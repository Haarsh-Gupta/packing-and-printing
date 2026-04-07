from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List
from app.core.database import get_db
from app.modules.seo.models import SEOConfig
from app.modules.seo.schemas import SEOConfigCreate, SEOConfigUpdate, SEOConfigResponse
from app.modules.auth.auth import get_current_admin_user

router = APIRouter()

@router.get("/configs", response_model=List[SEOConfigResponse])
async def list_seo_configs(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin_user)
):
    """List all SEO configurations (Admin only)."""
    stmt = select(SEOConfig)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/config", response_model=SEOConfigResponse)
async def create_seo_config(
    config: SEOConfigCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin_user)
):
    """Create a new SEO configuration for a path (Admin only)."""
    # Check if path already exists
    stmt = select(SEOConfig).where(SEOConfig.path == config.path)
    if (await db.execute(stmt)).scalar_one_or_none():
         raise HTTPException(status_code=400, detail="Config for this path already exists")
         
    new_config = SEOConfig(**config.model_dump())
    db.add(new_config)
    await db.commit()
    await db.refresh(new_config)
    return new_config

@router.put("/config/{config_id}", response_model=SEOConfigResponse)
async def update_seo_config(
    config_id: int,
    config_update: SEOConfigUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin_user)
):
    """Update an existing SEO configuration (Admin only)."""
    stmt = select(SEOConfig).where(SEOConfig.id == config_id)
    result = await db.execute(stmt)
    db_config = result.scalar_one_or_none()
    
    if not db_config:
         raise HTTPException(status_code=404, detail="SEO configuration not found")
    
    update_data = config_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_config, key, value)
        
    await db.commit()
    await db.refresh(db_config)
    return db_config

@router.delete("/config/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_seo_config(
    config_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin_user)
):
    """Delete an SEO configuration (Admin only)."""
    stmt = select(SEOConfig).where(SEOConfig.id == config_id)
    result = await db.execute(stmt)
    db_config = result.scalar_one_or_none()
    
    if not db_config:
         raise HTTPException(status_code=404, detail="SEO configuration not found")
         
    await db.delete(db_config)
    await db.commit()
    return None
