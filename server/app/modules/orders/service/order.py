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
        from app.modules.inquiry.models import InquiryGroup, InquiryItem

        order = (await self.db.execute(
            select(Order)
            .options(
                selectinload(Order.milestones),
                selectinload(Order.transactions),
                selectinload(Order.user),
                selectinload(Order.declarations)
            )
            .where(Order.id == order_id)
        )).scalar_one_or_none()

        if order:
            await self._populate_order_details([order])
        return order

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
        
        orders = list((await self.db.execute(stmt)).scalars().all())
        await self._populate_order_details(orders)
        return orders

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
        
        orders = list((await self.db.execute(stmt)).scalars().all())
        await self._populate_order_details(orders)
        return orders

    async def _populate_order_details(self, orders: list[Order]):
        from sqlalchemy.orm import selectinload
        from app.modules.inquiry.models import InquiryGroup, InquiryItem

        if not orders:
            return

        inquiry_ids = [o.inquiry_id for o in orders]
        inquiries = (await self.db.execute(
            select(InquiryGroup)
            .options(selectinload(InquiryGroup.items))
            .where(InquiryGroup.id.in_(inquiry_ids))
        )).scalars().all()

        inquiry_map = {i.id: i for i in inquiries}

        for order in orders:
            inquiry = inquiry_map.get(order.inquiry_id)
            if inquiry and inquiry.items:
                first_item = inquiry.items[0]
                # Populate dynamic fields (these are NOT columns, but the schema will pick them up)
                order.product_name = first_item.service_name or first_item.subproduct_name or first_item.product_name or "Custom Order"
                
                # Check custom user uploads first, then fall back to catalog images
                if first_item.images and len(first_item.images) > 0:
                    order.image_url = first_item.images[0]
                elif first_item.sub_product and first_item.sub_product.images and len(first_item.sub_product.images) > 0:
                    order.image_url = first_item.sub_product.images[0]
                elif first_item.product and getattr(first_item.product, 'cover_image', None):
                    order.image_url = first_item.product.cover_image
                elif first_item.sub_service and first_item.sub_service.images and len(first_item.sub_service.images) > 0:
                    order.image_url = first_item.sub_service.images[0]
                elif first_item.service and getattr(first_item.service, 'cover_image', None):
                    order.image_url = first_item.service.cover_image
                else:
                    order.image_url = None


    async def regenerate_milestones(self, order: Order, payload: AdminMilestoneCreateRequest) -> None:
        if order.amount_paid and order.amount_paid > 0:
            raise ValueError(f"Cannot regenerate milestones: ₹{order.amount_paid:,.2f} already paid.")

        # FIX: DELETE + flush first so unique constraint is cleared before INSERT
        await self.db.execute(delete(OrderMilestone).where(OrderMilestone.order_id == order.id))
        await self.db.flush()  # deletes visible in transaction before inserts

        milestones = _build_milestones(order.id, order.total_amount, payload)
        self.db.add_all(milestones)
        await self.db.flush()
        await self.db.refresh(order, ['milestones'])
    async def switch_milestones_user(self, order: Order, split_type) -> None:
        """
        Switch user payment schedule between FULL and HALF.
        This must be done before any payments are made.
        """
        from app.modules.orders.schemas import PaymentSplitType, AdminMilestoneCreateRequest, MilestoneDefinition

        if order.amount_paid and order.amount_paid > 0:
            raise ValueError(f"Cannot change payment schedule: ₹{order.amount_paid:,.2f} already paid.")

        if order.declarations and len(order.declarations) > 0:
            raise ValueError("Cannot change payment schedule while a payment declaration is pending verification.")

        if split_type == PaymentSplitType.CUSTOM:
            raise ValueError("Users cannot switch to custom milestones. Contact admin.")

        # Delete existing milestones
        await self.db.execute(delete(OrderMilestone).where(OrderMilestone.order_id == order.id))
        await self.db.flush()

        # Generate new milestones based on choice
        total = order.total_amount
        milestones = []
        if split_type == PaymentSplitType.FULL:
            milestones.append(OrderMilestone(
                order_id=order.id, label="Full Payment (100%)", amount=total, percentage=100.0, order_index=1
            ))
        elif split_type == PaymentSplitType.HALF:
            milestones.append(OrderMilestone(
                order_id=order.id, label="Advance Payment (50%)", amount=round(total * 0.5, 2), percentage=50.0, order_index=1
            ))
            milestones.append(OrderMilestone(
                order_id=order.id, label="Balance Before Dispatch (50%)", amount=round(total - round(total * 0.5, 2), 2), percentage=50.0, order_index=2
            ))
        else:
            raise ValueError(f"Invalid split_type: {split_type}")
        self.db.add_all(milestones)
        await self.db.flush()
        await self.db.refresh(order, ['milestones'])

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