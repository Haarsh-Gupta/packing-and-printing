from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.core.database import get_db
from app.modules.auth.auth import get_current_admin_user
from app.modules.users.models import User
from app.modules.inquiry.models import InquiryGroup
from app.modules.orders.models import Order, Transaction, OrderMilestone
from app.modules.orders.schemas import (
    OrderCreate, OrderUpdate, OrderResponse, OrderMilestoneRegenerate,
    TransactionCreate, TransactionResponse, PaymentSplitType
)
from app.core.sse import sse_manager
from app.core.messaging import get_dispatcher

router = APIRouter()

@router.post("/{order_id}/regenerate-milestones", status_code=status.HTTP_200_OK, response_model=OrderResponse)
async def regenerate_milestones(
    order_id: UUID,
    milestone_data: OrderMilestoneRegenerate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Admin refactors the payment milestones for an unpaid order."""
    
    # 1. Get the order with existing milestones
    stmt = select(Order).options(selectinload(Order.milestones)).where(Order.id == order_id)
    order = (await db.execute(stmt)).scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # 2. Prevent changes if payment has begun
    if order.amount_paid > 0:
        raise HTTPException(status_code=400, detail="Cannot regenerate milestones because payment has already started")

    # 3. Delete old unpaid milestones (technically all are unpaid)
    for m in order.milestones:
        await db.delete(m)

    # 4. Generate Milestones based on Split Type
    total = order.total_amount
    new_milestones = []

    if milestone_data.split_type == PaymentSplitType.FULL:
        new_milestones.append(OrderMilestone(
            order_id=order.id, label="Full Payment (100%)", amount=total, percentage=100.0, order_index=1
        ))
    
    elif milestone_data.split_type == PaymentSplitType.HALF:
        new_milestones.append(OrderMilestone(
            order_id=order.id, label="Advance Payment (50%)", amount=total * 0.5, percentage=50.0, order_index=1
        ))
        new_milestones.append(OrderMilestone(
            order_id=order.id, label="Balance Before Dispatch (50%)", amount=total * 0.5, percentage=50.0, order_index=2
        ))
        
    elif milestone_data.split_type == PaymentSplitType.CUSTOM and milestone_data.custom_percentages:
        if abs(sum(milestone_data.custom_percentages) - 100.0) > 0.1:
            raise HTTPException(status_code=400, detail="Custom percentages must sum to 100")
        
        if len(milestone_data.custom_percentages) > 5:
            raise HTTPException(status_code=400, detail="A maximum of 5 milestones is allowed")

        for i, pct in enumerate(milestone_data.custom_percentages):
            m_amount = (total * pct) / 100.0
            new_milestones.append(OrderMilestone(
                order_id=order.id, label=f"Custom Milestone {i+1} ({pct}%)", amount=m_amount, percentage=pct, order_index=i+1
            ))
    else:
        new_milestones.append(OrderMilestone(
            order_id=order.id, label="Full Payment (100%)", amount=total, percentage=100.0, order_index=1
        ))

    db.add_all(new_milestones)
    await db.commit()

    # Fetch fresh with relationships
    fetch_stmt = select(Order).options(
        selectinload(Order.milestones),
        selectinload(Order.transactions)
    ).where(Order.id == order.id)
    return (await db.execute(fetch_stmt)).scalar_one()


# ==================== MILESTONE PAYMENT RECORDING ====================

@router.post("/{order_id}/payment", response_model=TransactionResponse)
async def record_milestone_payment(
    order_id: UUID,
    payment_data: TransactionCreate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Admin manually approves/records a payment against a specific milestone (e.g. verifying a UTR/QR payment)."""
    
    # 1. Get Order and Specific Milestone
    stmt = select(OrderMilestone).where(
        OrderMilestone.id == payment_data.milestone_id,
        OrderMilestone.order_id == order_id
    )
    result = await db.execute(stmt)
    milestone = result.scalar_one_or_none()

    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found for this order")
    
    if milestone.is_paid:
        raise HTTPException(status_code=400, detail="This milestone is already paid")

    # 2. Get parent order
    order_stmt = select(Order).where(Order.id == order_id)
    order = (await db.execute(order_stmt)).scalar_one()

    # 3. Create Transaction
    new_transaction = Transaction(
        order_id=order.id,
        milestone_id=milestone.id,
        amount=payment_data.amount,
        payment_mode=payment_data.payment_mode,
        notes=payment_data.notes,
        gateway_payment_id=payment_data.gateway_payment_id
    )

    # 4. Update Milestone & Order Totals
    milestone.is_paid = True
    milestone.paid_at = datetime.now(timezone.utc)
    milestone.verification_status = "APPROVED"
    
    order.amount_paid += payment_data.amount
    
    if order.amount_paid >= order.total_amount:
        order.status = "PAID"
    else:
        order.status = "PARTIALLY_PAID"

    db.add(new_transaction)
    await db.commit()
    await db.refresh(new_transaction)

    # ── Notifications (SSE + Email/WhatsApp) ──
    try:
        user_stmt = select(User).where(User.id == order.user_id)
        user_obj = (await db.execute(user_stmt)).scalar_one_or_none()

        dispatcher = get_dispatcher()
        await dispatcher.dispatch(
            to_email=user_obj.email if user_obj else None,
            to_phone=user_obj.phone if user_obj else None,
            subject=f"Payment Recorded — ₹{payment_data.amount:,.2f}",
            body_html=f"""
                <p>Hi {user_obj.name if user_obj else 'Customer'},</p>
                <p>Your payment of <strong>₹{payment_data.amount:,.2f}</strong> for 
                milestone <em>{milestone.label}</em> has been approved by the admin.</p>
                <p>Order status: <strong>{order.status}</strong></p>
                <p>Total paid: ₹{order.amount_paid:,.2f} / ₹{order.total_amount:,.2f}</p>
            """,
            body_text=(
                f"Hi {user_obj.name if user_obj else 'Customer'}, "
                f"your payment of ₹{payment_data.amount:,.2f} for {milestone.label} has been approved. "
                f"Order status: {order.status}."
            ),
            sse_user_id=str(order.user_id),
            sse_event="payment_recorded",
            sse_data={
                "order_id": str(order.id),
                "milestone_id": str(milestone.id),
                "amount": payment_data.amount,
                "status": order.status,
            },
            sse_admin_event="admin_payment_recorded",
            sse_admin_data={
                "order_id": str(order.id),
                "user_id": str(order.user_id),
                "amount": payment_data.amount,
                "milestone": milestone.label,
            },
        )
    except Exception:
        pass  # Logged inside dispatcher

    return new_transaction


#  ==================== ADMIN ENDPOINTS ====================

@router.get("/all", response_model=list[OrderResponse])
async def get_all_orders(
    skip: int = 0,
    limit: int = 50,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    [ADMIN] Get all orders with optional status filter
    """
    stmt = select(Order).options(
        selectinload(Order.transactions),
        selectinload(Order.milestones)
    )
    
    if status_filter:
        stmt = stmt.where(Order.status == status_filter.upper())
    
    stmt = stmt.order_by(Order.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    
    return result.scalars().all()


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: UUID,
    status_update: OrderUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    [ADMIN] Update order status
    """
    stmt = select(Order).options(
        selectinload(Order.transactions),
        selectinload(Order.milestones)
    ).where(Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    old_status = order.status
    order.status = status_update.status
    
    await db.commit()
    
    # ── SSE + Messaging on status change ──
    try:
        user_stmt = select(User).where(User.id == order.user_id)
        user_obj = (await db.execute(user_stmt)).scalar_one_or_none()

        dispatcher = get_dispatcher()
        await dispatcher.dispatch(
            to_email=user_obj.email if user_obj else None,
            to_phone=user_obj.phone if user_obj else None,
            subject=f"Order Status Updated — {status_update.status}",
            body_html=f"""
                <p>Hi {user_obj.name if user_obj else 'Customer'},</p>
                <p>Your order status has been updated from 
                <strong>{old_status}</strong> to <strong>{status_update.status}</strong>.</p>
            """,
            body_text=(
                f"Hi {user_obj.name if user_obj else 'Customer'}, "
                f"your order status changed from {old_status} to {status_update.status}."
            ),
            sse_user_id=str(order.user_id),
            sse_event="order_status_changed",
            sse_data={
                "order_id": str(order.id),
                "old_status": old_status,
                "new_status": status_update.status,
            },
            sse_admin_event="admin_order_status_changed",
            sse_admin_data={
                "order_id": str(order.id),
                "user_id": str(order.user_id),
                "old_status": old_status,
                "new_status": status_update.status,
            },
        )
    except Exception:
        pass
    
    stmt = select(Order).options(
        selectinload(Order.transactions),
        selectinload(Order.milestones)
    ).where(Order.id == order_id)
    return (await db.execute(stmt)).scalar_one_or_none()


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_order(
    order_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    [ADMIN] Delete an order and all associated transactions
    """
    stmt = select(Order).where(Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    await db.execute(delete(Order).where(Order.id == order_id))
    await db.commit()
