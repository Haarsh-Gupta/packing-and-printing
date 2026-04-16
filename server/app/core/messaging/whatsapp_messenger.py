import urllib.parse
import logging
import httpx

from app.core.messaging.base import BaseMessenger, MessengerResult
from app.core.config import settings

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
    Meta Cloud API implementation.
    """

    def __init__(self, phone_number_id: str, access_token: str):
        self._phone_number_id = phone_number_id
        self._access_token = access_token
        self._base_url = f"https://graph.facebook.com/v21.0/{self._phone_number_id}/messages"

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
        Send a WhatsApp message via Meta Cloud API.
        Supports standard text messages or templates.
        """
        # Clean phone number (Meta expects digits only, usually with country code)
        phone_clean = "".join(c for c in to if c.isdigit())
        
        headers = {
            "Authorization": f"Bearer {self._access_token}",
            "Content-Type": "application/json"
        }

        template_name = kwargs.get("template_name")
        template_params = kwargs.get("template_params", [])

        if template_name:
            # Template message
            payload = {
                "messaging_product": "whatsapp",
                "to": phone_clean,
                "type": "template",
                "template": {
                    "name": template_name,
                    "language": {"code": kwargs.get("language_code", settings.whatsapp_template_language)},
                    "components": []
                }
            }
            
            # Only add components if we have parameters and it's not the default hello_world template
            if template_params and template_name != "hello_world":
                payload["template"]["components"] = [
                    {
                        "type": "body",
                        "parameters": [{"type": "text", "text": p} for p in template_params]
                    },
                    {
                        "type": "button",
                        "sub_type": "url",
                        "index": "0",
                        "parameters": [{"type": "text", "text": p} for p in template_params]
                    }
                ]
        else:
            # Standard text message
            payload = {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": phone_clean,
                "type": "text",
                "text": {"body": f"*{subject}*\n\n{body}" if subject else body}
            }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(self._base_url, json=payload, headers=headers)
                
                if response.status_code == 200:
                    logger.info(f"WhatsApp message sent successfully to {phone_clean}")
                    return MessengerResult(
                        success=True,
                        channel="whatsapp",
                        metadata=response.json()
                    )
                else:
                    logger.error(f"WhatsApp API error: {response.status_code} - {response.text}")
                    return MessengerResult(
                        success=False,
                        channel="whatsapp",
                        error=response.text
                    )
        except Exception as e:
            logger.exception("Failed to send WhatsApp message")
            return MessengerResult(
                success=False,
                channel="whatsapp",
                error=str(e)
            )


def get_whatsapp_messenger() -> BaseMessenger:
    """Factory — returns the active WhatsApp messenger implementation."""
    if settings.whatsapp_phone_number_id and settings.meta_access_token:
        return WhatsAppAPIMessenger(
            settings.whatsapp_phone_number_id,
            settings.meta_access_token
        )
    return WhatsAppLinkMessenger()
