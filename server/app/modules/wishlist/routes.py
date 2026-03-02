from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.core.database import get_db
from app.modules.auth.auth import get_current_user, get_current_admin_user
from app.modules.users.models import User
from app.modules.wishlist.models import Wishlist
from app.modules.products.models import SubProduct
from app.modules.services.models import SubService
from app.modules.wishlist.schemas import WishlistToggleRequest, WishlistSyncRequest, WishlistItemResponse

router = APIRouter()

# ==========================================
# CLIENT ROUTES (Next.js Storefront)
# ==========================================

@router.post("/toggle", status_code=status.HTTP_200_OK)
async def toggle_wishlist_item(
    request: WishlistToggleRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Toggles a Like. If it exists, remove it. If it doesn't, add it.
    Used for the instant Heart Icon click.
    """
    # 1. Check if it already exists
    stmt = select(Wishlist).where(
        Wishlist.user_id == current_user.id,
        Wishlist.sub_product_id == request.sub_product_id,
        Wishlist.sub_service_id == request.sub_service_id
    )
    existing_item = (await db.execute(stmt)).scalar_one_or_none()

    if existing_item:
        # UNLIKE: It exists, so we delete it
        await db.delete(existing_item)
        await db.commit()
        return {"status": "removed", "message": "Removed from wishlist"}
    
    # LIKE: It doesn't exist, so we create it
    new_item = Wishlist(
        user_id=current_user.id,
        sub_product_id=request.sub_product_id,
        sub_service_id=request.sub_service_id
    )
    db.add(new_item)
    
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Invalid Product or Service ID")
        
    return {"status": "added", "message": "Added to wishlist"}


@router.post("/sync", status_code=status.HTTP_200_OK)
async def sync_local_storage(
    request: WishlistSyncRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Fired once in the background when a user logs in. 
    Moves their localStorage guest likes into the database.
    """
    added_count = 0
    
    # Process Products
    for pid in request.products:
        # Ignore if they already liked it in a previous session
        stmt = select(Wishlist).where(Wishlist.user_id == current_user.id, Wishlist.sub_product_id == pid)
        if not (await db.execute(stmt)).scalar_one_or_none():
            db.add(Wishlist(user_id=current_user.id, sub_product_id=pid))
            added_count += 1

    # Process Services
    for sid in request.services:
        stmt = select(Wishlist).where(Wishlist.user_id == current_user.id, Wishlist.sub_service_id == sid)
        if not (await db.execute(stmt)).scalar_one_or_none():
            db.add(Wishlist(user_id=current_user.id, sub_service_id=sid))
            added_count += 1

    if added_count > 0:
        await db.commit()
        
    return {"message": f"Successfully synced {added_count} items"}


@router.get("/my", response_model=list[WishlistItemResponse])
async def get_my_wishlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetches the logged-in user's full wishlist to render the /saved page."""
    # Using selectinload to fetch the actual product/service details in one query
    stmt = select(Wishlist).options(
        selectinload(Wishlist.sub_product),
        selectinload(Wishlist.sub_service)
    ).where(Wishlist.user_id == current_user.id).order_by(Wishlist.created_at.desc())
    
    result = await db.execute(stmt)
    return result.scalars().all()
