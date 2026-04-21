import enum
from app.core.database import Base
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func, text
from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, ForeignKey, 
    Numeric, Enum, Uuid, CheckConstraint
)
from sqlalchemy.orm import relationship
from app.core.display_id import generate_nanoid

class UnitType(str, enum.Enum):
    SHEET = "SHEET"
    KG = "KG"
    SQ_INCH = "SQ_INCH"
    PCS = "PCS"
    METER = "METER"
    SQ_METER = "SQ_METER"
    LITER = "LITER"

class MaterialType(str, enum.Enum):
    PAPER = "PAPER"
    INK = "INK"
    BOARD = "BOARD"
    LAMINATE = "LAMINATE"
    GLUE = "GLUE"
    CONSUMABLE = "CONSUMABLE"
    FOIL = "FOIL"
    PLATE = "PLATE"
    HARDWARE = "HARDWARE"

class OwnerType(str, enum.Enum):
    FACTORY = "FACTORY"
    CUSTOMER = "CUSTOMER"

class TransactionType(str, enum.Enum):
    RECEIVE = "RECEIVE"
    CONSUMPTION = "CONSUMPTION"
    WASTAGE = "WASTAGE"
    RETURN_TO_CUSTOMER = "RETURN_TO_CUSTOMER"
    MANUAL_RECONCILIATION = "MANUAL_RECONCILIATION"


class MaterialDefinition(Base): # Fixed typo from Defination to Definition
    __tablename__ = "material_definitions"
    
    id = Column(Uuid, primary_key=True, server_default=text("uuidv7()"))
    name = Column(String, nullable=False) # eg "100 GSM Art Paper"
    category = Column(Enum(MaterialType), nullable=False) # eg "PAPER"
    uom = Column(Enum(UnitType), nullable=False)
    
    attributes = Column(JSONB, nullable=False, default=dict) # Store {"gsm" : 100, "size" : "22x28"}
    minimum_threshold = Column(Numeric(precision=12, scale=4), nullable=False, default=0.00)

    # Relationships
    batches = relationship("InventoryBatch", back_populates="material")

class InventoryBatch(Base):
    __tablename__ = "inventory_batches"
    
    # CONSTRAINTS: The ultimate safety net
    __table_args__ = (
        # 1. You cannot have negative stock on the physical shelf
        CheckConstraint('current_quantity >= 0', name='check_current_quantity_not_negative'),
        CheckConstraint('initial_quantity >= 0', name='check_initial_quantity_not_negative'),
        # 2. If it is CUSTOMER owned, the customer_id MUST exist
        CheckConstraint(
            "(owner_type = 'FACTORY') OR (owner_type = 'CUSTOMER' AND customer_id IS NOT NULL)",
            name='check_customer_ownership_integrity'
        ),
        # 3. Unit cost cannot be negative
        CheckConstraint('unit_cost >= 0', name='check_unit_cost_not_negative'),
    )

    id = Column(Uuid, primary_key=True, server_default=text("uuidv7()"))
    
    # RESTRICT deletion: Prevent admin from deleting a material if we have stock of it
    material_id = Column(Uuid, ForeignKey("material_definitions.id", ondelete="RESTRICT"), nullable=False, index=True)

    display_id = Column(String, nullable=False, unique=True, default=lambda: generate_nanoid("BTH", 4))
    
    owner_type = Column(Enum(OwnerType), nullable=False)
    customer_id = Column(Uuid, ForeignKey("users.id"), nullable=True, index=True)

    # Quantities are always stored in the Base UOM (e.g., Sheets or Sq_Inches)
    initial_quantity = Column(Numeric(precision=12, scale=4), nullable=False)
    current_quantity = Column(Numeric(precision=12, scale=4), nullable=False)

    # METADATA  
    # Stores {"supplier_name": "ITC", "invoice_no": "INV-882", "notes": "Arrived wet"}
    batch_metadata = Column(JSONB, nullable=False, default=dict)

    # Use Numeric for precision (never use Float for inventory math!)
    unit_cost = Column(Numeric(precision=12, scale=4), nullable=True)
    received_date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships (Moved these here from the Ledger table where they were misplaced)
    material = relationship("MaterialDefinition", back_populates="batches")
    ledger_entries = relationship("InventoryLedger", back_populates="batch")
    
class InventoryLedger(Base):
    __tablename__ = "inventory_ledger" 
    
    __table_args__ = (
        # 1. Total cost impact must be non-negative (it's an absolute value of the financial impact)
        CheckConstraint('total_cost_impact >= 0', name='check_total_cost_impact_not_negative'),
    )

    id = Column(Uuid, primary_key=True, server_default=text("uuidv7()"))
    
    # CASCADE deletion: If a batch is somehow legitimately deleted, wipe its ledger history
    batch_id = Column(Uuid, ForeignKey("inventory_batches.id", ondelete="CASCADE"), nullable=False, index=True)

    # Adding order_id as a formal column for faster reporting
    job_id = Column(Uuid, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)

    transaction_type = Column(Enum(TransactionType), nullable=False)
    quantity_change = Column(Numeric(precision=12, scale=4), nullable=False) # Negative for consumption, positive for receiving

    # If transaction is RECEIVE and Owner is FACTORY, this is (quantity * batch.unit_cost). 
    # If Owner is CUSTOMER, this is 0.00.
    total_cost_impact = Column(Numeric(precision=14, scale=4), nullable=False, default=0.00)
    
    reason = Column(String, nullable=True) # wastage note
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    batch = relationship("InventoryBatch", back_populates="ledger_entries")