class Product(Base):
    """A product type — a named bundle of services (e.g. Book, Calendar)."""

    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    min_order_qty: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # ── relationships ──
    # One product → many junction rows (links to services)
    service_links: Mapped[list["ProductService"]] = relationship(
        "ProductService", back_populates="product", cascade="all, delete-orphan"
    )
    # One product → many sizes
    sizes: Mapped[list["ProductSize"]] = relationship(
        "ProductSize", back_populates="product", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Product(id={self.id}, name={self.product_name!r})>"


# ─── product_services (junction) ─────────────────────────────────────────────


class ProductService(Base):
    """
    Many-to-many junction between products and services.

    is_required = True  → the service is mandatory for this product.
    is_required = False → the service is optional (upsell / add-on).
    """

    __tablename__ = "product_services"
    __table_args__ = (
        UniqueConstraint("product_id", "service_id", name="uq_product_service"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    service_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False
    )
    is_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # ── relationships ──
    product: Mapped["Product"] = relationship("Product", back_populates="service_links")
    service: Mapped["Service"] = relationship("Service", back_populates="product_links")

    def __repr__(self) -> str:
        return (
            f"<ProductService(product_id={self.product_id}, "
            f"service_id={self.service_id}, required={self.is_required})>"
        )


# ─── product_sizes ───────────────────────────────────────────────────────────


class ProductSize(Base):
    """A valid size for a given product (e.g. A4 for Book)."""

    __tablename__ = "product_sizes"
    __table_args__ = (
        UniqueConstraint("product_id", "size_label", name="uq_product_size"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    size_label: Mapped[str] = mapped_column(String(20), nullable=False)

    # ── relationships ──
    product: Mapped["Product"] = relationship("Product", back_populates="sizes")

    def __repr__(self) -> str:
        return f"<ProductSize(id={self.id}, product_id={self.product_id}, size={self.size_label!r})>"