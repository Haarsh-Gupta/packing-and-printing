import logging
from uuid import UUID
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.auth import get_current_admin_user
from app.modules.users.models import User
from app.modules.inventory.models import OwnerType, MaterialType, TransactionType
from app.modules.inventory.schemas import (
    FactoryReceiveRequest, CustomerReceiveRequest, BatchUpdateRequest,
    InventoryBatchResponse, BatchDetailResponse,
    StockSummaryItem, ExpenditureItem,
)
from app.modules.inventory.services import InventoryService

logger = logging.getLogger("app.modules.inventory.admin.stock")

router = APIRouter()


# ── Batch Receiving ───────────────────────────────────────────────────────────

@router.post("/batches/receive", response_model=InventoryBatchResponse, status_code=status.HTTP_201_CREATED)
async def receive_factory_material(
    data: FactoryReceiveRequest,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Receive factory-owned material into inventory.
    Admin must provide metadata (supplier, invoice) and unit cost.
    Creates the batch + RECEIVE ledger entry.
    """
    svc = InventoryService(db)
    batch = await svc.receive_factory_batch(data)
    await db.commit()
    return batch


@router.post("/batches/receive-customer", response_model=InventoryBatchResponse, status_code=status.HTTP_201_CREATED)
async def receive_customer_material(
    data: CustomerReceiveRequest,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Receive customer-owned material into inventory.
    No price or supplier metadata needed — customer provides their own material.
    """
    svc = InventoryService(db)
    batch = await svc.receive_customer_batch(data)
    await db.commit()
    return batch


# ── Batch Listing & Detail ────────────────────────────────────────────────────

@router.get("/batches", response_model=list[InventoryBatchResponse])
async def list_batches(
    owner_type: Optional[OwnerType] = Query(None, description="FACTORY or CUSTOMER"),
    material_id: Optional[UUID] = Query(None),
    customer_id: Optional[UUID] = Query(None),
    show_empty: bool = Query(False, description="Include zero-stock batches"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all inventory batches with filters."""
    svc = InventoryService(db)
    return await svc.get_batches(
        owner_type=owner_type,
        material_id=material_id,
        customer_id=customer_id,
        show_empty=show_empty,
        skip=skip,
        limit=limit,
    )


@router.get("/batches/{batch_id}", response_model=BatchDetailResponse)
async def get_batch_detail(
    batch_id: UUID,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get batch detail with material info and full ledger history."""
    svc = InventoryService(db)
    batch = await svc.get_batch_detail(batch_id)
    if not batch:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Batch not found")
    return batch


@router.patch("/batches/{batch_id}", response_model=InventoryBatchResponse)
async def update_batch(
    batch_id: UUID,
    data: BatchUpdateRequest,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Update batch metadata or unit cost."""
    svc = InventoryService(db)
    batch = await svc.update_batch(batch_id, data)
    if not batch:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Batch not found")
    await db.commit()
    return batch


# ── Stock Summary ─────────────────────────────────────────────────────────────

@router.get("/summary", response_model=list[StockSummaryItem])
async def stock_summary(
    owner_type: Optional[OwnerType] = Query(None),
    category: Optional[MaterialType] = Query(None),
    material_id: Optional[UUID] = Query(None),
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Aggregated current stock per material.
    Filter by owner_type (FACTORY/CUSTOMER), material category, or specific material.
    """
    svc = InventoryService(db)
    return await svc.get_stock_summary(
        owner_type=owner_type, category=category, material_id=material_id
    )


# ── Expenditure Report ────────────────────────────────────────────────────────

@router.get("/expenditure", response_model=list[ExpenditureItem])
async def expenditure_report(
    category: Optional[MaterialType] = Query(None, description="Filter by material category"),
    material_id: Optional[UUID] = Query(None, description="Filter by specific material"),
    transaction_type: Optional[TransactionType] = Query(None, description="CONSUMPTION or WASTAGE"),
    min_cost: Optional[float] = Query(None, ge=0, description="Minimum cost impact"),
    max_cost: Optional[float] = Query(None, ge=0, description="Maximum cost impact"),
    start_date: Optional[datetime] = Query(None, description="Start date (ISO 8601)"),
    end_date: Optional[datetime] = Query(None, description="End date (ISO 8601)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Inventory expenditure report.
    Tracks consumption and wastage costs — filterable by price range, material,
    category, transaction type, and date range.
    """
    svc = InventoryService(db)
    return await svc.get_expenditure_report(
        category=category,
        material_id=material_id,
        min_cost=min_cost,
        max_cost=max_cost,
        transaction_type=transaction_type,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )
