"""
Admin Dashboard Routes

All endpoints are GET-only, admin-protected, and accept an optional
`?period=today|week|month|quarter|year|all` query parameter.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth import get_current_admin_user
from app.modules.users.models import User
from .service import DashboardService, PeriodType

router = APIRouter()


@router.get("/overview")
async def dashboard_overview(
    period: PeriodType = Query("all", description="Time filter"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    """One-shot business snapshot: users, orders, revenue, inquiries, products, services."""
    svc = DashboardService(db)
    return await svc.get_overview(period)


@router.get("/revenue")
async def dashboard_revenue(
    period: PeriodType = Query("all", description="Time filter"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    """Financial breakdown: billed/collected/pending, payment modes, daily trend, top unpaid."""
    svc = DashboardService(db)
    return await svc.get_revenue(period)


@router.get("/users")
async def dashboard_users(
    period: PeriodType = Query("all", description="Time filter"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    """User growth: signups, trend, top spenders."""
    svc = DashboardService(db)
    return await svc.get_users(period)


@router.get("/orders")
async def dashboard_orders(
    period: PeriodType = Query("all", description="Time filter"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    """Order pipeline: status breakdown, avg value, daily trend."""
    svc = DashboardService(db)
    return await svc.get_orders(period)


@router.get("/inquiries")
async def dashboard_inquiries(
    period: PeriodType = Query("all", description="Time filter"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    """Inquiry pipeline: status breakdown, conversion rate, popular products."""
    svc = DashboardService(db)
    return await svc.get_inquiries(period)


@router.get("/recent-activity")
async def dashboard_recent_activity(
    limit: int = Query(20, ge=1, le=100, description="Number of recent events"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin_user),
):
    """Chronological feed of latest events (signups, orders, payments, inquiries)."""
    svc = DashboardService(db)
    return await svc.get_recent_activity(limit)
