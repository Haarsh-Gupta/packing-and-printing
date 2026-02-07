import asyncio
from passlib.context import CryptContext
from .schemas import TokenData
from jose import JWTError , jwt
from datetime import datetime , timedelta , timezone
from fastapi import HTTPException , Depends , status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from ..users.models import User
from app.core.database import get_db
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

SECRET_KEY = settings.secret_key
ALGORITHM = settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def get_password_hash(password: str):
    return await asyncio.to_thread(pwd_context.hash , password)
   

async def verify_password(plain_password: str , hashed_password: str):
    return await asyncio.to_thread(pwd_context.verify , plain_password , hashed_password)


async def create_access_token(data : dict):
    payload = TokenData(**data) 
    to_encode = payload.model_dump()
    expire = datetime.now(timezone.utc) + timedelta(minutes = ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp" : expire})
    encoded_jwt = jwt.encode(to_encode , SECRET_KEY , algorithm = ALGORITHM)
    return encoded_jwt

async def verify_token(token : str, credintials_exception : HTTPException):
    try:
        payload = jwt.decode(token , SECRET_KEY , algorithms = [ALGORITHM])
        token_data = TokenData(**payload)
    except JWTError:
        raise credintials_exception
    return token_data


async def get_current_user(token : str = Depends(oauth2_scheme), db : AsyncSession = Depends(get_db)):
    credintials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED , 
        detail="Could not validate credentials" ,
        headers={"WWW-Authenticate" : "Bearer"} 
    )
    token_data = await verify_token(token , credintials_exception) 
    user = await db.get(User, token_data.id)
    if not user:
        raise credintials_exception
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.admin:
        raise HTTPException(status_code=400, detail="The user is not an admin")
    return current_user

