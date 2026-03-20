"""
Payment provider factory.

Usage:
    from app.core.payment import get_payment_provider
    provider = get_payment_provider()
"""

from app.core.payment.base import PaymentProvider
from app.core.payment.razorpay_provider import RazorpayProvider
from app.core.config import settings


def get_payment_provider() -> PaymentProvider:
    """
    Factory that returns the active payment provider.
    Switch providers by changing this function — no route/model changes needed.
    """
    if not settings.razorpay_key_id or settings.razorpay_key_id == "mock_key":
        from app.core.payment.mock_provider import MockProvider
        return MockProvider()

    return RazorpayProvider(
        key_id=settings.razorpay_key_id,
        key_secret=settings.razorpay_key_secret,
    )
