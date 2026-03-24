"""
OTP orchestrator service.

Coordinates OTP generation, storage (via BaseOTPStore), and
email delivery (via BaseEmailService). Business logic is fully
decoupled from vendors — swap Redis or Brevo without touching this file.
"""

import secrets
import string
from app.core.config import settings
from app.core.otp_store import BaseOTPStore, get_otp_store
from app.core.email.service import BaseEmailService, get_email_service
from app.core.email.templates.otp import render_otp_email
from app.core.email.templates.password_reset import render_password_reset_email


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
        otp = self._generate_otp()
        expire_minutes = settings.otp_expire_seconds // 60

        logger.info(f"\n{'='*50}\n📧 OTP for {email}: {otp}\n⏱️  Expires in {expire_minutes} minutes\n{'='*50}\n")

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
            
        match = stored and stored == otp
        logger.info(f"\n{'='*50}\n🔍 Verifying OTP for {email}\n   Stored OTP : {stored!r}\n   Received OTP: {otp!r}\n   Match: {match}\n{'='*50}\n")

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
        if stored and stored == otp:
            await self.store.delete_otp(key)
            return True
        return False


# Singleton-ish convenience
def get_otp_service() -> OTPService:
    return OTPService()
