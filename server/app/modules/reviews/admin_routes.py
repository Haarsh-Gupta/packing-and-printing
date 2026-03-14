from typing import Optional
from app.modules.reviews.schemas import ReviewResponse
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import joinedload
from app.modules.auth.auth import get_current_admin_user, TokenData
from app.modules.users.models import User
from datetime import datetime
from sqlalchemy.orm import joinedload
from app.modules.orders.models import Order
from app.modules.inquiry.models import InquiryGroup, InquiryItem
from app.modules.reviews.models import Review 
from app.modules.reviews.schemas import ReviewBase , ReviewUpdate, ReviewCreate, ReviewResponse
from app.modules.services.models import SubService
from app.modules.products.models import SubProduct
from app.core.database import get_db

router = APIRouter()


@router.get("/all", response_model=list[ReviewResponse])
async def get_all_reviews(
    db: AsyncSession = Depends(get_db), 
    current_user: TokenData = Depends(get_current_admin_user),
    product_id: Optional[int] = None,
    service_id: Optional[int] = None,
    user_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100
):
    stmt = select(Review).options(joinedload(Review.user))
    if user_id is not None:
        stmt = stmt.where(Review.user_id == str(user_id))
    if product_id is not None:
        stmt = stmt.where(Review.product_id == product_id)
    if service_id is not None:
        stmt = stmt.where(Review.service_id == service_id)
        
    stmt = stmt.order_by(Review.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


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
    stmt = delete(Review).where(Review.id == review_id)
    await db.execute(stmt)
    await db.commit()
    return