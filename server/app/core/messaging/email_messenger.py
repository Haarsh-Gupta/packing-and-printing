# ===========================================================================
# Email Messenger — wraps the existing Brevo email service
# ===========================================================================

import logging
from typing import Optional, List, Tuple

from app.core.messaging.base import BaseMessenger, MessengerResult
from app.core.email.service import get_email_service

logger = logging.getLogger(__name__)


class EmailMessenger(BaseMessenger):
    """
    Sends notifications via the existing email service (Brevo SMTP).

    Accepted kwargs:
        attachments: List[Tuple[str, bytes, str]]  — (filename, data, mime_type)
    """

    def channel_name(self) -> str:
        return "email"

    async def send(
        self,
        to: str,
        subject: str,
        body: str,
        **kwargs,
    ) -> MessengerResult:
        attachments: Optional[List[Tuple[str, bytes, str]]] = kwargs.get("attachments")
        svc = get_email_service()

        try:
            if attachments:
                ok = await svc.send_email_with_attachments(
                    to=to,
                    subject=subject,
                    body_html=body,
                    attachments=attachments,
                )
            else:
                ok = await svc.send_email(
                    to=to,
                    subject=subject,
                    body_html=body,
                )

            if ok:
                logger.info(f"[EmailMessenger] Sent to {to}: {subject}")
                return MessengerResult(success=True, channel="email")
            else:
                logger.warning(f"[EmailMessenger] Failed to send to {to}")
                return MessengerResult(
                    success=False,
                    channel="email",
                    error="Email service returned failure",
                )

        except Exception as e:
            logger.error(f"[EmailMessenger] Exception sending to {to}: {e}")
            return MessengerResult(
                success=False,
                channel="email",
                error=str(e),
            )
