from uuid import UUID
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.orders.models import Order, OrderMilestone, Transaction, PaymentDeclaration
from app.modules.orders.schemas import MilestoneStatus
from app.modules.orders.schemas import AdminRecordPaymentRequest, PaymentDeclarationReview


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def submit_declaration(self, order_id, milestone_id, user_id, utr_number, screenshot_url):
        order = await self._get_order_locked(order_id)
        if str(order.user_id) != str(user_id):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your order")
        milestone = await self._get_milestone(milestone_id, order_id)
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
        import logging
        logger = logging.getLogger(__name__)

        declaration = (await self.db.execute(
            select(PaymentDeclaration).where(PaymentDeclaration.id == declaration_id)
        )).scalar_one_or_none()
        if not declaration:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Declaration not found")
        if declaration.status != "PENDING":
            raise HTTPException(status.HTTP_409_CONFLICT, "Declaration already reviewed")

        milestone = await self._get_milestone(declaration.milestone_id, declaration.order_id)
        order = await self._get_order_locked(declaration.order_id)

        if payload.is_approved:
            declaration.status = "APPROVED"
            declaration.reviewed_by = admin_id
            declaration.reviewed_at = datetime.now(timezone.utc)
            milestone.status = MilestoneStatus.PAID
            milestone.paid_at = datetime.now(timezone.utc)

            txn = Transaction(
                order_id=order.id, milestone_id=milestone.id, amount=milestone.amount,
                payment_mode=declaration.payment_mode,
                recorded_by_admin=admin_id, notes=f"Declaration {declaration_id} approved. UTR: {declaration.utr_number or 'N/A'}",
            )
            self.db.add(txn)
            await self.db.flush()
            await self._recalculate_amount_paid(order)

            # FIX 2: was declaration.amount (AttributeError) — milestone.amount is correct
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
        order = await self._get_order_locked(order_id)
        if payload.milestone_id:
            milestone = await self._get_milestone(payload.milestone_id, order_id)
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
        milestone = await self._get_milestone(milestone_id, order_id)

        txn = Transaction(
            order_id=order_id, milestone_id=milestone_id,
            amount=-abs(amount), payment_mode="REFUND",
            recorded_by_admin=admin_id, notes=f"Refund: {reason}",
        )
        self.db.add(txn)
        await self.db.flush()
        await self._recalculate_amount_paid(order)

        # FIX 4: revert PAID → WAITING_PAYMENT when refund underpays
        if order.amount_paid < order.total_amount and order.status == "PAID":
            order.status = "WAITING_PAYMENT"

        return order

    async def _get_order_locked(self, order_id: UUID) -> Order:
        # FIX 3: SELECT FOR UPDATE prevents race condition on concurrent webhooks
        order = (await self.db.execute(
            select(Order).where(Order.id == order_id).with_for_update()
        )).scalar_one_or_none()
        if not order:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
        return order

    async def _get_milestone(self, milestone_id, order_id) -> OrderMilestone:
        m = (await self.db.execute(
            select(OrderMilestone).where(OrderMilestone.id == milestone_id, OrderMilestone.order_id == order_id)
        )).scalar_one_or_none()
        if not m:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Milestone not found")
        return m

    async def _recalculate_amount_paid(self, order: Order) -> None:
        from sqlalchemy import func
        total = await self.db.scalar(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(Transaction.order_id == order.id)
        )
        order.amount_paid = float(total or 0)
        if order.amount_paid >= order.total_amount:
            order.status = "PAID"