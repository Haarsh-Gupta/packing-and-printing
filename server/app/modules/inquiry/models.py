from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.core.database import Base


class Inquiry(Base):
    """
    Inquiry model - represents a user's product inquiry/request.
    Admin reviews and sends a quotation with pricing.
    """
    __tablename__ = 'inquiries'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    template_id = Column(Integer, ForeignKey('product_templates.id'), nullable=False)
    
    quantity = Column(Integer, nullable=False)
    
    # Stores the user's selected options as JSON
    # Example: {"binding_type": "spiral", "pages": 200, "paper_quality": "premium"}
    selected_options = Column(JSONB, nullable=False)
    
    # Additional notes/requirements from user
    notes = Column(Text, nullable=True)
    
    # Status workflow: PENDING -> QUOTED -> ACCEPTED/REJECTED
    status = Column(String, default='PENDING', nullable=False)
    
    # Admin sets these after reviewing the inquiry
    quoted_price = Column(Float, nullable=True)
    admin_notes = Column(Text, nullable=True)  # Admin can add notes/comments
    quoted_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="inquiries")
    template = relationship("ProductTemplate", back_populates="inquiries")

    def __repr__(self):
        return f"Inquiry(id={self.id}, user_id={self.user_id}, template_id={self.template_id}, status={self.status})"