from sqlalchemy import Column , Integer , String , DateTime , Boolean , func , Float , ARRAY, ForeignKey, ForeignKeyConstraint, CheckConstraint, Uuid
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.modules.users.models import User
from app.modules.products.models import ProductTemplate

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer , primary_key = True , nullable = False , autoincrement = True)
    user_id = Column(Uuid , ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer , ForeignKey("product_templates.id"), nullable=False)

    rating = Column(Integer , nullable = False)
    comment = Column(String , nullable = False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_verified = Column(Boolean , default = False)

    # Relationships
    user = relationship("User")
    product = relationship("ProductTemplate")

    __table_args__ = (
        CheckConstraint(
            'rating >= 1 AND rating <= 5',
            name='valid_rating_range'
        ),
    )
    
    def __repr__(self):
        return f"Review(id={self.id}, user_id={self.user_id}, product_id={self.product_id}, rating={self.rating}, comment={self.comment})"