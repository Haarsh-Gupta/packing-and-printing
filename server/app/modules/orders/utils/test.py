# -*- coding: utf-8 -*-

import urllib.parse
import textwrap
import unicodedata
from typing import Optional, Dict, Any

# Optional: only required if you want direct sending
try:
    from twilio.rest import Client
except ImportError:
    Client = None


class WhatsAppMessenger:
    """
    WhatsApp messaging utility
    - Supports wa.me links (manual send)
    - Supports Twilio WhatsApp API (direct send)
    """

    # -------------------------------
    # INTERNAL HELPERS
    # -------------------------------
    @staticmethod
    def _clean_message(message: str) -> str:
        """
        Fix indentation, unicode issues, and emoji rendering
        """
        message = textwrap.dedent(message)
        message = message.strip()
        message = unicodedata.normalize("NFKC", message)
        return message

    @staticmethod
    def _clean_phone(phone_number: str) -> str:
        """
        Convert +91XXXXXXXXXX → 91XXXXXXXXXX
        """
        phone = ''.join(ch for ch in phone_number if ch.isdigit())
        return phone

    # -------------------------------
    # MESSAGE BUILDERS
    # -------------------------------
    @staticmethod
    def create_estimation_message(
        customer_name: str,
        inquiry_id: int,
        product_name: str,
        quantity: int,
        quoted_price: float,
        selected_options: Dict[str, Any],
        admin_notes: Optional[str] = None,
        company_name: str = "Your Company"
    ) -> str:

        options_text = "\n".join(
            f"- {key}: {value}" for key, value in selected_options.items()
        )

        message = f"""
        {company_name} – Price Estimation

        Hello {customer_name},

        Thank you for your inquiry. Please find your estimate below.

        Inquiry ID: {inquiry_id}
        Product: {product_name}
        Quantity: {quantity}

        Selected Options:
        {options_text}

        Quoted Price: ₹{quoted_price:,.2f}
        """

        if admin_notes:
            message += f"""

            Notes:
            {admin_notes}
            """

        message += f"""

        Reply YES to confirm the order.
        Reply NO if you want changes.

        Regards,
        {company_name} Team
        """

        return WhatsAppMessenger._clean_message(message)

    # -------------------------------
    # WHATSAPP LINK (wa.me)
    # -------------------------------
    @staticmethod
    def create_whatsapp_link(phone_number: str, message: str) -> str:
        phone = WhatsAppMessenger._clean_phone(phone_number)
        encoded_message = urllib.parse.quote(message)
        return f"https://wa.me/{phone}?text={encoded_message}"

    # -------------------------------
    # DIRECT SEND (TWILIO)
    # -------------------------------
    @staticmethod
    def send_direct_whatsapp(
        account_sid: str,
        auth_token: str,
        from_number: str,
        to_number: str,
        message: str
    ) -> str:
        """
        Sends WhatsApp message directly using Twilio
        """

        if Client is None:
            raise ImportError("twilio package not installed")

        client = Client(account_sid, auth_token)

        msg = client.messages.create(
            from_=f"whatsapp:{from_number}",
            to=f"whatsapp:{to_number}",
            body=message
        )

        return msg.sid


inquiry_data = {
    "inquiry_id": 1024,
    "product_name": "Engineering Mathematics – Vol 1",
    "quantity": 2,
    "quoted_price": 850.00,
    "selected_options": {
        "Edition": "2023",
        "Author": "B.S. Grewal",
        "Condition": "New"
    },
    "admin_notes": "Price valid for 48 hours."
}

message = WhatsAppMessenger.create_estimation_message(
    customer_name="Harsh",
    inquiry_id=inquiry_data["inquiry_id"],
    product_name=inquiry_data["product_name"],
    quantity=inquiry_data["quantity"],
    quoted_price=inquiry_data["quoted_price"],
    selected_options=inquiry_data["selected_options"],
    admin_notes=inquiry_data["admin_notes"],
    company_name="Navart"
)

link = WhatsAppMessenger.create_whatsapp_link(
    phone_number="+919310219172",
    message=message
)

