from pydantic import BaseModel , EmailStr

class OtpSend(BaseModel):
    email : EmailStr
    
class OtpVerify(BaseModel):
    email : EmailStr
    otp : str