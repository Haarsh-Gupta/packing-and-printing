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


# ==================== USER ENDPOINTS ====================

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=InquiryGroupResponse)
async def create_inquiry_group(
    inquiry_data: InquiryGroupCreate,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new Inquiry Group (RFQ Cart).
    User submits one or multiple products/services for quotation.
    """
    # 1. Create the parent container
    new_group = InquiryGroup(
        user_id=current_user.id,
        status='PENDING'
    )
    db.add(new_group)
    await db.flush()  # Flush to generate the new_group.id for the items

    # 2. Add the child items to the container
    for item in inquiry_data.items:
        new_item = InquiryItem(
            inquiry_group_id=new_group.id,
            template_id=item.template_id,
            service_id=item.service_id,
            variant_id=item.variant_id,
            quantity=item.quantity,
            selected_options=item.selected_options,
            notes=item.notes,
            images=item.images
        )
        db.add(new_item)
    
    await db.commit()
    
    # 3. Fetch the fully loaded group to return
    stmt = select(InquiryGroup).options(
        selectinload(InquiryGroup.items),
        selectinload(InquiryGroup.messages)
    ).where(InquiryGroup.id == new_group.id)
    
    result = await db.execute(stmt)
    return result.scalar_one()


@router.get("/my", response_model=list[InquiryGroupListResponse])
async def get_my_inquiries(
    skip: int = 0,
    limit: int = 20,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all inquiries for the current user (Lightweight List).
    """
    stmt = (
        select(InquiryGroup)
        .options(selectinload(InquiryGroup.items))
        .where(InquiryGroup.user_id == current_user.id)
        .order_by(InquiryGroup.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    groups = result.scalars().all()
    
    # Calculate item counts for the lightweight response
    for group in groups:
        group.item_count = len(group.items)

    return groups


@router.get("/my/{group_id}", response_model=InquiryGroupResponse)
async def get_my_inquiry(
    group_id: int,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific detailed inquiry by ID (only if owned by current user).
    """
    stmt = select(InquiryGroup).options(
        selectinload(InquiryGroup.items),
        selectinload(InquiryGroup.messages)
    ).where(
        InquiryGroup.id == group_id,
        InquiryGroup.user_id == current_user.id
    )
    result = await db.execute(stmt)
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inquiry not found"
        )
    
    return group


@router.patch("/my/{group_id}/respond", response_model=InquiryGroupResponse)
async def respond_to_quotation(
    group_id: int,
    status_update: InquiryStatusUpdate,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Accept or reject an admin quotation for the entire cart.
    """
    stmt = select(InquiryGroup).options(
        selectinload(InquiryGroup.items),
        selectinload(InquiryGroup.messages)
    ).where(
        InquiryGroup.id == group_id,
        InquiryGroup.user_id == current_user.id
    )
    result = await db.execute(stmt)
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    
    if group.status != 'QUOTED':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only respond to inquiries with QUOTED status"
        )
    
    group.status = status_update.status.value
    await db.commit()
    await db.refresh(group)
    
    # Note: If ACCEPTED, this is where you would trigger the background task
    # to convert this InquiryGroup into a finalized Order object.
    
    return group
    

@router.delete("/my/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_inquiry(
    group_id: int,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete an inquiry cart (only if PENDING status).
    """
    stmt = select(InquiryGroup).where(
        InquiryGroup.id == group_id,
        InquiryGroup.user_id == current_user.id
    )
    result = await db.execute(stmt)
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    
    if group.status != 'PENDING':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only delete inquiries with PENDING status"
        )
    
    # SQLAlchemy cascade will automatically delete associated Items and Messages
    await db.execute(delete(InquiryGroup).where(InquiryGroup.id == group_id))
    await db.commit()


# ==================== MESSAGING ENDPOINTS ====================

@router.post("/my/{group_id}/messages", response_model=InquiryMessageResponse)
async def send_inquiry_message(
    group_id: int,
    message: InquiryMessageCreate,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Send a message in the overall inquiry thread.
    """
    stmt = select(InquiryGroup).where(
        InquiryGroup.id == group_id,
        InquiryGroup.user_id == current_user.id
    )
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


# ==================== ADMIN ENDPOINTS ====================

@router.get("/admin", response_model=list[InquiryGroupListResponse])
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


@router.get("/admin/{group_id}", response_model=InquiryGroupResponse)
async def get_inquiry_by_id(
    group_id: int,
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


@router.patch("/admin/{group_id}/quote", response_model=InquiryGroupResponse)
async def send_quotation(
    group_id: int,
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


@router.delete("/admin/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_inquiry(
    group_id: int,
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