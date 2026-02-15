"""
Invoice / receipt email template.
"""
from typing import List, Dict, Any
from .base import wrap_in_base


def render_invoice_email(
    order_id: int,
    items: List[Dict[str, Any]],
    total_amount: float,
    amount_paid: float,
    payment_status: str = "PAID",
    user_name: str | None = None,
    currency: str = "₹",
) -> str:
    """
    Renders the invoice/receipt email.

    Args:
        order_id: The order ID.
        items: List of dicts with keys: description, quantity, unit_price, total.
        total_amount: Total order amount.
        amount_paid: Amount paid so far.
        payment_status: e.g. PAID, PARTIALLY_PAID.
        user_name: Optional greeting name.
        currency: Currency symbol.
    """
    greeting = f"Hi {user_name}," if user_name else "Hi,"

    # Build item rows
    rows = ""
    for item in items:
        rows += f"""\
<tr>
  <td style="padding: 10px 12px; border-bottom: 1px solid #eee;">{item.get('description', '')}</td>
  <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: center;">{item.get('quantity', 1)}</td>
  <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: right;">{currency}{item.get('unit_price', 0):,.2f}</td>
  <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: right;">{currency}{item.get('total', 0):,.2f}</td>
</tr>"""

    balance = total_amount - amount_paid
    status_color = "#27ae60" if payment_status == "PAID" else "#e67e22"

    content = f"""\
<p style="font-size: 16px; margin-bottom: 8px;">{greeting}</p>
<p style="font-size: 15px; color: #555;">
  Here's your invoice for <strong>Order #{order_id}</strong>:
</p>

<table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
  <thead>
    <tr style="background-color: #f8f9fa;">
      <th style="padding: 10px 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
      <th style="padding: 10px 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
      <th style="padding: 10px 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Unit Price</th>
      <th style="padding: 10px 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Total</th>
    </tr>
  </thead>
  <tbody>
    {rows}
  </tbody>
</table>

<div style="margin: 20px 0; padding: 16px; background-color: #f8f9fa; border-radius: 6px;">
  <table style="width: 100%; font-size: 14px;">
    <tr>
      <td style="padding: 4px 0;"><strong>Total Amount:</strong></td>
      <td style="text-align: right;">{currency}{total_amount:,.2f}</td>
    </tr>
    <tr>
      <td style="padding: 4px 0;"><strong>Amount Paid:</strong></td>
      <td style="text-align: right;">{currency}{amount_paid:,.2f}</td>
    </tr>
    <tr>
      <td style="padding: 4px 0;"><strong>Balance Due:</strong></td>
      <td style="text-align: right; font-weight: 700;">{currency}{balance:,.2f}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0 0;"><strong>Status:</strong></td>
      <td style="text-align: right; padding-top: 8px;">
        <span style="
          background-color: {status_color};
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        ">{payment_status}</span>
      </td>
    </tr>
  </table>
</div>

<p style="font-size: 13px; color: #888;">
  If you have any questions about this invoice, please contact our support team.
</p>"""

    return wrap_in_base(content)
