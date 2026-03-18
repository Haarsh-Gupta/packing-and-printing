"""
Mock implementation of PaymentProvider for local testing without API keys.
"""

import uuid
from typing import Optional

from .base import PaymentProvider, PaymentOrderResult


class MockProvider(PaymentProvider):
    """Mock adapter that simulates payment gateway."""

    def create_order(
        self,
        amount_paise: int,
        currency: str = "INR",
        receipt: str = "",
        notes: Optional[dict] = None,
    ) -> PaymentOrderResult:
        gw_order_id = f"order_{uuid.uuid4().hex[:14]}"
        return PaymentOrderResult(
            gateway_order_id=gw_order_id,
            amount=amount_paise,
            currency=currency,
            receipt=receipt,
            status="created",
            extra={"mock": True},
        )

    def verify_payment(
        self,
        gateway_order_id: str,
        gateway_payment_id: str,
        gateway_signature: str,
    ) -> bool:
        # Accept anything for local mock testing
        return True
