from typing import Optional
from app.modules.reviews.schemas import ReviewResponse
from fastapi import  APIRouter , Depends , HTTPException , status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.core.database import get_db
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

router = APIRouter()


@router.get("/{user_id}", response_model=list[ReviewResponse])
async def get_user_reviews(
    user_id: int, 
    db: AsyncSession = Depends(get_db), 
    current_user: TokenData = Depends(get_current_admin_user),
    product_id: Optional[int] = None,
    service_id: Optional[int] = None
):
    stmt = select(Review).where(Review.user_id == user_id)
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
    current_user: User = Depends(get_current_admin_user)
):
    stmt = delete(Review).where(Review.id == review_id and Review.user_id == current_user.id)
    await db.execute(stmt)
    await db.commit()
    return