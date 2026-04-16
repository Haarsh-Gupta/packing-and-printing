from pydantic import BaseModel, EmailStr

class OtpSend(BaseModel):
    email: EmailStr

class OtpVerify(BaseModel):
    email: EmailStr
    otp: str

class PhoneOtpSend(BaseModel):
    phone: str

class PhoneOtpVerify(BaseModel):
    phone: str
    otp: str