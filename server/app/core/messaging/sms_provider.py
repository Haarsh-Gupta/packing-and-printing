import logging 
from app.core.messaging.sms_base import SMSProvider

logger = logging.getLogger(__name__)

class SMSProviderImpl(SMSProvider):
    def send_otp(self, phone_number: str, otp: str) -> bool:
        try:
            logger.info(f"Sending OTP {otp} to {phone_number}")
            return True
        except Exception as e:
            logger.error(f"Failed to send OTP to {phone_number}: {e}")
            return False