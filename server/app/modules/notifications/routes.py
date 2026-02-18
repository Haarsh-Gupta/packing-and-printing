"""
Notification routes.

Admin endpoints  → send notifications
User endpoints   → list, read, mark-as-read
Admin view       → see all notifications with read status
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update

from app.core.database import get_db
from app.modules.auth import get_current_user, get_current_admin_user
from app.modules.users.models import User

from .models import Notification
from .schemas import (
    NotificationCreate,
    NotificationBulkCreate,
    NotificationResponse,
    NotificationListResponse,
    UnreadCountResponse,
)

router = APIRouter()


# ==================== ADMIN ENDPOINTS ====================

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


@router.post("/bulk", status_code=status.HTTP_201_CREATED)
async def send_bulk_notification(
    payload: NotificationBulkCreate,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """[ADMIN] Send a notification to ALL users."""
    result = await db.execute(select(User))
    users = result.scalars().all()

    if not users:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No users found")

    notifications = []
    for user in users:
        notif = Notification(user_id=user.id, title=payload.title, message=payload.message)
        db.add(notif)
        notifications.append(notif)

    await db.commit()

    return {
        "message": f"Notification sent to {len(notifications)} users",
        "total_sent": len(notifications),
    }


@router.get("/admin/all", response_model=list[NotificationResponse])
async def admin_list_all_notifications(
    skip: int = 0,
    limit: int = 50,
    user_id: Optional[int] = Query(None, description="Filter by user"),
    is_read: Optional[bool] = Query(None, description="Filter by read status"),
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """[ADMIN] List all notifications with optional filters. Admins can see is_read status."""
    query = select(Notification)
    if user_id is not None:
        query = query.where(Notification.user_id == user_id)
    if is_read is not None:
        query = query.where(Notification.is_read == is_read)

    query = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


# ==================== USER ENDPOINTS ====================

@router.get("/", response_model=NotificationListResponse)
async def list_my_notifications(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all notifications for the current user."""
    base = select(Notification).where(Notification.user_id == current_user.id)

    # Total count
    total_q = select(func.count()).select_from(base.subquery())
    total = (await db.execute(total_q)).scalar() or 0

    # Unread count
    unread_q = select(func.count()).select_from(
        base.where(Notification.is_read == False).subquery()
    )
    unread = (await db.execute(unread_q)).scalar() or 0

    # Paginated notifications
    result = await db.execute(
        base.order_by(Notification.created_at.desc()).offset(skip).limit(limit)
    )
    notifications = result.scalars().all()

    return NotificationListResponse(
        total=total,
        unread=unread,
        notifications=notifications,
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
async def unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the number of unread notifications for the current user."""
    result = await db.execute(
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
    )
    return UnreadCountResponse(unread=result.scalar() or 0)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a single notification as read."""
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    )
    notif = result.scalar_one_or_none()

    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    notif.is_read = True
    await db.commit()
    await db.refresh(notif)
    return notif


@router.patch("/read-all")
async def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all notifications as read for the current user."""
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
        .values(is_read=True)
    )
    await db.commit()
    return {"message": "All notifications marked as read"}
