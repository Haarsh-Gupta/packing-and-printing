from app.modules.reviews.schemas import ReviewResponse
from fastapi import  APIRouter , Depends , HTTPException , status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.core.database import get_db
from app.modules.auth.auth import get_current_admin_user, get_current_user, TokenData
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

@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_or_update_review(
    review: ReviewCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: TokenData = Depends(get_current_user)
):
    """
    Handles creating or updating a review for either a Product or a Service.
    """
    # 1. Determine target entity
    if review.product_id:
        target_model = SubProduct
        entity_id = review.product_id
        id_field = "product_id"
        error_msg = "Product not found"
    elif review.service_id:
        target_model = SubService
        entity_id = review.service_id
        id_field = "service_id"
        error_msg = "Service not found"
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Must provide either product_id or service_id")

    # 2. Verify the Product/Service exists
    stmt = select(target_model).where(target_model.id == entity_id)
    if not (await db.execute(stmt)).scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error_msg)

    # 3. Check for Existing Review (using getattr to dynamically filter by product_id or service_id)
    stmt = select(Review).where(
        getattr(Review, id_field) == entity_id, 
        Review.user_id == current_user.id
    )
    existing_review = (await db.execute(stmt)).scalar_one_or_none()

    # 4. UPDATE Logic
    if existing_review:
        existing_review.rating = review.rating
        existing_review.comment = review.comment
        existing_review.updated_at = datetime.now() 
        
        await db.commit()
        await db.refresh(existing_review)
        return existing_review

    # 5. CREATE Logic
    # Dynamically build the kwargs for the new review
    review_data = {
        "user_id": current_user.id,
        id_field: entity_id,
        "rating": review.rating,
        "comment": review.comment,
        "is_verified": False,
        "created_at": datetime.now()
    }
    
    new_review = Review(**review_data)
    db.add(new_review)
    await db.commit()
    await db.refresh(new_review)
    
    return new_review

@router.get("/service/{slug}", response_model=list[ReviewResponse])
async def get_service_reviews(
    slug: str,
    db: AsyncSession = Depends(get_db), 
    limit: int = 10, 
    skip: int = 0
):
    stmt = (
        select(Review).options(joinedload(Review.service)) .where(SubService.slug == slug).limit(limit).offset(skip)
    )
    result = await db.execute(stmt)
    reviews = result.scalars().all()
    return reviews

@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int, 
    db: AsyncSession = Depends(get_db), 
    current_user: TokenData = Depends(get_current_admin_user)
):
    stmt = select(Review).where(Review.id == review_id and Review.user_id == current_user.id) 
    result = await db.execute(stmt)
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    await db.delete(review)
    await db.commit()
    return