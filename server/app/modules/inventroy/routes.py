"""
Customers can only see their own material stock:
  - How much was received
  - How much was used (consumed)
  - How much was wasted
  - How much remains
"""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.auth import get_current_user
from app.modules.auth.schemas import TokenData
from app.modules.inventroy.schemas import (
    CustomerStockItem, CustomerMaterialDetailResponse,
)
from app.modules.inventroy.services import InventoryService

logger = logging.getLogger("app.modules.inventory.routes")

router = APIRouter()


@router.get("/my-stock", response_model=list[CustomerStockItem])
async def get_my_stock(
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    View your inventory stock.
    Shows per-material summary: total received, consumed, wasted, returned, and remaining.
    """
    svc = InventoryService(db)
    return await svc.get_customer_stock(current_user.id)


@router.get("/my-stock/{material_id}", response_model=CustomerMaterialDetailResponse)
async def get_my_material_detail(
    material_id: UUID,
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Detail view of a specific material in your inventory.
    Shows all batches and full transaction history.
    """
    svc = InventoryService(db)
    result = await svc.get_customer_material_detail(current_user.id, material_id)
    if not result:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Material not found")
    return result
