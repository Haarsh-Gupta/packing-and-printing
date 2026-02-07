from fastapi import APIRouter , Depends , HTTPException , status
from fastapi.security import OAuth2PasswordRequestForm 
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select 
from .auth import verify_password, create_access_token
from .schemas import TokenData, Token
from ..users.models import User
from app.core.database import get_db

router = APIRouter()


@router.post("/login")
async def login(db : AsyncSession = Depends(get_db), form_data : OAuth2PasswordRequestForm = Depends()):
    username = form_data.username
    password = form_data.password
    result = await db.execute(select(User).where(User.email == username))
    user = result.scalar_one_or_none() 

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Incorrect email or password")
    if not await verify_password(password , user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Incorrect email or password")
    
    payload = TokenData(id=user.id, email=user.email, admin=user.admin)
    
    access_token = await create_access_token(data = payload.model_dump())

    return Token(access_token = access_token, token_type="bearer")

