"""
PaymentService — all three payment paths.

Path 1: Online (Razorpay)
  create_session() → Redis → verify_payment() → Transaction → confirm

Path 2: Admin records offline (cash, bank, cheque)
  record_admin_payment() → Transaction → confirm

Path 3: User declares UPI → Admin reviews
  submit_declaration() → PaymentDeclaration(PENDING)
  review_declaration(approve) → Transaction → confirm
  review_declaration(reject)  → Declaration(REJECTED), milestone reset
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.payment import get_payment_provider
from app.core.redis import redis_client
from ..models import (
    Order, OrderMilestone, Transaction, PaymentDeclaration,
)
from ..schemas import (
    OrderStatus, MilestoneStatus, DeclarationStatus, PaymentMode,
    CreatePaymentSessionRequest, VerifyPaymentRequest,
    AdminRecordPaymentRequest, PaymentDeclarationCreate,
    PaymentDeclarationReview, PaymentSessionResponse,
)
from .order import OrderService

logger = logging.getLogger(__name__)


class PaymentService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.order_svc = OrderService(db)

    # ── Path 1: Online (Razorpay) ─────────────────────────────────────────────

    async def create_session(
        self,
        payload: CreatePaymentSessionRequest,
        user_id: UUID,
    ) -> PaymentSessionResponse:

        order = await self.order_svc.get_order(payload.order_id)
        if not order:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
        if order.user_id != user_id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your order")
        if order.status in (
            OrderStatus.PAID, OrderStatus.COMPLETED, OrderStatus.CANCELLED
        ):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Order is {order.status.value} — no payment needed",
            )

        milestone = self._pick_milestone(order, payload.milestone_id)

        if milestone.status == MilestoneStatus.PAID:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Milestone already paid")

        # Create Razorpay order (sync SDK — wrap in thread)
        amount_paise = int(milestone.amount * 100)
        if amount_paise <= 0:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Milestone amount is zero")

        provider = get_payment_provider()
        try:
            gw_order = await asyncio.to_thread(
                provider.create_order,
                amount_paise=amount_paise,
                currency="INR",
                receipt=f"ms_{str(milestone.id)[:8]}",
                notes={
                    "order_id": str(order.id),
                    "milestone_id": str(milestone.id),
                    "user_id": str(user_id),
                },
            )
        except Exception as e:
            logger.error(f"Razorpay order creation failed: {e}")
            raise HTTPException(
                status.HTTP_502_BAD_GATEWAY,
                "Payment gateway error. Please try again.",
            )

        # Store session in Redis — 15 min TTL matches Razorpay expiry
        session_id = str(uuid4())
        session_data = {
            "gateway_order_id": gw_order.gateway_order_id,
            "order_id": str(order.id),
            "milestone_id": str(milestone.id),
            "amount": milestone.amount,
            "user_id": str(user_id),
        }
        await redis_client.setex(
            f"payment_session:{session_id}",
            900,
            json.dumps(session_data),
        )

        logger.info(
            f"Payment session created: session={session_id}, "
            f"milestone={milestone.id}, amount={milestone.amount}"
        )

        return PaymentSessionResponse(
            session_id=session_id,
            gateway_order_id=gw_order.gateway_order_id,
            amount_paise=amount_paise,
            razorpay_key_id=settings.razorpay_key_id,
            order_id=order.id,
            milestone_id=milestone.id,
            milestone_label=milestone.label,
        )

    async def verify_payment(
        self,
        payload: VerifyPaymentRequest,
        user_id: UUID,
    ) -> dict:

        # Read session from Redis
        raw = await redis_client.get(f"payment_session:{payload.session_id}")
        if not raw:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Payment session expired or not found. "
                "Please start a new payment.",
            )

        session = json.loads(raw)

        if session["user_id"] != str(user_id):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your payment session")

        # Verify signature against OUR stored gateway_order_id
        provider = get_payment_provider()
        is_valid = await asyncio.to_thread(
            provider.verify_payment,
            gateway_order_id=session["gateway_order_id"],  # from Redis, not client
            gateway_payment_id=payload.gateway_payment_id,
            gateway_signature=payload.gateway_signature,
        )
        if not is_valid:
            logger.warning(
                f"Invalid signature for session {payload.session_id}, "
                f"payment {payload.gateway_payment_id}"
            )
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Payment verification failed. Invalid signature.",
            )

        # Idempotency — Razorpay can send duplicate webhooks
        existing = await self._get_txn_by_gateway_id(payload.gateway_payment_id)
        if existing:
            order = await self.order_svc.get_order(UUID(session["order_id"]))
            return self._payment_result(order, existing)

        # Load order and milestone
        order = await self.order_svc.get_order(UUID(session["order_id"]))
        milestone = next(
            (m for m in order.milestones if str(m.id) == session["milestone_id"]),
            None,
        )
        if not milestone:
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "Milestone not found — contact support",
            )

        # Create immutable transaction
        txn = Transaction(
            order_id=order.id,
            milestone_id=milestone.id,
            amount=float(session["amount"]),
            payment_mode=PaymentMode.ONLINE,
            gateway_payment_id=payload.gateway_payment_id,
            notes=f"Razorpay: {payload.gateway_payment_id}",
            recorded_by_admin=None,
        )
        self.db.add(txn)
        await self.db.flush()

        # Delete Redis session — one-time use
        await redis_client.delete(f"payment_session:{payload.session_id}")

        # Confirm from ledger
        await self.order_svc.confirm_milestone_payment(milestone, order)

        logger.info(
            f"Online payment verified: order={order.id}, "
            f"milestone={milestone.id}, amount={float(session['amount'])}"
        )

        return self._payment_result(order, txn)

    # ── Path 2: Admin records offline ─────────────────────────────────────────

    async def record_admin_payment(
        self,
        order_id: UUID,
        payload: AdminRecordPaymentRequest,
        admin_id: UUID,
    ) -> Order:

        order = await self.order_svc.get_order(order_id)
        if not order:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
        if order.status == OrderStatus.CANCELLED:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Order is cancelled")

        milestone = next(
            (m for m in order.milestones if m.id == payload.milestone_id), None
        )
        if not milestone:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Milestone not found")
        if milestone.status == MilestoneStatus.PAID:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Milestone already paid")

        # Zero amount milestone — mark paid directly, no transaction needed
        if milestone.amount == 0:
            milestone.status = MilestoneStatus.PAID
            milestone.paid_at = datetime.now(timezone.utc)
            await self.order_svc.confirm_milestone_payment(milestone, order)
            return order

        # Strict amount enforcement
        if abs(payload.amount - milestone.amount) > 0.01:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Amount must exactly match milestone amount ₹{milestone.amount:,.2f}. "
                f"Got ₹{payload.amount:,.2f}.",
            )

        txn = Transaction(
            order_id=order.id,
            milestone_id=milestone.id,
            amount=milestone.amount,              # ← always milestone.amount
            payment_mode=payload.payment_mode,
            gateway_payment_id=None,
            notes=payload.notes,
            recorded_by_admin=admin_id,
        )
        self.db.add(txn)
        await self.db.flush()

        await self.order_svc.confirm_milestone_payment(milestone, order)
    

        logger.info(
            f"Admin payment recorded: order={order.id}, "
            f"milestone={milestone.id}, amount={payload.amount}, "
            f"mode={payload.payment_mode.value}, admin={admin_id}"
        )

        return order

    # ── Path 3a: User submits declaration ─────────────────────────────────────

    async def submit_declaration(
        self,
        order_id: UUID,
        payload: PaymentDeclarationCreate,
        user_id: UUID,
        ) -> PaymentDeclaration:

        order = await self.order_svc.get_order(order_id)
        if not order:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
        if order.user_id != user_id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your order")
        if order.status == OrderStatus.CANCELLED:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Order is cancelled")

        milestone = next(
            (m for m in order.milestones if m.id == payload.milestone_id), None
            )
        if not milestone:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Milestone not found")
        if milestone.status == MilestoneStatus.PAID:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Milestone already paid")

        # Zero amount milestone — nothing to declare
        if milestone.amount == 0:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "This milestone has zero amount — no payment required.",
            )

        existing_pending = await self.db.scalar(
            select(PaymentDeclaration).where(
                PaymentDeclaration.milestone_id == payload.milestone_id,
                PaymentDeclaration.status == DeclarationStatus.PENDING,
            )
        )
        if existing_pending:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "A pending declaration already exists for this milestone.",
            )

        if payload.utr_number:
            duplicate = await self.db.scalar(
                select(PaymentDeclaration).where(
                PaymentDeclaration.utr_number == payload.utr_number
            )
        )
        if duplicate:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"UTR {payload.utr_number} has already been submitted.",
            )

        declaration = PaymentDeclaration(
            order_id=order_id,
            milestone_id=payload.milestone_id,
            user_id=user_id,
            # no amount — milestone.amount is the source of truth
            payment_mode=payload.payment_mode,
            utr_number=payload.utr_number,
            screenshot_url=payload.screenshot_url,
            status=DeclarationStatus.PENDING,
        )
        self.db.add(declaration)
        milestone.status = MilestoneStatus.PENDING

        return declaration

    # ── Path 3b: Admin reviews declaration ────────────────────────────────────

    async def review_declaration(
        self,
        declaration_id: UUID,
        payload: PaymentDeclarationReview,
        admin_id: UUID,
    ) -> Order:
        # Schema already validated rejection_reason is present when rejecting

        declaration = await self.db.scalar(
            select(PaymentDeclaration).where(
                PaymentDeclaration.id == declaration_id
            )
        )
        if not declaration:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Declaration not found")
        if declaration.status != DeclarationStatus.PENDING:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Declaration is already {declaration.status.value.lower()}.",
            )

        order = await self.order_svc.get_order(declaration.order_id)
        milestone = next(
            (m for m in order.milestones if m.id == declaration.milestone_id), None
        )
        if not milestone:
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "Milestone not found for this declaration",
            )

        now = datetime.now(timezone.utc)

        if payload.is_approved:
            declaration.status = DeclarationStatus.APPROVED
            declaration.reviewed_by = admin_id
            declaration.reviewed_at = now

            # Amount comes from milestone — not the declaration
            txn = Transaction(
                order_id=order.id,
                milestone_id=milestone.id,
                amount=milestone.amount,              # ← from milestone
                payment_mode=declaration.payment_mode,
                gateway_payment_id=None,
                notes=f"UTR: {declaration.utr_number}" if declaration.utr_number else None,
                recorded_by_admin=admin_id,
            )
            self.db.add(txn)
            await self.db.flush()

            await self.order_svc.confirm_milestone_payment(milestone, order)

            logger.info(
                f"Declaration approved: {declaration_id}, "
                f"milestone={milestone.id}, amount={declaration.amount}, "
                f"admin={admin_id}"
            )

        else:
            declaration.status = DeclarationStatus.REJECTED
            declaration.rejection_reason = payload.rejection_reason
            declaration.reviewed_by = admin_id
            declaration.reviewed_at = now

            # Reset milestone — only if no other pending declarations exist
            other_pending = await self.db.scalar(
                select(PaymentDeclaration).where(
                    PaymentDeclaration.milestone_id == milestone.id,
                    PaymentDeclaration.status == DeclarationStatus.PENDING,
                    PaymentDeclaration.id != declaration_id,
                )
            )
            if not other_pending:
                milestone.status = MilestoneStatus.UNPAID

            logger.info(
                f"Declaration rejected: {declaration_id}, "
                f"reason={payload.rejection_reason}, admin={admin_id}"
            )

        return order

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _pick_milestone(
        self, order: Order, milestone_id: Optional[UUID]
    ) -> OrderMilestone:
        """Return specified milestone or next unpaid one."""
        if milestone_id:
            m = next((m for m in order.milestones if m.id == milestone_id), None)
            if not m:
                raise HTTPException(
                    status.HTTP_404_NOT_FOUND,
                    "Milestone not found in this order",
                )
            return m

        unpaid = sorted(
            [m for m in order.milestones if m.status != MilestoneStatus.PAID],
            key=lambda m: m.order_index,
        )
        if not unpaid:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, "All milestones are already paid"
            )
        return unpaid[0]

    async def _get_txn_by_gateway_id(
        self, gateway_payment_id: str
    ) -> Optional[Transaction]:
        return await self.db.scalar(
            select(Transaction).where(
                Transaction.gateway_payment_id == gateway_payment_id
            )
        )

    def _payment_result(self, order: Order, txn: Transaction) -> dict:
        return {
            "message": "Payment verified and recorded",
            "order_id": str(order.id),
            "milestone_id": str(txn.milestone_id),
            "amount": txn.amount,
            "amount_paid": order.amount_paid,
            "balance_due": round(order.total_amount - order.amount_paid, 2),
            "order_status": order.status.value,
        }

    async def issue_refund(
        self,
        order_id: UUID,
        milestone_id: UUID,
        amount: float,
        reason: str,
        admin_id: UUID,
    ) -> Order:
        """
        Admin issues a refund against a paid milestone.
        Creates a negative Transaction.
        confirm_milestone_payment recomputes — milestone may revert to UNPAID.
        """
        order = await self.order_svc.get_order(order_id)
        if not order:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")

        milestone = next(
            (m for m in order.milestones if m.id == milestone_id), None
        )
        if not milestone:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Milestone not found")

        # Cannot refund more than what was paid on this milestone
        paid_on_milestone = float(await self.db.scalar(
            select(func.coalesce(func.sum(Transaction.amount), 0.0))
            .where(Transaction.milestone_id == milestone_id)
        ))

        if amount > paid_on_milestone + 0.01:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Refund amount ₹{amount:,.2f} exceeds "
                f"amount paid on this milestone ₹{paid_on_milestone:,.2f}.",
            )

        # Negative transaction — immutable fact of refund
        txn = Transaction(
            order_id=order.id,
            milestone_id=milestone.id,
            amount=-round(amount, 2),             # negative
            payment_mode=PaymentMode.BANK_TRANSFER,
            gateway_payment_id=None,
            notes=f"REFUND: {reason}",
            recorded_by_admin=admin_id,
        )
        self.db.add(txn)
        await self.db.flush()

        # Recompute — milestone may revert to UNPAID if fully refunded
        await self.order_svc.confirm_milestone_payment(milestone, order)

        return order