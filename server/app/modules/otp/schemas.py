from pydantic import BaseModel, EmailStr


class OTPVerifyRequest(BaseModel):
    """Schema for verifying OTP"""
    email: EmailStr
    otp: str


class OTPResendRequest(BaseModel):
    """Schema for requesting a new OTP"""
    email: EmailStr


class OTPResponse(BaseModel):
    """Response after OTP action"""
    message: str
    email: str
