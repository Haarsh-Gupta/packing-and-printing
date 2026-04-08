from app.core.email.templates.base import wrap_in_base

def render_order_status_email(
    order_number: str,
    new_status: str,
    user_name: str | None = None,
    admin_notes: str | None = None,
) -> str:
    """
    Renders an email notifying the user of an order status change.
    """
    greeting = f"Hi {user_name}," if user_name else "Hi,"
    
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
  Your Order <strong>{order_number}</strong> status has been updated to <strong>{new_status}</strong>.
</p>

{notes_section}

<p style="font-size: 14px; color: #555; text-align: center; margin-top: 32px;">
  Thank you for shopping with us! You can view detailed tracking information on your dashboard.
</p>
"""
    return wrap_in_base(content)
