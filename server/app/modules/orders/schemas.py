from datetime import datetime
from typing import Optional, Literal, List
from pydantic import BaseModel, Field
from enum import Enum
from 
# ==================== Transaction Schemas ====================

class PaymentMode(str, Enum):
    CASH = "CASH"
    UPI = "UPI"
    CARD = "CARD"
    BANK_TRANSFER = "BANK_TRANSFER"
    CHEQUE = "CHEQUE"
    ONLINE = "ONLINE"

class TransactionCreate(BaseModel):
    """Schema for creating a transaction/payment"""
    amount: float = Field(..., gt=0, description="Payment amount must be positive")
    payment_mode: PaymentMode
    notes: Optional[str] = None


class TransactionResponse(BaseModel):
    """Response schema for transaction data"""
    id: int
    order_id: int
    amount: float
    payment_mode: PaymentMode
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== Order Schemas ====================

class Status(str, Enum):
    WAITING_PAYMENT = "WAITING_PAYMENT"
    PARTIALLY_PAID = "PARTIALLY_PAID"
    PAID = "PAID"
    PROCESSING = "PROCESSING"
    READY = "READY"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class OrderCreate(BaseModel):
    """Schema for creating an order from an accepted inquiry"""
    inquiry_id: int


class OrderUpdate(BaseModel):
    """Schema for updating order status"""
    status: Status


class OrderResponse(BaseModel):
    """Response schema for order data"""
    id: int
    inquiry_id: int
    user_id: int
    total_amount: float
    amount_paid: float
    status: Status
    created_at: datetime
    updated_at: datetime
    
    # Include transactions if needed
    transactions: Optional[List[TransactionResponse]] = []

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    """Simplified response for listing orders"""
    id: int
    inquiry_id: int
    user_id: int
    total_amount: float
    amount_paid: float
    status: Status
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== Invoice/Quotation Schemas ====================

class InvoiceData(BaseModel):
    """Data required for generating an invoice"""
    order_id: int
    company_name: str = "Your Company Name"
    company_address: str = "Your Address"
    company_phone: str = "Your Phone"
    company_email: str = "your@email.com"
    company_gstin: Optional[str] = None


# ==================== WhatsApp Message Schemas ====================

class WhatsAppEstimationMessage(BaseModel):
    """Schema for WhatsApp estimation message data"""
    inquiry_id: int
    phone_number: str = Field(..., description="Phone number with country code (e.g., +91XXXXXXXXXX)")