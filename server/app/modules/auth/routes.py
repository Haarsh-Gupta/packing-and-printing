from fastapi import APIRouter , Depends , HTTPException , status
from fastapi.security import OAuth2PasswordRequestForm 
from sqlalchemy.ext.asyncio import AsyncSession
from .auth import verify_password, create_access_token
from .schemas import TokenData, Token
from ..users.models import User
from ...db.database import get_db

router = APIRouter()


@router.post("/login")
async def login(db : AsyncSession = Depends(get_db), form_data : OAuth2PasswordRequestForm = Depends()):
    username = form_data.username
    password = form_data.password
    user = await db.query(User).filter(User.email == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Incorrect email or password")
    if not await verify_password(password , user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Incorrect email or password")
    
    payload = TokenData(id=user.id, email=user.email, admin=user.admin)
    
    access_token = await create_access_token(data = payload.model_dump())

    return Token(access_token = access_token, token_type="bearer")

