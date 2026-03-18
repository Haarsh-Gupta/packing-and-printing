"""
OrderService — milestone building, status sync, transition logic.
No HTTP. No HTTPException. Raises ValueError for business rule violations.
Routes catch ValueError and convert to HTTPException.
"""

import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.orders.models import (
    Order, OrderMilestone, Transaction, PaymentDeclaration,
)
from app.modules.orders.schemas import (
    AdminMilestoneCreateRequest, PaymentSplitType,
    MilestoneDefinition, OrderStatus, MilestoneStatus, 
    DeclarationStatus,
)

logger = logging.getLogger(__name__)


# Valid status transitions per actor
_USER_TRANSITIONS = {
    OrderStatus.WAITING_PAYMENT: [OrderStatus.CANCELLED],
    OrderStatus.PARTIALLY_PAID:  [OrderStatus.CANCELLED],
    OrderStatus.PAID:            [],
    OrderStatus.PROCESSING:      [],
    OrderStatus.READY:           [],
    OrderStatus.COMPLETED:       [],
    OrderStatus.CANCELLED:       [],
}

_ADMIN_TRANSITIONS = {
    OrderStatus.WAITING_PAYMENT: [OrderStatus.CANCELLED],
    OrderStatus.PARTIALLY_PAID:  [OrderStatus.CANCELLED],
    OrderStatus.PAID:            [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    OrderStatus.PROCESSING:      [OrderStatus.READY, OrderStatus.CANCELLED],
    OrderStatus.READY:           [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    OrderStatus.COMPLETED:       [],
    OrderStatus.CANCELLED:       [],
}


class OrderService:

    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Fetching ──────────────────────────────────────────────────────────────

    async def get_order(self, order_id: UUID) -> Optional[Order]:
        """Load order with all relations needed for responses."""
        stmt = (
            select(Order)
            .options(
                selectinload(Order.milestones),
                selectinload(Order.transactions),
                selectinload(Order.declarations),
                selectinload(Order.user),
            )
            .where(Order.id == order_id)
        )
        return (await self.db.execute(stmt)).scalar_one_or_none()

    async def get_user_orders(
        self,
        user_id: UUID,
        status_filter: Optional[OrderStatus] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Order]:
        stmt = (
            select(Order)
            .where(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        if status_filter:
            stmt = stmt.where(Order.status == status_filter)
        return list((await self.db.execute(stmt)).scalars().all())

    async def get_all_orders(
        self,
        status_filter: Optional[OrderStatus] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Order]:
        stmt = (
            select(Order)
            .options(selectinload(Order.user))
            .order_by(Order.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        if status_filter:
            stmt = stmt.where(Order.status == status_filter)
        return list((await self.db.execute(stmt)).scalars().all())

    # ── Milestone building ────────────────────────────────────────────────────

    def _resolve_definitions(
        self, request: AdminMilestoneCreateRequest
    ) -> list[MilestoneDefinition]:
        """Expand FULL/HALF into concrete definitions. CUSTOM passes through."""
        if request.split_type == PaymentSplitType.FULL:
            return [MilestoneDefinition(label="Full payment (100%)", percentage=100.0)]

        if request.split_type == PaymentSplitType.HALF:
            return [
                MilestoneDefinition(label="Advance payment (50%)", percentage=50.0),
                MilestoneDefinition(label="Balance before dispatch (50%)", percentage=50.0),
            ]

        return request.milestones  # CUSTOM — already validated by schema

    def _build_milestone_objects(
        self,
        order: Order,
        definitions: list[MilestoneDefinition],
    ) -> list[OrderMilestone]:
        """
        Build ORM objects from definitions.
        Amounts derived from percentages.
        Last milestone absorbs rounding remainder so sum == total_amount exactly.
        """
        milestones = []
        for i, defn in enumerate(definitions, start=1):
            amount = round((defn.percentage / 100.0) * order.total_amount, 2)
            milestones.append(OrderMilestone(
                order_id=order.id,
                label=defn.label,
                percentage=defn.percentage,
                amount=amount,
                order_index=i,
                status=MilestoneStatus.UNPAID,
            ))

        # Fix rounding remainder on last milestone
        computed_sum = sum(m.amount for m in milestones)
        remainder = round(order.total_amount - computed_sum, 2)
        if remainder != 0:
            milestones[-1].amount = round(milestones[-1].amount + remainder, 2)

        return milestones

    async def create_milestones(
        self,
        order: Order,
        request: AdminMilestoneCreateRequest,
    ) -> list[OrderMilestone]:
        """Create milestones for a new order. Called once at order creation."""
        definitions = self._resolve_definitions(request)
        milestones = self._build_milestone_objects(order, definitions)
        self.db.add_all(milestones)
        return milestones

    async def regenerate_milestones(
        self,
        order: Order,
        request: AdminMilestoneCreateRequest,
    ) -> list[OrderMilestone]:
        """
        Replace all milestones.
        Guard: blocked if any payment has been made.
        Guard: blocked if any declaration is PENDING.
        """
        if order.amount_paid > 0:
            raise ValueError(
                "Cannot regenerate milestones — a payment has already been recorded. "
                "Contact support if changes are needed."
            )

        # Check for pending declarations
        pending_dec = await self.db.scalar(
            select(PaymentDeclaration).where(
                PaymentDeclaration.order_id == order.id,
                PaymentDeclaration.status == DeclarationStatus.PENDING,
            )
        )
        if pending_dec:
            raise ValueError(
                "Cannot regenerate milestones — there is a pending payment declaration. "
                "Review or reject it first."
            )

        # Delete existing milestones
        await self.db.execute(
            delete(OrderMilestone).where(OrderMilestone.order_id == order.id)
        )
        await self.db.flush()  # ensure deletes hit DB before inserts

        definitions = self._resolve_definitions(request)
        milestones = self._build_milestone_objects(order, definitions)
        self.db.add_all(milestones)
        return milestones

    async def switch_milestones_user(
        self,
        order: Order,
        split_type: PaymentSplitType,  # only FULL or HALF — schema validated
    ) -> list[OrderMilestone]:
        """
        User switches between FULL and HALF.
        Blocked if any payment has been made.
        """
        if order.amount_paid > 0:
            raise ValueError(
                "Cannot switch milestones — a payment has already been made."
            )

        request = AdminMilestoneCreateRequest(split_type=split_type)
        return await self.regenerate_milestones(order, request)

    # ── Payment confirmation ──────────────────────────────────────────────────

    async def confirm_milestone_payment(
        self,
        milestone: OrderMilestone,
        order: Order,
    ) -> None:
        """
        Recomputes milestone status and order totals from transactions.
        Single source of truth — always reads from the ledger.
        Called after every transaction insert.
        """
        # Sum confirmed transactions for this milestone
        paid_sum = float(await self.db.scalar(
            select(func.coalesce(func.sum(Transaction.amount), 0.0))
            .where(Transaction.milestone_id == milestone.id)
        ))

        if paid_sum >= milestone.amount - 0.01:
            milestone.status = MilestoneStatus.PAID
            if not milestone.paid_at:
                milestone.paid_at = datetime.now(timezone.utc)
        elif paid_sum > 0:
            milestone.status = MilestoneStatus.PENDING
        else:
            milestone.status = MilestoneStatus.UNPAID

        # Recompute order total from ALL transactions on this order
        total_paid = float(await self.db.scalar(
            select(func.coalesce(func.sum(Transaction.amount), 0.0))
            .where(Transaction.order_id == order.id)
        ))
        order.amount_paid = min(round(total_paid, 2), order.total_amount)

        # Auto-transition order status
        all_milestones = list((await self.db.execute(
            select(OrderMilestone).where(OrderMilestone.order_id == order.id)
        )).scalars().all())

        all_paid = all(m.status == MilestoneStatus.PAID for m in all_milestones)
        any_paid = any(m.status == MilestoneStatus.PAID for m in all_milestones)

        if all_paid:
            order.status = OrderStatus.PAID
        elif any_paid or order.amount_paid > 0:
            order.status = OrderStatus.PARTIALLY_PAID

        logger.info(
            f"Milestone {milestone.id} confirmed: "
            f"status={milestone.status.value}, "
            f"order.amount_paid={order.amount_paid}, "
            f"order.status={order.status.value}"
        )

    # ── Status transitions ────────────────────────────────────────────────────

    async def transition_status(
        self,
        order: Order,
        new_status: OrderStatus,
        actor: str,  # "user" | "admin"
        admin_notes: Optional[str] = None,
    ) -> None:
        transitions = _USER_TRANSITIONS if actor == "user" else _ADMIN_TRANSITIONS
        allowed = transitions.get(order.status, [])

        if new_status not in allowed:
            raise ValueError(
                f"{actor.capitalize()} cannot transition order from "
                f"{order.status.value} to {new_status.value}."
            )

        old = order.status
        order.status = new_status
        if admin_notes:
            order.admin_notes = admin_notes

        logger.info(f"Order {order.id}: {old.value} → {new_status.value} ({actor})")

        # When cancelled, reject all pending declarations
        if new_status == OrderStatus.CANCELLED:
            await self.db.execute(
                select(PaymentDeclaration)
                .where(
                    PaymentDeclaration.order_id == order.id,
                    PaymentDeclaration.status == DeclarationStatus.PENDING,
                )
            )
            pending = list((await self.db.execute(
                select(PaymentDeclaration).where(
                    PaymentDeclaration.order_id == order.id,
                    PaymentDeclaration.status == DeclarationStatus.PENDING,
                )
            )).scalars().all())

            for dec in pending:
                dec.status = DeclarationStatus.REJECTED
                dec.rejection_reason = "Order was cancelled."
                dec.reviewed_at = datetime.now(timezone.utc)

            # Reset unpaid milestones
            for milestone in order.milestones:
                if milestone.status != MilestoneStatus.PAID:
                    milestone.status = MilestoneStatus.UNPAID