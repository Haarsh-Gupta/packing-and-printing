"""
Online payment routes — milestone-aware.

POST /payments/create-order  — create a gateway order for a specific milestone
POST /payments/verify        — verify the payment and record the transaction
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.config import settings
from app.core.payment import get_payment_provider
from app.modules.auth import get_current_user
from app.modules.users.models import User
from app.modules.orders.models import Order, Transaction

from .schemas import CreatePaymentOrder, PaymentOrderResponse, VerifyPayment

router = APIRouter()


@router.post("/create-order", response_model=PaymentOrderResponse)
async def create_payment_order(
    payload: CreatePaymentOrder,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a payment gateway order for a specific milestone.
    If no milestone_id is provided, picks the next unpaid milestone.
    Returns the gateway order ID + key so the frontend can open checkout.
    """
    # 1. Fetch the order with milestones
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.milestones))
        .where(Order.id == payload.order_id)
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your order")

    if order.status in ("PAID", "COMPLETED", "CANCELLED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order is already {order.status}",
        )

    # 2. Find the milestone to pay
    milestone = None
    if payload.milestone_id:
        # Specific milestone requested
        milestone = next(
            (m for m in order.milestones if m.id == payload.milestone_id and m.status != "PAID"),
            None,
        )
        if not milestone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Milestone not found or already paid",
            )
    else:
        # Auto-pick the next unpaid milestone (lowest order_index)
        unpaid = sorted(
            [m for m in order.milestones if m.status != "PAID"],
            key=lambda m: m.order_index,
        )
        if not unpaid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="All milestones are already paid",
            )
        milestone = unpaid[0]

    # 3. Calculate amount (in paise)
    amount_paise = int(milestone.amount * 100)

    if amount_paise <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Milestone amount is zero — no payment required",
        )

    # 4. Create order on payment gateway
    provider = get_payment_provider()
    try:
        gw_order = provider.create_order(
            amount_paise=amount_paise,
            currency="INR",
            receipt=f"order_{order.id}_ms_{milestone.id}",
            notes={
                "internal_order_id": str(order.id),
                "milestone_id": str(milestone.id),
                "user_id": str(current_user.id),
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Payment gateway error: {str(e)}",
        )

    # 5. Save gateway order ID on our order
    order.payment_gateway_order_id = gw_order.gateway_order_id
    await db.commit()

    return PaymentOrderResponse(
        gateway_order_id=gw_order.gateway_order_id,
        amount=gw_order.amount,
        currency=gw_order.currency,
        razorpay_key_id=settings.razorpay_key_id,
        order_id=order.id,
        milestone_id=milestone.id,
    )


@router.post("/verify")
async def verify_payment(
    payload: VerifyPayment,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Verify the payment signature from the gateway callback.
    On success, records a Transaction, marks the milestone as paid,
    updates the Order totals, and fires SSE + messaging notifications.
    """
    # 1. Fetch the order with milestones
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.milestones), selectinload(Order.user))
        .where(Order.id == payload.order_id)
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your order")

    # 2. Verify signature
    provider = get_payment_provider()
    is_valid = provider.verify_payment(
        gateway_order_id=payload.gateway_order_id,
        gateway_payment_id=payload.gateway_payment_id,
        gateway_signature=payload.gateway_signature,
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification failed. Invalid signature.",
        )

    # 3. Find the milestone
    milestone = None
    if payload.milestone_id:
        milestone = next(
            (m for m in order.milestones if m.id == payload.milestone_id),
            None,
        )

    if not milestone:
        # Fallback: pick the next unpaid milestone
        unpaid = sorted(
            [m for m in order.milestones if m.status != "PAID"],
            key=lambda m: m.order_index,
        )
        milestone = unpaid[0] if unpaid else None

    if not milestone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No unpaid milestone found",
        )

    paid_amount = milestone.amount

    # 4. Record the transaction
    txn = Transaction(
        order_id=order.id,
        milestone_id=milestone.id,
        amount=paid_amount,
        payment_mode="ONLINE",
        notes=f"Gateway: {payload.gateway_payment_id}",
        gateway_payment_id=payload.gateway_payment_id,
    )
    db.add(txn)

    # 5. Update milestone
    milestone.status = "PAID"
    milestone.paid_at = datetime.now(timezone.utc)

    # 6. Update order totals
    order.amount_paid += paid_amount
    if order.amount_paid >= order.total_amount:
        order.status = "PAID"
    else:
        order.status = "PARTIALLY_PAID"

    await db.commit()

    # 7. Fire SSE + messaging notifications (fire-and-forget)
    try:
        from app.core.messaging import get_dispatcher

        dispatcher = get_dispatcher()
        user_obj = order.user
        await dispatcher.dispatch(
            to_email=user_obj.email if user_obj else None,
            to_phone=user_obj.phone if user_obj else None,
            subject=f"Payment Confirmed — ₹{paid_amount:,.2f}",
            body_html=f"""
                <p>Hi {user_obj.name if user_obj else 'Customer'},</p>
                <p>Your payment of <strong>₹{paid_amount:,.2f}</strong> for milestone 
                <em>{milestone.label}</em> has been confirmed.</p>
                <p>Order status: <strong>{order.status}</strong></p>
                <p>Amount paid so far: ₹{order.amount_paid:,.2f} / ₹{order.total_amount:,.2f}</p>
            """,
            body_text=(
                f"Hi {user_obj.name if user_obj else 'Customer'}, "
                f"your payment of ₹{paid_amount:,.2f} for {milestone.label} is confirmed. "
                f"Order status: {order.status}."
            ),
            sse_user_id=str(order.user_id),
            sse_event="payment_verified",
            sse_data={
                "order_id": str(order.id),
                "milestone_id": str(milestone.id),
                "amount": paid_amount,
                "status": order.status,
            },
            sse_admin_event="admin_payment_received",
            sse_admin_data={
                "order_id": str(order.id),
                "user_id": str(order.user_id),
                "amount": paid_amount,
                "milestone": milestone.label,
                "status": order.status,
            },
        )
    except Exception:
        pass  # Logged inside dispatcher — never block payment flow

    return {
        "message": "Payment verified and recorded successfully",
        "order_id": order.id,
        "milestone_id": milestone.id,
        "milestone_label": milestone.label,
        "amount_paid": order.amount_paid,
        "status": order.status,
    }
