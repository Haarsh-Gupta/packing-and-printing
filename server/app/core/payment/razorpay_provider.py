"""
Razorpay implementation of PaymentProvider.
"""

import razorpay
from typing import Optional

from .base import PaymentProvider, PaymentOrderResult


class RazorpayProvider(PaymentProvider):
    """Concrete adapter for the Razorpay payment gateway."""

    def __init__(self, key_id: str, key_secret: str):
        self._client = razorpay.Client(auth=(key_id, key_secret))

    # ── create_order ──────────────────────────────────────────────
    def create_order(
        self,
        amount_paise: int,
        currency: str = "INR",
        receipt: str = "",
        notes: Optional[dict] = None,
    ) -> PaymentOrderResult:
        payload: dict = {
            "amount": amount_paise,
            "currency": currency,
            "receipt": receipt,
        }
        if notes:
            payload["notes"] = notes

        rz_order = self._client.order.create(data=payload)

        return PaymentOrderResult(
            gateway_order_id=rz_order["id"],
            amount=rz_order["amount"],
            currency=rz_order["currency"],
            receipt=rz_order.get("receipt", receipt),
            status=rz_order["status"],
            extra=rz_order,
        )

    # ── verify_payment ────────────────────────────────────────────
    def verify_payment(
        self,
        gateway_order_id: str,
        gateway_payment_id: str,
        gateway_signature: str,
    ) -> bool:
        params = {
            "razorpay_order_id": gateway_order_id,
            "razorpay_payment_id": gateway_payment_id,
            "razorpay_signature": gateway_signature,
        }
        try:
            self._client.utility.verify_payment_signature(params)
            return True
        except razorpay.errors.SignatureVerificationError:
            return False
