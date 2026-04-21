"""
Inventory service layer — all business logic for material, batch, and ledger operations.
"""

import logging
from uuid import UUID
from typing import Optional
from datetime import datetime

from sqlalchemy import select, func as sa_func, case, literal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.inventory.models import (
    MaterialDefinition, InventoryBatch, InventoryLedger,
    MaterialType, OwnerType, TransactionType,
)

logger = logging.getLogger("app.modules.inventory.services")


class InventoryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Material Definition CRUD ──────────────────────────────────────────────

    async def create_material(self, data) -> MaterialDefinition:
        attrs = data.attributes.model_dump() if hasattr(data.attributes, "model_dump") else (data.attributes or {})
        material = MaterialDefinition(
            name=data.name,
            category=data.category,
            uom=data.uom,
            attributes=attrs,
        )
        self.db.add(material)
        await self.db.flush()
        await self.db.refresh(material)
        return material

    async def get_materials(
        self, category: Optional[MaterialType] = None, skip: int = 0, limit: int = 50
    ):
        stmt = select(MaterialDefinition)
        if category:
            stmt = stmt.where(MaterialDefinition.category == category)
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_material(self, material_id: UUID):
        result = await self.db.execute(
            select(MaterialDefinition).where(MaterialDefinition.id == material_id)
        )
        return result.scalar_one_or_none()

    async def update_material(self, material_id: UUID, data):
        material = await self.get_material(material_id)
        if not material:
            return None
        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(material, key, value)
        await self.db.flush()
        await self.db.refresh(material)
        return material

    async def delete_material(self, material_id: UUID):
        material = await self.get_material(material_id)
        if not material:
            return None
        await self.db.delete(material)
        await self.db.flush()
        return True

    # ── Batch Receiving ───────────────────────────────────────────────────────

    async def receive_factory_batch(self, data) -> InventoryBatch:
        """Receive factory-owned material with full metadata and cost."""
        metadata = data.batch_metadata.model_dump() if hasattr(data.batch_metadata, "model_dump") else {}
        batch = InventoryBatch(
            material_id=data.material_id,
            owner_type=OwnerType.FACTORY,
            initial_quantity=data.initial_quantity,
            current_quantity=data.initial_quantity,
            unit_cost=data.unit_cost,
            batch_metadata=metadata,
        )
        self.db.add(batch)
        await self.db.flush()

        cost_impact = float(data.initial_quantity) * float(data.unit_cost)
        ledger = InventoryLedger(
            batch_id=batch.id,
            transaction_type=TransactionType.RECEIVE,
            quantity_change=data.initial_quantity,
            total_cost_impact=cost_impact,
        )
        self.db.add(ledger)
        await self.db.flush()
        await self.db.refresh(batch)
        return batch

    async def receive_customer_batch(self, data) -> InventoryBatch:
        """Receive customer-owned material. No cost or supplier metadata."""
        batch = InventoryBatch(
            material_id=data.material_id,
            owner_type=OwnerType.CUSTOMER,
            customer_id=data.customer_id,
            initial_quantity=data.initial_quantity,
            current_quantity=data.initial_quantity,
            unit_cost=0,
            batch_metadata={},
        )
        self.db.add(batch)
        await self.db.flush()

        ledger = InventoryLedger(
            batch_id=batch.id,
            transaction_type=TransactionType.RECEIVE,
            quantity_change=data.initial_quantity,
            total_cost_impact=0,
        )
        self.db.add(ledger)
        await self.db.flush()
        await self.db.refresh(batch)
        return batch

    # ── Batch Queries ─────────────────────────────────────────────────────────

    async def get_batches(
        self,
        owner_type: Optional[OwnerType] = None,
        material_id: Optional[UUID] = None,
        customer_id: Optional[UUID] = None,
        show_empty: bool = False,
        skip: int = 0,
        limit: int = 50,
    ):
        stmt = select(InventoryBatch).options(selectinload(InventoryBatch.material))
        if owner_type:
            stmt = stmt.where(InventoryBatch.owner_type == owner_type)
        if material_id:
            stmt = stmt.where(InventoryBatch.material_id == material_id)
        if customer_id:
            stmt = stmt.where(InventoryBatch.customer_id == customer_id)
        if not show_empty:
            stmt = stmt.where(InventoryBatch.current_quantity > 0)
        stmt = stmt.order_by(InventoryBatch.received_date.desc()).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_batch_detail(self, batch_id: UUID):
        stmt = (
            select(InventoryBatch)
            .options(
                selectinload(InventoryBatch.material),
                selectinload(InventoryBatch.ledger_entries),
            )
            .where(InventoryBatch.id == batch_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_batch(self, batch_id: UUID, data):
        batch = await self._get_batch(batch_id)
        if not batch:
            return None
        if data.batch_metadata is not None:
            batch.batch_metadata = data.batch_metadata.model_dump()
        if data.unit_cost is not None:
            batch.unit_cost = data.unit_cost
        await self.db.flush()
        await self.db.refresh(batch)
        return batch

    # ── Transactions (Allocation) ─────────────────────────────────────────────

    async def consume_material(self, data) -> InventoryLedger:
        """Consume material from a batch for a job/order."""
        batch = await self._get_batch(data.batch_id)
        if not batch:
            raise ValueError("Batch not found")
        if float(batch.current_quantity) < data.quantity:
            raise ValueError(
                f"Insufficient stock. Available: {batch.current_quantity}, Requested: {data.quantity}"
            )

        batch.current_quantity = float(batch.current_quantity) - data.quantity
        cost_impact = data.quantity * float(batch.unit_cost or 0)

        ledger = InventoryLedger(
            batch_id=batch.id,
            job_id=data.job_id,
            transaction_type=TransactionType.CONSUMPTION,
            quantity_change=-data.quantity,
            total_cost_impact=cost_impact,
            reason=data.reason,
        )
        self.db.add(ledger)
        await self.db.flush()
        await self.db.refresh(ledger)
        return ledger

    async def consume_fifo(self, data) -> list[InventoryLedger]:
        """Auto-consume material using FIFO (First-In, First-Out)."""
        stmt = (
            select(InventoryBatch)
            .where(
                InventoryBatch.material_id == data.material_id,
                InventoryBatch.owner_type == OwnerType.FACTORY,
                InventoryBatch.current_quantity > 0,
            )
            .order_by(InventoryBatch.received_date.asc())
        )
        result = await self.db.execute(stmt)
        batches = list(result.scalars().all())

        remaining_qty = data.quantity
        ledgers = []

        for batch in batches:
            if remaining_qty <= 0:
                break
            
            qty_to_consume = min(float(batch.current_quantity), remaining_qty)
            batch.current_quantity = float(batch.current_quantity) - qty_to_consume
            cost_impact = qty_to_consume * float(batch.unit_cost or 0)
            
            ledger = InventoryLedger(
                batch_id=batch.id,
                job_id=data.job_id,
                transaction_type=TransactionType.CONSUMPTION,
                quantity_change=-qty_to_consume,
                total_cost_impact=cost_impact,
                reason=data.reason or "FIFO Auto-Consume",
            )
            self.db.add(ledger)
            ledgers.append(ledger)
            
            remaining_qty -= qty_to_consume

        if remaining_qty > 0:
            raise ValueError(f"Insufficient stock for FIFO. Short by {remaining_qty}")

        await self.db.flush()
        for ledger in ledgers:
            await self.db.refresh(ledger)
        return ledgers

    async def record_wastage(self, data) -> InventoryLedger:
        """Record material wastage."""
        batch = await self._get_batch(data.batch_id)
        if not batch:
            raise ValueError("Batch not found")
        if float(batch.current_quantity) < data.quantity:
            raise ValueError(
                f"Insufficient stock for wastage. Available: {batch.current_quantity}"
            )

        batch.current_quantity = float(batch.current_quantity) - data.quantity
        cost_impact = data.quantity * float(batch.unit_cost or 0)

        ledger = InventoryLedger(
            batch_id=batch.id,
            job_id=data.job_id,
            transaction_type=TransactionType.WASTAGE,
            quantity_change=-data.quantity,
            total_cost_impact=cost_impact,
            reason=data.reason,
        )
        self.db.add(ledger)
        await self.db.flush()
        await self.db.refresh(ledger)
        return ledger

    async def return_to_customer(self, data) -> InventoryLedger:
        """Return customer-owned material back to customer."""
        batch = await self._get_batch(data.batch_id)
        if not batch:
            raise ValueError("Batch not found")
        if batch.owner_type != OwnerType.CUSTOMER:
            raise ValueError("Can only return customer-owned material")
        if float(batch.current_quantity) < data.quantity:
            raise ValueError(
                f"Insufficient stock for return. Available: {batch.current_quantity}"
            )

        batch.current_quantity = float(batch.current_quantity) - data.quantity

        ledger = InventoryLedger(
            batch_id=batch.id,
            transaction_type=TransactionType.RETURN_TO_CUSTOMER,
            quantity_change=-data.quantity,
            total_cost_impact=0,
            reason=data.reason,
        )
        self.db.add(ledger)
        await self.db.flush()
        await self.db.refresh(ledger)
        return ledger

    async def reconcile_stock(self, data) -> InventoryLedger:
        """Manual stock correction after physical count."""
        batch = await self._get_batch(data.batch_id)
        if not batch:
            raise ValueError("Batch not found")

        difference = data.new_quantity - float(batch.current_quantity)
        batch.current_quantity = data.new_quantity
        cost_impact = abs(difference) * float(batch.unit_cost or 0)

        ledger = InventoryLedger(
            batch_id=batch.id,
            transaction_type=TransactionType.MANUAL_RECONCILIATION,
            quantity_change=difference,
            total_cost_impact=cost_impact,
            reason=data.reason,
        )
        self.db.add(ledger)
        await self.db.flush()
        await self.db.refresh(ledger)
        return ledger

    # ── Ledger Queries ────────────────────────────────────────────────────────

    async def get_ledger_entries(
        self,
        batch_id: Optional[UUID] = None,
        job_id: Optional[UUID] = None,
        owner_type: Optional[OwnerType] = None,
        transaction_type: Optional[TransactionType] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 50,
    ):
        stmt = select(InventoryLedger)
        if owner_type:
            stmt = stmt.join(InventoryBatch, InventoryLedger.batch_id == InventoryBatch.id).where(InventoryBatch.owner_type == owner_type)
        if batch_id:
            stmt = stmt.where(InventoryLedger.batch_id == batch_id)
        if job_id:
            stmt = stmt.where(InventoryLedger.job_id == job_id)
        if transaction_type:
            stmt = stmt.where(InventoryLedger.transaction_type == transaction_type)
        if start_date:
            stmt = stmt.where(InventoryLedger.timestamp >= start_date)
        if end_date:
            stmt = stmt.where(InventoryLedger.timestamp <= end_date)
        stmt = stmt.order_by(InventoryLedger.timestamp.desc()).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    # ── Reporting ─────────────────────────────────────────────────────────────

    async def get_stock_summary(
        self,
        owner_type: Optional[OwnerType] = None,
        category: Optional[MaterialType] = None,
        material_id: Optional[UUID] = None,
    ):
        """Aggregated stock per material, grouped by owner_type."""
        stmt = (
            select(
                MaterialDefinition.id.label("material_id"),
                MaterialDefinition.name.label("material_name"),
                MaterialDefinition.category,
                MaterialDefinition.uom,
                MaterialDefinition.minimum_threshold,
                InventoryBatch.owner_type,
                sa_func.count(InventoryBatch.id).label("total_batches"),
                sa_func.sum(InventoryBatch.initial_quantity).label("total_initial_quantity"),
                sa_func.sum(InventoryBatch.current_quantity).label("total_current_quantity"),
                sa_func.sum(
                    InventoryBatch.current_quantity * sa_func.coalesce(InventoryBatch.unit_cost, 0)
                ).label("total_value"),
            )
            .join(InventoryBatch, MaterialDefinition.id == InventoryBatch.material_id)
            .group_by(
                MaterialDefinition.id,
                MaterialDefinition.name,
                MaterialDefinition.category,
                MaterialDefinition.uom,
                MaterialDefinition.minimum_threshold,
                InventoryBatch.owner_type,
            )
        )
        if owner_type:
            stmt = stmt.where(InventoryBatch.owner_type == owner_type)
        if category:
            stmt = stmt.where(MaterialDefinition.category == category)
        if material_id:
            stmt = stmt.where(MaterialDefinition.id == material_id)

        result = await self.db.execute(stmt)
        rows = result.all()
        return [
            {
                "material_id": r.material_id,
                "material_name": r.material_name,
                "category": r.category.value if hasattr(r.category, "value") else str(r.category),
                "uom": r.uom.value if hasattr(r.uom, "value") else str(r.uom),
                "owner_type": r.owner_type.value if hasattr(r.owner_type, "value") else str(r.owner_type),
                "total_batches": r.total_batches,
                "total_initial_quantity": float(r.total_initial_quantity or 0),
                "total_current_quantity": float(r.total_current_quantity or 0),
                "total_value": float(r.total_value or 0),
                "minimum_threshold": float(r.minimum_threshold or 0),
            }
            for r in rows
        ]

    async def get_expenditure_report(
        self,
        category: Optional[MaterialType] = None,
        material_id: Optional[UUID] = None,
        min_cost: Optional[float] = None,
        max_cost: Optional[float] = None,
        transaction_type: Optional[TransactionType] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 50,
    ):
        """Expenditure report: filter ledger by price, material, attribute, wastage."""
        stmt = (
            select(
                InventoryLedger.id.label("ledger_id"),
                InventoryLedger.batch_id,
                InventoryBatch.display_id.label("batch_display_id"),
                MaterialDefinition.name.label("material_name"),
                MaterialDefinition.category,
                InventoryLedger.transaction_type,
                InventoryLedger.quantity_change,
                InventoryBatch.unit_cost,
                InventoryLedger.total_cost_impact,
                InventoryLedger.reason,
                InventoryLedger.timestamp,
                InventoryLedger.job_id,
            )
            .join(InventoryBatch, InventoryLedger.batch_id == InventoryBatch.id)
            .join(MaterialDefinition, InventoryBatch.material_id == MaterialDefinition.id)
            .where(InventoryLedger.transaction_type != TransactionType.RECEIVE)
        )

        if category:
            stmt = stmt.where(MaterialDefinition.category == category)
        if material_id:
            stmt = stmt.where(InventoryBatch.material_id == material_id)
        if min_cost is not None:
            stmt = stmt.where(InventoryLedger.total_cost_impact >= min_cost)
        if max_cost is not None:
            stmt = stmt.where(InventoryLedger.total_cost_impact <= max_cost)
        if transaction_type:
            stmt = stmt.where(InventoryLedger.transaction_type == transaction_type)
        if start_date:
            stmt = stmt.where(InventoryLedger.timestamp >= start_date)
        if end_date:
            stmt = stmt.where(InventoryLedger.timestamp <= end_date)

        stmt = stmt.order_by(InventoryLedger.timestamp.desc()).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        rows = result.all()

        return [
            {
                "ledger_id": r.ledger_id,
                "batch_id": r.batch_id,
                "batch_display_id": r.batch_display_id,
                "material_name": r.material_name,
                "category": r.category.value if hasattr(r.category, "value") else str(r.category),
                "transaction_type": r.transaction_type.value if hasattr(r.transaction_type, "value") else str(r.transaction_type),
                "quantity_change": float(r.quantity_change),
                "unit_cost": float(r.unit_cost or 0),
                "total_cost_impact": float(r.total_cost_impact or 0),
                "reason": r.reason,
                "timestamp": r.timestamp,
                "job_id": r.job_id,
            }
            for r in rows
        ]

    # ── Customer Stock View ───────────────────────────────────────────────────

    async def get_customer_stock(self, customer_id: UUID):
        """Per-material stock summary for a customer: received, consumed, wasted, returned, remaining."""
        batches = await self.get_batches(
            owner_type=OwnerType.CUSTOMER,
            customer_id=customer_id,
            show_empty=True,
            limit=1000,
        )

        # Group by material
        material_map: dict = {}
        for batch in batches:
            mid = batch.material_id
            if mid not in material_map:
                mat = batch.material
                material_map[mid] = {
                    "material_id": mid,
                    "material_name": mat.name if mat else "Unknown",
                    "category": mat.category.value if mat else "",
                    "uom": mat.uom.value if mat else "",
                    "total_received": 0.0,
                    "total_consumed": 0.0,
                    "total_wasted": 0.0,
                    "total_returned": 0.0,
                    "current_stock": 0.0,
                }
            entry = material_map[mid]
            entry["total_received"] += float(batch.initial_quantity)
            entry["current_stock"] += float(batch.current_quantity)

        # Fetch ledger entries for consumption/wastage/return breakdown
        if material_map:
            batch_ids = [b.id for b in batches]
            ledger_stmt = (
                select(InventoryLedger)
                .where(InventoryLedger.batch_id.in_(batch_ids))
                .where(InventoryLedger.transaction_type != TransactionType.RECEIVE)
            )
            ledger_result = await self.db.execute(ledger_stmt)
            # Build batch→material mapping
            batch_material = {b.id: b.material_id for b in batches}
            for entry in ledger_result.scalars().all():
                mid = batch_material.get(entry.batch_id)
                if mid and mid in material_map:
                    qty = abs(float(entry.quantity_change))
                    if entry.transaction_type == TransactionType.CONSUMPTION:
                        material_map[mid]["total_consumed"] += qty
                    elif entry.transaction_type == TransactionType.WASTAGE:
                        material_map[mid]["total_wasted"] += qty
                    elif entry.transaction_type == TransactionType.RETURN_TO_CUSTOMER:
                        material_map[mid]["total_returned"] += qty

        return list(material_map.values())

    async def get_customer_material_detail(self, customer_id: UUID, material_id: UUID):
        """Detail view: batches and transactions for a specific customer material."""
        material = await self.get_material(material_id)
        if not material:
            return None

        batch_stmt = (
            select(InventoryBatch)
            .where(
                InventoryBatch.material_id == material_id,
                InventoryBatch.owner_type == OwnerType.CUSTOMER,
                InventoryBatch.customer_id == customer_id,
            )
            .order_by(InventoryBatch.received_date.desc())
        )
        batch_result = await self.db.execute(batch_stmt)
        batches = list(batch_result.scalars().all())

        batch_ids = [b.id for b in batches]
        transactions = []
        if batch_ids:
            ledger_stmt = (
                select(InventoryLedger)
                .where(InventoryLedger.batch_id.in_(batch_ids))
                .order_by(InventoryLedger.timestamp.desc())
            )
            ledger_result = await self.db.execute(ledger_stmt)
            transactions = list(ledger_result.scalars().all())

        return {
            "material": material,
            "batches": batches,
            "transactions": transactions,
        }

    # ── Helpers ───────────────────────────────────────────────────────────────

    async def _get_batch(self, batch_id: UUID):
        result = await self.db.execute(
            select(InventoryBatch).where(InventoryBatch.id == batch_id)
        )
        return result.scalar_one_or_none()
