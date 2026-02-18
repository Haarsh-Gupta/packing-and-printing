"""
Payment provider factory.

Usage:
    from app.core.payment import get_payment_provider
    provider = get_payment_provider()
"""

from .base import PaymentProvider
from .razorpay_provider import RazorpayProvider
from app.core.config import settings


def get_payment_provider() -> PaymentProvider:
    """
    Factory that returns the active payment provider.
    Switch providers by changing this function — no route/model changes needed.
    """
    return RazorpayProvider(
        key_id=settings.razorpay_key_id,
        key_secret=settings.razorpay_key_secret,
    )
