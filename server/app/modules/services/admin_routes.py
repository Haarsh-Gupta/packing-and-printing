from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession 
from sqlalchemy import select
from app.core.database import get_db
from app.modules.auth.auth import get_current_admin_user
from app.modules.users.models import User
from app.modules.services.models import Service, SubService
from app.modules.services.schemas import (
    ServiceCreate, ServiceUpdate, 
    SubServiceCreate, SubServiceUpdate,
    ServiceResponse, SubServiceResponse 
)

router = APIRouter()

@router.post("/", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_service(
    service_in: ServiceCreate, 
    current_user: User = Depends(get_current_admin_user), 
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Service).where(
        (Service.slug == service_in.slug) |
        (Service.name == service_in.name) # schema validator already lowers these
    )
    if (await db.execute(stmt)).scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Service with this name or slug already exists"
        )
    
    new_service = Service(**service_in.model_dump())
    db.add(new_service)
    await db.commit()
    await db.refresh(new_service)
    return new_service

# Changed to PATCH because we are doing partial updates
@router.patch("/{slug}", response_model=ServiceResponse)
async def update_service(
    slug: str, 
    service_in: ServiceUpdate, 
    current_user: User = Depends(get_current_admin_user), 
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Service).where(Service.slug == slug)
    existing_service = (await db.execute(stmt)).scalar_one_or_none() 

    if not existing_service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    
    # Check for uniqueness conflicts if name/slug is being updated
    if service_in.slug or service_in.name:
        conflict_stmt = select(Service).where(
            ((Service.slug == service_in.slug) | (Service.name == service_in.name)) & 
            (Service.id != existing_service.id)
        )
        if (await db.execute(conflict_stmt)).scalar_one_or_none():
             raise HTTPException(status_code=400, detail="Name or slug already taken by another service")

    update_data = service_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(existing_service, key, value)
    
    db.add(existing_service)
    await db.commit()
    await db.refresh(existing_service)
    return existing_service

@router.get("/", response_model=List[ServiceResponse])
async def get_services(
    skip: int = 0, 
    limit: int = 10,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_admin_user), 
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Service)
    if is_active is not None:
        stmt = stmt.where(Service.is_active == is_active)
    stmt = stmt.offset(skip).limit(limit)
    
    return (await db.execute(stmt)).scalars().all()

@router.post("/{slug}/variants", response_model=SubServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_service_variant(
    slug: str, 
    subservice_in: SubServiceCreate, 
    current_user: User = Depends(get_current_admin_user), 
    db: AsyncSession = Depends(get_db)
):
    # Check if parent service exists
    service = (await db.execute(select(Service).where(Service.slug == slug))).scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent service not found")
    
    # Check if SubService slug already exists globally
    conflict = (await db.execute(select(SubService).where(SubService.slug == subservice_in.slug))).scalar_one_or_none()
    if conflict:
         raise HTTPException(status_code=400, detail="Variant with this slug already exists")
    
    new_variant = SubService(**subservice_in.model_dump(), service_id=service.id)
    db.add(new_variant)
    await db.commit()
    await db.refresh(new_variant)
    return new_variant


@router.patch("/{slug}/variants/{subservice_id}", response_model=SubServiceResponse)
async def update_service_variant(
    slug: str, 
    subservice_id: int, 
    subservice_in: SubServiceUpdate, 
    current_user: User = Depends(get_current_admin_user), 
    db: AsyncSession = Depends(get_db)
):
    # FIXED: Ensure the variant actually belongs to the provided service slug!
    stmt = (
        select(SubService)
        .join(SubService.service)
        .where(Service.slug == slug, SubService.id == subservice_id)
    )
    existing_variant = (await db.execute(stmt)).scalar_one_or_none() 

    if not existing_variant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service variant not found")
    
    # Check uniqueness if slug is updated
    if subservice_in.slug:
         conflict = (await db.execute(
             select(SubService).where((SubService.slug == subservice_in.slug) & (SubService.id != subservice_id))
         )).scalar_one_or_none()
         if conflict:
              raise HTTPException(status_code=400, detail="Slug already taken")

    update_data = subservice_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(existing_variant, key, value)
    
    db.add(existing_variant)
    await db.commit()
    await db.refresh(existing_variant)
    return existing_variant

@router.get("/{slug}/variants", response_model=List[SubServiceResponse])
async def get_service_variants(
    slug: str, 
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(SubService).join(SubService.service).where(Service.slug == slug)
    if is_active is not None:
        stmt = stmt.where(SubService.is_active == is_active)
    
    return (await db.execute(stmt)).scalars().all()

@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(
    slug: str, 
    current_user: User = Depends(get_current_admin_user), 
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Service).where(Service.slug == slug)
    service = (await db.execute(stmt)).scalar_one_or_none()

    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    
    await db.delete(service)
    await db.commit()

@router.delete("/{slug}/variants/{subservice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service_variant(
    slug: str, 
    subservice_id: int, 
    current_user: User = Depends(get_current_admin_user), 
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(SubService)
        .join(SubService.service)
        .where(Service.slug == slug, SubService.id == subservice_id)
    )
    variant = (await db.execute(stmt)).scalar_one_or_none()
    
    if not variant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service variant not found")
    
    await db.delete(variant)
    await db.commit()