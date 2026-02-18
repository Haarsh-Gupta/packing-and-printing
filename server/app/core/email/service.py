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
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Tuple, Optional
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

    async def send_email_with_attachments(
        self,
        to: str,
        subject: str,
        body_html: str,
        attachments: Optional[List[Tuple[str, bytes, str]]] = None,
    ) -> bool:
        """
        Send an email with optional file attachments.

        Args:
            to: Recipient email address
            subject: Email subject line
            body_html: Full HTML body
            attachments: List of (filename, file_bytes, mime_type) tuples
                         e.g. [("invoice.pdf", b"...", "application/pdf")]

        Returns:
            True if sent successfully, False otherwise

        Default implementation falls back to send_email (no attachments).
        Override in subclasses that support attachments.
        """
        return await self.send_email(to, subject, body_html)


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

    def _build_message(
        self,
        to: str,
        subject: str,
        body_html: str,
        attachments: Optional[List[Tuple[str, bytes, str]]] = None,
    ) -> MIMEMultipart:
        message = MIMEMultipart("mixed")
        message["From"] = f"{self.sender_name} <{self.sender_email}>"
        message["To"] = to
        message["Subject"] = subject
        message.attach(MIMEText(body_html, "html"))

        for filename, file_bytes, mime_type in (attachments or []):
            maintype, subtype = mime_type.split("/", 1) if "/" in mime_type else ("application", "octet-stream")
            part = MIMEBase(maintype, subtype)
            part.set_payload(file_bytes)
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", "attachment", filename=filename)
            message.attach(part)

        return message

    async def _send(self, message: MIMEMultipart) -> bool:
        try:
            await aiosmtplib.send(
                message,
                hostname=self.host,
                port=self.port,
                username=self.username,
                password=self.password,
                start_tls=True,
            )
            logger.info(f"Email sent to {message['To']}: {message['Subject']}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {message['To']}: {e}")
            return False

    async def send_email(self, to: str, subject: str, body_html: str) -> bool:
        return await self._send(self._build_message(to, subject, body_html))

    async def send_email_with_attachments(
        self,
        to: str,
        subject: str,
        body_html: str,
        attachments: Optional[List[Tuple[str, bytes, str]]] = None,
    ) -> bool:
        return await self._send(self._build_message(to, subject, body_html, attachments))

# ---------------------------------------------------------------------------
# Factory — change this to return a different email service implementation
# ---------------------------------------------------------------------------
def get_email_service() -> BaseEmailService:
    """
    Returns the active email service instance.
    Swap this to use a different provider (SendGridEmailService, etc.)
    """
    return BrevoSMTPEmailService()


async def check_smtp_connection():
    try:
        smtp = aiosmtplib.SMTP(
            hostname=settings.brevo_smtp_host,
            port=settings.brevo_smtp_port,
            start_tls=True,
        )
        await smtp.connect()
        await smtp.login(settings.brevo_smtp_user, settings.brevo_smtp_password)
        await smtp.quit()
        print("✅ Brevo (SMTP): Connected & Authenticated")
        return True
    except Exception as e:
        print(f"❌ Brevo (SMTP): Connection Failed - {e}")
        return False
