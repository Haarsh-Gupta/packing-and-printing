"""
Pydantic schemas for notifications.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


# ── Admin sends ──────────────────────────────────────────────
class NotificationCreate(BaseModel):
    """Admin sends a notification to a specific user."""
    user_id: int
    title: str = Field(..., max_length=200)
    message: str


class NotificationBulkCreate(BaseModel):
    """Admin sends a notification to ALL users."""
    title: str = Field(..., max_length=200)
    message: str


# ── Responses ────────────────────────────────────────────────
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    total: int
    unread: int
    notifications: List[NotificationResponse]


class UnreadCountResponse(BaseModel):
    unread: int
