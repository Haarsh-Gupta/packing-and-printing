import logging
from typing import Optional
import asyncio  
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from jose import jwt, JWTError

from app.core.database import get_db
from app.modules.auth import get_current_user, get_current_admin_user
from app.modules.users.models import User
from app.core.config import settings
from app.core.sse import sse_manager
from app.modules.auth.schemas import TokenData

from .models import Notification
from .schemas import (
    NotificationCreate,
    NotificationBulkCreate,
    NotificationResponse,
    NotificationListResponse,
    UnreadCountResponse,
)
from .service import NotificationService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/stream")
async def sse_stream(request: Request, token: str = Query(..., description="JWT access token")):
    """
    SSE stream for real-time push notifications.
    Accepts ?token= because EventSource cannot set Authorization headers.
    Events: inquiry_status_changed, inquiry_quoted, inquiry_new_message, connected
    """
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        token_data = TokenData(**payload)
        user_id = str(token_data.id)
    except (JWTError, Exception):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    async def event_stream():
        # Create a queue to merge multiple generators
        queue = asyncio.Queue()

        async def producer(gen):
            try:
                async for item in gen:
                    await queue.put(item)
            except Exception as e:
                logger.error(f"SSE producer error: {e}")

        # Start user stream
        tasks = [asyncio.create_task(producer(sse_manager.subscribe(user_id, request)))]
        
        # If admin, also start admin stream
        if payload.get("admin"):
            tasks.append(asyncio.create_task(producer(sse_manager.subscribe_admin(request))))

        try:
            while not sse_manager._shutdown_event.is_set():
                # Check if client disconnected
                if await request.is_disconnected():
                    break
                
                try:
                    # Get next chunk from any producer
                    chunk = await asyncio.wait_for(queue.get(), timeout=1.0)
                    yield chunk
                except asyncio.TimeoutError:
                    # Periodic heartbeat if no events
                    yield ": keepalive\n\n"
                    
        finally:
            for task in tasks:
                task.cancel()

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


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
    """Get all notifications for the current user and trigger lazy cleanup for admins."""
    # Lazy cleanup: if current user is admin, clean up old read notifications
    if current_user.admin:
        await NotificationService.lazy_cleanup(db)
        await db.commit() # Commit the deletions
        
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
