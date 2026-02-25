import asyncio
from passlib.context import CryptContext
from .schemas import TokenData
from jose import JWTError , jwt
from datetime import datetime , timedelta , timezone
from fastapi import HTTPException , Depends , status, Request
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..users.models import User
from app.core.database import get_db
from app.core.config import settings
import secrets, string

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

SECRET_KEY = settings.secret_key
ALGORITHM = settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes
REFRESH_TOKEN_EXPIRE_DAYS = settings.refresh_token_expire_days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def get_password_hash(password: str):
    return await asyncio.to_thread(pwd_context.hash , password)
   

async def verify_password(plain_password: str , hashed_password: str):
    return await asyncio.to_thread(pwd_context.verify , plain_password , hashed_password)

async def generate_otp():
    return "".join(secrets.choice(string.digits) for _ in range(6))


async def create_access_token(data : dict):
    payload = TokenData(**data) 
    to_encode = payload.model_dump(mode="json")
    expire = datetime.now(timezone.utc) + timedelta(minutes = ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp" : expire , "type" : "access_token"})
    encoded_jwt = jwt.encode(to_encode , SECRET_KEY , algorithm = ALGORITHM)
    return encoded_jwt

async def create_refresh_token(data : dict):
    payload = TokenData(**data)
    to_encode = payload.model_dump(mode="json")
    expire = datetime.now(timezone.utc) + timedelta(days = REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp" : expire , "type" : "refresh_token"})
    encoded_jwt = jwt.encode(to_encode , SECRET_KEY , algorithm = ALGORITHM)
    return encoded_jwt

async def verify_token(token : str, credintials_exception : HTTPException) -> TokenData:
    try:
        payload = jwt.decode(token , SECRET_KEY , algorithms = [ALGORITHM])
        token_data = TokenData(**payload)
    except JWTError:
        raise credintials_exception
    return token_data

async def get_current_user(request: Request, token : str = Depends(oauth2_scheme)) -> TokenData:
    credintials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED , 
        detail="Could not validate credentials" ,
        headers={"WWW-Authenticate" : "Bearer"} 
    )
    
    # If token is not in header or is string "undefined"/"null", check cookies
    if not token or token in ["undefined", "null"]:
        token = request.cookies.get("access_token")
        
    if not token:
        raise credintials_exception

    token_data = await verify_token(token , credintials_exception) 
    return token_data


async def get_current_admin_user(current_user: TokenData = Depends(get_current_user) , db : AsyncSession = Depends(get_db)) -> User:
    if current_user.admin == False:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="The user is not an admin")

    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Invalid user")

    if user.admin == False:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="The user is not an admin")

    if user.token_version != current_user.token_version:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Invalid user")

    return user
