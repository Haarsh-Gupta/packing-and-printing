from pydantic import BaseModel, Field, model_validator
from datetime import datetime
from typing import Optional
from uuid import UUID

class ReviewBase(BaseModel):
    rating : int = Field(... , ge = 1 , le = 5)
    comment : str = Field(... , min_length = 10)

class ReviewCreate(ReviewBase):
    user_id : UUID 
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

class ReviewResponse(ReviewBase):
    id : int
    user_id : UUID
    product_id : int
    service_id : int
    created_at : datetime
    is_verified : bool