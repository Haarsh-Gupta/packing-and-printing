"""
Payment / order reminder email template.
"""
from .base import wrap_in_base


def render_reminder_email(
    order_id: int,
    due_amount: float,
    due_date: str | None = None,
    message: str | None = None,
    user_name: str | None = None,
    currency: str = "₹",
) -> str:
    """
    Renders a payment or order reminder email.

    Args:
        order_id: The order ID.
        due_amount: Outstanding amount.
        due_date: Optional human-readable due date string.
        message: Optional custom message from admin.
        user_name: Optional greeting name.
        currency: Currency symbol.
    """
    greeting = f"Hi {user_name}," if user_name else "Hi,"

    due_date_row = ""
    if due_date:
        due_date_row = f"""\
    <tr>
      <td style="padding: 6px 0; color: #555;">Due Date:</td>
      <td style="padding: 6px 0; text-align: right; font-weight: 600;">{due_date}</td>
    </tr>"""

    custom_message = ""
    if message:
        custom_message = f"""\
<div style="margin: 20px 0; padding: 14px 16px; background-color: #fff8e1; border-left: 4px solid #f39c12; border-radius: 4px;">
  <p style="margin: 0; font-size: 14px; color: #555;">{message}</p>
</div>"""

    content = f"""\
<p style="font-size: 16px; margin-bottom: 8px;">{greeting}</p>
<p style="font-size: 15px; color: #555;">
  This is a friendly reminder about your pending payment for <strong>Order #{order_id}</strong>.
</p>

<div style="
  text-align: center;
  margin: 24px 0;
  padding: 20px;
  background-color: #fff3e0;
  border-radius: 8px;
  border: 1px solid #ffcc80;
">
  <p style="margin: 0 0 4px; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Amount Due</p>
  <span style="font-size: 32px; font-weight: 700; color: #e65100;">{currency}{due_amount:,.2f}</span>
</div>

<table style="width: 100%; font-size: 14px; margin: 16px 0;">
  <tr>
    <td style="padding: 6px 0; color: #555;">Order ID:</td>
    <td style="padding: 6px 0; text-align: right; font-weight: 600;">#{order_id}</td>
  </tr>
  {due_date_row}
</table>

{custom_message}

<p style="font-size: 13px; color: #888;">
  Please complete your payment at your earliest convenience.
  If you've already made this payment, please disregard this email.
</p>"""

    return wrap_in_base(content)
