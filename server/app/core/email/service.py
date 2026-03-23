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

import httpx
import base64
from app.core.config import settings

logger = logging.getLogger(__name__)


class BaseEmailService(ABC):
    """
    Abstract base for email delivery.
    """

    @abstractmethod
    async def send_email(self, to: str, subject: str, body_html: str) -> Optional[str]:
        ...

    @abstractmethod
    async def send_email_with_attachments(
        self,
        to: str,
        subject: str,
        body_html: str,
        attachments: Optional[List[Tuple[str, bytes, str]]] = None,
    ) -> Optional[str]:
        ...


class BrevoEmailService(BaseEmailService):
    """
    Sends transactional emails via Brevo's REST API V3.
    Returns messageId on success, None on failure. 
    """

    def __init__(self):
        self.api_url = "https://api.brevo.com/v3/smtp/email"
        self.api_key = settings.brevo_api_key
        self.sender_name = settings.brevo_sender_name
        self.sender_email = settings.brevo_sender_email

    async def _send_via_api(
        self,
        to: str,
        subject: str,
        body_html: str,
        attachments: Optional[List[Tuple[str, bytes, str]]] = None,
    ) -> Optional[str]:
        """
        Internal method to call Brevo REST API.
        """
        if not self.api_key:
            logger.error("BREVO_API_KEY is not configured.")
            return None

        # Prepare attachments for JSON (Base64)
        json_attachments = []
        for name, content, mime in (attachments or []):
            json_attachments.append({
                "name": name,
                "content": base64.b64encode(content).decode("utf-8")
            })

        payload = {
            "sender": {"name": self.sender_name, "email": self.sender_email},
            "to": [{"email": to}],
            "subject": subject,
            "htmlContent": body_html,
        }
        if json_attachments:
            payload["attachment"] = json_attachments

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "api-key": self.api_key,
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                    json=payload,
                )
                
                if response.status_code >= 400:
                    logger.error(f"Brevo API Error: {response.status_code} - {response.text}")
                    return None
                
                data = response.json()
                message_id = data.get("messageId")
                logger.info(f"Email sent via REST to {to}. Subject: {subject}. ID: {message_id}")
                return message_id

        except Exception as e:
            logger.exception(f"Unexpected error calling Brevo REST API for {to}: {e}")
            return None

    async def send_email(self, to: str, subject: str, body_html: str) -> Optional[str]:
        return await self._send_via_api(to, subject, body_html)

    async def send_email_with_attachments(
        self,
        to: str,
        subject: str,
        body_html: str,
        attachments: Optional[List[Tuple[str, bytes, str]]] = None,
    ) -> Optional[str]:
        return await self._send_via_api(to, subject, body_html, attachments)


class BrevoSMTPEmailService(BaseEmailService):
    """
    SMTP implementation kept as fallback.
    """
    def __init__(self):
        self.host = settings.brevo_smtp_host
        self.port = settings.brevo_smtp_port
        self.username = settings.brevo_smtp_user
        self.password = settings.brevo_smtp_password
        self.sender_email = settings.brevo_sender_email
        self.sender_name = settings.brevo_sender_name

    def _build_message(self, to, subject, body_html, attachments=None):
        import uuid
        import re
        from email.utils import formatdate
        message = MIMEMultipart("mixed")
        message["From"] = f"{self.sender_name} <{self.sender_email}>"
        message["To"] = to
        message["Subject"] = subject
        message["Date"] = formatdate(localtime=True)
        message["Message-ID"] = f"<{uuid.uuid4()}@{self.sender_email.split('@')[-1]}>"

        body_alternative = MIMEMultipart("alternative")
        plain_text = re.sub(r'<[^>]+>', '', body_html) 
        body_alternative.attach(MIMEText(plain_text, "plain", "utf-8"))
        body_alternative.attach(MIMEText(body_html, "html", "utf-8"))
        message.attach(body_alternative)

        for filename, file_bytes, mime_type in (attachments or []):
            maintype, subtype = mime_type.split("/", 1) if "/" in mime_type else ("application", "octet-stream")
            part = MIMEBase(maintype, subtype)
            part.set_payload(file_bytes)
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", "attachment", filename=filename)
            message.attach(part)
        return message

    async def send_email(self, to: str, subject: str, body_html: str) -> Optional[str]:
        msg = self._build_message(to, subject, body_html)
        try:
            await aiosmtplib.send(msg, hostname=self.host, port=self.port, username=self.username, password=self.password, start_tls=True)
            return msg["Message-ID"]
        except Exception as e:
            logger.error(f"SMTP Fallback failed: {e}")
            return None

    async def send_email_with_attachments(self, to: str, subject: str, body_html: str, attachments=None) -> Optional[str]:
        msg = self._build_message(to, subject, body_html, attachments)
        try:
            await aiosmtplib.send(msg, hostname=self.host, port=self.port, username=self.username, password=self.password, start_tls=True)
            return msg["Message-ID"]
        except Exception as e:
            logger.error(f"SMTP Fallback failed: {e}")
            return None


# Factory
def get_email_service() -> BaseEmailService:
    """
    Defaulting to the new REST service.
    """
    return BrevoEmailService()


async def check_smtp_connection():
    """
    Verifies connection by checking Brevo Account via REST API.
    """
    if not settings.brevo_api_key:
        logger.warning("Brevo (REST): API Key missing")
        return False
        
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                "https://api.brevo.com/v3/account",
                headers={"api-key": settings.brevo_api_key}
            )
            if response.status_code == 200:
                logger.info("Brevo (REST): API Key Valid")
                return True
            else:
                logger.error("Brevo (REST): API Key Invalid (%s)", response.status_code)
                return False
    except Exception as e:
        logger.error("Brevo (REST): Connection Failed - %s", e)
        return False
