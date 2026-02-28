from pydantic import BaseModel, model_validator
from typing import Optional, List
from uuid import UUID
from datetime import datetime

# --- Requests ---

class WishlistToggleRequest(BaseModel):
    """Schema for toggling a like button"""
    sub_product_id: Optional[int] = None
    sub_service_id: Optional[int] = None

    @model_validator(mode='after')
    def check_exclusive_arc(self):
        if (self.sub_product_id is None and self.sub_service_id is None) or \
           (self.sub_product_id is not None and self.sub_service_id is not None):
            raise ValueError('Must provide exactly ONE of either sub_product_id or sub_service_id')
        return self

class WishlistSyncRequest(BaseModel):
    """Schema for syncing localStorage on login"""
    products: List[int] = []
    services: List[int] = []

# --- Responses ---

class WishlistItemResponse(BaseModel):
    id: int
    user_id: UUID
    sub_product_id: Optional[int]
    sub_service_id: Optional[int]
    created_at: datetime
    
    # You would typically include nested schemas here for the actual product/service data
    # sub_product: Optional[SubProductResponse] = None
    # sub_service: Optional[SubServiceResponse] = None

    class Config:
        from_attributes = True