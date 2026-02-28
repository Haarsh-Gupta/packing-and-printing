from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Uuid, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Wishlist(Base):
    __tablename__ = "wishlists"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Uuid, ForeignKey("users.id"), nullable=False)
    sub_product_id = Column(Integer, ForeignKey("sub_products.id"), nullable=True)
    sub_service_id = Column(Integer, ForeignKey("sub_services.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="wishlists")
    sub_product = relationship("SubProduct")
    sub_service = relationship("SubService")

    __table_args__ = (
        CheckConstraint(
            "(sub_product_id IS NOT NULL) OR (sub_service_id IS NOT NULL)",
            name="check_single_whishlist_item"
        ),
        # 2. Prevent liking the same product twice
        UniqueConstraint('user_id', 'sub_product_id', name='uq_user_subproduct_wishlist'),
        # 3. Prevent liking the same service twice
        UniqueConstraint('user_id', 'sub_service_id', name='uq_user_subservice_wishlist'),
    )