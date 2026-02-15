"""
Admin-to-user notification email template.
"""
from .base import wrap_in_base


def render_admin_notice_email(
    subject: str,
    message: str,
    action_url: str | None = None,
    action_label: str = "View Details",
    user_name: str | None = None,
) -> str:
    """
    Renders a general admin notification email.

    Args:
        subject: Brief subject/title displayed in the email body.
        message: The main message content (plain text or simple HTML).
        action_url: Optional CTA button URL.
        action_label: Label for the CTA button.
        user_name: Optional greeting name.
    """
    greeting = f"Hi {user_name}," if user_name else "Hi,"

    cta_button = ""
    if action_url:
        cta_button = f"""\
<div style="text-align: center; margin: 28px 0;">
  <a href="{action_url}" style="
    display: inline-block;
    padding: 12px 32px;
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
    color: #ffffff;
    text-decoration: none;
    border-radius: 6px;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.3px;
  ">{action_label}</a>
</div>"""

    content = f"""\
<p style="font-size: 16px; margin-bottom: 8px;">{greeting}</p>

<h2 style="font-size: 18px; color: #2c3e50; margin: 20px 0 12px;">{subject}</h2>

<div style="font-size: 15px; color: #555; line-height: 1.6;">
  {message}
</div>

{cta_button}

<p style="font-size: 13px; color: #888; margin-top: 24px;">
  This is an automated notification from the admin team.
</p>"""

    return wrap_in_base(content)
