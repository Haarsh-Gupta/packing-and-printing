from sqlalchemy import Column , Integer , String , DateTime , Boolean , func , ForeignKey, CheckConstraint, Uuid
from sqlalchemy.orm import relationship
from app.core.database import Base


class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer , primary_key = True , nullable = False , autoincrement = True)
    user_id = Column(Uuid , ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer , ForeignKey("sub_products.id"), nullable=True)
    service_id = Column(Integer , ForeignKey("sub_services.id"), nullable=True)

    rating = Column(Integer , nullable = False)
    comment = Column(String , nullable = False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_verified = Column(Boolean , default = False)

    # Relationships — lazy="selectin" prevents MissingGreenlet in async context
    user = relationship("User", lazy="selectin")
    product = relationship("SubProduct", back_populates="reviews", lazy="selectin")
    service = relationship("SubService", back_populates="reviews", lazy="selectin")

    __table_args__ = (
        CheckConstraint(
            'rating >= 1 AND rating <= 5',
            name='valid_rating_range'
        ),
    )
    
    def __repr__(self):
        return f"Review(id={self.id}, user_id={self.user_id}, product_id={self.product_id}, rating={self.rating}, comment={self.comment})"