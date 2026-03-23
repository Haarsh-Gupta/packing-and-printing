"""
Admin email routes.

Lets admins send custom emails (with optional file attachments)
to individual users or all users.
"""

import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, Form, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.modules.auth import get_current_admin_user
from app.modules.users.models import User
from app.core.email.service import get_email_service
from app.core.email.templates.custom import render_custom_email
from app.core.email.templates.reminder import render_reminder_email
from app.core.email.templates.invoice import render_invoice_email
from app.core.email.templates.admin_notice import render_admin_notice_email
from app.modules.notifications.models import EmailLog

logger = logging.getLogger("app.modules.admin_email")

router = APIRouter()
email_service = get_email_service()

# Max file size: 10 MB
MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_MIME_PREFIXES = ("image/", "application/pdf")


async def _validate_files(files: List[UploadFile]) -> list:
    """Read, validate, and return attachments as (name, bytes, mime) tuples."""
    attachments = []
    for f in files:
        if f.content_type and not any(f.content_type.startswith(p) for p in ALLOWED_MIME_PREFIXES):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type '{f.content_type}' not allowed. Only images and PDFs are accepted.",
            )
        content = await f.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{f.filename}' exceeds 10 MB limit.",
            )
        attachments.append((f.filename or "attachment", content, f.content_type or "application/octet-stream"))
    return attachments


@router.post("/send-custom-email", status_code=status.HTTP_200_OK)
async def send_custom_email(
    request: Request,
    to_email: str = Form(..., description="Recipient email address"),
    subject: str = Form(..., description="Email subject line"),
    heading: str = Form(..., description="Main heading inside email body"),
    message: str = Form(..., description="Custom message (supports basic HTML)"),
    image_url: Optional[str] = Form(None, description="Optional banner image URL"),
    action_url: Optional[str] = Form(None, description="Optional CTA button URL"),
    action_label: Optional[str] = Form("Learn More", description="CTA button label"),
    template_id: str = Form("custom", description="Template to use: custom, reminder, invoice"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    """
    Send a custom email to a specific user.
    """
    # 1. Identity recipient
    stmt = select(User).where(User.email == to_email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    # Swagger coersion
    image_url = image_url.strip() if image_url else None
    action_url = action_url.strip() if action_url else None
    action_label = action_label.strip() if action_label else "Learn More"

    # 2. Render Template
    if template_id == "reminder":
        html = render_reminder_email(
            order_id=1234, # Mock for general center
            due_amount=0.0,
            message=message,
            user_name=user.name if user else "Customer",
        )
    elif template_id == "invoice":
        html = render_invoice_email(
            order_id=1234,
            items=[],
            total_amount=0.0,
            amount_paid=0.0,
            user_name=user.name if user else "Customer",
        )
    else:
        html = render_custom_email(
            heading=heading,
            message=message,
            image_url=image_url,
            action_url=action_url,
            action_label=action_label,
            user_name=user.name if user else "Customer",
        )

    # 3. File Attachments logic (existing)
    form = await request.form()
    raw_files = form.getlist("files")
    files = [v for v in raw_files if isinstance(v, UploadFile) and v.filename]
    logger.info("Files received: %d valid out of %d raw entries", len(files), len(raw_files))
    for f in files:
        logger.debug("  → %s (%s, size=%s)", f.filename, f.content_type, f.size)

    attachments = await _validate_files(files) if files else []
    logger.info("Validated attachments: %d", len(attachments))

    if attachments:
        message_id = await email_service.send_email_with_attachments(
            to=to_email, subject=subject, body_html=html, attachments=attachments,
        )
    else:
        message_id = await email_service.send_email(to=to_email, subject=subject, body_html=html)

    # 4. Log the attempt
    db.add(EmailLog(
        recipient=to_email,
        subject=subject,
        message_id=message_id if isinstance(message_id, str) else None,
        status="delivered" if message_id else "failed",
        metadata_={"template_id": template_id}
    ))
    await db.commit()

    if not message_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send email. Please check Brevo API configuration.",
        )

    return {"message": f"Email sent to {to_email}", "attachments_count": len(attachments)}


@router.post("/preview-custom-email")
async def preview_custom_email(
    heading: str = Form("", description="Main heading inside email body"),
    message: str = Form("", description="Custom message (supports basic HTML)"),
    image_url: Optional[str] = Form(None, description="Optional banner image URL"),
    action_url: Optional[str] = Form(None, description="Optional CTA button URL"),
    action_label: Optional[str] = Form("Learn More", description="CTA button label"),
    template_id: str = Form("custom", description="Template to use: custom, reminder, invoice"),
    admin: User = Depends(get_current_admin_user),
):
    """
    Renders the custom email template and returns the HTML for preview.
    Does NOT send any email.
    """
    if template_id == "reminder":
        html = render_reminder_email(
            order_id=1234,
            due_amount=5000.0,
            due_date="20th Oct",
            message=message or "This is a reminder.",
            user_name="Customer",
        )
    elif template_id == "invoice":
        html = render_invoice_email(
            order_id=1234,
            items=[{"name": "Item A", "qty": 1, "price": 1000.0}],
            total_amount=1000.0,
            user_name="Customer",
        )
    else:
        # Default to custom
        html = render_custom_email(
            heading=heading,
            message=message,
            image_url=image_url.strip() if image_url else None,
            action_url=action_url.strip() if action_url else None,
            action_label=action_label.strip() if action_label else "Learn More",
            user_name="Customer",
        )
    return {"html": html}


@router.post("/send-bulk-email", status_code=status.HTTP_200_OK)
async def send_bulk_email(
    request: Request,
    subject: str = Form(..., description="Email subject line"),
    heading: str = Form(..., description="Main heading inside email body"),
    message: str = Form(..., description="Custom message (supports basic HTML)"),
    image_url: Optional[str] = Form(None, description="Optional banner image URL"),
    action_url: Optional[str] = Form(None, description="Optional CTA button URL"),
    action_label: Optional[str] = Form("Learn More", description="CTA button label"),
    template_id: str = Form("custom", description="Template to use: custom, reminder, invoice"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    """
    Send a custom email to ALL users in the database.
    Supports optional banner image, CTA button, and file attachments.
    """
    # Swagger sends "" for optional fields instead of None — coerce empty strings
    image_url = image_url.strip() if image_url else None
    action_url = action_url.strip() if action_url else None
    action_label = action_label.strip() if action_label else "Learn More"

    # Extract files from request, filtering out empty strings Swagger UI sends
    form = await request.form()
    files = [v for v in form.getlist("files") if isinstance(v, UploadFile) and v.filename]

    # Read attachments once (before iterating over users)
    attachments = await _validate_files(files) if files else []

    result = await db.execute(select(User).where(User.admin == False))
    users = result.scalars().all()

    if not users:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No users found.")

    sent = 0
    failed = 0

    for user in users:
        if template_id == "reminder":
            html = render_reminder_email(
                order_id=0, due_amount=0.0, message=message, user_name=user.name
            )
        elif template_id == "invoice":
            html = render_invoice_email(
                order_id=0, items=[], total_amount=0.0, amount_paid=0.0, user_name=user.name
            )
        else:
            html = render_custom_email(
                heading=heading,
                message=message,
                image_url=image_url,
                action_url=action_url,
                action_label=action_label,
                user_name=user.name,
            )

        if attachments:
            msg_id = await email_service.send_email_with_attachments(
                to=user.email, subject=subject, body_html=html, attachments=attachments,
            )
        else:
            msg_id = await email_service.send_email(to=user.email, subject=subject, body_html=html)

        if msg_id:
            sent += 1
            db.add(EmailLog(
                recipient=user.email,
                subject=subject,
                message_id=msg_id if isinstance(msg_id, str) else None,
                status="delivered",
                metadata_={"template_id": template_id, "bulk": True}
            ))
        else:
            failed += 1

    return {
        "message": f"Bulk email completed. Sent: {sent}, Failed: {failed}",
        "total_users": len(users),
        "sent": sent,
        "failed": failed,
    }
