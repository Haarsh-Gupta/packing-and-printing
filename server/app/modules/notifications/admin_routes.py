from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update

from app.core.database import get_db
from app.modules.auth import get_current_admin_user
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
