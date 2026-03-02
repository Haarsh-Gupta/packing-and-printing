import asyncio
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, or_

from .schemas import UserCreate, UserOut, UserUpdate
from .models import User
from app.core.database import get_db
from ..auth.auth import get_password_hash
from ..auth import get_current_user, get_current_admin_user
from ..auth.schemas import TokenData
from app.modules.otps.services import get_otp_service
from app.core.rate_limiter import RateLimiter

router = APIRouter()

@router.get("/all" , response_model=list[UserOut])
async def get_all_users(
    query : Optional[str] = None,
    admin : Optional[bool] = None,
    db : AsyncSession = Depends(get_db) , 
    current_user : User = Depends(get_current_admin_user),
    is_active : Optional[bool] = None
    ):
    
    stmt = select(User)
    if admin is not None:
        stmt = stmt.where(User.admin == admin)
    if is_active is not None:
        stmt = stmt.where(User.is_active == is_active)
    if query:
        stmt = stmt.where(or_(
            User.name.ilike(f"%{query}%"),
            User.email.ilike(f"%{query}%"),
            User.phone.ilike(f"%{query}%")
        ))
    
    result = await db.execute(stmt)
    return result.scalars().all()

@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
async def soft_delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    stmt = update(User).where(User.id == user_id).values(is_active=False)
    await db.execute(stmt)
    await db.commit()
    return {"detail": "User deleted successfully"}


@router.delete("/hard-delete/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.execute(delete(User).where(User.id == user_id))
    await db.commit()