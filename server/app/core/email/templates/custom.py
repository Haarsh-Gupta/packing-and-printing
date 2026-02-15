"""
Custom promotional / greeting email template.

Use this for festival wishes, announcements, marketing campaigns,
or any custom message with an optional banner image.
"""
from .base import wrap_in_base


def render_custom_email(
    heading: str,
    message: str,
    image_url: str | None = None,
    action_url: str | None = None,
    action_label: str = "Learn More",
    user_name: str | None = None,
) -> str:
    """
    Renders a custom promotional or greeting email.

    Args:
        heading: Main heading / title (e.g. "Happy Diwali! 🪔")
        message: Custom HTML or plain text message body.
        image_url: Optional banner/greeting image URL.
        action_url: Optional CTA button URL.
        action_label: Label for the CTA button.
        user_name: Optional greeting name.
    """
    greeting = f"Hi {user_name}," if user_name else "Hi,"

    banner = ""
    if image_url:
        banner = f"""\
<div style="text-align: center; margin: 0 -32px 24px -32px;">
  <img src="{image_url}" alt="{heading}"
    style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 0;" />
</div>"""

    cta_button = ""
    if action_url:
        cta_button = f"""\
<div style="text-align: center; margin: 28px 0;">
  <a href="{action_url}" style="
    display: inline-block;
    padding: 12px 32px;
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    color: #ffffff;
    text-decoration: none;
    border-radius: 6px;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.3px;
  ">{action_label}</a>
</div>"""

    content = f"""\
{banner}

<p style="font-size: 16px; margin-bottom: 8px;">{greeting}</p>

<h2 style="
  font-size: 22px;
  color: #2c3e50;
  margin: 20px 0 16px;
  text-align: center;
  line-height: 1.4;
">{heading}</h2>

<div style="font-size: 15px; color: #555; line-height: 1.7; text-align: center;">
  {message}
</div>

{cta_button}"""

    return wrap_in_base(content)
