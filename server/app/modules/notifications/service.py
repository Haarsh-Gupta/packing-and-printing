from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.users.models import User
from app.modules.notifications.models import Notification
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    async def notify_admins(
        db: AsyncSession, 
        title: str, 
        message: str, 
        metadata: dict = None,
        sender_name: str = None,
        is_admin: bool = False
    ):
        """Create a persistent notification for all admin users."""
        try:
            final_message = message
            # Prepend sender name only if sender is NOT an admin
            if sender_name and not is_admin:
                if sender_name not in message:
                    final_message = f"{sender_name}: {message}"

            # Find all admins
            result = await db.execute(select(User).where(User.admin == True))
            admins = result.scalars().all()
            
            if not admins:
                logger.warning("No admins found to notify")
                return
                
            for admin in admins:
                notif = Notification(
                    user_id=admin.id,
                    title=title,
                    message=final_message,
                    metadata_=metadata
                )
                db.add(notif)
            
            # We don't commit here; let the caller handle the transaction
        except Exception as e:
            logger.error(f"Failed to notify admins: {e}")

    @staticmethod
    async def notify_user(
        db: AsyncSession,
        user_id,
        title: str,
        message: str,
        metadata: dict = None,
        sender_name: str = None,
        is_admin: bool = False
    ):
        """Create a persistent notification for a specific user."""
        try:
            final_message = message
            # Prepend sender name only if sender is NOT an admin
            if sender_name and not is_admin:
                if sender_name not in message:
                    final_message = f"{sender_name}: {message}"

            notif = Notification(
                user_id=user_id,
                title=title,
                message=final_message,
                metadata_=metadata
            )
            db.add(notif)
        except Exception as e:
            logger.error(f"Failed to notify user: {e}")

    @staticmethod
    async def lazy_cleanup(db: AsyncSession, user_id):
        """
        Delete notifications that are read and older than 24 hours for a specific user.
        This keeps the table slim since these are 'temporary' alerts.
        """
        try:
            from sqlalchemy import delete, and_
            from datetime import datetime, timedelta, timezone
            
            # Simple policy: Delete read notifications older than 1 day
            threshold = datetime.now(timezone.utc) - timedelta(days=1)
            stmt = delete(Notification).where(
                and_(
                    Notification.user_id == user_id,
                    Notification.is_read == True,
                    Notification.created_at < threshold
                )
            )
            result = await db.execute(stmt)
            logger.info(f"Lazy cleanup for user {user_id}: deleted {result.rowcount} old read notifications")
        except Exception as e:
            logger.error(f"Cleanup failed: {e}")
