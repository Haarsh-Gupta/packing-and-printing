from uuid import UUID
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.orders.models import Order, OrderMilestone, Transaction, PaymentDeclaration
from app.modules.orders.schemas import MilestoneStatus
from app.modules.orders.schemas import AdminRecordPaymentRequest, PaymentDeclarationReview

import logging
logger = logging.getLogger(__name__)

# ── Helpers for safe money math ──────────────────────────────────────────────
def _money(val) -> Decimal:
    """Convert any numeric value to a 2-decimal-place Decimal."""
    return Decimal(str(val)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def submit_declaration(self, order_id, milestone_id, user_id, utr_number, screenshot_url):
        order = await self._get_order_locked(order_id)
        if str(order.user_id) != str(user_id):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your order")
        milestone = await self._get_milestone_lock(milestone_id, order_id)
        if milestone.status == MilestoneStatus.PAID:
            raise HTTPException(status.HTTP_409_CONFLICT, "Milestone already paid")
        if milestone.status == MilestoneStatus.PENDING:
            raise HTTPException(status.HTTP_409_CONFLICT, "A declaration is already pending verification for this milestone")

        # UTR duplicate check — both conditions in same if block
        if utr_number:
            duplicate = await self.db.scalar(
                select(PaymentDeclaration).where(
                    PaymentDeclaration.utr_number == utr_number,
                    PaymentDeclaration.status == "PENDING",
                )
            )
            if duplicate:
                raise HTTPException(status.HTTP_409_CONFLICT, "A pending declaration with this UTR already exists.")

        declaration = PaymentDeclaration(
            order_id=order_id, milestone_id=milestone_id, user_id=user_id,
            payment_mode="UPI_MANUAL",
            utr_number=utr_number, screenshot_url=screenshot_url, status="PENDING",
        )
        milestone.status = MilestoneStatus.PENDING
        self.db.add(declaration)
        await self.db.flush()
        return declaration

    async def review_declaration(self, declaration_id: UUID, payload: PaymentDeclarationReview, admin_id: UUID) -> Order:
        declaration = await self._get_payment_declaration_lock(declaration_id)

        if declaration.status != "PENDING":
            raise HTTPException(status.HTTP_409_CONFLICT, "Declaration already reviewed")

        milestone = await self._get_milestone_lock(declaration.milestone_id, declaration.order_id)
        order = await self._get_order_locked(declaration.order_id)

        if payload.is_approved:
            declaration.status = "APPROVED"
            declaration.reviewed_by = admin_id
            declaration.reviewed_at = datetime.now(timezone.utc)
            milestone.status = MilestoneStatus.PAID
            milestone.paid_at = datetime.now(timezone.utc)

            actual_amt = payload.actual_amount if payload.actual_amount else milestone.amount

            txn = Transaction(
                order_id=order.id, milestone_id=milestone.id, amount=actual_amt,
                payment_mode=declaration.payment_mode,
                recorded_by_admin=admin_id, notes=f"Declaration {declaration_id} approved. UTR: {declaration.utr_number or 'N/A'}",
            )
            self.db.add(txn)
            await self.db.flush()
            await self._recalculate_amount_paid(order)

            logger.info(f"Declaration approved: {declaration_id}, milestone={milestone.id}, amount={milestone.amount}")
        else:
            if not payload.rejection_reason:
                raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "rejection_reason is required")
            declaration.status = "REJECTED"
            declaration.reviewed_by = admin_id
            declaration.reviewed_at = datetime.now(timezone.utc)
            declaration.rejection_reason = payload.rejection_reason
            
            # Check if there are any other pending declarations for this milestone.
            # If not, revert milestone status to UNPAID.
            other_pending = await self.db.scalar(
                select(PaymentDeclaration).where(
                    PaymentDeclaration.milestone_id == milestone.id,
                    PaymentDeclaration.id != declaration.id,
                    PaymentDeclaration.status == "PENDING"
                )
            )
            if not other_pending:
                milestone.status = MilestoneStatus.UNPAID

        return order

    async def record_admin_payment(self, order_id: UUID, payload: AdminRecordPaymentRequest, admin_id: UUID) -> Order:
        if payload.amount <= 0:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Ledger transaction amounts must be strictly positive.")
            
        order = await self._get_order_locked(order_id)
        if payload.milestone_id:
            milestone = await self._get_milestone_lock(payload.milestone_id, order_id)
            milestone.status = MilestoneStatus.PAID
            milestone.paid_at = datetime.now(timezone.utc)
        txn = Transaction(
            order_id=order_id, milestone_id=payload.milestone_id, amount=payload.amount,
            payment_mode=payload.payment_mode,
            recorded_by_admin=admin_id, notes=payload.notes,
        )
        self.db.add(txn)
        await self.db.flush()
        await self._recalculate_amount_paid(order)
        return order

    async def issue_refund(self, order_id, milestone_id, amount, reason, admin_id) -> Order:
        order = await self._get_order_locked(order_id)
        milestone = await self._get_milestone_lock(milestone_id, order_id)

        if milestone.status != MilestoneStatus.PAID:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Cannot refund milestone '{milestone.label}' "
                    f"— current status is {milestone.status}, "
                    f"expected PAID"
                )
            )

        # BUG-007 FIX: Validate refund against net paid amount (payments minus previous refunds)
        net_paid_on_milestone = await self.db.scalar(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(Transaction.milestone_id == milestone_id)
        )
        net_paid_on_milestone = float(net_paid_on_milestone or 0)

        if amount > net_paid_on_milestone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Refund amount ₹{amount:,.2f} exceeds "
                    f"net amount paid on this milestone "
                    f"₹{net_paid_on_milestone:,.2f}"
                )
            )

        txn = Transaction(
            order_id=order_id, milestone_id=milestone_id,
            amount=-abs(amount), payment_mode="REFUND",
            recorded_by_admin=admin_id, 
            notes=f"Refund: {reason}",
        )
        self.db.add(txn)
        await self.db.flush()
        await self._recalculate_amount_paid(order)

        return order

    async def _get_order_locked(self, order_id: UUID) -> Order:
        order = (await self.db.execute(
            select(Order).where(Order.id == order_id).with_for_update()
        )).scalar_one_or_none()
        if not order:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
        return order

    async def _get_milestone_lock(self, milestone_id: UUID, order_id: UUID) -> OrderMilestone:
        m = (await self.db.execute(
            select(OrderMilestone).where(OrderMilestone.id == milestone_id, OrderMilestone.order_id == order_id).with_for_update()
        )).scalar_one_or_none()
        if not m:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Milestone not found")
        return m

    # BUG-008 FIX: Use Decimal for safe money comparison instead of float >=
    async def _recalculate_amount_paid(self, order: Order) -> None:
        total = await self.db.scalar(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(Transaction.order_id == order.id)
        )
        paid = _money(total or 0)
        target = _money(order.total_amount)

        order.amount_paid = float(paid)

        if paid >= target:
            order.status = "PAID"
        elif paid > 0:
            order.status = "PARTIALLY_PAID"
        else:
            order.status = "WAITING_PAYMENT"

        # Reconcile milestones using a waterfall logic for fungible money
        milestones = (await self.db.execute(
            select(OrderMilestone).where(OrderMilestone.order_id == order.id).order_by(OrderMilestone.order_index)
        )).scalars().all()
        
        remaining_money = paid
        for m in milestones:
             m_target = _money(m.amount)
             if remaining_money >= m_target:
                 # The waterfall covers this milestone fully
                 if m.status != MilestoneStatus.PAID:
                     m.status = MilestoneStatus.PAID
                     m.paid_at = m.paid_at or datetime.now(timezone.utc)
                 remaining_money -= m_target
             else:
                 # The waterfall DOES NOT cover this milestone fully
                 remaining_money = _money(0) # Absorbs any leftover into the partial milestone
                 # If it was erroneously marked PAID, reset it unless there's a PENDING declaration.
                 # To keep this clean, if it doesn't have the funds, it cannot be PAID.
                 if m.status == MilestoneStatus.PAID:
                     m.status = MilestoneStatus.UNPAID
                     m.paid_at = None

    async def _get_payment_declaration_lock(self, id: UUID) -> PaymentDeclaration:
        result = await self.db.execute(
            select(PaymentDeclaration)
            .where(PaymentDeclaration.id == id)
            .with_for_update()
        )
        decl = result.scalar_one_or_none()

        if not decl:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Declaration not found")
        return decl
