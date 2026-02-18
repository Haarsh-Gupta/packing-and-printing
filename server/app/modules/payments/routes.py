"""
Online payment routes.

POST /payments/create-order  — create a gateway order for an existing Order
POST /payments/verify        — verify the payment and record the transaction
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

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
    Create a payment gateway order for an existing internal order.
    Returns the gateway order ID + key so the frontend can open checkout.
    """
    # 1. Fetch the order
    result = await db.execute(select(Order).where(Order.id == payload.order_id))
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

    # 2. Calculate remaining amount (in paise)
    remaining = order.total_amount - order.amount_paid
    if remaining <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already fully paid",
        )
    amount_paise = int(remaining * 100)

    # 3. Create order on payment gateway
    provider = get_payment_provider()
    try:
        gw_order = provider.create_order(
            amount_paise=amount_paise,
            currency="INR",
            receipt=f"order_{order.id}",
            notes={"internal_order_id": str(order.id), "user_id": str(current_user.id)},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Payment gateway error: {str(e)}",
        )

    # 4. Save gateway order ID on our order
    order.payment_gateway_order_id = gw_order.gateway_order_id
    await db.commit()

    return PaymentOrderResponse(
        gateway_order_id=gw_order.gateway_order_id,
        amount=gw_order.amount,
        currency=gw_order.currency,
        razorpay_key_id=settings.razorpay_key_id,
        order_id=order.id,
    )


@router.post("/verify")
async def verify_payment(
    payload: VerifyPayment,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Verify the payment signature from the gateway callback.
    On success, records a Transaction and updates the Order.
    """
    # 1. Fetch the order
    result = await db.execute(select(Order).where(Order.id == payload.order_id))
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

    # 3. Calculate the paid amount (the amount from the gateway order)
    remaining = order.total_amount - order.amount_paid
    paid_amount = remaining  # full remaining amount was charged

    # 4. Record the transaction
    txn = Transaction(
        order_id=order.id,
        amount=paid_amount,
        payment_mode="ONLINE",
        notes=f"Gateway: {payload.gateway_payment_id}",
        gateway_payment_id=payload.gateway_payment_id,
        gateway_signature=payload.gateway_signature,
    )
    db.add(txn)

    # 5. Update order
    order.amount_paid += paid_amount
    if order.amount_paid >= order.total_amount:
        order.status = "PAID"
    else:
        order.status = "PARTIALLY_PAID"

    await db.commit()

    return {
        "message": "Payment verified and recorded successfully",
        "order_id": order.id,
        "amount_paid": order.amount_paid,
        "status": order.status,
    }
