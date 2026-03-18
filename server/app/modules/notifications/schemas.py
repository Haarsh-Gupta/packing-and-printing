"""
Pydantic schemas for notifications.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

from uuid import UUID

# ── Standard UI Event Payload ────────────────────────────────
class UINotification(BaseModel):
    """Standardized payload structure for raw real-time SSE websocket messages."""
    id: str
    event_type: str
    title: str
    body: str
    action_url: Optional[str] = None
    is_read: bool = False
    metadata: Optional[dict] = None


# ── Admin sends ──────────────────────────────────────────────
class NotificationCreate(BaseModel):
    """Admin sends a notification to a specific user."""
    user_id: UUID
    title: str = Field(..., max_length=200)
    message: str
    metadata: Optional[dict] = None


class NotificationBulkCreate(BaseModel):
    """Admin sends a notification to ALL users."""
    title: str = Field(..., max_length=200)
    message: str


# ── Responses ────────────────────────────────────────────────
class NotificationResponse(BaseModel):
    id: int
    user_id: UUID
    title: str
    message: str
    is_read: bool
    created_at: datetime
    metadata: Optional[dict] = Field(None, alias="metadata_")

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    total: int
    unread: int
    notifications: List[NotificationResponse]


class UnreadCountResponse(BaseModel):
    unread: int
