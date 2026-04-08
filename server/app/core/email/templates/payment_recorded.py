from app.core.email.templates.base import wrap_in_base

def render_payment_recorded_email(
    order_number: str,
    amount: float,
    balance: float,
    user_name: str | None = None,
    currency: str = "₹",
) -> str:
    """
    Renders an email notifying the user of a manually recorded payment.
    """
    greeting = f"Hi {user_name}," if user_name else "Hi,"
    content = f"""\
<p style="font-size: 16px; margin-bottom: 8px;">{greeting}</p>
<p style="font-size: 15px; color: #555;">
  A payment of <strong>{currency}{amount:,.2f}</strong> has been successfully recorded for your Order <strong>{order_number}</strong>.
</p>
<div style="margin: 20px 0; padding: 16px; background-color: #2c3e50; color: #ffffff; border-radius: 6px; text-align: center;">
  <span style="font-size: 14px; opacity: 0.9;">Balance remaining:</span>
  <div style="font-size: 24px; font-weight: 700; margin-top: 4px;">{currency}{balance:,.2f}</div>
</div>
<p style="font-size: 14px; color: #555; text-align: center; margin-top: 32px;">
  You can review your complete transaction history on your dashboard.
</p>
"""
    return wrap_in_base(content)
