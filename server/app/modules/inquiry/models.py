from sqlalchemy import Column, String, DateTime, ForeignKey, func, Uuid, text, Integer, Text, ARRAY, Float
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.core.database import Base


class InquiryGroup(Base):
    __tablename__ = "inquiry_groups"

    id              = Column(Uuid, primary_key=True, server_default=text("uuidv7()"))
    user_id         = Column(Uuid, ForeignKey("users.id"), nullable=False, index=True)
    status          = Column(String, default="DRAFT", nullable=False, index=True)  # was "PENDING"
    active_quote_id = Column(Uuid, ForeignKey("quote_versions.id"), nullable=True)  # NEW
    quote_email_status = Column(String, nullable=True) # delivered, bounced, etc.
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user            = relationship("User", back_populates="inquiry_groups")
    items           = relationship("InquiryItem", back_populates="group", cascade="all, delete-orphan")
    messages        = relationship("InquiryMessage", back_populates="group", cascade="all, delete-orphan")
    quote_versions  = relationship(
        "QuoteVersion",
        back_populates="inquiry",
        cascade="all, delete-orphan",
        foreign_keys="QuoteVersion.inquiry_id",
        order_by="QuoteVersion.version",
    )
    active_quote    = relationship(
        "QuoteVersion",
        foreign_keys=[active_quote_id],
        post_update=True,
    )


class InquiryItem(Base):
    __tablename__ = "inquiry_items"

    id               = Column(Uuid, primary_key=True, server_default=text("uuidv7()"))
    group_id         = Column(Uuid, ForeignKey("inquiry_groups.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id       = Column(Integer, ForeignKey("products.id"), nullable=True)
    subproduct_id    = Column(Integer, ForeignKey("sub_products.id"), nullable=True)
    service_id       = Column(Integer, ForeignKey("services.id"), nullable=True)
    subservice_id    = Column(Integer, ForeignKey("sub_services.id"), nullable=True)
    quantity         = Column(Integer, nullable=False)
    selected_options = Column(JSONB, nullable=True)
    notes            = Column(Text, nullable=True)
    images           = Column(ARRAY(String), nullable=True)
    line_item_price  = Column(Integer, nullable=True)
    estimated_price  = Column(Integer, nullable=True)

    group            = relationship("InquiryGroup", back_populates="items")
    product          = relationship("Product", lazy="selectin")
    sub_product      = relationship("SubProduct", back_populates="inquiry_items", lazy="selectin")
    service          = relationship("Service", lazy="selectin")
    sub_service      = relationship("SubService", lazy="selectin")

    @property
    def product_name(self): return self.product.name if self.product else None
    @property
    def subproduct_name(self): return self.sub_product.name if self.sub_product else None
    @property
    def service_name(self): return self.service.name if self.service else None
    @property
    def subservice_name(self): return self.sub_service.name if self.sub_service else None


class InquiryMessage(Base):
    __tablename__ = "inquiry_messages"

    id                 = Column(Integer, primary_key=True, autoincrement=True)
    inquiry_group_id   = Column(Uuid, ForeignKey("inquiry_groups.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id          = Column(Uuid, ForeignKey("users.id"), nullable=False)
    content            = Column(Text, nullable=False)
    file_urls          = Column(ARRAY(String), nullable=True)
    created_at         = Column(DateTime(timezone=True), server_default=func.now())

    group              = relationship("InquiryGroup", back_populates="messages")
    sender             = relationship("User")

class QuoteVersion(Base):
    __tablename__ = "quote_versions"

    id          = Column(Uuid, primary_key=True, server_default=text("uuidv7()"))
    inquiry_id  = Column(Uuid, ForeignKey("inquiry_groups.id", ondelete="CASCADE"), nullable=False, index=True)
    version     = Column(Integer, nullable=False)
    created_by  = Column(Uuid, ForeignKey("users.id"), nullable=False)

    total_price = Column(Float, nullable=False)
    valid_until = Column(DateTime(timezone=True), nullable=False)
    admin_notes = Column(Text, nullable=True)

    # [{"label": "Advance", "percentage": 40.0, "description": "...", "trigger": "..."}]
    milestones  = Column(JSONB, nullable=False, default=list)
    line_items  = Column(JSONB, nullable=True)

    # PENDING_REVIEW | ACCEPTED | REJECTED | COUNTERED | SUPERSEDED | EXPIRED
    status      = Column(String, default="PENDING_REVIEW", nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    inquiry     = relationship("InquiryGroup", back_populates="quote_versions", foreign_keys=[inquiry_id])
    creator     = relationship("User", foreign_keys=[created_by])