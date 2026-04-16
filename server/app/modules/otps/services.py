import logging
import secrets
import string
import hashlib
from app.core.config import settings
from app.core.otp_store import BaseOTPStore, get_otp_store
from app.core.email.service import BaseEmailService, get_email_service
from app.core.email.templates.otp import render_otp_email
from app.core.email.templates.password_reset import render_password_reset_email
from app.core.messaging.whatsapp_messenger import BaseMessenger, get_whatsapp_messenger


logger = logging.getLogger("app.modules.otps")


class OTPService:
    """
    High-level OTP operations.
    Inject custom store/email/messenger service for testing or vendor swaps.
    """

    def __init__(
        self,
        otp_store: BaseOTPStore | None = None,
        email_service: BaseEmailService | None = None,
        whatsapp_service: BaseMessenger | None = None,
    ):
        self.store = otp_store or get_otp_store()
        self.email = email_service or get_email_service()
        self.whatsapp = whatsapp_service or get_whatsapp_messenger()


    @staticmethod
    def _generate_otp() -> str:
        otp = "".join(secrets.choice(string.digits) for _ in range(6))
        return otp

    async def send_otp(self, email: str, user_name: str | None = None) -> bool:
        """Generate, store, and email a verification OTP."""
        count = await self.store.increment_daily_otp_count(email)
        if count > 5: # Increased limit for testing flexibility
            raise ValueError("MAX_GENERATION_LIMIT_EXCEEDED")
            
        otp = self._generate_otp()
        expire_minutes = settings.otp_expire_seconds // 60

        logger.info(
            "Email OTP generated and queued for delivery",
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

    async def send_phone_otp(self, phone: str) -> bool:
        """Generate, store, and send a WhatsApp verification OTP via Meta Cloud API."""
        # Clean phone number
        phone_clean = "".join(c for c in phone if c.isdigit())
        if not phone_clean.startswith("+"):
            # Assume India if no country code? Usually better to require it.
            # For now, if it's 10 digits, prepend +91
            if len(phone_clean) == 10:
                phone_clean = f"+91{phone_clean}"
            elif not phone_clean.startswith("+"):
                # If it doesn't have a plus, we might need to handle it based on format
                # But E.164 is preferred. Prepend + if missing.
                phone_clean = f"+{phone_clean}"

        count = await self.store.increment_daily_otp_count(phone_clean)
        if count > 5:
            raise ValueError("MAX_GENERATION_LIMIT_EXCEEDED")

        otp = self._generate_otp()
        
        logger.info(
            "Phone OTP generated and queued for delivery",
            extra={
                "phone_hash": hashlib.sha256(phone_clean.encode()).hexdigest()[:8],
            }
        )

        # Store under phone_otp:{phone} to separate from email OTPs
        key = f"phone:{phone_clean}"
        await self.store.store_otp(key, otp)

        # Send via WhatsApp API Template
        result = await self.whatsapp.send(
            to=phone_clean,
            subject="Verification Code",
            body=f"Your verification code is {otp}",
            template_name=settings.whatsapp_auth_template_name,
            template_params=[otp]
        )
        
        return result.success
    
    async def send_test_whatsapp(self, phone: str) -> bool:
        """Send a test 'hello_world' message to verify credentials."""
        phone_clean = "".join(c for c in phone if c.isdigit())
        if not phone_clean.startswith("+"):
            if len(phone_clean) == 10:
                phone_clean = f"+91{phone_clean}"
            else:
                phone_clean = f"+{phone_clean}"

        logger.info(f"Sending hello_world test message to {phone_clean}")

        result = await self.whatsapp.send(
            to=phone_clean,
            subject="Test Connectivity",
            body="If you see this, your credentials are correct.",
            template_name="hello_world"
        )
        return result.success

    async def send_password_reset_otp(self, email: str, user_name: str | None = None) -> bool:
        """Generate, store, and email a password-reset OTP."""
        count = await self.store.increment_daily_otp_count(email)
        if count > 5:
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

    async def verify_otp(self, identifier: str, otp: str, consume: bool = True) -> bool:
        """
        Verify an OTP. 
        Works for both email and phone (if prefix is included in identifier).
        """
        stored = await self.store.get_otp(identifier)
        if stored is not None:
            stored = stored.decode() if isinstance(stored, bytes) else str(stored)
            
        attempts = await self.store.increment_otp_attempts(identifier)
        if attempts > 5:
            await self.store.delete_otp(identifier)
            raise ValueError("MAX_ATTEMPT_LIMIT_EXCEEDED")
            
        match = stored and stored == otp
        logger.info(
            "OTP verification attempt",
            extra={
                "id_hash": hashlib.sha256(identifier.encode()).hexdigest()[:8],
                "result": "success" if match else "failure",
                "consume": consume,
            }
        )

        if match and consume:
            await self.store.delete_otp(identifier)
            return True
            
        if match and not consume:
            return True
            
        return False

    async def verify_phone_otp(self, phone: str, otp: str, consume: bool = True) -> bool:
        """Verify a phone OTP."""
        phone_clean = "".join(c for c in phone if c.isdigit())
        if not phone_clean.startswith("+"):
             if len(phone_clean) == 10:
                phone_clean = f"+91{phone_clean}"
             else:
                phone_clean = f"+{phone_clean}"
        
        return await self.verify_otp(f"phone:{phone_clean}", otp, consume)

    async def verify_password_reset_otp(self, email: str, otp: str) -> bool:
        """Verify a password-reset OTP and delete it on success."""
        key = f"pwd_reset:{email}"
        return await self.verify_otp(key, otp, consume=True)


# Singleton-ish convenience
def get_otp_service() -> OTPService:
    return OTPService()
