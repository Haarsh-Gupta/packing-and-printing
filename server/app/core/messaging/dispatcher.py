# ===========================================================================
# Notification Dispatcher
# ===========================================================================
# Orchestrates sending notifications through all configured channels
# (Email, WhatsApp, etc.) and optionally fires an SSE event.
#
# Usage:
#   dispatcher = get_dispatcher()
#   results = await dispatcher.dispatch(
#       to_email="user@example.com",
#       to_phone="+919876543210",
#       subject="Payment Received",
#       body_html="<p>Your payment of ₹5000 has been confirmed.</p>",
#       body_text="Your payment of ₹5000 has been confirmed.",
#       sse_user_id=user_id,
#       sse_event="payment_received",
#       sse_data={"order_id": str(order_id), "amount": 5000},
#   )
# ===========================================================================

import asyncio
import logging
from typing import Optional, List
from uuid import UUID

from .base import BaseMessenger, MessengerResult
from .email_messenger import EmailMessenger
from .whatsapp_messenger import get_whatsapp_messenger

logger = logging.getLogger(__name__)


class NotificationDispatcher:
    """
    Sends notifications through all registered channels.
    Failures are logged but never block the caller.
    """

    def __init__(self, messengers: List[BaseMessenger]):
        self._messengers = messengers

    async def dispatch(
        self,
        *,
        # Recipient identifiers — each channel uses the one it needs
        to_email: Optional[str] = None,
        to_phone: Optional[str] = None,
        # Content
        subject: str,
        body_html: str = "",
        body_text: str = "",
        # Email-specific
        attachments: Optional[list] = None,
        # SSE broadcasting (optional)
        sse_user_id: Optional[str | UUID] = None,
        sse_event: Optional[str] = None,
        sse_data: Optional[dict] = None,
        # Admin SSE
        sse_admin_event: Optional[str] = None,
        sse_admin_data: Optional[dict] = None,
    ) -> List[MessengerResult]:
        """
        Fire-and-forget across all channels.  Returns results list.
        """
        results: List[MessengerResult] = []

        for messenger in self._messengers:
            channel = messenger.channel_name()

            # Determine recipient and body for this channel
            if channel == "email" and to_email:
                to = to_email
                body = body_html or body_text
                kwargs = {}
                if attachments:
                    kwargs["attachments"] = attachments
            elif channel == "whatsapp" and to_phone:
                to = to_phone
                body = body_text or body_html
                kwargs = {}
            else:
                # No recipient for this channel — skip
                continue

            try:
                result = await messenger.send(
                    to=to,
                    subject=subject,
                    body=body,
                    **kwargs,
                )
                results.append(result)

                if result.success:
                    logger.info(f"[Dispatcher] {channel} → {to}: OK")
                else:
                    logger.warning(f"[Dispatcher] {channel} → {to}: FAILED ({result.error})")

            except Exception as e:
                logger.error(f"[Dispatcher] {channel} → {to}: EXCEPTION {e}")
                results.append(
                    MessengerResult(success=False, channel=channel, error=str(e))
                )

        # ── SSE broadcasts ────────────────────────────────────
        if sse_event and sse_user_id:
            try:
                from app.core.sse import sse_manager
                await sse_manager.publish(sse_user_id, sse_event, sse_data or {})
            except Exception as e:
                logger.error(f"[Dispatcher] SSE user publish failed: {e}")

        if sse_admin_event:
            try:
                from app.core.sse import sse_manager
                await sse_manager.publish_to_admins(sse_admin_event, sse_admin_data or {})
            except Exception as e:
                logger.error(f"[Dispatcher] SSE admin publish failed: {e}")

        return results


def get_dispatcher() -> NotificationDispatcher:
    """
    Factory — returns a dispatcher pre-loaded with all active channels.
    Add new channels here as they are implemented.
    """
    messengers: List[BaseMessenger] = [
        EmailMessenger(),
        get_whatsapp_messenger(),
    ]
    return NotificationDispatcher(messengers)
