from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
from app.modules.inventory.models import UnitType, MaterialType, OwnerType, TransactionType


# ── Material Definition Schemas ───────────────────────────────────────────────

class MaterialAttributesValidation(BaseModel):
    gsm: Optional[int] = Field(None, gt=0)
    length: Optional[int] = Field(None, gt=0)
    width: Optional[int] = Field(None, gt=0)
    roll_width: Optional[int] = Field(None, gt=0)
    type: Optional[str] = Field(None, example="matte")
    color_code: Optional[str] = Field(None, example="CMYK")
    thickness: Optional[float] = Field(None, example=0.1)

    @model_validator(mode="after")
    def validate_roll_or_sheet(self) -> Any:
        if self.roll_width and (self.length or self.width):
            raise ValueError("Length and width are not required when roll_width is provided.")
        return self


class MaterialCreate(BaseModel):
    name: str = Field(..., example="300 GSM Kraft Board")
    category: MaterialType
    uom: UnitType
    attributes: MaterialAttributesValidation = Field(default_factory=MaterialAttributesValidation)


class MaterialUpdate(BaseModel):
    name: Optional[str]
    category: Optional[MaterialType]
    uom: Optional[UnitType]
    attributes: Optional[MaterialAttributesValidation]


class MaterialResponse(BaseModel):
    id: UUID
    name: str
    category: MaterialType
    uom: UnitType
    attributes: Dict[str, Any] = {}
    model_config = ConfigDict(from_attributes=True)


# ── Batch Metadata ────────────────────────────────────────────────────────────

class BatchMetadataSchema(BaseModel):
    supplier_name: Optional[str] = Field(None, example="ITC Paper Mills")
    invoice_no: Optional[str] = Field(None, example="INV-2026-882")
    notes: Optional[str] = Field(None, example="Pallet 2 was slightly dented")


# ── Inventory Receive Schemas ─────────────────────────────────────────────────

class FactoryReceiveRequest(BaseModel):
    """Receive factory-owned material. Admin must enter metadata and cost."""
    material_id: UUID
    initial_quantity: float = Field(..., gt=0)
    unit_cost: float = Field(..., ge=0)
    batch_metadata: BatchMetadataSchema = Field(default_factory=BatchMetadataSchema)


class CustomerReceiveRequest(BaseModel):
    """Receive customer-owned material. No price or supplier metadata needed."""
    material_id: UUID
    customer_id: UUID
    initial_quantity: float = Field(..., gt=0)


class BatchUpdateRequest(BaseModel):
    """Update batch metadata or unit cost."""
    batch_metadata: Optional[BatchMetadataSchema] = None
    unit_cost: Optional[float] = Field(None, ge=0)


# ── Batch Response Schemas ────────────────────────────────────────────────────

class InventoryBatchResponse(BaseModel):
    id: UUID
    display_id: str
    material_id: UUID
    owner_type: OwnerType
    customer_id: Optional[UUID] = None
    initial_quantity: float
    current_quantity: float
    unit_cost: Optional[float] = None
    batch_metadata: Optional[Dict[str, Any]] = None
    received_date: datetime
    model_config = ConfigDict(from_attributes=True)


class LedgerEntryResponse(BaseModel):
    id: UUID
    batch_id: UUID
    job_id: Optional[UUID] = None
    transaction_type: TransactionType
    quantity_change: float
    total_cost_impact: float
    reason: Optional[str] = None
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)


class BatchDetailResponse(InventoryBatchResponse):
    """Batch detail with material info and full ledger history."""
    material: Optional[MaterialResponse] = None
    ledger_entries: List[LedgerEntryResponse] = []


# ── Transaction Request Schemas ───────────────────────────────────────────────

class ConsumptionRequest(BaseModel):
    """Consume material from a batch for a job/order."""
    batch_id: UUID
    job_id: Optional[UUID] = None
    quantity: float = Field(..., gt=0)
    reason: Optional[str] = None


class WastageRequest(BaseModel):
    """Record material wastage from a batch."""
    batch_id: UUID
    job_id: Optional[UUID] = None
    quantity: float = Field(..., gt=0)
    reason: str = Field(..., min_length=1, description="Wastage reason is mandatory")


class ReturnToCustomerRequest(BaseModel):
    """Return customer-owned material back to customer."""
    batch_id: UUID
    quantity: float = Field(..., gt=0)
    reason: Optional[str] = None


class ReconciliationRequest(BaseModel):
    """Manual stock correction after physical count."""
    batch_id: UUID
    new_quantity: float = Field(..., ge=0)
    reason: str = Field(..., min_length=1, description="Reconciliation reason is mandatory")


# ── Reporting Schemas ─────────────────────────────────────────────────────────

class StockSummaryItem(BaseModel):
    material_id: UUID
    material_name: str
    category: str
    uom: str
    owner_type: str
    total_batches: int
    total_initial_quantity: float
    total_current_quantity: float
    total_value: float


class ExpenditureItem(BaseModel):
    ledger_id: UUID
    batch_id: UUID
    batch_display_id: str
    material_name: str
    category: str
    transaction_type: str
    quantity_change: float
    unit_cost: float
    total_cost_impact: float
    reason: Optional[str] = None
    timestamp: datetime
    job_id: Optional[UUID] = None


class CustomerStockItem(BaseModel):
    """Per-material stock view for a customer: used + wasted + remaining."""
    material_id: UUID
    material_name: str
    category: str
    uom: str
    total_received: float
    total_consumed: float
    total_wasted: float
    total_returned: float
    current_stock: float


class CustomerMaterialDetailResponse(BaseModel):
    """Detail view of a specific material for a customer with transaction history."""
    material: MaterialResponse
    batches: List[InventoryBatchResponse] = []
    transactions: List[LedgerEntryResponse] = []


# ── Pricing Engine Schemas ────────────────────────────────────────────────────

class PricingQuoteRequest(BaseModel):
    target_quantity: int = Field(..., gt=0, example=5000)
    material_id: UUID
    ups: int = Field(..., gt=0, description="Items printed per master sheet", example=4)
    wastage_pct: float = Field(default=0.05, ge=0, description="Standard 5% waste")
    setup_cost: float = Field(..., example=1500.00)
    alpha_value: float = Field(..., example=0.15, description="Wright's Law learning curve factor")
    overhead_pct: float = Field(..., example=0.20)
    margin_pct: float = Field(..., example=0.25)
    is_job_work: bool = Field(default=False, description="True if customer provides paper")


class PricingQuoteResponse(BaseModel):
    target_quantity: int
    sheets_required: int
    true_cost_total: float
    system_unit_price: float
    total_quote_price: float
    is_job_work: bool