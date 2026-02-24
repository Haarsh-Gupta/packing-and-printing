"""
Ticket / Support routes.

Users  → create tickets, add messages, view own tickets
Admins → view all tickets, reply, update status, see read flags
"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.modules.auth import get_current_user, get_current_admin_user
from app.modules.auth.schemas import TokenData
from app.modules.users.models import User

from .models import Ticket, TicketMessage
from .schemas import (
    TicketCreate,
    TicketStatusUpdate,
    TicketMessageCreate,
    TicketResponse,
    TicketDetailResponse,
    TicketMessageResponse,
)

router = APIRouter()


# ==================== USER ENDPOINTS ====================

@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    payload: TicketCreate,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new support ticket with an initial message."""
    ticket = Ticket(
        user_id=current_user.id,
        subject=payload.subject,
        priority=payload.priority.value,
    )
    db.add(ticket)
    await db.flush()  # get ticket.id before adding message

    # Add the initial message
    msg = TicketMessage(
        ticket_id=ticket.id,
        sender_id=current_user.id,
        message=payload.message,
        is_read=False,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(ticket)
    return ticket


@router.get("/", response_model=list[TicketResponse])
async def list_my_tickets(
    skip: int = 0,
    limit: int = 20,
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all tickets for the current user."""
    query = select(Ticket).where(Ticket.user_id == current_user.id)
    if status_filter:
        query = query.where(Ticket.status == status_filter)
    query = query.order_by(Ticket.updated_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{ticket_id}", response_model=TicketDetailResponse)
async def get_ticket_detail(
    ticket_id: UUID,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific ticket with all its messages."""
    result = await db.execute(
        select(Ticket)
        .where(Ticket.id == ticket_id)
        .options(selectinload(Ticket.messages))
    )
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    # Users can only see their own tickets; admins can see any
    if not current_user.admin and ticket.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your ticket")

    return ticket


@router.post("/{ticket_id}/messages", response_model=TicketMessageResponse, status_code=status.HTTP_201_CREATED)
async def add_message(
    ticket_id: UUID,
    payload: TicketMessageCreate,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a message to a ticket (user or admin can reply)."""
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    # Only the ticket owner or an admin may reply
    if not current_user.admin and ticket.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your ticket")

    if ticket.status == "CLOSED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ticket is closed")

    msg = TicketMessage(
        ticket_id=ticket.id,
        sender_id=current_user.id,
        message=payload.message,
        is_read=False,
    )
    db.add(msg)

    # Auto-update status when admin replies
    if current_user.admin and ticket.status == "OPEN":
        ticket.status = "IN_PROGRESS"

    await db.commit()
    await db.refresh(msg)
    return msg


@router.patch("/{ticket_id}/messages/{message_id}/read", response_model=TicketMessageResponse)
async def mark_message_read(
    ticket_id: UUID,
    message_id: int,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a specific ticket message as read."""
    result = await db.execute(
        select(TicketMessage).where(
            TicketMessage.id == message_id,
            TicketMessage.ticket_id == ticket_id,
        )
    )
    msg = result.scalar_one_or_none()

    if not msg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    # Verify access to the parent ticket
    ticket_result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = ticket_result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    if not current_user.admin and ticket.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your ticket")

    msg.is_read = True
    await db.commit()
    await db.refresh(msg)
    return msg


# ==================== ADMIN ENDPOINTS ====================

@router.get("/admin/all", response_model=list[TicketResponse])
async def admin_list_all_tickets(
    skip: int = 0,
    limit: int = 50,
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    priority_filter: Optional[str] = Query(None, description="Filter by priority"),
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """[ADMIN] List all tickets with optional filters."""
    query = select(Ticket)
    if status_filter:
        query = query.where(Ticket.status == status_filter)
    if priority_filter:
        query = query.where(Ticket.priority == priority_filter)
    query = query.order_by(Ticket.updated_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/admin/{ticket_id}/status", response_model=TicketResponse)
async def admin_update_ticket_status(
    ticket_id: UUID,
    payload: TicketStatusUpdate,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """[ADMIN] Update a ticket's status."""
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    ticket.status = payload.status.value
    await db.commit()
    await db.refresh(ticket)
    return ticket
