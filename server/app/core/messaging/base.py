# ===========================================================================
# Abstract Messenger Interface
# ===========================================================================
# Every notification channel (Email, WhatsApp, SMS, Push, etc.) must
# implement this interface.  Business logic depends ONLY on this
# abstraction — swapping or adding channels requires zero changes
# outside this package.
# ===========================================================================

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class MessengerResult:
    """Outcome of a single send attempt."""
    success: bool
    channel: str                        # "email", "whatsapp", etc.
    error: Optional[str] = None
    metadata: dict = field(default_factory=dict)   # channel-specific extras


class BaseMessenger(ABC):
    """Contract that every messaging channel adapter must fulfil."""

    @abstractmethod
    async def send(
        self,
        to: str,
        subject: str,
        body: str,
        **kwargs,
    ) -> MessengerResult:
        """
        Send a notification.

        Args:
            to:      Recipient identifier (email address, phone number, etc.)
            subject: Short subject / title of the notification
            body:    Full message body (HTML for email, plain text for WhatsApp)
            kwargs:  Channel-specific extras (attachments, template_id, etc.)

        Returns:
            MessengerResult with success flag and optional metadata.
        """
        ...

    @abstractmethod
    def channel_name(self) -> str:
        """Return a human-readable channel identifier, e.g. 'email'."""
        ...
