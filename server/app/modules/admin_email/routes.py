"""
Admin email routes.

Lets admins send custom emails (with optional file attachments)
to individual users or all users.
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.modules.auth import get_current_admin_user
from app.modules.users.models import User
from app.core.email.service import get_email_service
from app.core.email.templates.custom import render_custom_email

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
    admin: User = Depends(get_current_admin_user),
):
    """
    Send a custom email to a specific user.
    Supports optional banner image, CTA button, and file attachments.
    """
    # Swagger sends "" for optional fields instead of None — coerce empty strings
    image_url = image_url.strip() if image_url else None
    action_url = action_url.strip() if action_url else None
    action_label = action_label.strip() if action_label else "Learn More"

    # Extract files from request, filtering out empty strings Swagger UI sends
    form = await request.form()
    raw_files = form.getlist("files")
    files = [v for v in raw_files if isinstance(v, UploadFile) and v.filename]
    print(f"📎 Files received: {len(files)} valid out of {len(raw_files)} raw entries")
    for f in files:
        print(f"   → {f.filename} ({f.content_type}, size={f.size})")

    html = render_custom_email(
        heading=heading,
        message=message,
        image_url=image_url or None,
        action_url=action_url or None,
        action_label=action_label or "Learn More",
    )

    attachments = await _validate_files(files) if files else []
    print(f"📎 Validated attachments: {len(attachments)}")

    if attachments:
        success = await email_service.send_email_with_attachments(
            to=to_email, subject=subject, body_html=html, attachments=attachments,
        )
    else:
        success = await email_service.send_email(to=to_email, subject=subject, body_html=html)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send email. Please check SMTP configuration.",
        )

    return {"message": f"Email sent to {to_email}", "attachments_count": len(attachments)}


@router.post("/send-bulk-email", status_code=status.HTTP_200_OK)
async def send_bulk_email(
    request: Request,
    subject: str = Form(..., description="Email subject line"),
    heading: str = Form(..., description="Main heading inside email body"),
    message: str = Form(..., description="Custom message (supports basic HTML)"),
    image_url: Optional[str] = Form(None, description="Optional banner image URL"),
    action_url: Optional[str] = Form(None, description="Optional CTA button URL"),
    action_label: Optional[str] = Form("Learn More", description="CTA button label"),
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

    result = await db.execute(select(User))
    users = result.scalars().all()

    if not users:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No users found.")

    sent = 0
    failed = 0

    for user in users:
        html = render_custom_email(
            heading=heading,
            message=message,
            image_url=image_url or None,
            action_url=action_url or None,
            action_label=action_label or "Learn More",
            user_name=user.name,
        )

        if attachments:
            ok = await email_service.send_email_with_attachments(
                to=user.email, subject=subject, body_html=html, attachments=attachments,
            )
        else:
            ok = await email_service.send_email(to=user.email, subject=subject, body_html=html)

        if ok:
            sent += 1
        else:
            failed += 1

    return {
        "message": f"Bulk email completed. Sent: {sent}, Failed: {failed}",
        "total_users": len(users),
        "sent": sent,
        "failed": failed,
    }
