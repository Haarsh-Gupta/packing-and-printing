import Link from "next/link";
import { ServiceItem } from "@/types/service";
import { ServiceCard } from "@/components/services/ServiceCard";

async function getServices(): Promise<ServiceItem[]> {
    try {
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/services?_t=${Date.now()}`,
            { cache: "no-store" }
        );
        if (!res.ok) throw new Error(`Failed to fetch services: ${res.status}`);
        return res.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

const FILTERS = [
    { label: "All Services", color: "bg-black text-white" },
    { label: "Design", color: "bg-[#b8f0c8] text-black hover:bg-[#a0e8b4]" },
    { label: "Consulting", color: "bg-[#ffd6e8] text-black hover:bg-[#ffbfda]" },
    { label: "Printing", color: "bg-[#fff0a0] text-black hover:bg-[#ffe880]" },
    { label: "Prototyping", color: "bg-[#c8d8ff] text-black hover:bg-[#b0c8ff]" },
] as const;

export default async function ServicesCatalogPage() {
    const services = await getServices();

    return (
        <>
            <main className="pp-root">

                {/* ══════════════════════════════════════════════════════
            HERO — blue background alternative
        ══════════════════════════════════════════════════════ */}
                <section className="pp-hero" style={{ background: "#c8d8ff" }}>
                    <div className="pp-hero-inner">

                        {/* Left */}
                        <div>
                            {/* <div className="pp-badge">
                                <span className="pp-badge-dot" style={{ background: "#c8d8ff" }} />
                                Premium Design Studio
                            </div> */}

                            <h1 className="pp-hero-title">
                                Explore our<br />
                                <em>service catalog.</em>
                            </h1>

                            <p className="pp-hero-sub">
                                From conceptual mockups to full architectural setups — every service
                                is executed with precision by our studio masters.
                            </p>

                            {/* Stats anchored to bottom of hero */}
                            <div className="pp-stats">
                                {[
                                    { value: "50+", label: "Services" },
                                    { value: "10+", label: "Categories" },
                                    { value: "24/7", label: "Consulting" },
                                    { value: "100%", label: "Satisfaction" },
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
                                {String(services.length).padStart(2, "0")}
                            </div>
                            <div>
                                <p className="pp-search-label">Search services</p>
                                <div className="pp-search-row">
                                    <input
                                        className="pp-search-input"
                                        placeholder="e.g. 3D modeling, packaging design…"
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
                                {services.length} items
                            </span>
                            <button className="pp-sort-btn">
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>swap_vert</span>
                                Sort
                            </button>
                        </div>
                    </div>
                </nav>

                {/* ══════════════════════════════════════════════════════
            SERVICE GRID
        ══════════════════════════════════════════════════════ */}
                <div className="pp-content">
                    <div className="pp-section-header">
                        <h2 className="pp-section-heading">All Categories</h2>
                        <span className="pp-section-sub">
                            {services.length} service{services.length !== 1 ? "s" : ""} found
                        </span>
                    </div>

                    <div className="pp-grid">
                        {services.length > 0 ? (
                            services.map((service, index) => (
                                <div key={service.id} className="pp-card">
                                    <ServiceCard service={service} index={index} />
                                </div>
                            ))
                        ) : (
                            <div className="pp-empty">
                                <div className="pp-empty-icon">
                                    <span className="material-symbols-outlined">design_services</span>
                                </div>
                                <p className="pp-empty-title">Nothing here yet</p>
                                <p className="pp-empty-body">
                                    New services are being added. Check back soon or request custom architecture.
                                </p>
                                <Link href="/contact" className="pp-empty-cta">
                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                                    Contact the Studio
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
                                Custom Architect
                            </div>
                            <h2 className="pp-cta-title">
                                Can't find what<br />
                                <em>you need?</em>
                            </h2>
                            <p className="pp-cta-body">
                                Can't find exactly what you're looking for? Our master designers handle
                                complex bespoke engineering and prototyping daily.
                            </p>
                        </div>

                        <div className="pp-cta-actions" style={{ position: "relative", zIndex: 1 }}>
                            <Link href="/contact" className="pp-btn-black">
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                                Contact Us
                            </Link>
                            <Link href="/products" className="pp-btn-outline">
                                Browse Products
                            </Link>
                        </div>
                    </div>
                </div>

            </main>
        </>
    );
}