import asyncio
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, or_

from .schemas import UserCreate, UserOut, UserUpdate
from .models import User
from ...db.database import get_db
from ..auth import get_password_hash
from ..auth import get_current_user, get_current_active_user

router = APIRouter()

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):

    stmt = select(User).where(User.email == user.email)
    result = await db.execute(stmt)
    db_user = result.scalar_one_or_none()

    if db_user:
        raise HTTPException(status_code=400, detail="User already exists")

    data = user.model_dump()
    data["password"] = await get_password_hash(data["password"])

    new_user = User(**data)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user

@router.get("/all" , response_model=list[UserOut])
async def get_all_users(query : Optional[str] = None, db : AsyncSession = Depends(get_db) , current_user : User = Depends(get_current_active_user)):
    
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


@router.get("/me" , response_model=UserOut)
async def user_detail(current_user : User = Depends(get_current_user)):
    return current_user


@router.get("/{id}" , response_model=UserOut)
async def get_user_by_id(id : int , db : AsyncSession = Depends(get_db)):

    stmt = select(User).where(User.id == id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND , detail="User not found")
    return user


@router.get("/admin" , response_model=UserOut)
async def admin_detail(current_user : User = Depends(get_current_active_user)):
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