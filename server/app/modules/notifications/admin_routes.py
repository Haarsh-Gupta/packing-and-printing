from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.modules.auth import get_current_admin_user
from app.modules.users.models import User

from app.modules.notifications.models import Notification, EmailLog
from app.modules.notifications.schemas import (
    NotificationCreate,
    NotificationResponse,
)

router = APIRouter()

@router.get("/", response_model=list[NotificationResponse], status_code=status.HTTP_200_OK)
async def get_my_admin_notifications(
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
):
    """[ADMIN] Get personal inbox notifications aimed at this admin."""
    stmt = (
        select(Notification)
        .where(Notification.user_id == admin.id)
        .order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.patch("/mark-all-read", status_code=status.HTTP_200_OK)
async def mark_all_admin_read(
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """[ADMIN] Mark all my personal notifications as read."""
    from sqlalchemy import update
    await db.execute(
        update(Notification)
        .where(Notification.user_id == admin.id, Notification.is_read == False)
        .values(is_read=True)
    )
    await db.commit()
    return {"message": "All notifications marked as read"}

@router.patch("/{id}/read", response_model=NotificationResponse, status_code=status.HTTP_200_OK)
async def mark_single_admin_read(
    id: int,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """[ADMIN] Mark a single notification as read."""
    result = await db.execute(select(Notification).where(Notification.id == id, Notification.user_id == admin.id))
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found")
    notif.is_read = True
    await db.commit()
    await db.refresh(notif)
    return notif

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_single_admin_notification(
    id: int,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """[ADMIN] Delete a single notification."""
    from sqlalchemy import delete
    result = await db.execute(delete(Notification).where(Notification.id == id, Notification.user_id == admin.id))
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found")
    return {"message": "Notification deleted"}

@router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def send_notification(
    payload: NotificationCreate,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """[ADMIN] Send a notification to a specific user."""
    # Verify user exists
    result = await db.execute(select(User).where(User.id == payload.user_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    notif = Notification(
        user_id=payload.user_id,
        title=payload.title,
        message=payload.message,
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return notif


@router.get("/email-logs", status_code=status.HTTP_200_OK)
async def get_email_logs(
    skip: int = 0,
    limit: int = 100,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """[ADMIN] Get the last 100 email events."""
    stmt = (
        select(EmailLog)
        .order_by(EmailLog.sent_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()
