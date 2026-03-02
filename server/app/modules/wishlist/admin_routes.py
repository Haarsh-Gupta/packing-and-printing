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
# ADMIN ROUTES (Next.js Admin Dashboard)
# ==========================================

@router.get("/user/{user_id}", response_model=list[WishlistItemResponse])
async def admin_get_user_wishlist(
    user_id: UUID,
    admin_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    [ADMIN ONLY] See what a specific user has liked.
    Great for sales context before calling a lead.
    """
    stmt = select(Wishlist).options(
        selectinload(Wishlist.sub_product),
        selectinload(Wishlist.sub_service)
    ).where(Wishlist.user_id == user_id).order_by(Wishlist.created_at.desc())
    
    result = await db.execute(stmt)
    return result.scalars().all()