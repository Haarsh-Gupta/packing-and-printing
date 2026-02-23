"""
Support ticket models — Ticket + threaded TicketMessage with read tracking.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, func , Uuid , text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Uuid, primary_key=True, server_default=text("uuidv7()"))
    user_id = Column(Uuid, ForeignKey("users.id"), nullable=False, index=True)
    subject = Column(String(300), nullable=False)
    status = Column(String, default="OPEN", nullable=False)        # OPEN, IN_PROGRESS, RESOLVED, CLOSED
    priority = Column(String, default="MEDIUM", nullable=False)    # LOW, MEDIUM, HIGH, URGENT
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    messages = relationship("TicketMessage", back_populates="ticket", cascade="all, delete-orphan",
                            order_by="TicketMessage.created_at")

    def __repr__(self):
        return f"Ticket(id={self.id}, user_id={self.user_id}, status={self.status})"


class TicketMessage(Base):
    __tablename__ = "ticket_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ticket_id = Column(Uuid, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(Uuid, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    ticket = relationship("Ticket", back_populates="messages")
    sender = relationship("User")

    def __repr__(self):
        return f"TicketMessage(id={self.id}, ticket_id={self.ticket_id}, is_read={self.is_read})"
