# ===========================================================================
# Email Service Abstraction
# ===========================================================================
# This module provides a vendor-agnostic interface for sending emails.
#
# CURRENT IMPLEMENTATION: BrevoSMTPEmailService (uses aiosmtplib)
#
# VENDOR SWAPPING:
#   To use a different provider (SendGrid, Mailgun, AWS SES, Resend, etc.):
#   1. Create a new class inheriting from BaseEmailService
#   2. Implement the `send_email` method using that provider's SDK/API
#   3. Update the `get_email_service()` factory to return your new class
#
#   Example:
#       class SendGridEmailService(BaseEmailService):
#           async def send_email(self, to, subject, body_html):
#               # use sendgrid SDK here
#               ...
# ===========================================================================

from abc import ABC, abstractmethod
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

import aiosmtplib
from app.core.config import settings

logger = logging.getLogger(__name__)


class BaseEmailService(ABC):
    """
    Abstract base for email delivery.
    Inherit this class to add a new email vendor without changing
    any business logic or templates.
    """

    @abstractmethod
    async def send_email(self, to: str, subject: str, body_html: str) -> bool:
        """
        Send an email.

        Args:
            to: Recipient email address
            subject: Email subject line
            body_html: Full HTML body (already rendered from a template)

        Returns:
            True if sent successfully, False otherwise
        """
        ...


class BrevoSMTPEmailService(BaseEmailService):
    """
    Sends emails through Brevo's SMTP relay using aiosmtplib.

    Requires these env vars (set in config.py):
      BREVO_SMTP_HOST, BREVO_SMTP_PORT,
      BREVO_SMTP_USER, BREVO_SMTP_PASSWORD,
      BREVO_SENDER_EMAIL, BREVO_SENDER_NAME
    """

    def __init__(
        self,
        host: str | None = None,
        port: int | None = None,
        username: str | None = None,
        password: str | None = None,
        sender_email: str | None = None,
        sender_name: str | None = None,
    ):
        self.host = host or settings.brevo_smtp_host
        self.port = port or settings.brevo_smtp_port
        self.username = username or settings.brevo_smtp_user
        self.password = password or settings.brevo_smtp_password
        self.sender_email = sender_email or settings.brevo_sender_email
        self.sender_name = sender_name or settings.brevo_sender_name

    async def send_email(self, to: str, subject: str, body_html: str) -> bool:
        message = MIMEMultipart("alternative")
        message["From"] = f"{self.sender_name} <{self.sender_email}>"
        message["To"] = to
        message["Subject"] = subject
        message.attach(MIMEText(body_html, "html"))

        try:
            await aiosmtplib.send(
                message,
                hostname=self.host,
                port=self.port,
                username=self.username,
                password=self.password,
                start_tls=True,
            )
            logger.info(f"Email sent to {to}: {subject}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to}: {e}")
            return False


# ---------------------------------------------------------------------------
# Factory — change this to return a different email service implementation
# ---------------------------------------------------------------------------
def get_email_service() -> BaseEmailService:
    """
    Returns the active email service instance.
    Swap this to use a different provider (SendGridEmailService, etc.)
    """
    return BrevoSMTPEmailService()
