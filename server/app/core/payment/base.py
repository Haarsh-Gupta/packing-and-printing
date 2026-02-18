"""
Abstract payment provider interface.

Any payment gateway (Razorpay, Stripe, PayU, etc.) must implement this
interface. Routes and services depend ONLY on this abstraction, so
swapping providers requires zero changes outside this package.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class PaymentOrderResult:
    """Returned by create_order — gateway-agnostic shape."""
    gateway_order_id: str
    amount: int            # in smallest currency unit (paise for INR)
    currency: str
    receipt: str
    status: str            # e.g. "created"
    extra: Optional[dict] = None   # provider-specific extras


class PaymentProvider(ABC):
    """Contract that every payment gateway adapter must fulfil."""

    @abstractmethod
    def create_order(
        self,
        amount_paise: int,
        currency: str = "INR",
        receipt: str = "",
        notes: Optional[dict] = None,
    ) -> PaymentOrderResult:
        """
        Create an order/session on the payment gateway.
        `amount_paise` is in the smallest currency unit (e.g. paise for INR).
        """
        ...

    @abstractmethod
    def verify_payment(
        self,
        gateway_order_id: str,
        gateway_payment_id: str,
        gateway_signature: str,
    ) -> bool:
        """
        Verify the payment callback signature.
        Returns True if the signature is valid.
        """
        ...
