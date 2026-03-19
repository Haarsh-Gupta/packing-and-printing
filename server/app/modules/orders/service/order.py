from uuid import UUID
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.orders.models import Order, OrderMilestone
from app.modules.orders.schemas import MilestoneStatus
from app.modules.orders.schemas import AdminMilestoneCreateRequest, OrderStatus


class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_order(self, order_id: UUID) -> Optional[Order]:
        from sqlalchemy.orm import selectinload
        return (await self.db.execute(
            select(Order)
            .options(
                selectinload(Order.milestones),
                selectinload(Order.transactions),
                selectinload(Order.user),
                selectinload(Order.declarations)
            )
            .where(Order.id == order_id)
        )).scalar_one_or_none()

    async def get_all_orders(self, status_filter=None, skip=0, limit=50):
        from sqlalchemy.orm import selectinload
        stmt = (
            select(Order)
            .options(selectinload(Order.milestones), selectinload(Order.user))
            .order_by(Order.created_at.desc())
            .offset(skip).limit(limit)
        )
        if status_filter:
            stmt = stmt.where(Order.status == status_filter.value)
        return list((await self.db.execute(stmt)).scalars().all())

    async def get_user_orders(self, user_id: UUID, status_filter=None, skip=0, limit=50):
        from sqlalchemy.orm import selectinload
        stmt = (
            select(Order)
            .options(selectinload(Order.milestones), selectinload(Order.user))
            .where(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
            .offset(skip).limit(limit)
        )
        if status_filter:
            stmt = stmt.where(Order.status == status_filter.value)
        return list((await self.db.execute(stmt)).scalars().all())

    async def regenerate_milestones(self, order: Order, payload: AdminMilestoneCreateRequest) -> None:
        if order.amount_paid and order.amount_paid > 0:
            raise ValueError(f"Cannot regenerate milestones: ₹{order.amount_paid:,.2f} already paid.")

        # FIX: DELETE + flush first so unique constraint is cleared before INSERT
        await self.db.execute(delete(OrderMilestone).where(OrderMilestone.order_id == order.id))
        await self.db.flush()  # deletes visible in transaction before inserts

        milestones = _build_milestones(order.id, order.total_amount, payload)
        self.db.add_all(milestones)
        await self.db.flush()

    async def transition_status(self, order: Order, new_status: OrderStatus, actor="admin", admin_notes=None):
        allowed = _status_transitions(order.status)
        if new_status.value not in allowed:
            raise ValueError(f"Cannot transition from '{order.status}' to '{new_status.value}'. Allowed: {allowed}")
        order.status = new_status.value
        if admin_notes:
            order.admin_notes = admin_notes


def _build_milestones(order_id, total_amount, payload):
    milestones = []
    running = 0.0
    for i, m in enumerate(payload.milestones, start=1):
        amount = round((m.percentage / 100.0) * total_amount, 2)
        running += amount
        milestones.append(OrderMilestone(
            order_id=order_id, label=m.label, percentage=m.percentage,
            amount=amount, order_index=i, status=MilestoneStatus.UNPAID,
        ))
    if milestones:
        diff = round(total_amount - running, 2)
        if diff != 0:
            milestones[-1].amount = round(milestones[-1].amount + diff, 2)
    return milestones


def _status_transitions(current):
    return {
        "WAITING_PAYMENT": ["PAID", "CANCELLED"],
        "PAID": ["IN_PRODUCTION", "CANCELLED"],
        "IN_PRODUCTION": ["READY_TO_DISPATCH", "CANCELLED"],
        "READY_TO_DISPATCH": ["DISPATCHED"],
        "DISPATCHED": ["DELIVERED"],
        "DELIVERED": [],
        "CANCELLED": [],
    }.get(current, [])