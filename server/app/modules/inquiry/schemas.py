from datetime import datetime
from typing import Dict, Union, Optional, Literal , List
from pydantic import BaseModel, Field, model_validator


# --- User-facing Schemas ---

class InquiryCreate(BaseModel):
    """Schema for user creating a new inquiry"""
    template_id: int
    quantity: int = Field(..., gt=0, description="Must be greater than 0")
    selected_options: Dict[str, Union[str, int, float]]
    notes: Optional[str] = None


class InquiryUpdate(BaseModel):
    """Schema for user updating their pending inquiry"""
    quantity: Optional[int] = Field(None, gt=0)
    selected_options: Optional[Dict[str, Union[str, int, float]]] = None
    notes: Optional[str] = None

    @model_validator(mode="after")
    def at_least_one_field(self):
        if self.quantity is None and self.selected_options is None and self.notes is None:
            raise ValueError("At least one field must be provided")
        return self


# --- Admin-facing Schemas ---

class InquiryQuotation(BaseModel):
    """Schema for admin sending a quotation"""
    quoted_price: float = Field(..., gt=0, description="Price must be positive")
    admin_notes: Optional[str] = None
    valid_for_days: int = Field(7, gt=0, description="How many days is this price valid?")


class InquiryStatusUpdate(BaseModel):
    """Schema for updating inquiry status (user accepting/rejecting)"""
    status: Literal['ACCEPTED', 'REJECTED']


# --- Response Schemas ---

class InquiryResponse(BaseModel):
    """Response schema for inquiry data"""
    id: int
    user_id: int
    template_id: int
    quantity: int
    selected_options: Dict[str, Union[str, int, float]]
    notes: Optional[str]
    status: str
    images : Optional[List[str]] = None
    quoted_price: Optional[float]
    admin_notes: Optional[str]
    quoted_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InquiryListResponse(BaseModel):
    """Response schema for listing inquiries"""
    id: int
    template_id: int
    quantity: int
    status: str
    images : Optional[List[str]] = None
    quoted_price: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True
