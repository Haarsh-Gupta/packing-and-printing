from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.modules.seo.models import SEOConfig
from app.modules.seo.schemas import SEOConfigResponse

router = APIRouter()

@router.get("/config", response_model=SEOConfigResponse)
async def get_seo_data(path: str, db: AsyncSession = Depends(get_db)):
    """Fetch SEO metadata for a specific URL path."""
    stmt = select(SEOConfig).where(SEOConfig.path == path)
    result = await db.execute(stmt)
    seo_data = result.scalar_one_or_none()

    if not seo_data:
        raise HTTPException(status_code=404, detail="SEO configuration not found")
    return seo_data
