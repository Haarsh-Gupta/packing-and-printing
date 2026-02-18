"""
Schemas for the online payment flow.
"""

from pydantic import BaseModel, Field
from typing import Optional


class CreatePaymentOrder(BaseModel):
    """Request to create a gateway order for an existing internal order."""
    order_id: int = Field(..., description="Internal Order ID to pay for")


class PaymentOrderResponse(BaseModel):
    """Returned to the frontend so it can open the gateway checkout."""
    gateway_order_id: str
    amount: int                     # in paise
    currency: str = "INR"
    razorpay_key_id: str            # frontend needs this to open checkout
    order_id: int                   # echo back for convenience


class VerifyPayment(BaseModel):
    """Callback payload sent by the frontend after the gateway checkout."""
    order_id: int = Field(..., description="Internal Order ID")
    gateway_order_id: str = Field(..., description="Gateway order id (e.g. razorpay_order_id)")
    gateway_payment_id: str = Field(..., description="Gateway payment id (e.g. razorpay_payment_id)")
    gateway_signature: str = Field(..., description="Gateway signature (e.g. razorpay_signature)")
