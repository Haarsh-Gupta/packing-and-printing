"""
Quote / Quotation email template.
"""
from typing import List, Dict, Any
from .base import wrap_in_base


def render_quote_email(
    inquiry_id: str,
    total_price: float,
    valid_until: str,
    items: List[Dict[str, Any]],
    admin_notes: str | None = None,
    user_name: str | None = None,
    currency: str = "₹",
) -> str:
    """
    Renders the quotation email.
    """
    greeting = f"Hi {user_name}," if user_name else "Hi,"
    
    # Build item rows
    rows = ""
    for item in items:
        # InquiryItem objects or dicts? Use .get() for safety
        desc = item.get("product_name") or item.get("service_name") or "Custom Item"
        qty = item.get("quantity", 1)
        price = item.get("line_item_price") or 0.0
        total = qty * price
        
        rows += f"""\
<tr>
  <td style="padding: 10px 12px; border-bottom: 1px solid #eee;">{desc}</td>
  <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: center;">{qty}</td>
  <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: right;">{currency}{price:,.2f}</td>
  <td style="padding: 10px 12px; border-bottom: 1px solid #eee; text-align: right;">{currency}{total:,.2f}</td>
</tr>"""

    notes_section = ""
    if admin_notes:
        notes_section = f"""\
<div style="margin: 20px 0; padding: 16px; border-left: 4px solid #3498db; background-color: #f8f9fa;">
  <p style="margin: 0; font-size: 14px; color: #2c3e50;"><strong>Admin Notes:</strong></p>
  <p style="margin: 8px 0 0; font-size: 14px; color: #555;">{admin_notes}</p>
</div>"""

    content = f"""\
<p style="font-size: 16px; margin-bottom: 8px;">{greeting}</p>
<p style="font-size: 15px; color: #555;">
  We are pleased to share the quotation for your inquiry <strong>#{inquiry_id[:8].upper()}</strong>.
</p>

{notes_section}

<table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
  <thead>
    <tr style="background-color: #f8f9fa;">
      <th style="padding: 10px 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Description</th>
      <th style="padding: 10px 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
      <th style="padding: 10px 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Unit Price</th>
      <th style="padding: 10px 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Total</th>
    </tr>
  </thead>
  <tbody>
    {rows}
  </tbody>
</table>

<div style="margin: 20px 0; padding: 16px; background-color: #2c3e50; color: #ffffff; border-radius: 6px; text-align: right;">
  <span style="font-size: 14px; opacity: 0.9;">Total Quotation Value:</span>
  <div style="font-size: 24px; font-weight: 700; margin-top: 4px;">{currency}{total_price:,.2f}</div>
  <div style="font-size: 12px; margin-top: 8px; opacity: 0.8;">Valid until: {valid_until}</div>
</div>

<p style="font-size: 14px; color: #555; text-align: center; margin-top: 32px;">
  Please log in to your dashboard to accept this quote and proceed with the order.
</p>
"""

    return wrap_in_base(content)
