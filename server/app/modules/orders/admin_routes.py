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
    OrderCreate, OrderUpdate, OrderResponse,
    TransactionCreate, TransactionResponse, PaymentSplitType
)

router = APIRouter()

# ==================== ORDER CREATION WITH MILESTONES ====================

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=OrderResponse)
async def create_order(
    order_data: OrderCreate, 
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Admin converts an accepted inquiry into an order and sets payment milestones."""
    stmt = select(InquiryGroup).where(
        InquiryGroup.id == order_data.inquiry_id,
        InquiryGroup.status == "ACCEPTED"
    )
    result = await db.execute(stmt)
    group = result.scalar_one_or_none()

    if not group:
        raise HTTPException(status_code=404, detail="Inquiry not found or not accepted")

    # Check if order exists
    existing_stmt = select(Order).where(Order.inquiry_id == order_data.inquiry_id)
    if (await db.execute(existing_stmt)).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Order already exists for this inquiry")

    # 1. Create Base Order
    new_order = Order(
        inquiry_id=group.id,
        user_id=group.user_id,
        total_amount=group.total_quoted_price,
        status="WAITING_PAYMENT"
    )
    db.add(new_order)
    await db.flush() # Get new_order.id

    # 2. Generate Milestones based on Split Type
    total = group.total_quoted_price
    milestones = []

    if order_data.split_type == PaymentSplitType.FULL:
        milestones.append(OrderMilestone(
            order_id=new_order.id, label="Full Payment (100%)", amount=total, percentage=100.0, order_index=1
        ))
    
    elif order_data.split_type == PaymentSplitType.HALF:
        milestones.append(OrderMilestone(
            order_id=new_order.id, label="Advance Payment (50%)", amount=total * 0.5, percentage=50.0, order_index=1
        ))
        milestones.append(OrderMilestone(
            order_id=new_order.id, label="Balance Before Dispatch (50%)", amount=total * 0.5, percentage=50.0, order_index=2
        ))
        
    elif order_data.split_type == PaymentSplitType.CUSTOM_30:
        milestones.append(OrderMilestone(
            order_id=new_order.id, label="Project Kickoff (30%)", amount=total * 0.3, percentage=30.0, order_index=1
        ))
        milestones.append(OrderMilestone(
            order_id=new_order.id, label="Post-Sample Approval (30%)", amount=total * 0.3, percentage=30.0, order_index=2
        ))
        milestones.append(OrderMilestone(
            order_id=new_order.id, label="Final Balance (40%)", amount=total * 0.4, percentage=40.0, order_index=3
        ))

    db.add_all(milestones)
    await db.commit()

    # Fetch fresh with relationships
    fetch_stmt = select(Order).options(
        selectinload(Order.milestones),
        selectinload(Order.transactions)
    ).where(Order.id == new_order.id)
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
    
    order.status = status_update.status
    
    await db.commit()
    
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
