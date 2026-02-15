"""
Password reset OTP email template.
"""
from .base import wrap_in_base


def render_password_reset_email(
    otp_code: str,
    expire_minutes: int = 5,
    user_name: str | None = None,
) -> str:
    """
    Renders the forgot-password OTP email.

    Args:
        otp_code: The 6-digit OTP code.
        expire_minutes: Minutes until the OTP expires.
        user_name: Optional greeting name.
    """
    greeting = f"Hi {user_name}," if user_name else "Hi,"

    content = f"""\
<p style="font-size: 16px; margin-bottom: 8px;">{greeting}</p>
<p style="font-size: 15px; color: #555;">
  We received a request to reset your password. Use the code below to proceed:
</p>
<div style="
  text-align: center;
  margin: 28px 0;
  padding: 20px;
  background-color: #fef3f2;
  border-radius: 8px;
  border: 1px dashed #e74c3c;
">
  <span style="
    font-size: 36px;
    font-weight: 700;
    letter-spacing: 8px;
    color: #c0392b;
    font-family: 'Courier New', monospace;
  ">{otp_code}</span>
</div>
<p style="font-size: 14px; color: #888;">
  This code will expire in <strong>{expire_minutes} minutes</strong>.
</p>
<p style="font-size: 14px; color: #e74c3c; font-weight: 600;">
  ⚠️ If you did not request a password reset, please secure your account immediately.
</p>"""

    return wrap_in_base(content)
