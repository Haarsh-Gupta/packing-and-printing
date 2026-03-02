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

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):

    # 1. Check if user already exists
    stmt = select(User).where(User.email == user.email)
    result = await db.execute(stmt)
    db_user = result.scalar_one_or_none()

    if db_user:
        raise HTTPException(status_code=400, detail="User already exists")

    # 2. Verify OTP (without consuming yet - we'll delete it after user creation)
    otp_service = get_otp_service()
    is_valid = await otp_service.verify_otp(email=user.email, otp=user.otp, consume=False)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid or expired OTP"
        )

    data = user.model_dump(exclude={"otp"})
    data["password"] = await get_password_hash(data["password"])

    new_user = User(**data)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # 3. Consume (delete) the OTP only after user is successfully created
    await otp_service.store.delete_otp(user.email)

    return new_user


@router.get("/me" , response_model=UserOut)
async def user_detail(current_user : TokenData = Depends(get_current_user), db : AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.id == current_user.id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return user


@router.get("/{id}" , response_model=UserOut)
async def get_user_by_id(id : UUID , db : AsyncSession = Depends(get_db), current_user: TokenData = Depends(get_current_user)):

    stmt = select(User).where(User.id == id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND , detail="User not found")
    return user


@router.patch("/update", response_model=UserOut)
async def update_user(
    user: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    stmt = select(User).where(User.id == current_user.id)
    result = await db.execute(stmt)
    db_user = result.scalar_one_or_none()

    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND , detail="User not found")
    data = user.model_dump(exclude_unset=True)

    if "password" in data:
        data["password"] = await get_password_hash(data["password"])

    stmt = (
        update(User)
        .where(User.id == current_user.id)
        .values(**data)
        .returning(User)
    )

    result = await db.execute(stmt)
    await db.commit()

    return result.scalar_one()

