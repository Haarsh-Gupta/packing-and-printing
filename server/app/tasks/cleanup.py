import asyncio
import logging
from datetime import datetime, timezone, timedelta
from celery import shared_task
from sqlalchemy import select, delete, update
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.modules.inquiry.models import InquiryGroup, InquiryItem, QuoteVersion
from app.modules.users.models import User
from app.core.email.service import get_email_service

logger = logging.getLogger(__name__)

# Add to celery beat schedule:
# "cleanup-drafts-nightly": {"task": "app.tasks.cleanup.cleanup_stale_drafts", "schedule": crontab(hour=2, minute=0)}
# "expire-quotes-hourly":   {"task": "app.tasks.cleanup.expire_stale_quotes",  "schedule": crontab(minute=0)}
# "purge-expired-weekly":   {"task": "app.tasks.cleanup.purge_expired_drafts",  "schedule": crontab(hour=3, minute=0, day_of_week=0)}


async def _cleanup_stale_drafts():
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    sixty_days_ago  = now - timedelta(days=60)
    warning_cutoff  = now - timedelta(days=53)  # warn 7 days before 60-day expiry

    async with AsyncSessionLocal() as db:
        # Hard-delete empty drafts > 30 days
        await db.execute(delete(InquiryGroup).where(
            InquiryGroup.status == "DRAFT",
            InquiryGroup.created_at < thirty_days_ago,
            ~(select(InquiryItem.id).where(InquiryItem.group_id == InquiryGroup.id).exists()),
        ))

        # Warn users with drafts between 53–60 days old
        result = await db.execute(
            select(InquiryGroup).options(selectinload(InquiryGroup.user)).where(
                InquiryGroup.status == "DRAFT",
                InquiryGroup.created_at < warning_cutoff,
                InquiryGroup.created_at >= sixty_days_ago,
            )
        )
        warn_candidates = result.scalars().all()

        for group in warn_candidates:
            if group.user and group.user.email:
                days_left = 60 - (now - group.created_at.replace(tzinfo=timezone.utc)).days
                try:
                    email_svc = get_email_service()
                    await email_svc.send_email(
                        to=group.user.email,
                        subject="Your saved inquiry draft will expire soon",
                        body_html=f"<p>Your inquiry draft expires in <strong>{days_left} days</strong>. <a href='https://bookbind.in/inquiries'>Log in to submit it.</a></p>",
                    )
                except Exception as e:
                    logger.warning(f"Failed to send expiry warning for {group.id}: {e}")

        # Expire drafts with items > 60 days
        await db.execute(update(InquiryGroup).where(
            InquiryGroup.status == "DRAFT",
            InquiryGroup.created_at < sixty_days_ago,
        ).values(status="EXPIRED"))

        await db.commit()


async def _expire_stale_quotes():
    now = datetime.now(timezone.utc)

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(QuoteVersion).where(
                QuoteVersion.status == "PENDING_REVIEW",
                QuoteVersion.valid_until < now,
            )
        )
        stale = result.scalars().all()

        for quote in stale:
            quote.status = "EXPIRED"

        affected_ids = {q.inquiry_id for q in stale}
        for inquiry_id in affected_ids:
            inquiry = await db.get(InquiryGroup, inquiry_id)
            if not inquiry or inquiry.status not in ("QUOTED", "NEGOTIATING"):
                continue
            still_active = (await db.execute(
                select(QuoteVersion).where(
                    QuoteVersion.inquiry_id == inquiry_id,
                    QuoteVersion.status == "PENDING_REVIEW",
                )
            )).scalar_one_or_none()
            if not still_active:
                inquiry.status = "EXPIRED"
                inquiry.active_quote_id = None
                try:
                    user = await db.get(User, inquiry.user_id)
                    if user and user.email:
                        email_svc = get_email_service()
                        await email_svc.send_email(
                            to=user.email,
                            subject="Your quotation has expired",
                            body_html="<p>Your quotation has expired. Contact us for a new quote.</p>",
                        )
                except Exception as e:
                    logger.warning(f"Failed to send expiry email for {inquiry_id}: {e}")

        await db.commit()


async def _purge_expired_drafts():
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    async with AsyncSessionLocal() as db:
        result = await db.execute(delete(InquiryGroup).where(
            InquiryGroup.status == "EXPIRED",
            InquiryGroup.updated_at < cutoff,
        ))
        await db.commit()
    logger.info(f"Purged {result.rowcount} expired inquiry groups")


# ── Celery entry points ─────────────────────────────────────────────────

@shared_task(name="app.tasks.cleanup.cleanup_stale_drafts")
def cleanup_stale_drafts():
    asyncio.run(_cleanup_stale_drafts())


@shared_task(name="app.tasks.cleanup.expire_stale_quotes")
def expire_stale_quotes():
    asyncio.run(_expire_stale_quotes())


@shared_task(name="app.tasks.cleanup.purge_expired_drafts")
def purge_expired_drafts():
    asyncio.run(_purge_expired_drafts())