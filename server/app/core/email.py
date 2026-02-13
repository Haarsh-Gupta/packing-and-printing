import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings


BREVO_SMTP_HOST = "smtp-relay.brevo.com"
BREVO_SMTP_PORT = 587


async def send_otp_email(to_email: str, otp_code: str) -> bool:
    """
    Send an OTP verification email using Brevo SMTP.
    
    Args:
        to_email: Recipient email address
        otp_code: 6-digit OTP code
    
    Returns:
        True if email was sent successfully
    """
    message = MIMEMultipart("alternative")
    message["From"] = settings.brevo_sender_email
    message["To"] = to_email
    message["Subject"] = "Verify Your Email - OTP Code"

    # Plain text fallback
    text_content = f"""
    Your OTP verification code is: {otp_code}
    
    This code will expire in 10 minutes.
    You have a maximum of 3 attempts to verify.
    
    If you did not request this, please ignore this email.
    """

    # HTML email
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }}
            .container {{ max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); overflow: hidden; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 24px; text-align: center; }}
            .header h1 {{ color: #fff; margin: 0; font-size: 22px; font-weight: 600; }}
            .body {{ padding: 32px 24px; text-align: center; }}
            .otp-box {{ background: #f0f0f5; border-radius: 10px; padding: 20px; margin: 24px 0; }}
            .otp-code {{ font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #333; font-family: 'Courier New', monospace; }}
            .info {{ color: #666; font-size: 14px; line-height: 1.6; margin-top: 16px; }}
            .footer {{ border-top: 1px solid #eee; padding: 16px 24px; text-align: center; color: #999; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Email Verification</h1>
            </div>
            <div class="body">
                <p style="color: #555; font-size: 15px;">Use the code below to verify your email address</p>
                <div class="otp-box">
                    <div class="otp-code">{otp_code}</div>
                </div>
                <div class="info">
                    <p>This code expires in <strong>10 minutes</strong>.</p>
                    <p>You have a maximum of <strong>3 attempts</strong> to verify.</p>
                </div>
            </div>
            <div class="footer">
                <p>If you didn't request this code, you can safely ignore this email.</p>
            </div>
        </div>
    </body>
    </html>
    """

    message.attach(MIMEText(text_content, "plain"))
    message.attach(MIMEText(html_content, "html"))

    try:
        await aiosmtplib.send(
            message,
            hostname=BREVO_SMTP_HOST,
            port=BREVO_SMTP_PORT,
            username=settings.brevo_login_email,
            password=settings.brevo_smtp_api_key,
            start_tls=True,
        )
        print(f"OTP email sent to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send OTP email to {to_email}: {e}")
        raise
