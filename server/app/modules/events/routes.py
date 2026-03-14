"""
SSE (Server-Sent Events) streaming endpoints.

GET /events/stream        — authenticated user's real-time event stream
GET /admin/events/stream  — admin-only real-time event stream
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.modules.auth.auth import get_current_user, get_current_admin_user
from app.modules.auth.schemas import TokenData
from app.modules.users.models import User
from app.core.sse import sse_manager

router = APIRouter()


@router.get("/stream")
async def user_sse_stream(
    current_user: TokenData = Depends(get_current_user),
):
    """
    SSE stream for the authenticated user.

    Sends real-time events:
      - order_status_changed
      - payment_recorded
      - payment_verified
      - milestones_changed
      - new_notification

    Usage (JavaScript):
        const es = new EventSource('/events/stream', { withCredentials: true });
        es.addEventListener('order_status_changed', (e) => {
            const data = JSON.parse(e.data);
            console.log('Order updated:', data);
        });
    """
    return StreamingResponse(
        sse_manager.subscribe(str(current_user.id)),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


@router.get("/admin/stream")
async def admin_sse_stream(
    current_user: User = Depends(get_current_admin_user),
):
    """
    SSE stream for admin users.

    Sends real-time events:
      - admin_payment_recorded
      - admin_order_created
      - admin_milestone_switch
      - admin_new_inquiry

    Usage (JavaScript):
        const es = new EventSource('/admin/events/stream', { withCredentials: true });
        es.addEventListener('admin_payment_recorded', (e) => { ... });
    """
    return StreamingResponse(
        sse_manager.subscribe_admin(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
