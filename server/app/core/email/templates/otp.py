"""
OTP verification email template.
"""
from .base import wrap_in_base


def render_otp_email(
    otp_code: str,
    expire_minutes: int = 5,
    user_name: str | None = None,
) -> str:
    """
    Renders the OTP verification email.

    Args:
        otp_code: The 6-digit OTP code.
        expire_minutes: How many minutes until the OTP expires.
        user_name: Optional greeting name.
    """
    greeting = f"Hi {user_name}," if user_name else "Hi,"

    content = f"""\
<p style="font-size: 16px; margin-bottom: 8px;">{greeting}</p>
<p style="font-size: 15px; color: #555;">
  Use the following verification code to complete your action:
</p>
<div style="
  text-align: center;
  margin: 28px 0;
  padding: 20px;
  background-color: #f0f4ff;
  border-radius: 8px;
  border: 1px dashed #3498db;
">
  <span style="
    font-size: 36px;
    font-weight: 700;
    letter-spacing: 8px;
    color: #2c3e50;
    font-family: 'Courier New', monospace;
  ">{otp_code}</span>
</div>
<p style="font-size: 14px; color: #888;">
  This code will expire in <strong>{expire_minutes} minutes</strong>.
  If you didn't request this, you can safely ignore this email.
</p>"""

    return wrap_in_base(content)
