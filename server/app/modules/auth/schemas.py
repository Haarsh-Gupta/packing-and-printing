from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str = "Bearer"
    token_type: str

class TokenData(BaseModel):
    id: int
    email: EmailStr
    admin : bool
