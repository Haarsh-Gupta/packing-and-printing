from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, or_

from .schemas import UserCreate, UserOut, UserUpdate
from .models import User
from ...db.database import get_db
from ..auth import get_password_hash
from ..auth import get_current_user, get_current_active_user

router = APIRouter()

@router.post("/register" , response_model = UserOut , status_code = status.HTTP_201_CREATED)
async def create_user(user : UserCreate , db : AsyncSession = Depends(get_db)):

    db_user = await db.execute(User).filter(User.email == user.email).first()

    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST , 
        detail=f"User with email {user.email} already exists")

    current_user = user.model_dump()
    current_user["password"] = get_password_hash(current_user["password"])
    user = User(**current_user)

    await db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
    

@router.get("/all" , response_model=list[UserOut])
async def get_all_users(query : str, db : AsyncSession = Depends(get_db) , current_user : User = Depends(get_current_active_user)):
    if query:
        return await db.query(User).filter(User.name.contain(query)| User.email.contain(query) | User.phone.contain(query)).all()
    return await db.query(User).all()


@router.get("/{id}" , response_model=UserOut)
async def get_user_by_id(id : int , db : AsyncSession = Depends(get_db)):
    return await db.query(User).filter(User.id == id).first()


@router.get("/me" , response_model=UserOut)
async def user_detail(current_user : User = Depends(get_current_user)):
    return current_user


@router.get("/admin" , response_model=UserOut)
async def admin_detail(current_user : User = Depends(get_current_active_user)):
    return current_user


@router.patch("/update" , response_model=UserOut)
async def update_user(user : UserUpdate , db : AsyncSession = Depends(get_db), current_user : User = Depends(get_current_user) , file : UploadFile = None):
    data = user.model_dump()

    if data["password"]:
        data["password"] = get_password_hash(data["password"])
    
    await db.query(User).filter(User.id == current_user.id).update(data)
    await db.commit()
    return await db.query(User).filter(User.id == current_user.id).first()


@router.delete("/delete" , status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id : int , db : AsyncSession = Depends(get_db) , current_user : User = Depends(get_current_active_user)):

    query = db.query(User).filter(User.id == user_id)
    
    if not await query.first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND , detail="User not found")
    
    await query.delete()
    await db.commit()
    return

