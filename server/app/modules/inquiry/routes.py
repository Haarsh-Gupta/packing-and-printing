from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.core.database import get_db
from ..auth.auth import get_current_user, get_current_active_user
from ..users.models import User
from ..products.models import ProductTemplate
from .models import Inquiry
from .schemas import (
    InquiryCreate,
    InquiryUpdate,
    InquiryQuotation,
    InquiryStatusUpdate,
    InquiryResponse,
    InquiryListResponse
)


router = APIRouter()


# ==================== USER ENDPOINTS ====================

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=InquiryResponse)
async def create_inquiry(
    inquiry: InquiryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new inquiry for a product template.
    User selects product options and submits for admin quotation.
    """
    # Verify template exists
    stmt = select(ProductTemplate).where(ProductTemplate.id == inquiry.template_id)
    result = await db.execute(stmt)
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product template not found"
        )
    
    # Check minimum quantity
    if inquiry.quantity < template.minimum_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimum quantity for this product is {template.minimum_quantity}"
        )
    
    new_inquiry = Inquiry(
        user_id=current_user.id,
        template_id=inquiry.template_id,
        quantity=inquiry.quantity,
        selected_options=inquiry.selected_options,
        notes=inquiry.notes,
        status='PENDING'
    )
    
    db.add(new_inquiry)
    await db.commit()
    await db.refresh(new_inquiry)
    
    return new_inquiry


@router.get("/my", response_model=list[InquiryListResponse])
async def get_my_inquiries(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all inquiries for the current user.
    """
    stmt = (
        select(Inquiry)
        .where(Inquiry.user_id == current_user.id)
        .order_by(Inquiry.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/my/{inquiry_id}", response_model=InquiryResponse)
async def get_my_inquiry(
    inquiry_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific inquiry by ID (only if owned by current user).
    """
    stmt = select(Inquiry).where(
        Inquiry.id == inquiry_id,
        Inquiry.user_id == current_user.id
    )
    result = await db.execute(stmt)
    inquiry = result.scalar_one_or_none()
    
    if not inquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inquiry not found"
        )
    
    return inquiry


@router.put("/my/{inquiry_id}", response_model=InquiryResponse)
async def update_my_inquiry(
    inquiry_id: int,
    inquiry_update: InquiryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update an inquiry (only if PENDING status).
    """
    stmt = select(Inquiry).where(
        Inquiry.id == inquiry_id,
        Inquiry.user_id == current_user.id
    )
    result = await db.execute(stmt)
    inquiry = result.scalar_one_or_none()
    
    if not inquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inquiry not found"
        )
    
    if inquiry.status != 'PENDING':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only update inquiries with PENDING status"
        )
    
    update_data = inquiry_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(inquiry, key, value)
    
    await db.commit()
    await db.refresh(inquiry)
    
    return inquiry


@router.patch("/my/{inquiry_id}/respond", response_model=InquiryResponse)
async def respond_to_quotation(
    inquiry_id: int,
    status_update: InquiryStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Accept or reject an admin quotation.
    Can only respond to inquiries with QUOTED status.
    """
    stmt = select(Inquiry).where(
        Inquiry.id == inquiry_id,
        Inquiry.user_id == current_user.id
    )
    result = await db.execute(stmt)
    inquiry = result.scalar_one_or_none()
    
    if not inquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inquiry not found"
        )
    
    if inquiry.status != 'QUOTED':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only respond to inquiries with QUOTED status"
        )
    
    inquiry.status = status_update.status
    await db.commit()
    await db.refresh(inquiry)
    
    return inquiry


@router.delete("/my/{inquiry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_inquiry(
    inquiry_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete an inquiry (only if PENDING status).
    """
    stmt = select(Inquiry).where(
        Inquiry.id == inquiry_id,
        Inquiry.user_id == current_user.id
    )
    result = await db.execute(stmt)
    inquiry = result.scalar_one_or_none()
    
    if not inquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inquiry not found"
        )
    
    if inquiry.status != 'PENDING':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only delete inquiries with PENDING status"
        )
    
    await db.execute(delete(Inquiry).where(Inquiry.id == inquiry_id))
    await db.commit()


# ==================== ADMIN ENDPOINTS ====================

@router.get("/admin", response_model=list[InquiryResponse])
async def get_all_inquiries(
    skip: int = 0,
    limit: int = 50,
    status_filter: str = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    [ADMIN] Get all inquiries with optional status filter.
    """
    stmt = select(Inquiry).order_by(Inquiry.created_at.desc())
    
    if status_filter:
        stmt = stmt.where(Inquiry.status == status_filter.upper())
    
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    
    return result.scalars().all()


@router.get("/admin/{inquiry_id}", response_model=InquiryResponse)
async def get_inquiry_by_id(
    inquiry_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    [ADMIN] Get a specific inquiry by ID.
    """
    stmt = select(Inquiry).where(Inquiry.id == inquiry_id)
    result = await db.execute(stmt)
    inquiry = result.scalar_one_or_none()
    
    if not inquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inquiry not found"
        )
    
    return inquiry


@router.patch("/admin/{inquiry_id}/quote", response_model=InquiryResponse)
async def send_quotation(
    inquiry_id: int,
    quotation: InquiryQuotation,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    [ADMIN] Send a quotation/price estimate for an inquiry.
    Changes status from PENDING to QUOTED.
    """
    stmt = select(Inquiry).where(Inquiry.id == inquiry_id)
    result = await db.execute(stmt)
    inquiry = result.scalar_one_or_none()
    
    if not inquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inquiry not found"
        )
    
    if inquiry.status not in ['PENDING', 'QUOTED']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only quote inquiries with PENDING or QUOTED status"
        )
    
    inquiry.quoted_price = quotation.quoted_price
    inquiry.admin_notes = quotation.admin_notes
    inquiry.quoted_at = datetime.now(timezone.utc)
    inquiry.status = 'QUOTED'
    
    await db.commit()
    await db.refresh(inquiry)
    
    return inquiry


@router.delete("/admin/{inquiry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_inquiry(
    inquiry_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    [ADMIN] Delete any inquiry.
    """
    stmt = select(Inquiry).where(Inquiry.id == inquiry_id)
    result = await db.execute(stmt)
    inquiry = result.scalar_one_or_none()
    
    if not inquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inquiry not found"
        )
    
    await db.execute(delete(Inquiry).where(Inquiry.id == inquiry_id))
    await db.commit()
