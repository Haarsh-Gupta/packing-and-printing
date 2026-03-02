from uuid import UUID
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from ..auth.auth import get_current_user, get_current_admin_user
from ..auth.schemas import TokenData
from ..users.models import User
from .models import InquiryGroup, InquiryItem, InquiryMessage
from .schemas import (
    InquiryGroupCreate,
    InquiryQuotation,
    InquiryStatusUpdate,
    InquiryGroupResponse,
    InquiryGroupListResponse,
    InquiryMessageCreate,
    InquiryMessageResponse
)

router = APIRouter()


@router.get("/", response_model=list[InquiryGroupListResponse], status_code=status.HTTP_200_OK)
async def get_all_inquiries(
    skip: int = 0,
    limit: int = 50,
    status_filter: str = None,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    [ADMIN] Get all inquiry groups with optional status filter.
    """
    stmt = select(InquiryGroup).options(
        selectinload(InquiryGroup.items)
    ).order_by(InquiryGroup.created_at.desc())
    
    if status_filter:
        stmt = stmt.where(InquiryGroup.status == status_filter.upper())
    
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    groups = result.scalars().all()

    for group in groups:
        group.item_count = len(group.items)
    
    return groups


@router.get("/{group_id}", response_model=InquiryGroupResponse, status_code=status.HTTP_200_OK)
async def get_inquiry_by_id(
    group_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    [ADMIN] Get a specific detailed inquiry by ID.
    """
    stmt = select(InquiryGroup).options(
        selectinload(InquiryGroup.items),
        selectinload(InquiryGroup.messages)
    ).where(InquiryGroup.id == group_id)
    
    result = await db.execute(stmt)
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    
    return group


@router.patch("/{group_id}/quote", response_model=InquiryGroupResponse, status_code=status.HTTP_200_OK)
async def send_quotation(
    group_id: UUID,
    quotation: InquiryQuotation,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    [ADMIN] Send a quotation/price estimate for the entire cart.
    Can also apply specific line-item pricing if provided.
    """
    stmt = select(InquiryGroup).options(
        selectinload(InquiryGroup.items),
        selectinload(InquiryGroup.messages)
    ).where(InquiryGroup.id == group_id)
    
    result = await db.execute(stmt)
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    
    if group.status not in ['PENDING', 'QUOTED']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only quote inquiries with PENDING or QUOTED status"
        )
    
    # Update Parent Total Pricing
    group.total_quoted_price = quotation.total_quoted_price
    group.admin_notes = quotation.admin_notes
    group.quoted_at = datetime.now(timezone.utc)
    group.status = 'QUOTED'
    group.quote_valid_until = datetime.now(timezone.utc) + timedelta(days=quotation.valid_for_days)
    
    # Update Child Line-Item Pricing (if provided by admin)
    if quotation.line_items:
        prices_map = {li.item_id: li.line_item_price for li in quotation.line_items}
        for item in group.items:
            if item.id in prices_map:
                item.line_item_price = prices_map[item.id]
    
    await db.commit()
    await db.refresh(group)
    
    return group


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_inquiry(
    group_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    [ADMIN] Delete any inquiry group.
    """
    stmt = select(InquiryGroup).where(InquiryGroup.id == group_id)
    result = await db.execute(stmt)
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    
    await db.execute(delete(InquiryGroup).where(InquiryGroup.id == group_id))
    await db.commit()


@router.post("/{group_id}/messages", response_model=InquiryMessageResponse)
async def admin_send_message(
    group_id: UUID,
    message: InquiryMessageCreate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    [ADMIN] Send a message in any inquiry thread.
    """
    stmt = select(InquiryGroup).where(InquiryGroup.id == group_id)
    result = await db.execute(stmt)
    group = result.scalar_one_or_none()

    if not group:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    new_message = InquiryMessage(
        inquiry_group_id=group_id,
        sender_id=current_user.id,
        content=message.content,
        file_urls=message.file_urls
    )

    db.add(new_message)
    await db.commit()
    await db.refresh(new_message)

    return new_message