from pydantic import BaseModel , Field

class ReviewBase(BaseModel):
    rating : int = Field(... , ge = 1 , le = 5)
    comment : str = Field(... , min_length = 10)

class ReviewCreate(ReviewBase):
    user_id : int 
    product_id : int
    created_at : datetime = Field(default_factory=datetime.now)
    is_verified : bool = Field(default = False)

class ReviewUpdate(ReviewBase):
    update_at : datetime = Field(default_factory=datetime.now)

class ReviewResponse(ReviewBase):
    id : int
    user_id : int
    product_id : int
    created_at : datetime
    is_verified : bool