"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, ChevronDown, SlidersHorizontal, Package } from "lucide-react";
import { Product } from "@/types/product";
import { ProductCard } from "@/components/products/ProductCard";
import { staggerContainer, cardReveal } from "@/lib/animations";

// ══════════════ CONSTANTS ══════════════
const FILTERS = ["All", "Office Printing", "Packaging", "Apparel", "Marketing Materials", "Stationery"] as const;
const SORT_OPTIONS = ["Popular", "Newest", "A–Z"] as const;

const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  :root {
    --off-white:  #f8eef0;
    --ink:       #0d0d0d;
    --yellow:    #f5e642;
    --shadow-sm: 3px 3px 0 var(--ink);
    --shadow-md: 5px 5px 0 var(--ink);
  }

  /* Prevent horizontal overflow globally */
  html, body { overflow-x: hidden; max-width: 100%; }

  .display { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.01em; }
  .body-f   { font-family: 'DM Sans', sans-serif; }

  /* ── Responsive container ── */
  .page-container {
    width: 100%;
    max-width: 88vw;
    margin: 0 auto;
    padding: 0 24px;
    box-sizing: border-box;
  }
  @media (max-width: 640px) {
    .page-container {
      max-width: 100vw;
      width: 100vw;
      padding: 0 10px;
      box-sizing: border-box;
      overflow: hidden;
    }
  }

  /* ── Hero text container ── */
  .hero-text {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    max-width: 88vw;
    margin: 0 auto;
    padding: 0 24px 48px;
    box-sizing: border-box;
  }
  @media (max-width: 640px) {
    .hero-text { max-width: 100%; padding: 0 16px 20px; bottom: 0; top: auto; }
    /* Shrink hero height on mobile to cut empty top space */
    .hero-section { height: 62vmax !important; min-height: 300px !important; max-height: 420px !important; }
  }

  /* ── Filter pill ── */
  .pill {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.04em;
    padding: 6px 16px;
    border: 2px solid var(--ink);
    cursor: pointer;
    transition: background 0.12s, color 0.12s, box-shadow 0.12s, transform 0.12s;
    background: transparent;
    color: var(--ink);
    white-space: nowrap;
    user-select: none;
    flex-shrink: 0;
  }
  .pill:hover  { background: var(--ink); color: var(--off-white); }
  .pill.active { background: var(--ink); color: var(--yellow); box-shadow: var(--shadow-sm); }

  /* ── Sort wrapper ── */
  .sort-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    border: 2px solid var(--ink);
    padding: 6px 12px;
    background: transparent;
    cursor: pointer;
    transition: box-shadow 0.12s, transform 0.12s;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 500;
    color: var(--ink);
    flex-shrink: 0;
  }
  .sort-wrap:hover { box-shadow: var(--shadow-sm); transform: translate(-1px,-1px); }
  .sort-wrap select {
    appearance: none; background: transparent; border: none;
    outline: none; font-family: inherit; font-size: inherit;
    font-weight: inherit; color: inherit; cursor: pointer;
  }

  /* ── Inline search (filter bar) ── */
  .filter-search {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 2px solid var(--ink);
    padding: 6px 14px;
    background: white;
    box-shadow: var(--shadow-sm);
    flex-shrink: 0;
    box-sizing: border-box;
  }
  .filter-search input {
    background: transparent; border: none; outline: none;
    font-family: 'DM Sans', sans-serif; font-size: 12px;
    font-weight: 500; color: var(--ink); width: 148px; min-width: 0;
  }

  /* ── Filter toolbar ── */
  /* Desktop: single row — search | pills | sort */
  .filter-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 0;
    border-bottom: 2px solid var(--ink);
  }
  .pills-row {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow-x: auto;
    flex: 1 1 auto;
    min-width: 0;
  }
  .pills-row::-webkit-scrollbar { display: none; }
  .pills-row { -ms-overflow-style: none; scrollbar-width: none; }
  .v-divider {
    width: 2px; height: 26px;
    background: var(--ink); opacity: 0.1; flex-shrink: 0;
  }

  /* Mobile: single row — [category ▾] [search] [sort icon] */
  .mobile-cat-select {
    display: none;
  }
  @media (max-width: 640px) {
    /* Hide desktop elements */
    .pills-row  { display: none; }
    .v-divider  { display: none; }
    .sort-wrap  { display: none; }
    .filter-search { display: none; }
    /* Show mobile row */
    .mobile-toolbar {
      display: flex !important;
      align-items: center;
      gap: 8px;
      padding: 12px 0;
      border-bottom: 2px solid var(--ink);
      width: 100%;
    }
    /* Category pill-select */
    .mobile-cat-select {
      display: flex;
      align-items: center;
      gap: 4px;
      border: 2px solid var(--ink);
      background: var(--ink);
      padding: 7px 12px;
      font-family: 'DM Sans', sans-serif;
      font-size: 12px;
      font-weight: 600;
      color: var(--yellow);
      flex-shrink: 0;
      position: relative;
      cursor: pointer;
    }
    .mobile-cat-select select {
      position: absolute;
      inset: 0;
      opacity: 0;
      width: 100%;
      cursor: pointer;
      font-size: 16px; /* prevents iOS zoom */
    }
    /* Compact search */
    .mobile-search {
      display: flex;
      align-items: center;
      gap: 6px;
      border: 2px solid var(--ink);
      background: white;
      padding: 7px 10px;
      flex: 1 1 auto;
      min-width: 0;
      box-shadow: var(--shadow-sm);
    }
    .mobile-search input {
      background: transparent; border: none; outline: none;
      font-family: 'DM Sans', sans-serif; font-size: 12px;
      font-weight: 500; color: var(--ink); width: 100%; min-width: 0;
    }
    .mobile-search input::placeholder { color: rgba(13,13,13,0.35); }
    /* Sort icon button */
    .mobile-sort {
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--ink);
      background: white;
      padding: 7px 10px;
      flex-shrink: 0;
      cursor: pointer;
      box-shadow: var(--shadow-sm);
      position: relative;
    }
    .mobile-sort select {
      position: absolute;
      inset: 0;
      opacity: 0;
      width: 100%;
      cursor: pointer;
      font-size: 16px;
    }
  }

  /* ── Product grid ── */
  .product-grid {
    display: grid;
    gap: 28px;
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 900px) {
    .product-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 540px) {
    .product-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      width: calc(100vw - 20px);
      max-width: calc(100vw - 20px);
      box-sizing: border-box;
      overflow: hidden;
    }
    .square-card {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
      overflow: hidden;
    }
  }

  /* ── Square cards ── */
  .square-card { width: 100%; }
  /* Mobile: 2 compact columns — let card height be natural (image + info strip) */
  @media (max-width: 540px) {
    .square-card { height: auto; overflow: visible; }
    .square-card > a { height: auto !important; }
  }

  /* ── Hero description ── */
  @media (max-width: 640px) {
    .hero-desc { max-width: 100% !important; font-size: 13px !important; }
    .hero-eyebrow { font-size: 10px !important; letter-spacing: 0.18em !important; }
  }
`;

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("All");
    const [sort, setSort] = useState("Popular");
    const [query, setQuery] = useState("");

    useEffect(() => {
        async function fetchProducts() {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/products?_t=${Date.now()}`
                );
                if (!res.ok) throw new Error("Failed to fetch products");
                const data = await res.json();
                setProducts(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchProducts();
    }, []);

    return (
        <main className="min-h-screen body-f" style={{ background: "var(--off-white)", overflowX: "hidden" }}>
            <style>{PAGE_STYLES}</style>

            {/* ══════════════ HERO — FULL-BLEED VIDEO BG ══════════════ */}
            <section className="hero-section relative w-full" style={{ height: "56vh", minHeight: 400, maxHeight: 560 }}>

                <video
                    src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260302_085640_276ea93b-d7da-4418-a09b-2aa5b490e838.mp4"
                    autoPlay muted loop playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: "brightness(0.78)" }}
                />

                {/* Gradient scrim */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.1) 35%, rgba(0,0,0,0.2) 78%, #f8eef0 100%)",
                    }}
                />

                {/* Grain texture */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        opacity: 0.045,
                        backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                        backgroundSize: "200px",
                    }}
                />

                {/* Hero text — uses .hero-text class for responsive positioning */}
                <div className="hero-text">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
                        }}
                    >
                        {/* Eyebrow */}
                        <motion.p
                            variants={{
                                hidden: { opacity: 0, y: 10 },
                                visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
                            }}
                            className="body-f text-[11px] font-semibold uppercase mb-4"
                            style={{
                                color: "var(--yellow)",
                                textShadow: "0 1px 8px rgba(0,0,0,0.7), 0 0 2px rgba(0,0,0,0.9)",
                                letterSpacing: "0.24em",
                            }}
                        >
                            Premium Catalog — 2026
                        </motion.p>

                        {/* Heading */}
                        <motion.h1
                            variants={{
                                hidden: { opacity: 0, y: 28 },
                                visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
                            }}
                            className="display leading-[0.9]"
                            style={{ fontSize: "clamp(46px, 10vw, 118px)" }}
                        >
                            <span style={{ color: "white", WebkitTextStroke: "1.5px rgba(0,0,0,0.55)", paintOrder: "stroke fill", display: "block" }}>
                                Premium
                            </span>
                            <span style={{ WebkitTextStroke: "2px white", color: "transparent", filter: "drop-shadow(0 0 1px rgba(0,0,0,0.6))" }}>
                                Printing
                            </span>
                            {" "}<span style={{ color: "var(--yellow)", WebkitTextStroke: "1.5px rgba(0,0,0,0.4)", paintOrder: "stroke fill" }}>&amp;</span>{" "}
                            <span style={{ color: "white", WebkitTextStroke: "1.5px rgba(0,0,0,0.55)", paintOrder: "stroke fill" }}>
                                Packaging
                            </span>
                        </motion.h1>

                        {/* Description */}
                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: 16 },
                                visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
                            }}
                            className="mt-6"
                        >
                            <p
                                className="body-f hero-desc text-[14px] font-light leading-relaxed"
                                style={{
                                    color: "rgba(255,255,255,0.6)",
                                    textShadow: "0 1px 8px rgba(0,0,0,0.7), 0 0 2px rgba(0,0,0,0.9)",
                                    maxWidth: "340px",
                                }}
                            >
                                High-quality branded merchandise, custom packaging, and marketing materials — crafted with precision.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ══════════════ UNIFIED FILTER + SEARCH BAR ══════════════ */}
            <div className="page-container">
                <div className="filter-toolbar">

                    {/* ── MOBILE SINGLE-ROW TOOLBAR ── */}
                    <div className="mobile-toolbar" style={{ display: "none" }}>
                        {/* Category dropdown styled as pill */}
                        <div className="mobile-cat-select">
                            <span>{activeFilter}</span>
                            <ChevronDown size={12} />
                            <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)}>
                                {FILTERS.map((f) => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>
                        {/* Compact search */}
                        <div className="mobile-search">
                            <Search size={12} style={{ color: "var(--ink)", opacity: 0.4, flexShrink: 0 }} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                        {/* Sort icon button */}
                        <div className="mobile-sort">
                            <SlidersHorizontal size={14} strokeWidth={2} style={{ color: "var(--ink)" }} />
                            <select value={sort} onChange={(e) => setSort(e.target.value)}>
                                {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="filter-search">
                        <Search size={13} style={{ color: "var(--ink)", opacity: 0.4, flexShrink: 0 }} />
                        <input
                            type="text"
                            placeholder="Search catalog..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>

                    <div className="v-divider" />

                    {/* Pills */}
                    <div className="pills-row">
                        {FILTERS.map((f) => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`pill ${activeFilter === f ? "active" : ""}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="v-divider" />

                    {/* Sort */}
                    <div className="sort-wrap">
                        <SlidersHorizontal size={11} strokeWidth={2} />
                        <select value={sort} onChange={(e) => setSort(e.target.value)}>
                            {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                        <ChevronDown size={11} strokeWidth={2} />
                    </div>
                </div>

                {/* Count */}
                <p
                    className="body-f text-[11px] font-medium uppercase mt-4 mb-8"
                    style={{ color: "rgba(13,13,13,0.32)", letterSpacing: "0.14em" }}
                >
                    {isLoading
                        ? "Loading catalog…"
                        : `${products.length} product${products.length !== 1 ? "s" : ""} available`}
                </p>
            </div>

            {/* ══════════════ PRODUCT GRID ══════════════ */}
            <div className="page-container" style={{ paddingBottom: 100, boxSizing: "border-box" }}>
                {isLoading ? (
                    <div className="py-36 flex justify-center items-center gap-3">
                        <div
                            className="w-5 h-5 rounded-full animate-spin border-2"
                            style={{ borderColor: "var(--ink)", borderTopColor: "transparent" }}
                        />
                        <span
                            className="body-f text-[11px] font-medium uppercase"
                            style={{ color: "rgba(13,13,13,0.38)", letterSpacing: "0.1em" }}
                        >
                            Syncing Catalog…
                        </span>
                    </div>
                ) : products.length > 0 ? (
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-60px" }}
                        className="product-grid"
                    >
                        {products.map((product, idx) => (
                            <motion.div key={product.id} variants={cardReveal} className="square-card">
                                <ProductCard product={product} index={idx} />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-36 text-center">
                        <div
                            className="w-16 h-16 border-2 flex items-center justify-center mb-5"
                            style={{ borderColor: "var(--ink)", background: "var(--yellow)", boxShadow: "var(--shadow-md)" }}
                        >
                            <Package size={28} style={{ color: "var(--ink)" }} />
                        </div>
                        <h3 className="display mb-2" style={{ fontSize: "38px", color: "var(--ink)" }}>
                            Catalog Empty
                        </h3>
                        <p
                            className="body-f text-[13px] font-light leading-relaxed max-w-xs"
                            style={{ color: "rgba(13,13,13,0.45)" }}
                        >
                            Our new 2026 samples are arriving soon. Contact us for custom bulk orders in the meantime.
                        </p>
                    </div>
                )}
            </div>

        </main>
    );
}