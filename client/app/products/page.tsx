import Link from "next/link";
import { Product } from "@/types/product";
import { ProductCard } from "@/components/products/ProductCard";

async function getProducts(): Promise<Product[]> {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/products?_t=${Date.now()}`,
            { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
        return res.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

const FILTERS = [
    { label: "All Products", color: "bg-black text-white" },
    { label: "Office", color: "bg-[#b8f0c8] text-black hover:bg-[#a0e8b4]" },
    { label: "Packaging", color: "bg-[#ffd6e8] text-black hover:bg-[#ffbfda]" },
    { label: "Apparel", color: "bg-[#fff0a0] text-black hover:bg-[#ffe880]" },
    { label: "Marketing", color: "bg-[#c8d8ff] text-black hover:bg-[#b0c8ff]" },
] as const;

export default async function ProductsPage() {
    const products = await getProducts();

    return (
        <>
            <main className="pp-root">

                {/* ══════════════════════════════════════════════════════
            HERO — pink background matching homepage hero
        ══════════════════════════════════════════════════════ */}
                <section className="pp-hero">
                    <div className="pp-hero-inner">

                        {/* Left */}
                        <div>
                            <div className="pp-badge">
                                <span className="pp-badge-dot" />
                                Premium Printing &amp; Packaging
                            </div>

                            <h1 className="pp-hero-title">
                                Browse our<br />
                                <em>product catalog.</em>
                            </h1>

                            <p className="pp-hero-sub">
                                From custom packaging to offset printing — every product
                                is crafted with precision. Simple pricing, fast delivery.
                            </p>

                            {/* Stats anchored to bottom of hero */}
                            <div className="pp-stats">
                                {[
                                    { value: "200+", label: "Products" },
                                    { value: "50+", label: "Categories" },
                                    { value: "24h", label: "Turnaround" },
                                    { value: "99%", label: "Satisfaction" },
                                ].map(({ value, label }) => (
                                    <div key={label} className="pp-stat">
                                        <div className="pp-stat-value">{value}</div>
                                        <div className="pp-stat-label">{label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right */}
                        <div className="pp-hero-right">
                            <div className="pp-hero-deco" aria-hidden>
                                {String(products.length).padStart(2, "0")}
                            </div>
                            <div>
                                <p className="pp-search-label">Search products</p>
                                <div className="pp-search-row">
                                    <input
                                        className="pp-search-input"
                                        placeholder="e.g. business cards, boxes…"
                                        type="text"
                                    />
                                    <button className="pp-search-btn" aria-label="Search">
                                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>search</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════════
            STICKY FILTER BAR — pill buttons like homepage tags
        ══════════════════════════════════════════════════════ */}
                <nav className="pp-filters" aria-label="Filter by category">
                    <div className="pp-filters-inner">

                        {FILTERS.map(({ label, color }, i) => (
                            <button
                                key={label}
                                className={`pp-filter-btn ${color}${i === 0 ? " active" : ""}`}
                            >
                                {label}
                            </button>
                        ))}

                        <div className="pp-filter-divider" aria-hidden />

                        <div className="pp-filter-right">
                            <span className="pp-count-pill">
                                {products.length} items
                            </span>
                            <button className="pp-sort-btn">
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>swap_vert</span>
                                Sort
                            </button>
                        </div>
                    </div>
                </nav>

                {/* ══════════════════════════════════════════════════════
            PRODUCT GRID
        ══════════════════════════════════════════════════════ */}
                <div className="pp-content">
                    <div className="pp-section-header">
                        <h2 className="pp-section-heading">All Categories</h2>
                        <span className="pp-section-sub">
                            {products.length} product{products.length !== 1 ? "s" : ""} found
                        </span>
                    </div>

                    <div className="pp-grid">
                        {products.length > 0 ? (
                            products.map((product, index) => (
                                <div key={product.id} className="pp-card">
                                    <ProductCard product={product} index={index} />
                                </div>
                            ))
                        ) : (
                            <div className="pp-empty">
                                <div className="pp-empty-icon">
                                    <span className="material-symbols-outlined">inventory_2</span>
                                </div>
                                <p className="pp-empty-title">Nothing here yet</p>
                                <p className="pp-empty-body">
                                    New categories are being added. Check back soon or request a custom order.
                                </p>
                                <Link href="/services#contact" className="pp-empty-cta">
                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                                    Request a Custom Order
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════
            BOTTOM CTA — yellow card matching homepage CTA tone
        ══════════════════════════════════════════════════════ */}
                <div className="pp-cta-wrap">
                    <div className="pp-cta">
                        <div className="pp-cta-deco" aria-hidden />
                        <div className="pp-cta-deco2" aria-hidden />

                        <div style={{ position: "relative", zIndex: 1 }}>
                            <div className="pp-cta-badge">
                                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>support_agent</span>
                                Enterprise &amp; Bulk Orders
                            </div>
                            <h2 className="pp-cta-title">
                                Can't find what<br />
                                <em>you need?</em>
                            </h2>
                            <p className="pp-cta-body">
                                We offer custom sourcing for large enterprise orders. Our team
                                will find exactly what you're looking for — at scale, on time,
                                at a competitive price.
                            </p>
                        </div>

                        <div className="pp-cta-actions" style={{ position: "relative", zIndex: 1 }}>
                            <Link href="/services#contact" className="pp-btn-black">
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                                Contact Sales
                            </Link>
                            <Link href="/services" className="pp-btn-outline">
                                Browse Services
                            </Link>
                        </div>
                    </div>
                </div>

            </main>
        </>
    );
}