from app.modules.reviews.schemas import ReviewResponse
from fastapi import  APIRouter , Depends , HTTPException , status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.core.database import get_db
from app.modules.auth.auth import get_current_admin_user, get_current_user, TokenData
from app.modules.users.models import User
from app.modules.products.models import ProductTemplate
from datetime import datetime
from sqlalchemy.orm import joinedload
from app.modules.orders.models import Order
from app.modules.inquiry.models import Inquiry
from app.modules.reviews.models import Review as ProductReview
from app.modules.reviews.schemas import ReviewBase , ReviewUpdate, ReviewCreate, ReviewResponse

router = APIRouter()

@router.post("/review", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    product_id: int, 
    review: ReviewBase, 
    db: AsyncSession = Depends(get_db), 
    current_user: TokenData = Depends(get_current_user)
):
    user_id = current_user.id

    # 1. Check if Product Exists first
    stmt = select(ProductTemplate).where(ProductTemplate.id == product_id)
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # 2. Check for Existing Review
    stmt = select(ProductReview).where(ProductReview.product_id == product_id, ProductReview.user_id == user_id)
    result = await db.execute(stmt)
    existing_review = result.scalar_one_or_none()

    # UPDATE Logic
    if existing_review:
        existing_review.rating = review.rating
        existing_review.comment = review.comment
        existing_review.updated_at = datetime.now() # Manually update timestamp
        
        await db.commit()
        await db.refresh(existing_review)
        return existing_review

   
    stmt = (
    select(Order)
    .join(Inquiry, Order.inquiry_id == Inquiry.id) # Connect Order to Inquiry
    .where(
        Order.user_id == user_id,           # 1. Matches User
        Inquiry.template_id == product_id,  # 2. Matches Specific Product
        Order.status == 'PAID' or Order.status == 'COMPLETED' # Optional: Ensure it's paid? User didn't specify but good practice. I'll stick to user logic which was user_id and template_id.
    )
    .limit(1) 
    )

    result = await db.execute(stmt)
    order = result.scalar_one_or_none() 

    # Now this is accurate:
    is_verified = True if order else False

    # CREATE Logic
    # We instantiate the SQLALCHEMY Model, not the Pydantic one
    new_review_db = ProductReview(
        user_id=user_id,
        product_id=product_id,
        rating=review.rating,
        comment=review.comment,
        is_verified=is_verified,
        created_at=datetime.now()
    )

    db.add(new_review_db)
    await db.commit()
    await db.refresh(new_review_db)
    
    return new_review_db

@router.get("/reviews/{product_id}", response_model=list[ReviewResponse])
async def get_reviews(
    product_id: int, 
    db: AsyncSession = Depends(get_db), 
    limit: int = 10, 
    skip: int = 0
):
    # Added product_id to path for better REST practice
    stmt = (
        select(ProductReview)
        .options(joinedload(ProductReview.user)) # Ensure 'user' relationship exists in model
        .where(ProductReview.product_id == product_id)
        .limit(limit)
        .offset(skip)
    )
    result = await db.execute(stmt)
    reviews = result.scalars().all()
    return reviews

@router.delete("/review/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int, 
    db: AsyncSession = Depends(get_db), 
    current_user: TokenData = Depends(get_current_admin_user)
):
    stmt = select(ProductReview).where(ProductReview.id == review_id)
    result = await db.execute(stmt)
    review = result.scalar_one_or_none()

    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    await db.delete(review)
    await db.commit()
    return