import asyncio
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, or_
import redis.asyncio as redis

from .schemas import UserCreate, UserOut, UserUpdate
from .models import User
from app.core.database import get_db
from app.core.redis import get_redis
from app.core.email import send_otp_email
from ..auth import get_password_hash
from ..auth import get_current_user, get_current_active_user
from ..otp.schemas import OTPVerifyRequest, OTPResendRequest, OTPResponse
from ..otp.service import generate_otp, store_otp, verify_otp, resend_otp

router = APIRouter()


@router.post("/register", response_model=OTPResponse)
async def register_user(
    user: UserCreate,
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis)
):
    """
    Step 1: Register a new user. Sends an OTP to the user's email.
    The user must verify the OTP via POST /users/verify-otp to complete registration.
    """
    # Check if email already exists in DB
    stmt = select(User).where(User.email == user.email)
    result = await db.execute(stmt)
    db_user = result.scalar_one_or_none()

    if db_user:
        raise HTTPException(status_code=400, detail="User already exists")

    # Hash the password before storing
    data = user.model_dump()
    data["password"] = await get_password_hash(data["password"])

    # Generate OTP and store in Redis with user data
    otp = generate_otp()
    await store_otp(redis_client, user.email, otp, data)

    # Send OTP email via Brevo
    try:
        await send_otp_email(user.email, otp)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP email. Please try again."
        )

    return OTPResponse(
        message="OTP sent to your email. Please verify to complete registration.",
        email=user.email
    )


@router.post("/verify-otp", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def verify_otp_and_create_user(
    otp_data: OTPVerifyRequest,
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis)
):
    """
    Step 2: Verify OTP and create the user account.
    Maximum 3 attempts allowed. OTP expires after 10 minutes.
    """
    try:
        user_data = await verify_otp(redis_client, otp_data.email, otp_data.otp)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # Double-check email isn't taken (race condition guard)
    stmt = select(User).where(User.email == otp_data.email)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already exists")

    # Create user in DB
    new_user = User(**user_data)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


@router.post("/resend-otp", response_model=OTPResponse)
async def resend_otp_code(
    data: OTPResendRequest,
    redis_client: redis.Redis = Depends(get_redis)
):
    """
    Resend a new OTP for a pending registration.
    Generates a fresh OTP and resets the attempt counter.
    """
    try:
        await resend_otp(redis_client, data.email)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    return OTPResponse(
        message="New OTP sent to your email.",
        email=data.email
    )


@router.get("/all", response_model=list[UserOut])
async def get_all_users(query: Optional[str] = None, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):

    stmt = select(User)
    if query:
        stmt = stmt.where(or_(
            User.name.ilike(f"%{query}%"),
            User.email.ilike(f"%{query}%"),
            User.phone.ilike(f"%{query}%")
        ))

        result = await db.execute(stmt)
        return result.scalars().all()

    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/me", response_model=UserOut)
async def user_detail(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/{id}", response_model=UserOut)
async def get_user_by_id(id: int, db: AsyncSession = Depends(get_db)):

    stmt = select(User).where(User.id == id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.get("/admin", response_model=UserOut)
async def admin_detail(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.patch("/update", response_model=UserOut)
async def update_user(
    user: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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


@router.delete("/delete", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.execute(delete(User).where(User.id == user_id))
    await db.commit()