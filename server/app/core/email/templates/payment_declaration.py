from app.core.email.templates.base import wrap_in_base

def render_declaration_review_email(
    order_number: str,
    is_approved: bool,
    reason: str | None = None,
    order_status: str | None = None,
    user_name: str | None = None,
) -> str:
    """
    Renders an email notifying the user of an accepted or rejected payment declaration.
    """
    greeting = f"Hi {user_name}," if user_name else "Hi,"
    
    if is_approved:
        status_html = f"<p>Order status: <strong>{order_status}</strong></p>" if order_status else ""
        content = f"""\
<p style="font-size: 16px; margin-bottom: 8px;">{greeting}</p>
<p style="font-size: 15px; color: #555;">
  Your payment declaration for Order <strong>{order_number}</strong> has been successfully verified and recorded.
</p>
{status_html}
<p style="font-size: 14px; color: #555; text-align: center; margin-top: 32px;">
  Thank you for your prompt payment!
</p>
"""
    else:
        reason_html = f"""\
<div style="margin: 20px 0; padding: 16px; border-left: 4px solid #e74c3c; background-color: #fdf5f4;">
  <p style="margin: 0; font-size: 14px; color: #c0392b;"><strong>Rejection Reason:</strong></p>
  <p style="margin: 8px 0 0; font-size: 14px; color: #555;">{reason}</p>
</div>""" if reason else ""

        content = f"""\
<p style="font-size: 16px; margin-bottom: 8px;">{greeting}</p>
<p style="font-size: 15px; color: #555;">
  We were unable to verify your payment declaration for Order <strong>{order_number}</strong>.
</p>
{reason_html}
<p style="font-size: 14px; color: #555; text-align: center; margin-top: 32px;">
  Please review the details and submit a new declaration on your dashboard or contact support if you believe this is an error.
</p>
"""

    return wrap_in_base(content)
