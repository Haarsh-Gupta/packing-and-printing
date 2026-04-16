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

def valid_phone(phone):
    # Support E.164 format (+ followed by 10-15 digits) or standard 10 digits
    if phone.startswith('+'):
        if not phone[1:].isdigit() or len(phone) < 11 or len(phone) > 16:
            raise ValueError("International phone number must start with '+' followed by 10 to 15 digits")
    else:
        if not phone.isdigit() or len(phone) != 10:
            raise ValueError("Local phone number must be 10 digits")
    return phone

class PhoneOTPRequest(BaseModel):
    phone: str

    @field_validator("phone")
    def validate_phone(cls, v):
        return valid_phone(v)

class PhoneOTPVerifyRequest(BaseModel):
    phone: str
    otp: str = Field(min_length=6, max_length=6)

    @field_validator("phone")
    def validate_phone(cls, v):
        return valid_phone(v)
 

class UserBase(BaseModel):
    name: str
    email: EmailStr
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(min_length = 6)
    profile_picture: Optional[str] = None
    phone: Optional[str] = None
    otp: str = Field(min_length=6, max_length=6)

    @model_validator(mode="after")
    def is_all_none(self):
        if self.name is None and self.phone is None and self.password is None and self.profile_picture is None:
            raise ValueError("At least one field must be provided")

        if self.password:
            valid_password(self.password)
        
        if self.phone:
            valid_phone(self.phone)
            
        return self

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    profile_picture: Optional[str] = None
    gstin: Optional[str] = None

    @model_validator(mode="after")
    def is_all_none(self):
        if self.name is None and self.phone is None and self.password is None and self.profile_picture is None and self.gstin is None:
            raise ValueError("At least one field must be provided")

        if self.password:
            valid_password(self.password)
        
        if self.phone:
            valid_phone(self.phone)
            
        return self
    
    class Config:
        from_attributes = True

class UserOut(UserBase):
    id: UUID
    admin: bool = False
    phone : Optional[str] = None
    gstin: Optional[str] = None
    profile_picture: Optional[str] = None
    created_at: datetime
    is_online: bool = False

    class Config:
        from_attributes = True



# address 

from enum import Enum as PyEnum, IntEnum

class StateEnum(str, PyEnum):
    JAMMU_AND_KASHMIR = "JAMMU AND KASHMIR"
    HIMACHAL_PRADESH = "HIMACHAL PRADESH"
    PUNJAB = "PUNJAB"
    CHANDIGARH = "CHANDIGARH"
    UTTARAKHAND = "UTTARAKHAND"
    HARYANA = "HARYANA"
    DELHI = "DELHI"
    RAJASTHAN = "RAJASTHAN"
    UTTAR_PRADESH = "UTTAR PRADESH"
    BIHAR = "BIHAR"
    SIKKIM = "SIKKIM"
    ARUNACHAL_PRADESH = "ARUNACHAL PRADESH"
    NAGALAND = "NAGALAND"
    MANIPUR = "MANIPUR"
    MIZORAM = "MIZORAM"
    TRIPURA = "TRIPURA"
    MEGHALAYA = "MEGHALAYA"
    ASSAM = "ASSAM"
    WEST_BENGAL = "WEST BENGAL"
    JHARKHAND = "JHARKHAND"
    ODISHA = "ODISHA"
    CHHATTISGARH = "CHHATTISGARH"
    MADHYA_PRADESH = "MADHYA PRADESH"
    GUJARAT = "GUJARAT"
    DADRA_AND_NAGAR_HAVELI_AND_DAMAN_AND_DIU = "DADRA AND NAGAR HAVELI AND DAMAN AND DIU"
    MAHARASHTRA = "MAHARASHTRA"
    KARNATAKA = "KARNATAKA"
    GOA = "GOA"
    LAKSHADWEEP = "LAKSHADWEEP"
    KERALA = "KERALA"
    TAMIL_NADU = "TAMIL NADU"
    PUDUCHERRY = "PUDUCHERRY"
    ANDAMAN_AND_NICOBAR_ISLANDS = "ANDAMAN AND NICOBAR ISLANDS"
    TELANGANA = "TELANGANA"
    ANDHRA_PRADESH = "ANDHRA PRADESH"
    OTHER_TERRITORY = "OTHER TERRITORY"
    OTHER_COUNTRY = "OTHER COUNTRY"



class StateCodeEnum(IntEnum):
    JAMMU_AND_KASHMIR = 1
    HIMACHAL_PRADESH = 2
    PUNJAB = 3
    CHANDIGARH = 4
    UTTARAKHAND = 5
    HARYANA = 6
    DELHI = 7
    RAJASTHAN = 8
    UTTAR_PRADESH = 9
    BIHAR = 10
    SIKKIM = 11
    ARUNACHAL_PRADESH = 12
    NAGALAND = 13
    MANIPUR = 14
    MIZORAM = 15
    TRIPURA = 16
    MEGHALAYA = 17
    ASSAM = 18
    WEST_BENGAL = 19
    JHARKHAND = 20
    ODISHA = 21
    CHHATTISGARH = 22
    MADHYA_PRADESH = 23
    GUJARAT = 24
    DADRA_AND_NAGAR_HAVELI_AND_DAMAN_AND_DIU = 25
    MAHARASHTRA = 27
    KARNATAKA = 29
    GOA = 30
    LAKSHADWEEP = 31
    KERALA = 32
    TAMIL_NADU = 33
    PUDUCHERRY = 34
    ANDAMAN_AND_NICOBAR_ISLANDS = 35
    TELANGANA = 36
    ANDHRA_PRADESH = 37
    OTHER_COUNTRY = 96
    OTHER_TERRITORY = 97



STATE_TO_CODE = {
    StateEnum[state.name]: StateCodeEnum[state.name]
    for state in StateEnum
}

CODE_TO_STATE = {
    StateCodeEnum[state.name]: StateEnum[state.name]
    for state in StateEnum
}


# ── Address Schemas ──────────────────────────────────────────────

from typing import List

class PhoneOTPRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)

class PhoneOTPVerifyRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)
    otp: str = Field(..., min_length=6, max_length=6)

class AddressCreate(BaseModel):
    address_type: str = Field(..., description="BILLING or SHIPPING")
    address_line_1: str = Field(..., min_length=1, max_length=200)
    address_line_2: Optional[str] = Field(None, max_length=200)
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100, description="Must be a valid Indian state from StateEnum")
    pincode: str = Field(..., min_length=6, max_length=6)

    @field_validator("address_type")
    def validate_address_type(cls, v):
        if v.upper() not in ("BILLING", "SHIPPING"):
            raise ValueError("address_type must be BILLING or SHIPPING")
        return v.upper()

    @field_validator("pincode")
    def validate_pincode(cls, v):
        if not v.isdigit():
            raise ValueError("Pincode must be 6 digits")
        return v


class AddressUpdate(BaseModel):
    address_type: Optional[str] = None
    address_line_1: Optional[str] = Field(None, max_length=200)
    address_line_2: Optional[str] = Field(None, max_length=200)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    pincode: Optional[str] = Field(None, min_length=6, max_length=6)


class AddressResponse(BaseModel):
    id: UUID
    user_id: UUID
    address_type: str
    address_line_1: str
    address_line_2: Optional[str] = None
    city: str
    state: str
    pincode: str

    class Config:
        from_attributes = True