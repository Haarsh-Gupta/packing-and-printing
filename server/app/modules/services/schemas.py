"""
SQLAlchemy ORM models for the Printing & Packaging company.

Tables
------
services            – atomic service definitions (Binding, Printing, …)
service_options     – per-service variant options (Pin, Perfect, …)
products            – product types (Book, Calendar, …)
product_services    – many-to-many junction: which services a product needs
product_sizes       – valid sizes per product (A4, A5, …)
"""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


# ─── Base ────────────────────────────────────────────────────────────────────


class Base(DeclarativeBase):
    """Single declarative base shared by every model."""

    pass


# ─── services ────────────────────────────────────────────────────────────────


class Service(Base):
    """Atomic building-block service (e.g. Binding, Printing)."""

    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    service_name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    min_order_qty: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # ── relationships ──
    # One service → many options
    options: Mapped[list["ServiceOption"]] = relationship(
        "ServiceOption", back_populates="service", cascade="all, delete-orphan"
    )
    # One service ← many junction rows (used by many products)
    product_links: Mapped[list["ProductService"]] = relationship(
        "ProductService", back_populates="service", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Service(id={self.id}, name={self.service_name!r})>"


# ─── service_options ─────────────────────────────────────────────────────────


class ServiceOption(Base):
    """A single variant / option belonging to a service (e.g. Pin for Binding)."""

    __tablename__ = "service_options"
    __table_args__ = (
        UniqueConstraint("service_id", "option_name", name="uq_service_option"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    service_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False
    )
    option_name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # ── relationships ──
    service: Mapped["Service"] = relationship("Service", back_populates="options")

    def __repr__(self) -> str:
        return f"<ServiceOption(id={self.id}, option={self.option_name!r}, service_id={self.service_id})>"

