from typing import Optional
from app.modules.reviews.schemas import ReviewResponse, ReviewListResponse
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func
from sqlalchemy.orm import joinedload
from app.modules.auth.auth import get_current_admin_user, TokenData
from uuid import UUID
from app.modules.reviews.models import Review 
from app.modules.services.models import SubService
from app.modules.products.models import SubProduct
from app.core.database import get_db

router = APIRouter()


@router.get("/all", response_model=ReviewListResponse)
async def get_all_reviews(
    db: AsyncSession = Depends(get_db), 
    current_user: TokenData = Depends(get_current_admin_user),
    product_id: Optional[int] = None,
    service_id: Optional[int] = None,
    parent_product_id: Optional[int] = None,
    parent_service_id: Optional[int] = None,
    user_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 100
):
    """
    Get all reviews with advanced filtering and pagination.
    - product_id: Filter by specific SubProduct
    - service_id: Filter by specific SubService
    - parent_product_id: Filter by parent Product category
    - parent_service_id: Filter by parent Service category
    - user_id: Filter by specific user
    """
    stmt = select(Review).options(
        joinedload(Review.user),
        joinedload(Review.product),
        joinedload(Review.service)
    )
    
    # Filtering
    if user_id:
        stmt = stmt.where(Review.user_id == user_id)
    
    if product_id:
        stmt = stmt.where(Review.product_id == product_id)
    elif parent_product_id:
        # Filter by sub-products belonging to this parent product
        stmt = stmt.join(SubProduct, Review.product_id == SubProduct.id).where(SubProduct.product_id == parent_product_id)
        
    if service_id:
        stmt = stmt.where(Review.service_id == service_id)
    elif parent_service_id:
        # Filter by sub-services belonging to this parent service
        stmt = stmt.join(SubService, Review.service_id == SubService.id).where(SubService.service_id == parent_service_id)
        
    # Count total for pagination
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0
    
    # Fetch data
    stmt = stmt.order_by(Review.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    reviews = result.scalars().all()
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "reviews": reviews
    }


@router.get("/{user_id}", response_model=list[ReviewResponse])
async def get_user_reviews(
    user_id: str, 
    db: AsyncSession = Depends(get_db), 
    current_user: TokenData = Depends(get_current_admin_user),
    product_id: Optional[int] = None,
    service_id: Optional[int] = None
):
    stmt = select(Review).options(joinedload(Review.user)).where(Review.user_id == user_id)
    if product_id is not None:
        stmt = stmt.where(Review.product_id == product_id)
    if service_id is not None:
        stmt = stmt.where(Review.service_id == service_id)
    result = await db.execute(stmt)
    reviews = result.scalars().all()
    return reviews


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int, 
    db: AsyncSession = Depends(get_db), 
    current_user: TokenData = Depends(get_current_admin_user)
):
    stmt = select(Review).where(Review.id == review_id)
    review = (await db.execute(stmt)).scalar_one_or_none()
    
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")   

    stmt = delete(Review).where(Review.id == review_id)
    await db.execute(stmt)
    await db.commit()
    return
