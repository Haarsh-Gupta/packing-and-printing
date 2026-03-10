# ===========================================================================
# WhatsApp Messenger — future-proofed for Meta Cloud API
# ===========================================================================
# CURRENT (hackathon):  WhatsAppLinkMessenger generates wa.me links.
#                       Admin clicks the link to manually send the message.
#
# FUTURE:               Implement WhatsAppAPIMessenger using Meta Cloud API.
#                       Swap in get_whatsapp_messenger() — zero changes to
#                       business logic or the dispatcher.
# ===========================================================================

import urllib.parse
import logging
from typing import Optional

from .base import BaseMessenger, MessengerResult

logger = logging.getLogger(__name__)


class WhatsAppLinkMessenger(BaseMessenger):
    """
    Hackathon implementation — generates a wa.me deep link.

    The link is returned in ``metadata["whatsapp_link"]`` so the admin
    dashboard can render a clickable "Send via WhatsApp" button.
    """

    def channel_name(self) -> str:
        return "whatsapp"

    async def send(
        self,
        to: str,
        subject: str,
        body: str,
        **kwargs,
    ) -> MessengerResult:
        """
        Generate a wa.me link.

        Args:
            to:      Phone number with country code (e.g. "+919876543210")
            subject: Used as a header line in the message
            body:    Plain text message body
        """
        # Clean phone number
        phone_clean = "".join(c for c in to if c.isdigit())

        # Compose message text
        full_message = f"*{subject}*\n\n{body}" if subject else body
        encoded = urllib.parse.quote(full_message)
        link = f"https://wa.me/{phone_clean}?text={encoded}"

        logger.info(f"[WhatsAppLink] Generated link for {phone_clean}")

        return MessengerResult(
            success=True,
            channel="whatsapp",
            metadata={"whatsapp_link": link},
        )


class WhatsAppAPIMessenger(BaseMessenger):
    """
    Meta Cloud API implementation (placeholder).

    To activate:
      1. Set WHATSAPP_BUSINESS_PHONE_ID and WHATSAPP_ACCESS_TOKEN in .env
      2. Implement the send() method using httpx / aiohttp
      3. Update get_whatsapp_messenger() to return this class

    The rest of the codebase requires ZERO changes.
    """

    def __init__(self, phone_number_id: str, access_token: str):
        self._phone_number_id = phone_number_id
        self._access_token = access_token

    def channel_name(self) -> str:
        return "whatsapp"

    async def send(
        self,
        to: str,
        subject: str,
        body: str,
        **kwargs,
    ) -> MessengerResult:
        # ---- Future Implementation ----
        # import httpx
        # url = f"https://graph.facebook.com/v18.0/{self._phone_number_id}/messages"
        # headers = {"Authorization": f"Bearer {self._access_token}", "Content-Type": "application/json"}
        # payload = {
        #     "messaging_product": "whatsapp",
        #     "to": to,
        #     "type": "text",
        #     "text": {"body": f"*{subject}*\n\n{body}"}
        # }
        # async with httpx.AsyncClient() as client:
        #     resp = await client.post(url, json=payload, headers=headers)
        #     if resp.status_code == 200:
        #         return MessengerResult(success=True, channel="whatsapp", metadata=resp.json())
        #     return MessengerResult(success=False, channel="whatsapp", error=resp.text)

        raise NotImplementedError(
            "WhatsApp Cloud API is not configured. "
            "Set WHATSAPP_BUSINESS_PHONE_ID and WHATSAPP_ACCESS_TOKEN in .env, "
            "then implement this method."
        )


def get_whatsapp_messenger() -> BaseMessenger:
    """Factory — returns the active WhatsApp messenger implementation."""
    # When Meta API is configured, swap to:
    #   return WhatsAppAPIMessenger(settings.whatsapp_phone_id, settings.whatsapp_access_token)
    return WhatsAppLinkMessenger()
