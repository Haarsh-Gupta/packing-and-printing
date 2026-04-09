from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.modules.auth import get_current_user
from app.modules.auth.schemas import TokenData
from app.modules.settings.models import SiteSettings
from app.modules.settings.schemas import SiteSettingsResponse, SiteSettingsUpdate

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=SiteSettingsResponse)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Retrieve global settings. Admins only mostly, but allowed for global read."""
    if not current_user.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized")
        
    settings = (await db.execute(select(SiteSettings))).scalar_one_or_none()
    if not settings:
        settings = SiteSettings()
        db.add(settings)
        await db.flush()
        await db.commit()
    return settings

@router.put("", response_model=SiteSettingsResponse)
async def update_settings(
    payload: SiteSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Update global settings. Admins only."""
    if not current_user.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
    settings = (await db.execute(select(SiteSettings))).scalar_one_or_none()
    if not settings:
        settings = SiteSettings()
        db.add(settings)
        
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(settings, key, value)
        
    await db.commit()
    return settings
