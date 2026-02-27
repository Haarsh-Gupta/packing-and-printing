from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession 
from sqlalchemy import select
from app.core.database import get_db
# Ensure auth and models are correctly imported
from app.modules.services.models import Service, SubService
from app.modules.services.schemas import ServiceResponse, SubServiceResponse 

router = APIRouter()

@router.get("/", response_model=List[ServiceResponse])
async def get_services(
    skip: int = 0, 
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    # selectinload is handled automatically by the model's lazy="selectin"
    stmt = select(Service).where(Service.is_active == True).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{slug}", response_model=ServiceResponse)
async def get_service(slug: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Service).where(Service.slug == slug)
    result = await db.execute(stmt)
    service = result.scalar_one_or_none()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Service not found"
        )
    return service

@router.get("/{slug}/variants", response_model=List[SubServiceResponse])
async def get_all_service_variants(
    slug: str,
    skip: int = 0, 
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    # Fetch and paginate SubServices, not the Service
    stmt = (
        select(SubService)
        .join(SubService.service)
        .where(Service.slug == slug, Service.is_active == True)
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    variants = result.scalars().all()
    
    return variants

@router.get("/{service_slug}/variants/{subservice_slug}", response_model=SubServiceResponse)
async def get_service_variant(
    service_slug: str,   # Path variable name now matches exactly
    subservice_slug: str,
    db: AsyncSession = Depends(get_db)
):
    # Use .join() to link the tables for filtering
    stmt = (
        select(SubService)
        .join(SubService.service)
        .where(
            Service.slug == service_slug, 
            SubService.slug == subservice_slug, 
            SubService.is_active == True
        )
    )
    
    result = await db.execute(stmt)
    variant = result.scalar_one_or_none()

    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Service variant not found"
        )
    return variant