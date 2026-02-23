from uuid import UUID
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str 
    token_type: str = "Bearer"

class TokenData(BaseModel):
    id: UUID
    email: EmailStr
    admin : bool
    token_version : int = 1

    class Config:
        extra = "ignore"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

