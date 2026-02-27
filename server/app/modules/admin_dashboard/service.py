"""
Admin Dashboard Service

Encapsulates all DB aggregation queries for the dashboard endpoints.
Each method returns a plain dict ready to serialize as JSON.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Literal

from sqlalchemy import select, func, case, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import User
from app.modules.orders.models import Order, Transaction
from app.modules.inquiry.models import InquiryGroup, InquiryItem, InquiryMessage
from app.modules.products.models import SubProduct
from app.modules.services.models import Service


PeriodType = Literal["today", "week", "month", "quarter", "year", "all"]


def _period_start(period: PeriodType) -> Optional[datetime]:
    """Return the UTC-aware start datetime for a given period filter."""
    now = datetime.now(timezone.utc)
    match period:
        case "today":
            return now.replace(hour=0, minute=0, second=0, microsecond=0)
        case "week":
            return now - timedelta(days=7)
        case "month":
            return now - timedelta(days=30)
        case "quarter":
            return now - timedelta(days=90)
        case "year":
            return now - timedelta(days=365)
        case _:
            return None


class DashboardService:

    def __init__(self, db: AsyncSession):
        self.db = db

    # ------------------------------------------------------------------ #
    #  1.  OVERVIEW
    # ------------------------------------------------------------------ #
    async def get_overview(self, period: PeriodType = "all") -> dict:
        start = _period_start(period)

        # --- Users ---
        total_users = (await self.db.execute(
            select(func.count(User.id))
        )).scalar() or 0

        new_users = 0
        if start:
            new_users = (await self.db.execute(
                select(func.count(User.id)).where(User.created_at >= start)
            )).scalar() or 0

        # --- Orders ---
        total_orders = (await self.db.execute(
            select(func.count(Order.id))
        )).scalar() or 0

        orders_in_period = 0
        if start:
            orders_in_period = (await self.db.execute(
                select(func.count(Order.id)).where(Order.created_at >= start)
            )).scalar() or 0

        status_rows = (await self.db.execute(
            select(Order.status, func.count(Order.id)).group_by(Order.status)
        )).all()
        orders_by_status = {row[0]: row[1] for row in status_rows}

        # --- Revenue ---
        rev = (await self.db.execute(
            select(
                func.coalesce(func.sum(Order.total_amount), 0),
                func.coalesce(func.sum(Order.amount_paid), 0),
            )
        )).one()
        total_billed = float(rev[0])
        total_collected = float(rev[1])
        total_pending = total_billed - total_collected

        collected_in_period = 0.0
        if start:
            collected_in_period = float((await self.db.execute(
                select(func.coalesce(func.sum(Transaction.amount), 0))
                .where(Transaction.created_at >= start)
            )).scalar())

        # --- Inquiries ---
        total_inquiries = (await self.db.execute(
            select(func.count(InquiryGroup.id))
        )).scalar() or 0

        pending_inquiries = (await self.db.execute(
            select(func.count(InquiryGroup.id)).where(InquiryGroup.status == "PENDING")
        )).scalar() or 0

        inquiries_in_period = 0
        if start:
            inquiries_in_period = (await self.db.execute(
                select(func.count(InquiryGroup.id)).where(InquiryGroup.created_at >= start)
            )).scalar() or 0

        # --- Products & Services ---
        total_products = (await self.db.execute(
            select(func.count(SubProduct.id))
        )).scalar() or 0
        active_products = (await self.db.execute(
            select(func.count(SubProduct.id)).where(SubProduct.is_active == True)
        )).scalar() or 0

        total_services = (await self.db.execute(
            select(func.count(Service.id))
        )).scalar() or 0
        active_services = (await self.db.execute(
            select(func.count(Service.id)).where(Service.is_active == True)
        )).scalar() or 0

        return {
            "users": {"total": total_users, "new_in_period": new_users},
            "orders": {
                "total": total_orders,
                "in_period": orders_in_period,
                "by_status": orders_by_status,
            },
            "revenue": {
                "total_billed": total_billed,
                "total_collected": total_collected,
                "total_pending": total_pending,
                "collected_in_period": collected_in_period,
            },
            "inquiries": {
                "total": total_inquiries,
                "pending": pending_inquiries,
                "in_period": inquiries_in_period,
            },
            "products": {"total": total_products, "active": active_products},
            "services": {"total": total_services, "active": active_services},
        }

    # ------------------------------------------------------------------ #
    #  2.  REVENUE & PAYMENTS
    # ------------------------------------------------------------------ #
    async def get_revenue(self, period: PeriodType = "all") -> dict:
        start = _period_start(period)

        # Totals
        rev = (await self.db.execute(
            select(
                func.coalesce(func.sum(Order.total_amount), 0),
                func.coalesce(func.sum(Order.amount_paid), 0),
            )
        )).one()
        total_billed = float(rev[0])
        total_collected = float(rev[1])

        # Collected in period
        txn_filter = select(func.coalesce(func.sum(Transaction.amount), 0))
        if start:
            txn_filter = txn_filter.where(Transaction.created_at >= start)
        collected_in_period = float((await self.db.execute(txn_filter)).scalar())

        # By payment mode
        mode_q = select(
            Transaction.payment_mode,
            func.coalesce(func.sum(Transaction.amount), 0),
        ).group_by(Transaction.payment_mode)
        if start:
            mode_q = mode_q.where(Transaction.created_at >= start)
        mode_rows = (await self.db.execute(mode_q)).all()
        by_payment_mode = {row[0]: float(row[1]) for row in mode_rows}

        # Daily collection trend
        trend_q = select(
            func.date(Transaction.created_at).label("date"),
            func.coalesce(func.sum(Transaction.amount), 0),
        ).group_by(func.date(Transaction.created_at)).order_by(func.date(Transaction.created_at))
        if start:
            trend_q = trend_q.where(Transaction.created_at >= start)
        trend_rows = (await self.db.execute(trend_q)).all()
        collection_trend = [
            {"date": str(row[0]), "amount": float(row[1])} for row in trend_rows
        ]

        # Top 10 unpaid orders
        unpaid_q = (
            select(
                Order.id,
                User.email,
                User.name,
                (Order.total_amount - Order.amount_paid).label("pending"),
            )
            .join(User, User.id == Order.user_id)
            .where(Order.total_amount > Order.amount_paid)
            .where(Order.status.notin_(["CANCELLED", "COMPLETED"]))
            .order_by(desc("pending"))
            .limit(10)
        )
        unpaid_rows = (await self.db.execute(unpaid_q)).all()
        top_unpaid = [
            {"order_id": r[0], "user_email": r[1], "user_name": r[2], "pending": float(r[3])}
            for r in unpaid_rows
        ]

        return {
            "total_billed": total_billed,
            "total_collected": total_collected,
            "total_pending": total_billed - total_collected,
            "collected_in_period": collected_in_period,
            "by_payment_mode": by_payment_mode,
            "collection_trend": collection_trend,
            "top_unpaid_orders": top_unpaid,
        }

    # ------------------------------------------------------------------ #
    #  3.  USER ANALYTICS
    # ------------------------------------------------------------------ #
    async def get_users(self, period: PeriodType = "all") -> dict:
        start = _period_start(period)

        total = (await self.db.execute(select(func.count(User.id)))).scalar() or 0
        admins = (await self.db.execute(
            select(func.count(User.id)).where(User.admin == True)
        )).scalar() or 0

        new_in_period = 0
        if start:
            new_in_period = (await self.db.execute(
                select(func.count(User.id)).where(User.created_at >= start)
            )).scalar() or 0

        # Signup trend
        trend_q = (
            select(
                func.date(User.created_at).label("date"),
                func.count(User.id),
            )
            .group_by(func.date(User.created_at))
            .order_by(func.date(User.created_at))
        )
        if start:
            trend_q = trend_q.where(User.created_at >= start)
        trend_rows = (await self.db.execute(trend_q)).all()
        signup_trend = [{"date": str(r[0]), "count": r[1]} for r in trend_rows]

        # Top 10 users by order count & total spent
        top_q = (
            select(
                User.id, User.name, User.email,
                func.count(Order.id).label("order_count"),
                func.coalesce(func.sum(Order.amount_paid), 0).label("total_spent"),
            )
            .join(Order, Order.user_id == User.id)
            .group_by(User.id, User.name, User.email)
            .order_by(desc("total_spent"))
            .limit(10)
        )
        top_rows = (await self.db.execute(top_q)).all()
        top_users = [
            {
                "user_id": r[0], "name": r[1], "email": r[2],
                "order_count": r[3], "total_spent": float(r[4]),
            }
            for r in top_rows
        ]

        return {
            "total_users": total,
            "admins": admins,
            "new_in_period": new_in_period,
            "signup_trend": signup_trend,
            "top_users_by_orders": top_users,
        }

    # ------------------------------------------------------------------ #
    #  4.  ORDER ANALYTICS
    # ------------------------------------------------------------------ #
    async def get_orders(self, period: PeriodType = "all") -> dict:
        start = _period_start(period)

        total = (await self.db.execute(select(func.count(Order.id)))).scalar() or 0

        in_period = 0
        if start:
            in_period = (await self.db.execute(
                select(func.count(Order.id)).where(Order.created_at >= start)
            )).scalar() or 0

        # By status
        status_rows = (await self.db.execute(
            select(Order.status, func.count(Order.id)).group_by(Order.status)
        )).all()
        by_status = {r[0]: r[1] for r in status_rows}

        # Average order value
        avg_val = (await self.db.execute(
            select(func.coalesce(func.avg(Order.total_amount), 0))
        )).scalar()

        # Daily trend
        trend_q = (
            select(
                func.date(Order.created_at).label("date"),
                func.count(Order.id),
                func.coalesce(func.sum(Order.total_amount), 0),
            )
            .group_by(func.date(Order.created_at))
            .order_by(func.date(Order.created_at))
        )
        if start:
            trend_q = trend_q.where(Order.created_at >= start)
        trend_rows = (await self.db.execute(trend_q)).all()
        order_trend = [
            {"date": str(r[0]), "count": r[1], "value": float(r[2])} for r in trend_rows
        ]

        return {
            "total": total,
            "in_period": in_period,
            "by_status": by_status,
            "avg_order_value": round(float(avg_val), 2),
            "order_trend": order_trend,
        }

    # ------------------------------------------------------------------ #
    #  5.  INQUIRY ANALYTICS
    # ------------------------------------------------------------------ #
    async def get_inquiries(self, period: PeriodType = "all") -> dict:
        start = _period_start(period)

        total = (await self.db.execute(select(func.count(InquiryGroup.id)))).scalar() or 0

        in_period = 0
        if start:
            in_period = (await self.db.execute(
                select(func.count(InquiryGroup.id)).where(InquiryGroup.created_at >= start)
            )).scalar() or 0

        # By status
        status_rows = (await self.db.execute(
            select(InquiryGroup.status, func.count(InquiryGroup.id)).group_by(InquiryGroup.status)
        )).all()
        by_status = {r[0]: r[1] for r in status_rows}

        # Conversion rate
        accepted = by_status.get("ACCEPTED", 0)
        conversion_rate = round((accepted / total * 100), 1) if total > 0 else 0.0

        # Average quoted price
        avg_quoted = (await self.db.execute(
            select(func.coalesce(func.avg(InquiryGroup.total_quoted_price), 0))
            .where(InquiryGroup.total_quoted_price.isnot(None))
        )).scalar()

        # Popular products (top 10 by inquiry item count)
        popular_q = (
            select(
                SubProduct.id,
                SubProduct.name,
                func.count(InquiryItem.id).label("inquiry_count"),
            )
            .join(InquiryItem, InquiryItem.subproduct_id == SubProduct.id)
            .group_by(SubProduct.id, SubProduct.name)
            .order_by(desc("inquiry_count"))
            .limit(10)
        )
        popular_rows = (await self.db.execute(popular_q)).all()
        popular_products = [
            {"template_id": r[0], "name": r[1], "inquiry_count": r[2]}
            for r in popular_rows
        ]

        return {
            "total": total,
            "in_period": in_period,
            "by_status": by_status,
            "conversion_rate": conversion_rate,
            "avg_quoted_price": round(float(avg_quoted), 2),
            "popular_products": popular_products,
        }

    # ------------------------------------------------------------------ #
    #  6.  RECENT ACTIVITY
    # ------------------------------------------------------------------ #
    async def get_recent_activity(self, limit: int = 20) -> dict:
        activities = []

        # Recent users
        users = (await self.db.execute(
            select(User.name, User.email, User.created_at)
            .order_by(desc(User.created_at)).limit(limit)
        )).all()
        for u in users:
            activities.append({
                "type": "NEW_USER",
                "description": f"{u[0] or u[1]} signed up",
                "timestamp": u[2].isoformat() if u[2] else None,
            })

        # Recent orders
        orders = (await self.db.execute(
            select(Order.id, Order.total_amount, Order.status, Order.created_at)
            .order_by(desc(Order.created_at)).limit(limit)
        )).all()
        for o in orders:
            activities.append({
                "type": "NEW_ORDER",
                "description": f"Order #{o[0]} created (₹{o[1]:,.0f}) — {o[2]}",
                "timestamp": o[3].isoformat() if o[3] else None,
            })

        # Recent transactions
        txns = (await self.db.execute(
            select(Transaction.order_id, Transaction.amount, Transaction.payment_mode, Transaction.created_at)
            .order_by(desc(Transaction.created_at)).limit(limit)
        )).all()
        for t in txns:
            activities.append({
                "type": "PAYMENT",
                "description": f"₹{t[1]:,.0f} received for Order #{t[0]} via {t[2]}",
                "timestamp": t[3].isoformat() if t[3] else None,
            })

        # Recent inquiries
        inqs = (await self.db.execute(
            select(InquiryGroup.id, InquiryGroup.status, InquiryGroup.created_at)
            .order_by(desc(InquiryGroup.created_at)).limit(limit)
        )).all()
        for i in inqs:
            activities.append({
                "type": "NEW_INQUIRY",
                "description": f"Inquiry #{i[0]} — {i[1]}",
                "timestamp": i[2].isoformat() if i[2] else None,
            })

        # Sort all by timestamp descending, take top N
        activities.sort(key=lambda x: x["timestamp"] or "", reverse=True)
        return {"activities": activities[:limit]}
