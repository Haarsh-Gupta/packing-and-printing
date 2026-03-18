from pydantic import BaseModel, Field, model_validator
from datetime import datetime
from typing import Optional, List
from uuid import UUID

class ReviewBase(BaseModel):
    rating : int = Field(... , ge = 1 , le = 5)
    comment : str = Field(... , min_length = 10)

class ReviewCreate(ReviewBase):
    user_id : Optional[UUID] = None
    product_id : Optional[int] = None
    service_id : Optional[int] = None
    created_at : datetime = Field(default_factory=datetime.now)
    is_verified : bool = Field(default = False)

    @model_validator(mode="after")
    def valid_product_or_service(self):
        if self.product_id is None and self.service_id is None:
            raise ValueError("Either product_id or service_id must be provided")
        if self.product_id is not None and self.service_id is not None:
            raise ValueError("Only one of product_id or service_id can be provided")
        return self

class ReviewUpdate(ReviewBase):
    update_at : datetime = Field(default_factory=datetime.now)

class ReviewUserResponse(BaseModel):
    name: str
    profile_picture: Optional[str] = None

    class Config:
        from_attributes = True


class ReviewProductResponse(BaseModel):
    id: int
    name: str
    product_id: int

    class Config:
        from_attributes = True


class ReviewServiceResponse(BaseModel):
    id: int
    name: str
    service_id: int

    class Config:
        from_attributes = True

class ReviewResponse(ReviewBase):
    id : int
    user_id : UUID
    product_id : Optional[int] = None
    service_id : Optional[int] = None
    created_at : datetime
    is_verified : bool
    user: Optional[ReviewUserResponse] = None
    product: Optional[ReviewProductResponse] = None
    service: Optional[ReviewServiceResponse] = None

    class Config:
        from_attributes = True


class ReviewListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    reviews: List[ReviewResponse]