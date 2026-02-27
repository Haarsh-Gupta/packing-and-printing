from typing import Optional
from uuid import UUID

from app.modules.tickets.schemas import TicketResponse
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.modules.auth import get_current_admin_user
from app.modules.users.models import User
from app.modules.tickets.models import Ticket, TicketMessage
from app.modules.tickets.schemas import (
    TicketCreate,
    TicketStatusUpdate,
    TicketMessageCreate,
    TicketResponse,
    TicketDetailResponse,
    TicketMessageResponse,
)


router = APIRouter()

@router.get("/all", response_model=list[TicketResponse])
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


@router.patch("/{ticket_id}/status", response_model=TicketResponse)
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
