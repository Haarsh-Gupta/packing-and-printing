import logging
from uuid import UUID
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.auth import get_current_admin_user
from app.modules.users.models import User
from app.modules.inventroy.models import TransactionType
from app.modules.inventroy.schemas import (
    ConsumptionRequest, WastageRequest, ReturnToCustomerRequest,
    ReconciliationRequest, LedgerEntryResponse,
)
from app.modules.inventroy.services import InventoryService

logger = logging.getLogger("app.modules.inventory.admin.transactions")

router = APIRouter()


# ── Material Consumption ──────────────────────────────────────────────────────

@router.post("/consume", response_model=LedgerEntryResponse, status_code=status.HTTP_201_CREATED)
async def consume_material(
    data: ConsumptionRequest,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Allocate/consume material from a batch for a job/order.
    After the order is done, admin verifies, corrects and creates this transaction.
    Deducts from batch current_quantity and creates a CONSUMPTION ledger entry.
    """
    svc = InventoryService(db)
    try:
        ledger = await svc.consume_material(data)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    await db.commit()
    return ledger


# ── Wastage Recording ─────────────────────────────────────────────────────────

@router.post("/wastage", response_model=LedgerEntryResponse, status_code=status.HTTP_201_CREATED)
async def record_wastage(
    data: WastageRequest,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Record material wastage from a batch.
    Requires a reason (mandatory). Creates a WASTAGE ledger entry.
    """
    svc = InventoryService(db)
    try:
        ledger = await svc.record_wastage(data)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    await db.commit()
    return ledger


# ── Return to Customer ────────────────────────────────────────────────────────

@router.post("/return", response_model=LedgerEntryResponse, status_code=status.HTTP_201_CREATED)
async def return_to_customer(
    data: ReturnToCustomerRequest,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Return customer-owned material back to the customer.
    Only works on CUSTOMER-owned batches. Creates a RETURN_TO_CUSTOMER ledger entry.
    """
    svc = InventoryService(db)
    try:
        ledger = await svc.return_to_customer(data)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    await db.commit()
    return ledger


# ── Manual Reconciliation ─────────────────────────────────────────────────────

@router.post("/reconcile", response_model=LedgerEntryResponse, status_code=status.HTTP_201_CREATED)
async def reconcile_stock(
    data: ReconciliationRequest,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Manual stock correction after physical count.
    Sets the batch to the new_quantity and creates a MANUAL_RECONCILIATION ledger entry
    with the difference (positive or negative).
    """
    svc = InventoryService(db)
    try:
        ledger = await svc.reconcile_stock(data)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    await db.commit()
    return ledger


# ── Ledger History ────────────────────────────────────────────────────────────

@router.get("/", response_model=list[LedgerEntryResponse])
async def list_transactions(
    batch_id: Optional[UUID] = Query(None, description="Filter by batch"),
    job_id: Optional[UUID] = Query(None, description="Filter by job/order"),
    transaction_type: Optional[TransactionType] = Query(None, description="RECEIVE, CONSUMPTION, WASTAGE, etc."),
    start_date: Optional[datetime] = Query(None, description="Start date (ISO 8601)"),
    end_date: Optional[datetime] = Query(None, description="End date (ISO 8601)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all ledger entries with filters."""
    svc = InventoryService(db)
    return await svc.get_ledger_entries(
        batch_id=batch_id,
        job_id=job_id,
        transaction_type=transaction_type,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )
