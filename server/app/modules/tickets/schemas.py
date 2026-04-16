from datetime import datetime
from typing import List, Optional
from uuid import UUID
from enum import Enum as PyEnum
from pydantic import BaseModel, Field, ConfigDict


# ── Enums ─────────────────────────────────────────────────────
class TicketStatus(str, PyEnum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class TicketPriority(str, PyEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


# ── Ticket Schemas ────────────────────────────────────────────
class TicketCreate(BaseModel):
    subject: str = Field(..., max_length=300)
    message: str = Field(..., description="Initial message for the ticket")
    priority: TicketPriority = TicketPriority.MEDIUM


class TicketStatusUpdate(BaseModel):
    status: TicketStatus


class TicketMessageCreate(BaseModel):
    message: str


class TicketUserMinimal(BaseModel):
    id: UUID
    name: Optional[str] = None
    email: str
    profile_picture: Optional[str] = None
    admin: bool = False

    model_config = ConfigDict(from_attributes=True)


# ── Responses ─────────────────────────────────────────────────
class TicketMessageResponse(BaseModel):
    id: int
    ticket_id: UUID
    sender_id: UUID
    message: str
    is_read: bool
    created_at: datetime
    sender: Optional[TicketUserMinimal] = None;

    model_config = ConfigDict(from_attributes=True)


class TicketResponse(BaseModel):
    id: UUID
    display_id: Optional[str] = None
    user_id: UUID
    subject: str
    status: TicketStatus
    priority: TicketPriority
    created_at: datetime
    updated_at: datetime
    user: Optional[TicketUserMinimal] = None

    model_config = ConfigDict(from_attributes=True)


class TicketDetailResponse(TicketResponse):
    """Ticket with its full message thread."""
    messages: List[TicketMessageResponse] = []


class TicketListResponse(BaseModel):
    id: UUID
    display_id: Optional[str] = None
    user_id: UUID
    subject: str
    status: TicketStatus
    priority: TicketPriority
    created_at: datetime
    user: Optional[TicketUserMinimal] = None
    unread_count: int = 0

    model_config = ConfigDict(from_attributes=True)
