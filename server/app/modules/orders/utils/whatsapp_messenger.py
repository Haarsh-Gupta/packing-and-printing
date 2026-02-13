import urllib.parse
from typing import Optional, Dict, Any
from datetime import datetime


class WhatsAppMessenger:
    """Utility class for generating WhatsApp message links"""
    
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
        """
        Create a formatted estimation message for WhatsApp
        
        Args:
            customer_name: Customer's name
            inquiry_id: Inquiry ID
            product_name: Product name
            quantity: Quantity ordered
            quoted_price: Quoted price
            selected_options: Selected product options
            admin_notes: Optional admin notes
            company_name: Company name
        
        Returns:
            Formatted message text
        """
        # Format options
        options_text = "\n".join([f"  • {key}: {value}" for key, value in selected_options.items()])
        
        message = f"""
🎨 *{company_name}* - Price Estimation

Hello {customer_name}!

Thank you for your inquiry. Here's your price estimate:

📋 *Inquiry Details:*
  • Inquiry ID: #{inquiry_id}
  • Product: {product_name}
  • Quantity: {quantity}

⚙️ *Selected Options:*
{options_text}

💰 *Quoted Price:* ₹{quoted_price:,.2f}

"""
        
        if admin_notes:
            message += f"""
📝 *Additional Notes:*
{admin_notes}

"""
        
        message += f"""
✅ To proceed with this order, please:
1. Review the details above
2. Reply to confirm your order
3. We'll send you payment instructions

If you have any questions, feel free to ask!

Best regards,
{company_name} Team
        """.strip()
        
        return message
    
    @staticmethod
    def create_payment_reminder_message(
        customer_name: str,
        order_id: int,
        total_amount: float,
        amount_paid: float,
        payment_link: Optional[str] = None,
        company_name: str = "Your Company"
    ) -> str:
        """
        Create a payment reminder message
        
        Args:
            customer_name: Customer's name
            order_id: Order ID
            total_amount: Total order amount
            amount_paid: Amount already paid
            payment_link: Optional payment link
            company_name: Company name
        
        Returns:
            Formatted message text
        """
        due_amount = total_amount - amount_paid
        
        message = f"""
💳 *{company_name}* - Payment Reminder

Hello {customer_name}!

This is a friendly reminder about your pending payment:

📋 *Order Details:*
  • Order ID: #{order_id}
  • Total Amount: ₹{total_amount:,.2f}
  • Amount Paid: ₹{amount_paid:,.2f}
  • *Amount Due: ₹{due_amount:,.2f}*

"""
        
        if payment_link:
            message += f"""
💰 *Quick Payment:*
{payment_link}

"""
        
        message += f"""
Please complete the payment at your earliest convenience.

For any queries, feel free to reach out!

Thank you,
{company_name} Team
        """.strip()
        
        return message
    
    @staticmethod
    def create_order_confirmation_message(
        customer_name: str,
        order_id: int,
        product_name: str,
        quantity: int,
        total_amount: float,
        estimated_delivery: Optional[str] = None,
        company_name: str = "Your Company"
    ) -> str:
        """
        Create an order confirmation message
        
        Args:
            customer_name: Customer's name
            order_id: Order ID
            product_name: Product name
            quantity: Quantity ordered
            total_amount: Total amount
            estimated_delivery: Estimated delivery date/time
            company_name: Company name
        
        Returns:
            Formatted message text
        """
        message = f"""
✅ *{company_name}* - Order Confirmed!

Hello {customer_name}!

Great news! Your order has been confirmed.

📦 *Order Summary:*
  • Order ID: #{order_id}
  • Product: {product_name}
  • Quantity: {quantity}
  • Total Amount: ₹{total_amount:,.2f}

"""
        
        if estimated_delivery:
            message += f"""
🚚 *Estimated Delivery:* {estimated_delivery}

"""
        
        message += f"""
We'll keep you updated on the progress of your order.

Thank you for choosing {company_name}!

Best regards,
{company_name} Team
        """.strip()
        
        return message
    
    @staticmethod
    def create_whatsapp_link(phone_number: str, message: str) -> str:
        """
        Create a WhatsApp web link with pre-filled message
        
        Args:
            phone_number: Phone number with country code (e.g., +919876543210)
            message: Message text
        
        Returns:
            WhatsApp web URL
        """
        # Remove any non-numeric characters except +
        phone_clean = ''.join(filter(lambda x: x.isdigit() or x == '+', phone_number))
        
        # Remove + if present (WhatsApp API doesn't need it in URL)
        phone_clean = phone_clean.replace('+', '')
        
        # URL encode the message
        encoded_message = urllib.parse.quote(message)
        
        # Create WhatsApp link
        whatsapp_url = f"https://wa.me/{phone_clean}?text={encoded_message}"
        
        return whatsapp_url
    
    @staticmethod
    def send_estimation_whatsapp(
        phone_number: str,
        customer_name: str,
        inquiry_data: Dict[str, Any],
        company_name: str = "Your Company"
    ) -> str:
        """
        Generate WhatsApp link for sending estimation
        
        Args:
            phone_number: Customer's phone number
            customer_name: Customer's name
            inquiry_data: Dictionary containing inquiry details
            company_name: Company name
        
        Returns:
            WhatsApp web URL
        """
        message = WhatsAppMessenger.create_estimation_message(
            customer_name=customer_name,
            inquiry_id=inquiry_data['inquiry_id'],
            product_name=inquiry_data['product_name'],
            quantity=inquiry_data['quantity'],
            quoted_price=inquiry_data['quoted_price'],
            selected_options=inquiry_data['selected_options'],
            admin_notes=inquiry_data.get('admin_notes'),
            company_name=company_name
        )
        
        return WhatsAppMessenger.create_whatsapp_link(phone_number, message)


# Twilio Integration (Optional - requires Twilio account)
class TwilioWhatsAppSender:
    """
    Send WhatsApp messages via Twilio API
    Requires: pip install twilio
    """
    
    def __init__(self, account_sid: str, auth_token: str, from_number: str):
        """
        Initialize Twilio client
        
        Args:
            account_sid: Twilio Account SID
            auth_token: Twilio Auth Token
            from_number: Twilio WhatsApp number (e.g., whatsapp:+14155238886)
        """
        try:
            from twilio.rest import Client
            self.client = Client(account_sid, auth_token)
            self.from_number = from_number
        except ImportError:
            raise ImportError("Twilio package not installed. Install with: pip install twilio")
    
    def send_message(self, to_number: str, message: str) -> Dict[str, Any]:
        """
        Send WhatsApp message via Twilio
        
        Args:
            to_number: Recipient's WhatsApp number (e.g., whatsapp:+919876543210)
            message: Message text
        
        Returns:
            Message response dict
        """
        # Ensure number has whatsapp: prefix
        if not to_number.startswith('whatsapp:'):
            to_number = f'whatsapp:{to_number}'
        
        message_response = self.client.messages.create(
            body=message,
            from_=self.from_number,
            to=to_number
        )
        
        return {
            'sid': message_response.sid,
            'status': message_response.status,
            'date_sent': message_response.date_sent
        }

# ==============================================================

inquiry_data = {
    "inquiry_id": 1024,
    "product_name": "Engineering Mathematics – Volume 1",
    "quantity": 2,
    "quoted_price": 850.00,
    "selected_options": {
        "Edition": "2023",
        "Author": "B.S. Grewal",
        "Condition": "New",
        "Delivery": "Home Delivery"
    },
    "admin_notes": "Price valid for 48 hours. Delivery within 3–4 working days."
}

phone_number = "+919315865758"
customer_name = "Harsh"
company_name = "Navart"


link = WhatsAppMessenger.send_estimation_whatsapp(
    phone_number=phone_number,
    customer_name=customer_name,
    inquiry_data=inquiry_data,
    company_name=company_name
)
