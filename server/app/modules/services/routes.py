from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession # FIXED: Correct import
from sqlalchemy import select
from sqlalchemy.orm import selectinload # FIXED: Needed to load variants
from app.core.database import get_db
from app.modules.auth.auth import get_current_active_user
from app.modules.users.models import User
from app.modules.services.models import Service, ServiceVariant
from app.modules.services.schemas import (
    ServiceCreate, ServiceUpdate, 
    ServiceVariantCreate, ServiceVariantUpdate,
    ServiceResponse, ServiceVariantResponse 
)

router = APIRouter()

@router.post("/", response_model=ServiceResponse)
async def create_service(
    service_in: ServiceCreate, # Renamed to avoid confusion
    current_user: User = Depends(get_current_active_user), 
    db: AsyncSession = Depends(get_db)
):
    # FIXED: Use comma for AND, or use & operator
    stmt = select(Service).where(
        (Service.slug == service_in.slug.lower()) & 
        (Service.name == service_in.name.lower())
    )
    result = await db.execute(stmt)
    
    # FIXED: Check scalar properly
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Service already exists"
        )
    
    new_service = Service(**service_in.model_dump())
    db.add(new_service)
    await db.commit()
    await db.refresh(new_service)
    return new_service

@router.get("/", response_model=List[ServiceResponse])
async def get_services(
    skip: int = 0, 
    limit: int = 10, # FIXED: Syntax was 'limit : int : 10'
    db: AsyncSession = Depends(get_db)
):
    # FIXED: Added selectinload to fetch variants efficiently
    stmt = select(Service).options(selectinload(Service.variants)).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{slug}", response_model=ServiceResponse)
async def get_service(slug: str, db: AsyncSession = Depends(get_db)):
    # FIXED: Added selectinload
    stmt = select(Service).options(selectinload(Service.variants)).where(Service.slug == slug)
    result = await db.execute(stmt)
    service = result.scalar_one_or_none()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Service not found"
        )
    
    return service

@router.put("/{slug}", response_model=ServiceResponse)
async def update_service(
    slug: str, 
    service_in: ServiceUpdate, # FIXED: Renamed input variable
    current_user: User = Depends(get_current_active_user), 
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Service).options(selectinload(Service.variants)).where(Service.slug == slug)
    result = await db.execute(stmt)
    existing_service = result.scalar_one_or_none() # FIXED: Renamed DB variable

    if not existing_service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Service not found"
        )
    
    # FIXED: Use service_in (input) not existing_service (db object)
    update_data = service_in.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(existing_service, key, value)
    
    db.add(existing_service)
    await db.commit()
    await db.refresh(existing_service)
    return existing_service

@router.delete("/{slug}", response_model=ServiceResponse)
async def delete_service(
    slug: str, 
    current_user: User = Depends(get_current_active_user), 
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Service).where(Service.slug == slug)
    result = await db.execute(stmt)
    service = result.scalar_one_or_none()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Service not found"
        )
    
    await db.delete(service)
    await db.commit()
    return service

@router.post("/{slug}/variants", response_model=ServiceVariantResponse)
async def create_service_variant(
    slug: str, 
    variant_in: ServiceVariantCreate, 
    current_user: User = Depends(get_current_active_user), 
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Service).where(Service.slug == slug)
    result = await db.execute(stmt)
    service = result.scalar_one_or_none()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Service not found"
        )
    
    new_variant = ServiceVariant(**variant_in.model_dump(), service_id=service.id)
    db.add(new_variant)
    await db.commit()
    await db.refresh(new_variant)
    return new_variant