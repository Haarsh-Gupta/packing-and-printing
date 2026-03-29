import logging
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, case

from app.modules.users.schemas import UserCreate, UserOut, UserUpdate
from app.modules.users.models import User
from app.core.database import get_db
from app.modules.auth.auth import get_password_hash
from app.modules.auth import get_current_user
from app.modules.auth.schemas import TokenData
from app.modules.otps.services import get_otp_service
from app.core.rate_limiter import RateLimiter
from app.modules.orders.models import Order
from app.modules.inquiry.models import InquiryGroup, InquiryItem

logger = logging.getLogger("app.modules.users")

router = APIRouter()

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):

    # 1. Check if user already exists
    stmt = select(User).where(User.email == user.email)
    result = await db.execute(stmt)
    db_user = result.scalar_one_or_none()

    if db_user:
        logger.warning(f"Registration failed: User with email {user.email} already exists.")
        raise HTTPException(status_code=400, detail="User already exists")

    # 2. Verify OTP (without consuming yet - we'll delete it after user creation)
    otp_service = get_otp_service()
    is_valid = await otp_service.verify_otp(email=user.email, otp=user.otp, consume=False)
    
    if not is_valid:
        logger.warning(f"Registration failed: Invalid or expired OTP for {user.email}.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid or expired OTP"
        )

    data = user.model_dump(exclude={"otp"})
    data["password"] = await get_password_hash(data["password"])

    new_user = User(**data)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # 3. Consume (delete) the OTP only after user is successfully created
    await otp_service.store.delete_otp(user.email)

    return new_user


@router.get("/me" , response_model=UserOut)
async def user_detail(current_user : TokenData = Depends(get_current_user), db : AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.id == current_user.id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return user


# ── Dashboard Stats (MUST be before /{id} to avoid route interception) ──
@router.get("/dashboard-stats")
async def get_dashboard_stats(
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns all dashboard metrics in a single response using efficient SQL aggregation.
    2 aggregate queries + 2 LIMIT 3 queries instead of fetching all rows.
    """
    uid = current_user.id

    # ── 1. Order stats (single aggregate query) ──
    order_stats = (await db.execute(
        select(
            func.count(Order.id).label("total_orders"),
            func.count(case((Order.status.notin_(["COMPLETED", "CANCELLED"]), 1))).label("active_orders"),
            func.count(case((Order.status == "COMPLETED", 1))).label("completed_orders"),
            func.coalesce(func.sum(Order.total_amount), 0).label("total_expenditure"),
            func.coalesce(func.sum(Order.amount_paid), 0).label("total_paid"),
            func.coalesce(
                func.sum(case((Order.status.notin_(["COMPLETED", "CANCELLED", "PAID"]),
                               Order.total_amount - Order.amount_paid))),
                0
            ).label("upcoming_payments"),
        ).where(Order.user_id == uid)
    )).one()

    # ── 2. Inquiry stats (single aggregate query) ──
    pending_inquiry_statuses = ["PENDING", "SUBMITTED", "UNDER_REVIEW", "DRAFT"]
    inquiry_stats = (await db.execute(
        select(
            func.count(InquiryGroup.id).label("total_inquiries"),
            func.count(case((InquiryGroup.status.in_(pending_inquiry_statuses), 1))).label("pending_inquiries"),
        ).where(InquiryGroup.user_id == uid)
    )).one()

    # ── 3. Recent orders (limit 3, lightweight) ──
    recent_orders_result = (await db.execute(
        select(Order)
        .where(Order.user_id == uid)
        .order_by(Order.created_at.desc())
        .limit(3)
    )).scalars().all()

    # BUG-021 FIX: Batch-fetch product names instead of N+1 loop
    inquiry_ids = [o.inquiry_id for o in recent_orders_result]
    items_by_group = {}
    if inquiry_ids:
        items_result = (await db.execute(
            select(InquiryItem)
            .where(InquiryItem.group_id.in_(inquiry_ids))
        )).scalars().all()
        for item in items_result:
            if item.group_id not in items_by_group:
                items_by_group[item.group_id] = item

    recent_orders = []
    for o in recent_orders_result:
        item = items_by_group.get(o.inquiry_id)
        product_name = "Custom Order"
        if item:
            product_name = item.service_name or getattr(item, 'subproduct_name', None) or getattr(item, 'product_name', None) or "Custom Order"
        recent_orders.append({
            "id": str(o.id),
            "order_number": o.order_number,
            "product_name": product_name,
            "total_amount": o.total_amount or 0,
            "amount_paid": o.amount_paid or 0,
            "status": o.status,
            "created_at": o.created_at.isoformat() if o.created_at else None,
        })

    # ── 4. Recent inquiries (limit 3, lightweight) ──
    recent_inquiries_result = (await db.execute(
        select(InquiryGroup)
        .where(InquiryGroup.user_id == uid)
        .order_by(InquiryGroup.created_at.desc())
        .limit(3)
    )).scalars().all()

    recent_inquiries = [{
        "id": str(i.id),
        "display_id": i.display_id,
        "status": i.status,
        "created_at": i.created_at.isoformat() if i.created_at else None,
    } for i in recent_inquiries_result]

    total_exp = float(order_stats.total_expenditure)
    total_paid = float(order_stats.total_paid)

    return {
        "stats": {
            "totalInquiries": inquiry_stats.total_inquiries,
            "pendingInquiries": inquiry_stats.pending_inquiries,
            "totalOrders": order_stats.total_orders,
            "activeOrders": order_stats.active_orders,
            "completedOrders": order_stats.completed_orders,
            "totalExpenditure": total_exp,
            "totalPaid": total_paid,
            "totalRemaining": total_exp - total_paid,
            "upcomingPayments": float(order_stats.upcoming_payments),
        },
        "recentOrders": recent_orders,
        "recentInquiries": recent_inquiries,
    }


# ── User by ID (MUST be after all named routes like /dashboard-stats) ──
@router.get("/{id}" , response_model=UserOut)
async def get_user_by_id(id : UUID , db : AsyncSession = Depends(get_db), current_user: TokenData = Depends(get_current_user)):

    stmt = select(User).where(User.id == id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND , detail="User not found")
    return user


@router.patch("/update", response_model=UserOut)
async def update_user(
    user: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    stmt = select(User).where(User.id == current_user.id)
    result = await db.execute(stmt)
    db_user = result.scalar_one_or_none()

    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND , detail="User not found")
    data = user.model_dump(exclude_unset=True)

    if "password" in data:
        data["password"] = await get_password_hash(data["password"])

    stmt = (
        update(User)
        .where(User.id == current_user.id)
        .values(**data)
        .returning(User)
    )

    result = await db.execute(stmt)
    await db.commit()

    return result.scalar_one()
