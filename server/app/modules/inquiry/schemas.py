from datetime import datetime
from typing import Dict, Union, Optional, List, Literal
from uuid import UUID
from enum import Enum as PyEnum
from pydantic import BaseModel, Field, model_validator, ConfigDict, computed_field


class InquiryStatus(str, PyEnum):
    DRAFT        = "DRAFT"
    SUBMITTED    = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    NEGOTIATING  = "NEGOTIATING"
    QUOTED       = "QUOTED"
    ACCEPTED     = "ACCEPTED"
    REJECTED     = "REJECTED"
    CANCELLED    = "CANCELLED"
    EXPIRED      = "EXPIRED"


USER_ALLOWED_TRANSITIONS = {
    InquiryStatus.DRAFT:        [InquiryStatus.SUBMITTED, InquiryStatus.CANCELLED],
    InquiryStatus.SUBMITTED:    [InquiryStatus.DRAFT, InquiryStatus.CANCELLED],
    InquiryStatus.UNDER_REVIEW: [InquiryStatus.CANCELLED],
    InquiryStatus.NEGOTIATING:  [InquiryStatus.CANCELLED],
    InquiryStatus.QUOTED:       [InquiryStatus.ACCEPTED, InquiryStatus.REJECTED, InquiryStatus.CANCELLED],
    InquiryStatus.ACCEPTED:     [InquiryStatus.CANCELLED],
    InquiryStatus.REJECTED:     [],
    InquiryStatus.CANCELLED:    [],
    InquiryStatus.EXPIRED:      [],
}

ADMIN_ALLOWED_TRANSITIONS = {
    InquiryStatus.SUBMITTED:    [InquiryStatus.UNDER_REVIEW, InquiryStatus.REJECTED, InquiryStatus.CANCELLED],
    InquiryStatus.UNDER_REVIEW: [InquiryStatus.NEGOTIATING, InquiryStatus.REJECTED, InquiryStatus.CANCELLED],
    InquiryStatus.NEGOTIATING:  [InquiryStatus.REJECTED, InquiryStatus.CANCELLED],
    InquiryStatus.QUOTED:       [InquiryStatus.NEGOTIATING, InquiryStatus.CANCELLED, InquiryStatus.EXPIRED],
    InquiryStatus.EXPIRED:      [InquiryStatus.NEGOTIATING, InquiryStatus.CANCELLED],
    InquiryStatus.ACCEPTED:     [InquiryStatus.CANCELLED],
    InquiryStatus.REJECTED:     [InquiryStatus.NEGOTIATING],
    InquiryStatus.CANCELLED:    [InquiryStatus.NEGOTIATING],
}


class ProposedMilestone(BaseModel):
    label:       str   = Field(..., min_length=2, max_length=80)
    percentage:  float = Field(..., gt=0, le=100)
    description: Optional[str] = Field(None, max_length=200)
    trigger:     Optional[str] = None
    due_date:    Optional[datetime] = None
    


class QuoteLineItemCreate(BaseModel):
    item_id: str = Field(..., description="The UUID of the InquiryItem")
    line_item_price: float = Field(..., description="The original base price before discount")
    discount_type: Optional[Literal["percentage", "amount"]] = None
    discount_value: float = Field(default=0.0, description="The raw input, e.g., 5% or ₹200")
    discount_amount: float = Field(default=0.0, description="The computed ₹ value of the discount")
    taxable_value: float = Field(..., description="line_item_price - discount_amount")
    gst_amount: float = Field(..., description="Tax calculated on the taxable_value")

    @model_validator(mode="after")
    def validate_line_item_pricing(self):
        eps = 0.01
        
        if self.discount_type and self.discount_type not in ["percentage", "amount"]:
            raise ValueError("discount_type must be 'percentage' or 'amount'")
            
        if self.discount_type == "percentage":
            if not (0 <= self.discount_value <= 100):
                raise ValueError("discount_value must be between 0 and 100 for percentage discount")
            if abs(self.discount_amount - (self.line_item_price * self.discount_value / 100.0)) > eps:
                raise ValueError("discount_amount must be equal to line_item_price * discount_value / 100")
        elif self.discount_type == "amount":
            if self.discount_value < 0:
                raise ValueError("discount_value must be non-negative for amount discount")
            if abs(self.discount_amount - self.discount_value) > eps:
                raise ValueError("discount_amount must be equal to discount_value for amount discount")
        else:
            if self.discount_value < 0:
                raise ValueError("discount_value must be non-negative")
                
        if abs(self.taxable_value - (self.line_item_price - self.discount_amount)) > eps:
            raise ValueError("taxable_value must be equal to line_item_price - discount_amount")
            
        if self.discount_amount > self.line_item_price + eps:
            raise ValueError("discount_amount cannot be greater than line_item_price")
            
        if self.gst_amount > self.taxable_value + eps:
            raise ValueError("gst_amount cannot be greater than taxable_value")
            
        return self


class QuoteVersionCreate(BaseModel):
    total_price:     float = Field(..., gt=0)
    tax_amount:      float = Field(0.0, ge=0)
    shipping_amount: float = Field(0.0, ge=0)
    discount_amount: float = Field(0.0, ge=0)
    valid_days:      int   = Field(7, gt=0, le=90)
    admin_notes:     Optional[str] = Field(None, max_length=2000)
    milestones:      List[ProposedMilestone] = Field(default_factory=lambda: [
        ProposedMilestone(label="Advance payment", percentage=50, description="Due on order confirmation"),
        ProposedMilestone(label="Balance before dispatch", percentage=50, description="Due before dispatch"),
    ])
    line_items:      Optional[List[QuoteLineItemCreate]] = None

    @model_validator(mode="after")
    def validate_milestones(self):
        total = sum(m.percentage for m in self.milestones)
        if abs(total - 100.0) > 0.01:
            raise ValueError(f"Milestone percentages must sum to 100. Got {total:.2f}.")
        if not (1 <= len(self.milestones) <= 5):
            raise ValueError("Must define between 1 and 5 milestones.")
        labels = [m.label.strip().lower() for m in self.milestones]
        if len(labels) != len(set(labels)):
            raise ValueError("Each milestone must have a unique label.")
        return self


class QuoteVersionResponse(BaseModel):
    id: UUID; display_id: Optional[str] = None; inquiry_id: UUID; version: int; status: str
    total_price: float
    tax_amount: Optional[float] = 0.0
    shipping_amount: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    valid_until: datetime; admin_notes: Optional[str]
    milestones: List[Dict]; line_items: Optional[List[Dict]]
    created_by: UUID; created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class InquiryItemBase(BaseModel):
    product_id: Optional[int] = None; subproduct_id: Optional[int] = None
    service_id: Optional[int] = None; subservice_id: Optional[int] = None
    quantity: Optional[int] = Field(None, gt=0)
    selected_options: Optional[Dict[str, Union[str, int, float, bool, List[str], None]]] = None
    notes: Optional[str] = None; images: Optional[List[str]] = None

    @model_validator(mode="after")
    def check_product_or_service(self):
        has_product = self.product_id is not None
        has_service = self.service_id is not None
        if not has_product and not has_service:
            raise ValueError("Either product_id or service_id must be provided")
        if has_product and has_service:
            raise ValueError("Cannot provide both product_id and service_id — choose one")
        if has_service and self.subservice_id is None:
            raise ValueError(f"subservice_id is required for service_id {self.service_id}")
        if has_product and self.subproduct_id is None:
            raise ValueError(f"subproduct_id is required for product_id {self.product_id}")
        return self


class InquiryItemCreate(InquiryItemBase): pass

class InquiryItemUpdate(BaseModel):
    quantity: Optional[int] = Field(None, gt=0)
    selected_options: Optional[Dict[str, Union[str, int, float, bool, List[str], None]]] = None
    notes: Optional[str] = None; images: Optional[List[str]] = None

class InquiryGroupCreate(BaseModel):
    items: List[InquiryItemCreate] = Field(..., min_length=1)

class InquiryStatusUpdate(BaseModel):
    status: InquiryStatus
    reason: Optional[str] = None
    billing_address_id: Optional[UUID] = None
    shipping_address_id: Optional[UUID] = None

class InquiryMessageCreate(BaseModel):
    content: str; file_urls: Optional[List[str]] = None

class AdminPricingCalculatorRequest(BaseModel):
    is_service: bool = False; base_price: float = 0.0
    quantity: int = Field(1, gt=0); config_schema: Optional[Dict] = None
    selected_options: Optional[Dict] = None

class InquiryMessageResponse(BaseModel):
    id: int; inquiry_group_id: UUID; sender_id: UUID
    content: str; file_urls: Optional[List[str]] = None; created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class InquiryItemResponse(InquiryItemBase):
    id: UUID; inquiry_group_id: Optional[UUID] = None; quantity: int
    line_item_price: Optional[float] = None; estimated_price: float = 0.0
    product_name: Optional[str] = None; subproduct_name: Optional[str] = None
    service_name: Optional[str] = None; subservice_name: Optional[str] = None
    display_images: List[str] = []
    
    # Tax & HSN properties mapped from models
    gst_rate: float = 0.0
    hsn_code: Optional[str] = None

    @computed_field
    @property
    def total_estimated_price(self) -> float:
        return (self.quantity * self.estimated_price) if self.estimated_price else 0.0
        
    @computed_field
    @property
    def computed_tax_amount(self) -> float:
        return self.total_estimated_price * (self.gst_rate / 100.0)
    model_config = ConfigDict(from_attributes=True)

class InquiryGroupResponse(BaseModel):
    id: UUID; display_id: Optional[str] = None; user_id: UUID; status: InquiryStatus
    active_quote_id: Optional[UUID] = None; active_quote: Optional[QuoteVersionResponse] = None
    quote_email_status: Optional[str] = None
    admin_notes: Optional[str] = None
    quote_versions: List[QuoteVersionResponse] = []
    created_at: datetime; updated_at: datetime
    items: List[InquiryItemResponse] = []; messages: List[InquiryMessageResponse] = []
    model_config = ConfigDict(from_attributes=True)

class InquiryGroupListResponse(BaseModel):
    id: UUID; display_id: Optional[str] = None; user_id: UUID; status: InquiryStatus
    active_quote_id: Optional[UUID] = None; total_price: Optional[float] = None
    quote_email_status: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: datetime; item_count: int = 0
    items: List[InquiryItemResponse] = []
    model_config = ConfigDict(from_attributes=True)