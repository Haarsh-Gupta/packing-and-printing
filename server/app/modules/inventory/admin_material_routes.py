import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.auth import get_current_admin_user
from app.modules.users.models import User
from app.modules.inventory.models import MaterialType
from app.modules.inventory.schemas import (
    MaterialCreate, MaterialUpdate, MaterialResponse,
)
from app.modules.inventory.services import InventoryService

logger = logging.getLogger("app.modules.inventory.admin.materials")

router = APIRouter()


@router.post("/", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def create_material(
    data: MaterialCreate,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new material definition (e.g., '100 GSM Art Paper')."""
    svc = InventoryService(db)
    material = await svc.create_material(data)
    await db.commit()
    return material


@router.get("/", response_model=list[MaterialResponse])
async def list_materials(
    category: MaterialType | None = Query(None, description="Filter by material category"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all material definitions with optional category filter."""
    svc = InventoryService(db)
    return await svc.get_materials(category=category, skip=skip, limit=limit)


@router.get("/{material_id}", response_model=MaterialResponse)
async def get_material(
    material_id: UUID,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single material definition."""
    svc = InventoryService(db)
    material = await svc.get_material(material_id)
    if not material:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Material not found")
    return material


@router.patch("/{material_id}", response_model=MaterialResponse)
async def update_material(
    material_id: UUID,
    data: MaterialUpdate,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Update material definition (name, category, uom, attributes)."""
    svc = InventoryService(db)
    material = await svc.update_material(material_id, data)
    if not material:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Material not found")
    await db.commit()
    return material


@router.delete("/{material_id}")
async def delete_material(
    material_id: UUID,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a material definition.
    Blocked by DB RESTRICT constraint if inventory batches exist for this material.
    """
    svc = InventoryService(db)
    try:
        result = await svc.delete_material(material_id)
        if not result:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Material not found")
        await db.commit()
    except Exception as e:
        if "RESTRICT" in str(e) or "foreign key" in str(e).lower():
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "Cannot delete material — inventory batches exist for it.",
            )
        raise
    return {"message": "Material deleted successfully"}
