"""
OTP orchestrator service.

Coordinates OTP generation, storage (via BaseOTPStore), and
email delivery (via BaseEmailService). Business logic is fully
decoupled from vendors — swap Redis or Brevo without touching this file.
"""

import logging
import secrets
import string
import hashlib
from app.core.config import settings
from app.core.otp_store import BaseOTPStore, get_otp_store
from app.core.email.service import BaseEmailService, get_email_service
from app.core.email.templates.otp import render_otp_email
from app.core.email.templates.password_reset import render_password_reset_email


logger = logging.getLogger("app.modules.otps")


class OTPService:
    """
    High-level OTP operations.
    Inject custom store/email service for testing or vendor swaps.
    """

    def __init__(
        self,
        otp_store: BaseOTPStore | None = None,
        email_service: BaseEmailService | None = None,
    ):
        self.store = otp_store or get_otp_store()
        self.email = email_service or get_email_service()


    @staticmethod
    def _generate_otp() -> str:
        otp = "".join(secrets.choice(string.digits) for _ in range(6))
        return otp

    async def send_otp(self, email: str, user_name: str | None = None) -> bool:
        """Generate, store, and email a verification OTP."""
        count = await self.store.increment_daily_otp_count(email)
        if count > 3:
            raise ValueError("MAX_GENERATION_LIMIT_EXCEEDED")
            
        otp = self._generate_otp()
        expire_minutes = settings.otp_expire_seconds // 60

        logger.info(
            "OTP generated and queued for delivery",
            extra={
                "email_hash": hashlib.sha256(email.encode()).hexdigest()[:8],
                "expires_in_minutes": expire_minutes,
            }
        )

        await self.store.store_otp(email, otp)

        html = render_otp_email(
            otp_code=otp,
            expire_minutes=expire_minutes,
            user_name=user_name,
        )
        return await self.email.send_email(
            to=email,
            subject="Your Verification Code",
            body_html=html,
        )

    async def send_password_reset_otp(self, email: str, user_name: str | None = None) -> bool:
        """Generate, store, and email a password-reset OTP."""
        # Share the generation limit across regular and password-reset OTPs
        count = await self.store.increment_daily_otp_count(email)
        if count > 3:
            raise ValueError("MAX_GENERATION_LIMIT_EXCEEDED")
            
        otp = self._generate_otp()
        expire_minutes = settings.otp_expire_seconds // 60

        # Store under a different key prefix to avoid collision with regular OTPs
        await self.store.store_otp(f"pwd_reset:{email}", otp)

        html = render_password_reset_email(
            otp_code=otp,
            expire_minutes=expire_minutes,
            user_name=user_name,
        )
        return await self.email.send_email(
            to=email,
            subject="Password Reset Code",
            body_html=html,
        )

    async def verify_otp(self, email: str, otp: str, consume: bool = True) -> bool:
        """
        Verify an OTP. 
        If consume=True (default), deletes the OTP on success.
        If consume=False, keeps the OTP (for pre-verification checks).
        """
        stored = await self.store.get_otp(email)
        if stored is not None:
            stored = stored.decode() if isinstance(stored, bytes) else str(stored)
            
        attempts = await self.store.increment_otp_attempts(email)
        if attempts > 5:
            await self.store.delete_otp(email)
            raise ValueError("MAX_ATTEMPT_LIMIT_EXCEEDED")
            
        match = stored and stored == otp
        logger.info(
            "OTP verification attempt",
            extra={
                "email_hash": hashlib.sha256(
                    email.encode()
                ).hexdigest()[:8],
                "result": "success" if match else "failure",
                "consume": consume,
            }
        )

        if match and consume:
            await self.store.delete_otp(email)
            return True
            
        if match and not consume:
            return True
            
        return False

    async def verify_password_reset_otp(self, email: str, otp: str) -> bool:
        """Verify a password-reset OTP and delete it on success."""
        key = f"pwd_reset:{email}"
        stored = await self.store.get_otp(key)
        if stored is not None:
            stored = stored.decode() if isinstance(stored, bytes) else str(stored)
            
        attempts = await self.store.increment_otp_attempts(key)
        if attempts > 5:
            await self.store.delete_otp(key)
            raise ValueError("MAX_ATTEMPT_LIMIT_EXCEEDED")
            
        if stored and stored == otp:
            await self.store.delete_otp(key)
            return True
        return False




# Singleton-ish convenience
def get_otp_service() -> OTPService:
    return OTPService()
