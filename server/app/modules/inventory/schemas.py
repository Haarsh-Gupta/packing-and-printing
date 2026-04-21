from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import Optional, Dict, Any, List, Union, Annotated, Literal
from uuid import UUID
from datetime import datetime
from app.modules.inventory.models import UnitType, MaterialType, OwnerType, TransactionType

class BaseAttributes(BaseModel):
    """The translation keys for the dashboard UI (Applies to ALL materials)"""
    display_unit: Optional[str] = Field(None, example="Reams", description="What the humans call it")
    units_per_display: Optional[float] = Field(None, gt=0, example=500, description="Conversion factor")
    brand: Optional[str] = Field(None, description="Manufacturer or Brand name")
    density_kg_l: Optional[float] = Field(None, gt=0, description="Density (Kg/L) for converting volume (Liters) to weight (Kg) on the shop floor")

class PaperAttributes(BaseAttributes):
    # Matches: GSM, brightness, coating, size, brand, bulk
    gsm: int = Field(..., gt=0)
    brightness_pct: Optional[float] = Field(None, ge=0, le=100)
    finish: Optional[Literal["Uncoated", "Gloss", "Matte", "Silk"]] = None
    shade: Optional[str] = Field(None, example="Natural White")
    bulk_cm3_g: Optional[float] = Field(None, description="Paper bulk/thickness ratio")

class BoardAttributes(BaseAttributes):
    # Matches: GSM, ply, stiffness, burst strength, flute type
    gsm: int = Field(..., gt=0)
    ply: Optional[int] = Field(None, ge=1)
    burst_factor_bf: Optional[float] = Field(None, gt=0, description="BF for Kraft/Corrugated")
    flute_type: Optional[Literal["A", "B", "C", "E", "F"]] = None
    coating: Optional[Literal["White Back", "Grey Back", "Kraft Back"]] = None
    thickness_mm: Optional[float] = Field(None, gt=0)

class InkAttributes(BaseAttributes):
    # Matches: Color strength, viscosity, drying type
    color_code: str = Field(..., example="Cyan or Pantone 032C")
    drying_type: Optional[Literal["UV", "Conventional", "Aqueous", "Solvent"]] = None
    viscosity: Optional[str] = Field(None, example="High")
    particle_size: Optional[str] = Field(None, description="For coatings/powders")

class LaminateAttributes(BaseAttributes):
    # Matches: Micron, finish, shrink ratio, transparency, barrier
    micron: float = Field(..., gt=0)
    finish: Optional[Literal["Gloss", "Matte", "Velvet", "Holographic"]] = None
    roll_width_inches: Optional[float] = Field(None, gt=0, description="Required if converting from linear length")
    gsm: Optional[float] = Field(None, gt=0, description="Required for Kg-to-SqInch math")
    shrink_ratio: Optional[str] = Field(None, example="High")
    is_thermal: Optional[bool] = Field(default=True)

class GlueAttributes(BaseAttributes):
    # Matches: Type, bonding strength, viscosity, solid content
    glue_type: Literal["Hot Melt", "PVA", "PUR", "Starch", "Chemical"]
    solid_content_pct: Optional[float] = Field(None, ge=0, le=100)
    bond_strength: Optional[Literal["Low", "Medium", "High"]] = None
    viscosity_cps: Optional[int] = Field(None, description="Viscosity in Centipoise")

class ConsumableAttributes(BaseAttributes):
    # Matches: Hardware, Chemicals, Thread, Wire
    consumable_type: str = Field(..., example="CTP Plate, Stitching Wire, IPA Solvent")
    gauge: Optional[int] = Field(None, description="For stitching wire")
    thickness_mm: Optional[float] = Field(None, description="For plates/blankets")
    concentration_pct: Optional[float] = Field(None, description="For chemicals/fountain solutions")
    life_expectancy: Optional[str] = Field(None, description="E.g., 500,000 impressions for Blankets")

class FoilAttributes(BaseAttributes):
    # Foil is unique: it's a laminate, but usually tracked by linear width/meters and color
    color: str = Field(..., example="Gold, Silver, Rose Gold")
    width_mm: float = Field(..., gt=0, description="Width of the foil roll")
    core_size_inches: Optional[float] = Field(None, example=1.0)
    is_holographic: Optional[bool] = Field(default=False)
    micron: Optional[float] = Field(None, gt=0)

class PlateAttributes(BaseAttributes):
    # Plates are tracked by size and how many impressions they can survive
    plate_type: Literal["Thermal CTP", "UV CTP", "Violet CTP", "Analog"]
    thickness_mm: float = Field(..., example=0.28)
    length_mm: float = Field(..., gt=0)
    width_mm: float = Field(..., gt=0)
    max_impressions: Optional[int] = Field(None, description="Expected life before degrading")

class HardwareAttributes(BaseAttributes):
    # Valves, binding combs, screws, eyelets
    hardware_type: str = Field(..., example="Degassing Valve, Spiral Comb")
    material: Optional[str] = Field(None, example="Plastic, Aluminum, Brass")
    diameter_mm: Optional[float] = Field(None, description="For spirals/eyelets")
    color: Optional[str] = None


# ── Material Definition Schemas ───────────────────────────────────────────────

MaterialAttributeUnion = Union[
    PaperAttributes, 
    BoardAttributes, 
    InkAttributes, 
    LaminateAttributes, 
    GlueAttributes, 
    ConsumableAttributes,
    FoilAttributes,
    PlateAttributes,
    HardwareAttributes
]

# class MaterialAttributesValidation(BaseModel):
#     gsm: Optional[int] = Field(None, gt=0)
#     length: Optional[int] = Field(None, gt=0)
#     width: Optional[int] = Field(None, gt=0)
#     roll_width: Optional[int] = Field(None, gt=0)
#     type: Optional[str] = Field(None, example="matte")
#     color_code: Optional[str] = Field(None, example="CMYK")
#     thickness: Optional[float] = Field(None, example=0.1)

#     @model_validator(mode="after")
#     def validate_roll_or_sheet(self) -> Any:
#         if self.roll_width and (self.length or self.width):
#             raise ValueError("Length and width are not required when roll_width is provided.")
#         return self


class MaterialCreate(BaseModel):
    name: str = Field(..., example="300 GSM Kraft Board")
    category: MaterialType
    uom: UnitType
    attributes: MaterialAttributeUnion
    minimum_threshold: float = Field(default=0.00, ge=0)


class MaterialUpdate(BaseModel):
    name: Optional[str]
    category: Optional[MaterialType] = None
    uom: Optional[UnitType] = None
    attributes: Optional[MaterialAttributeUnion] = None
    minimum_threshold: Optional[float] = Field(None, ge=0)


class MaterialResponse(BaseModel):
    id: UUID
    name: str
    category: MaterialType
    uom: UnitType
    attributes: Dict[str, Any] = {}
    minimum_threshold: float = 0.00
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

class FifoConsumptionRequest(BaseModel):
    """Consume material automatically from the oldest batches."""
    material_id: UUID
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
    minimum_threshold: float


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