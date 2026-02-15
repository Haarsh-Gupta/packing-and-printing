from app.modules.auth import get_current_user
from fastapi import APIRouter , Depends, status, HTTPException
from fastapi.requests import Request
from fastapi.responses import Response
from fastapi.security import OAuth2PasswordRequestForm 
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select 
from .auth import verify_password, create_access_token , create_refresh_token, verify_token
from .schemas import TokenData, Token
from ..users.models import User
from app.core.database import get_db
from app.core.config import settings
from app.core.oauth import oauth
from authlib.integrations.base_client import OAuthError

REFRESH_TOKEN_EXPIRE_DAYS = settings.refresh_token_expire_days

router = APIRouter()


@router.post("/login")
async def login(response : Response , db : AsyncSession = Depends(get_db), form_data : OAuth2PasswordRequestForm = Depends()):
    username = form_data.username
    password = form_data.password

    result = await db.execute(select(User).where(User.email == username))
    user = result.scalar_one_or_none() 

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Incorrect email or password")

    if not await verify_password(password , user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED , detail="Incorrect email or password")
    
    payload = TokenData(id=user.id, email=user.email, admin=user.admin, token_version=user.token_version)
    
    #create the access token
    access_token = await create_access_token(data = payload.model_dump())
    
    #create the refresh token
    refresh_token = await create_refresh_token(data = payload.model_dump())

    #setting the refresh token in cookies 
    response.set_cookie(
        key = "refresh_token",
        value = refresh_token,
        httponly = True,
        secure = True,
        samesite = "lax",
        max_age = REFRESH_TOKEN_EXPIRE_DAYS*24*60*60
    )

    return Token(access_token = access_token)

@router.post("/refresh")
async def refresh(response: Response, request: Request, db : AsyncSession = Depends(get_db)):
    #get the refresh token from cookies
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token not found")

    #validate the refresh token and check user in db
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # 3. FIX: Use 'verify_token' directly and AWAIT it
    # We use verify_token instead of get_current_user because we are 
    # explicitly handing it the string from the cookie.
    token_data = await verify_token(refresh_token, credentials_exception)

    result = await db.execute(select(User).where(User.id == token_data.id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    if user.token_version != token_data.token_version:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    #create the access token
    new_payload = TokenData(id=user.id, email=user.email, admin=user.admin)
    access_token = await create_access_token(data = new_payload.model_dump())

    return Token(access_token = access_token)


@router.post("/logout")
async def logout(response: Response, db : AsyncSession = Depends(get_db), current_user : TokenData = Depends(get_current_user)):

    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")


    user.token_version += 1
    await db.commit()

    response.delete_cookie("refresh_token")
    return {"message" : "Logged out successfully"}


@router.get("/google/login")
async def google_login(request: Request):

    redirect_uri = request.url_for("google_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback", name = "auth_google_callback")
async def google_callback(request: Request, db : AsyncSession = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google authentication failed")


    user_info = token.get("userinfo")

    if not user_info:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google authentication failed")

    email = user_info.get("email")
    name = user_info.get("name")
    picture = user_info.get("picture")

    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google authentication failed")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            email=email,
            name=name,
            picture=picture,
            admin=False
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    payload = TokenData(id=user.id, email=user.email, admin=user.admin, token_version=user.token_version)
    access_token = await create_access_token(data = payload.model_dump())
    refresh_token = await create_refresh_token(data = payload.model_dump())

    #TODO: redirect to the frontend 
    #frontend_url = "http://localhost:3000/dashboard"
    # response = RedirectResponse(url=frontend_url)

    response.set_cookie(
        key = "refresh_token",
        value = refresh_token,
        httponly = True,
        secure = True,
        samesite = "lax",
        max_age = REFRESH_TOKEN_EXPIRE_DAYS*24*60*60
    )

    return response
    

# ==================== FORGOT PASSWORD ====================

from .schemas import ForgotPasswordRequest, ResetPasswordRequest
from .auth import get_password_hash
from app.modules.otps.service import get_otp_service

_otp_service = get_otp_service()


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Send a password-reset OTP to the user's email.
    Always returns 200 to avoid leaking whether the email exists.
    """
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if user:
        await _otp_service.send_password_reset_otp(
            email=user.email,
            user_name=user.name,
        )

    return {"message": "If the email exists, a password reset code has been sent."}


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Verify the reset OTP and update the password.
    Bumps token_version to invalidate all existing sessions.
    """
    valid = await _otp_service.verify_password_reset_otp(
        email=payload.email,
        otp=payload.otp,
    )

    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP.",
        )

    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    user.password = await get_password_hash(payload.new_password)
    user.token_version += 1  # invalidate all existing tokens
    await db.commit()

    return {"message": "Password reset successfully. Please log in with your new password."}
