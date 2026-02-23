from pydantic import BaseModel , EmailStr, model_validator , field_validator, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

def valid_password(password):
        """ Must have the captial , small letter , number """
        upper , lower , num = False , False , False

        for char in password:
            if char.isupper():
                upper = True
            elif char.islower():
                lower = True
            elif char.isdigit():
                num = True

        if not (upper and lower and num):
            raise ValueError("Password must contain at least one uppercase letter, one lowercase letter, and one number")
 

class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(min_length = 6)
    profile_picture: Optional[str] = None
    otp: int = Field(ge=100000, le=999999)

    @field_validator("password")
    def check_password(cls , value):
        valid_password(value)
        return value

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    profile_picture: Optional[str] = None


    @field_validator("password")
    def check_password(cls , value):
        if value:
            valid_password(value)
        return value

    @model_validator(mode="after")
    def is_all_none(self):
        if self.name is None and self.phone is None and self.password is None and self.profile_picture is None:
            raise ValueError("At least one field must be provided")
        return self
    
    class Config:
        from_attributes = True

class UserOut(UserBase):
    id: UUID
    admin: bool = False
    phone : Optional[str] = None
    profile_picture: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True