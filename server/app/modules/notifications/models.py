"""
Notification model — admin-to-user messages with read tracking.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, func, Uuid, JSON
from app.core.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Uuid, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    metadata_ = Column("metadata", JSON, nullable=True)


    def __repr__(self):
        return f"Notification(id={self.id}, user_id={self.user_id}, is_read={self.is_read})"


class EmailLog(Base):
    """
    Log of emails sent via Brevo REST API with their delivery status.
    Used for the "Email Logs" dashboard in admin panel.
    """
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    recipient = Column(String, nullable=False, index=True)
    subject = Column(String, nullable=False)
    status = Column(String, default="pending", index=True) # delivered, bounced, opened, clicked, pending
    message_id = Column(String, unique=True, index=True, nullable=True) # Brevo's messageId
    inquiry_id = Column(Uuid, nullable=True, index=True) # Optional link to inquiry
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    metadata_ = Column("metadata", JSON, nullable=True) # e.g. template_id, etc.

    def __repr__(self):
        return f"EmailLog(id={self.id}, to={self.recipient}, status={self.status})"
