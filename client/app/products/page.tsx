"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Product } from "@/types/product";
import { ProductCard } from "@/components/products/ProductCard";

/* ── Doodle SVG helpers ──────────────────────────────────────── */

function DoodleBook({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 80 80" fill="none" className={className}>
            <path d="M20 15C18 15 15 17 15 20V60C15 63 17 65 20 65H60C63 65 65 63 65 60V20C65 17 63 15 60 15H20Z" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M40 15V65" stroke="black" strokeWidth="2" strokeLinecap="round" />
            <path d="M25 30H35" stroke="black" strokeWidth="2" strokeLinecap="round" />
            <path d="M25 38H33" stroke="black" strokeWidth="2" strokeLinecap="round" />
            <path d="M45 30H55" stroke="black" strokeWidth="2" strokeLinecap="round" />
            <path d="M45 38H53" stroke="black" strokeWidth="2" strokeLinecap="round" />
            <path d="M45 46H50" stroke="black" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function DoodleBox({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 80 80" fill="none" className={className}>
            <path d="M15 30L40 18L65 30V55L40 67L15 55V30Z" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 30L40 42L65 30" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M40 42V67" stroke="black" strokeWidth="2" strokeLinecap="round" />
            <path d="M27 24L52 36" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
        </svg>
    );
}

function DoodlePrinter({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 80 80" fill="none" className={className}>
            <rect x="20" y="10" width="40" height="20" rx="3" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
            <rect x="12" y="30" width="56" height="25" rx="4" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M22 55H58V68C58 70 56 72 54 72H26C24 72 22 70 22 68V55Z" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="54" cy="40" r="3" fill="black" />
            <path d="M28 62H52" stroke="black" strokeWidth="2" strokeLinecap="round" />
            <path d="M28 66H44" stroke="black" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function DoodleStar({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 50 50" fill="none" className={className}>
            <path d="M25 5L30 18L44 20L33 30L36 44L25 37L14 44L17 30L6 20L20 18L25 5Z" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="#FDF567" />
        </svg>
    );
}

function DoodleArrow({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 80 40" fill="none" className={className}>
            <path d="M5 30C15 30 25 10 40 10C55 10 60 25 75 20" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M68 14L75 20L66 24" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function DoodleScribble({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 60 60" fill="none" className={className}>
            <path d="M10 50C15 30 25 15 35 20C45 25 30 40 20 35C10 30 25 10 50 15" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    );
}

function DoodleHeart({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 50 50" fill="none" className={className}>
            <path d="M25 44C25 44 5 30 5 18C5 10 12 5 19 8C22 9 24 12 25 15C26 12 28 9 31 8C38 5 45 10 45 18C45 30 25 44 25 44Z" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="#FF90E8" fillOpacity="0.3" />
        </svg>
    );
}

/* ── Filter config ───────────────────────────────────────────── */

const FILTERS = [
    { label: "All Products", color: "bg-black text-white",      keyword: "" },
    { label: "Office",       color: "bg-[#b8f0c8] text-black",  keyword: "office" },
    { label: "Packaging",    color: "bg-[#ffd6e8] text-black",  keyword: "packaging" },
    { label: "Apparel",      color: "bg-[#fff0a0] text-black",  keyword: "apparel" },
    { label: "Marketing",    color: "bg-[#c8d8ff] text-black",  keyword: "marketing" },
] as const;

/* ── How It Works strip ──────────────────────────────────────── */

const HOW_STEPS = [
    {
        num: "01",
        icon: <span className="material-symbols-outlined" style={{ fontSize: 22 }}>grid_view</span>,
        color: "#f5c6e0",
        title: "Browse catalog",
        body: "Explore our 200+ products. Filter by category, search by name, and find exactly what your brand needs.",
    },
    {
        num: "02",
        icon: <span className="material-symbols-outlined" style={{ fontSize: 22 }}>description</span>,
        color: "#fff0a0",
        title: "Submit inquiry",
        body: "Choose specs, upload artwork, and send your inquiry. Our team reviews and prepares a transparent quote.",
    },
    {
        num: "03",
        icon: <span className="material-symbols-outlined" style={{ fontSize: 22 }}>local_shipping</span>,
        color: "#b8f0c8",
        title: "Receive & enjoy",
        body: "Approve the quote, confirm payment, and track production in real time from your dashboard.",
    },
];

/* ── Page ───────────────────────────────────────────────────── */

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [activeKeyword, setActiveKeyword] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?_t=${Date.now()}`)
            .then((r) => (r.ok ? r.json() : []))
            .then(setProducts)
            .catch(() => setProducts([]));
    }, []);

    const visible = products.filter((p) => {
        const haystack = `${p.name} ${p.description ?? ""}`.toLowerCase();
        return activeKeyword === "" || haystack.includes(activeKeyword);
    });

    return (
        <>
            <main className="pp-root">

                {/* ══════════════════════════════════════════════════════
                    HERO
                ══════════════════════════════════════════════════════ */}
                <section className="pp-hero" style={{ position: "relative", overflow: "hidden" }}>

                    {/* Dot pattern */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            opacity: 0.05,
                            backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)",
                            backgroundSize: "24px 24px",
                        }}
                    />

                    {/* Floating doodles */}
                    <DoodleBook     className="absolute top-16 left-[4%]        w-16 opacity-20 pp-doodle-float-1 hidden sm:block" />
                    <DoodleBox      className="absolute top-20 right-[6%]       w-14 opacity-20 pp-doodle-float-2 hidden sm:block" />
                    <DoodlePrinter  className="absolute top-[45%] left-[2%]     w-16 pp-doodle-float-3 hidden md:block" style={{ opacity: "0.15" } as React.CSSProperties} />
                    <DoodleStar     className="absolute top-[30%] right-[5%]    w-10 opacity-25 pp-doodle-spin hidden sm:block" />
                    <DoodleScribble className="absolute bottom-[22%] left-[10%] w-12 pp-doodle-float-2 hidden md:block" style={{ opacity: "0.15" } as React.CSSProperties} />
                    <DoodleArrow    className="absolute bottom-[20%] right-[5%] w-20 opacity-20 pp-doodle-float-1 hidden sm:block" />
                    <DoodleHeart    className="absolute top-16 left-[25%]       w-8  opacity-20 pp-doodle-float-3 hidden lg:block" />
                    <DoodleStar     className="absolute top-[60%] left-[15%]    w-6  pp-doodle-spin-slow hidden lg:block" style={{ opacity: "0.15" } as React.CSSProperties} />

                    <div className="pp-hero-inner" style={{ position: "relative", zIndex: 1 }}>

                        {/* Left */}
                        <div>
                            <h1
                                className="pp-hero-title"
                                style={{
                                    opacity:    mounted ? 1 : 0,
                                    transform:  mounted ? "translateY(0)" : "translateY(24px)",
                                    transition: "opacity 0.6s ease, transform 0.6s ease",
                                }}
                            >
                                Browse our<br />
                                <em>product catalog.</em>
                            </h1>

                            <p
                                className="pp-hero-sub"
                                style={{
                                    opacity:    mounted ? 1 : 0,
                                    transform:  mounted ? "translateY(0)" : "translateY(24px)",
                                    transition: "opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s",
                                }}
                            >
                                From custom packaging to offset printing — every product
                                is crafted with precision. Simple pricing, fast delivery.
                            </p>


                        </div>

                        {/* Right — deco */}
                        <div className="pp-hero-right">
                            <div className="pp-hero-deco" aria-hidden>
                                {String(products.length).padStart(2, "0")}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══════════════════════════════════════════════════════
                    STICKY FILTER BAR
                ══════════════════════════════════════════════════════ */}
                <nav className="pp-filters" aria-label="Filter by category">
                    <div className="pp-filters-inner">
                        {FILTERS.map(({ label, color, keyword }, i) => (
                            <button
                                key={label}
                                onClick={() => setActiveKeyword(keyword)}
                                className={`pp-filter-btn ${color}${
                                    activeKeyword === keyword || (i === 0 && activeKeyword === "")
                                        ? " active"
                                        : ""
                                }`}
                            >
                                {label}
                            </button>
                        ))}

                        <div className="pp-filter-divider" aria-hidden />

                        <div className="pp-filter-right">
                            <span className="pp-count-pill">{visible.length} items</span>
                            <button
                                className="pp-sort-btn"
                                onClick={() => { setActiveKeyword(""); }}
                                title="Clear filters"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>filter_list_off</span>
                                Reset
                            </button>
                        </div>
                    </div>
                </nav>

                {/* ══════════════════════════════════════════════════════
                    PRODUCT GRID
                ══════════════════════════════════════════════════════ */}
                <div className="pp-content">
                    <div className="pp-section-header">
                        <h2 className="pp-section-heading">
                            {activeKeyword
                                ? FILTERS.find((f) => f.keyword === activeKeyword)?.label ?? "Products"
                                : "All Categories"}
                        </h2>
                        <span className="pp-section-sub">
                            {visible.length} product{visible.length !== 1 ? "s" : ""} found
                        </span>
                    </div>

                    <div className="pp-grid">
                        {visible.length > 0 ? (
                            visible.map((product, index) => (
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
                    HOW IT WORKS STRIP
                ══════════════════════════════════════════════════════ */}
                <div className="pp-strip-wrap">
                    <div className="pp-strip-header">
                        <span className="pp-strip-tag">How it works</span>
                        <span className="pp-strip-title">Three easy steps.</span>
                    </div>
                    <div className="pp-strip-grid">
                        {HOW_STEPS.map((step) => (
                            <div key={step.num} className="pp-strip-card" style={{ background: "#fff" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div className="pp-strip-icon" style={{ background: step.color }}>
                                        {step.icon}
                                    </div>
                                    <span className="pp-strip-num">{step.num}</span>
                                </div>
                                <p className="pp-strip-card-title">{step.title}</p>
                                <p className="pp-strip-card-body">{step.body}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════
                    BOTTOM CTA
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
                                Can&apos;t find what<br />
                                <em>you need?</em>
                            </h2>
                            <p className="pp-cta-body">
                                We offer custom sourcing for large enterprise orders. Our team
                                will find exactly what you&apos;re looking for — at scale, on time,
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