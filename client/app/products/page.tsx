"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, Package, ArrowRight, Zap } from "lucide-react";
import { Product } from "@/types/product";
import { ProductCard } from "@/components/products/ProductCard";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const FILTERS = ["All", "Office Printing", "Packaging", "Apparel", "Marketing Materials", "Stationery"] as const;
const SORT_OPTIONS = ["Popular", "Newest", "A–Z"] as const;
const TICKER_ITEMS = ["Premium Printing ★", "Custom Packaging ✦", "Branded Apparel ◆", "Bulk Orders ★", "Marketing Stuff ✦", "Stationery ◆"];

// ─── STYLES (fully scoped under .products-page) ───────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Archivo+Black&family=Courier+Prime:wght@400;700&display=swap');

  /* ── SCOPE ROOT ── */
  .products-page {
    --black:        #0a0a0a;
    --white:        #fafafa;
    --yellow:       #ffe135;
    --red:          #ff2d2d;
    --blue:         #1a1aff;
    --bg:           #f0ede6;
    --border:       3px solid #0a0a0a;
    --border-thick: 5px solid #0a0a0a;
    --sh:           6px 6px 0 #0a0a0a;
    --sh-lg:        10px 10px 0 #0a0a0a;
    --sh-xl:        14px 14px 0 #0a0a0a;

    background: var(--bg);
    min-height: 100vh;
    overflow-x: hidden;
    font-family: 'Space Grotesk', sans-serif;
  }

  .products-page *,
  .products-page *::before,
  .products-page *::after { box-sizing: border-box; }

  .products-page button,
  .products-page select,
  .products-page input {
    font-family: 'Space Grotesk', sans-serif;
  }

  /* ── TYPOGRAPHY HELPERS ── */
  .products-page .display { font-family: 'Archivo Black', sans-serif; }
  .products-page .mono    { font-family: 'Courier Prime', monospace; }

  /* ── PAGE WRAP ── */
  .products-page .wrap {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 28px;
  }
  @media (max-width: 600px) {
    .products-page .wrap { padding: 0 14px; }
  }

  /* ── HERO ── */
  .products-page .hero {
    position: relative;
    overflow: hidden;
    border-bottom: var(--border-thick);
  }
  .products-page .hero-noise {
    position: absolute;
    inset: 0;
    opacity: 0.04;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 200px;
    pointer-events: none;
    z-index: 3;
  }
  .products-page .hero-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: brightness(0.55) saturate(0.8);
  }
  .products-page .hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(10,10,10,0.0) 0%, rgba(10,10,10,0.7) 100%);
    z-index: 2;
  }
  .products-page .hero-content {
    position: relative;
    z-index: 4;
    max-width: 1200px;
    margin: 0 auto;
    padding: 80px 28px 56px;
  }
  @media (max-width: 640px) {
    .products-page .hero-content { padding: 48px 14px 36px; }
  }

  /* Blinking badge */
  .products-page .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    background: var(--yellow);
    border: var(--border-thick);
    box-shadow: var(--sh);
    padding: 6px 16px 6px 12px;
    margin-bottom: 22px;
    font-family: 'Courier Prime', monospace;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--black);
    user-select: none;
  }
  .products-page .blink-dot {
    width: 9px;
    height: 9px;
    background: var(--red);
    border: 2px solid var(--black);
    flex-shrink: 0;
    animation: pp-blink 1.3s step-start infinite;
  }
  @keyframes pp-blink { 0%,100%{opacity:1} 50%{opacity:0} }

  /* Hero title */
  .products-page .hero-title-wrap {
    position: relative;
    display: inline-block;
  }
  .products-page .hero-sticker {
    position: absolute;
    top: -18px;
    right: -60px;
    background: var(--red);
    border: var(--border-thick);
    box-shadow: var(--sh);
    width: 72px;
    height: 72px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    transform: rotate(12deg);
    z-index: 10;
  }
  .products-page .hero-sticker span {
    font-family: 'Archivo Black', sans-serif;
    font-size: 9px;
    color: var(--white);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    line-height: 1.3;
    text-align: center;
  }
  @media (max-width: 640px) {
    .products-page .hero-sticker { display: none; }
  }

  /* Hero description box */
  .products-page .hero-desc-block {
    display: inline-flex;
    margin-top: 24px;
    border: var(--border-thick);
    box-shadow: var(--sh);
    overflow: hidden;
    max-width: 480px;
  }
  @media (max-width: 640px) {
    .products-page .hero-desc-block { max-width: 100%; }
  }
  .products-page .hero-desc-accent {
    background: var(--red);
    width: 8px;
    flex-shrink: 0;
  }
  .products-page .hero-desc-inner {
    background: rgba(255,255,255,0.12);
    backdrop-filter: blur(6px);
    padding: 14px 18px;
  }
  .products-page .hero-desc-inner p {
    font-size: 13px;
    font-weight: 400;
    line-height: 1.6;
    color: rgba(255,255,255,0.75);
  }

  /* ── MARQUEE ── */
  .products-page .marquee-outer {
    background: var(--black);
    border-top: var(--border-thick);
    border-bottom: var(--border-thick);
    overflow: hidden;
  }
  .products-page .marquee-track {
    display: flex;
    width: max-content;
    animation: pp-scroll 18s linear infinite;
  }
  .products-page .marquee-outer:hover .marquee-track {
    animation-play-state: paused;
  }
  .products-page .marquee-item {
    padding: 12px 32px;
    font-family: 'Courier Prime', monospace;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--yellow);
    white-space: nowrap;
    border-right: 2px solid rgba(255,225,53,0.2);
  }
  @keyframes pp-scroll { from { transform: translateX(0) } to { transform: translateX(-50%) } }

  /* ── FILTER BAR ── */
  .products-page .filter-bar {
    display: flex;
    align-items: stretch;
    border: var(--border-thick);
    box-shadow: var(--sh-lg);
    background: var(--white);
    overflow: hidden;
    margin-top: 36px;
  }
  @media (max-width: 640px) {
    .products-page .filter-bar { flex-wrap: wrap; }
  }

  .products-page .search-box {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 20px;
    border-right: var(--border-thick);
    background: var(--yellow);
    min-width: 200px;
    height: 56px;
  }
  @media (max-width: 640px) {
    .products-page .search-box { height: 48px; min-width: 0; }
  }
  .products-page .search-box input {
    background: transparent;
    border: none;
    outline: none;
    font-size: 13px;
    font-weight: 700;
    color: var(--black);
    width: 140px;
    letter-spacing: 0.03em;
  }
  .products-page .search-box input::placeholder { color: rgba(10,10,10,0.4); }

  .products-page .pills-zone {
    display: flex;
    align-items: stretch;
    flex: 1;
    overflow-x: auto;
    scrollbar-width: none;
    height: 56px;
  }
  .products-page .pills-zone::-webkit-scrollbar { display: none; }
  @media (max-width: 640px) {
    .products-page .pills-zone {
      width: 100%;
      border-top: var(--border-thick);
      height: 48px;
    }
  }

  .products-page .pill {
    border: none;
    border-right: 2px solid rgba(10,10,10,0.1);
    background: transparent;
    padding: 0 20px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: rgba(10,10,10,0.45);
    white-space: nowrap;
    transition: background 0.08s, color 0.08s;
    display: flex;
    align-items: center;
  }
  .products-page .pill:hover { background: var(--black); color: var(--yellow); }
  .products-page .pill.on {
    background: var(--red);
    color: var(--white);
    box-shadow: inset 0 -4px 0 var(--black);
  }
  @media (max-width: 640px) {
    .products-page .pill { font-size: 10px; padding: 0 13px; }
  }

  .products-page .sort-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 20px;
    border-left: var(--border-thick);
    background: var(--black);
    color: var(--yellow);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    height: 56px;
    transition: background 0.1s;
    flex-shrink: 0;
  }
  .products-page .sort-box:hover { background: var(--blue); }
  .products-page .sort-box select {
    appearance: none;
    background: transparent;
    border: none;
    outline: none;
    color: inherit;
    font-family: 'Courier Prime', monospace;
    font-size: inherit;
    font-weight: inherit;
    letter-spacing: inherit;
  }
  @media (max-width: 640px) {
    .products-page .sort-box { height: 48px; }
  }

  /* ── STAT ROW ── */
  .products-page .stat-row {
    display: flex;
    border: var(--border-thick);
    border-top: none;
    box-shadow: var(--sh);
    overflow: hidden;
    background: var(--white);
    margin-bottom: 48px;
  }
  .products-page .stat-cell {
    flex: 1;
    padding: 16px 24px;
    border-right: var(--border-thick);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .products-page .stat-cell:last-child { border-right: none; }
  .products-page .stat-label {
    font-family: 'Courier Prime', monospace;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(10,10,10,0.4);
  }
  .products-page .stat-value {
    font-family: 'Archivo Black', sans-serif;
    font-size: 32px;
    color: var(--black);
    line-height: 1;
  }
  .products-page .stat-value.accent { color: var(--red); }
  @media (max-width: 600px) {
    .products-page .stat-row { display: grid; grid-template-columns: 1fr 1fr; }
    .products-page .stat-cell { border-bottom: var(--border-thick); }
  }

  /* ── SECTION LABEL ── */
  .products-page .sec-label {
    display: flex;
    align-items: stretch;
    border: var(--border-thick);
    box-shadow: var(--sh);
    margin-bottom: 24px;
    overflow: hidden;
  }
  .products-page .sec-label-main {
    background: var(--black);
    color: var(--yellow);
    font-family: 'Courier Prime', monospace;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    padding: 12px 24px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-right: var(--border-thick);
    flex-shrink: 0;
  }
  .products-page .sec-label-fill {
    flex: 1;
    background: repeating-linear-gradient(
      -45deg, transparent, transparent 8px,
      rgba(10,10,10,0.05) 8px, rgba(10,10,10,0.05) 10px
    );
  }
  .products-page .sec-label-num {
    background: var(--red);
    color: var(--white);
    font-family: 'Archivo Black', sans-serif;
    font-size: 20px;
    padding: 0 20px;
    display: flex;
    align-items: center;
    border-left: var(--border-thick);
    flex-shrink: 0;
  }

  /* ── PRODUCT GRID ── */
  .products-page .pg {
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 900px) { .products-page .pg { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 500px)  { .products-page .pg { grid-template-columns: repeat(2, 1fr); gap: 10px; } }

  .products-page .card-shell {
    border: var(--border-thick);
    box-shadow: var(--sh);
    background: var(--white);
    overflow: hidden;
    transition: transform 0.1s, box-shadow 0.1s;
  }
  .products-page .card-shell:hover {
    transform: translate(-4px, -4px);
    box-shadow: var(--sh-xl);
  }
  .products-page .card-shell:active {
    transform: translate(4px, 4px);
    box-shadow: none;
  }

  /* ── SPINNER ── */
  .products-page .spin-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding: 100px 0;
  }
  .products-page .spinner {
    width: 40px;
    height: 40px;
    border: 5px solid var(--black);
    border-top-color: var(--yellow);
    animation: pp-spin 0.65s linear infinite;
    box-shadow: var(--sh);
  }
  .products-page .spin-label {
    font-family: 'Courier Prime', monospace;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--black);
  }
  @keyframes pp-spin { to { transform: rotate(360deg); } }

  /* ── EMPTY STATE ── */
  .products-page .empty-wrap {
    display: flex;
    justify-content: center;
    padding: 80px 0 120px;
  }
  .products-page .empty-box {
    position: relative;
    border: var(--border-thick);
    background: var(--white);
    box-shadow: var(--sh-xl);
    padding: 52px 44px;
    max-width: 420px;
    width: 100%;
  }
  .products-page .empty-box::after {
    content: '';
    position: absolute;
    inset: 8px -8px -8px 8px;
    background: var(--yellow);
    border: var(--border-thick);
    z-index: -1;
  }
  .products-page .empty-icon {
    width: 64px;
    height: 64px;
    border: var(--border-thick);
    background: var(--red);
    box-shadow: var(--sh);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
  }
  .products-page .empty-cta {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: var(--black);
    color: var(--yellow);
    border: var(--border-thick);
    box-shadow: var(--sh);
    padding: 12px 22px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-top: 24px;
    transition: transform 0.08s, box-shadow 0.08s;
  }
  .products-page .empty-cta:hover  { transform: translate(-3px,-3px); box-shadow: var(--sh-lg); }
  .products-page .empty-cta:active { transform: translate(4px,4px);   box-shadow: none; }
`;

// ─── MARQUEE ─────────────────────────────────────────────────────────────────
function Marquee() {
    const items = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];
    return (
        <div className="marquee-outer">
            <div className="marquee-track">
                {items.map((t, i) => (
                    <div key={i} className="marquee-item">{t}</div>
                ))}
            </div>
        </div>
    );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("All");
    const [sort, setSort] = useState("Popular");
    const [query, setQuery] = useState("");

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?_t=${Date.now()}`);
                if (!res.ok) throw new Error("fetch failed");
                setProducts(await res.json());
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    const filtered = products
        .filter(p =>
            (activeFilter === "All" || p.category === activeFilter) &&
            (!query || p.name?.toLowerCase().includes(query.toLowerCase()))
        )
        .sort((a, b) => {
            if (sort === "A–Z") return (a.name ?? "").localeCompare(b.name ?? "");
            if (sort === "Newest") return ((b as any).createdAt ?? 0) - ((a as any).createdAt ?? 0);
            return 0;
        });

    return (
        <main className="products-page">
            <style>{STYLES}</style>

            {/* ── HERO ── */}
            <section className="hero" style={{ minHeight: "60vh" }}>
                <video
                    src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260302_085640_276ea93b-d7da-4418-a09b-2aa5b490e838.mp4"
                    autoPlay muted loop playsInline
                    className="hero-img"
                    style={{ transform: "scaleY(-1)" }}
                />
                <div className="hero-overlay" />
                <div className="hero-noise" />

                <div className="hero-content">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } }}
                    >
                        {/* Badge */}
                        <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } }}>
                            <div className="hero-badge">
                                <span className="blink-dot" />
                                Live Catalog — 2026
                            </div>
                        </motion.div>

                        {/* Title */}
                        <motion.div variants={{ hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } } }}>
                            <div className="hero-title-wrap">
                                <h1
                                    className="display"
                                    style={{
                                        fontSize: "clamp(52px, 11vw, 130px)",
                                        lineHeight: 0.88,
                                        color: "var(--white)",
                                    }}
                                >
                                    Premium<br />
                                    <span style={{ WebkitTextStroke: "3px var(--yellow)", color: "transparent", display: "block" }}>
                                        Printing
                                    </span>
                                    <span style={{ color: "var(--yellow)" }}>&amp;</span>{" "}
                                    <span>Pack</span>
                                </h1>
                                <div className="hero-sticker">
                                    <span>2026{"\n"}CATALOG{"\n"}✦</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Description */}
                        <motion.div variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } }}>
                            <div className="hero-desc-block">
                                <div className="hero-desc-accent" />
                                <div className="hero-desc-inner">
                                    <p>High-quality branded merchandise, custom packaging, and marketing materials — crafted with precision.</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ── MARQUEE ── */}
            <Marquee />

            {/* ── CONTENT ── */}
            <div className="wrap" style={{ paddingBottom: 100 }}>

                {/* Filter bar */}
                <div className="filter-bar">
                    <div className="search-box">
                        <Search size={14} color="var(--black)" style={{ opacity: 0.5, flexShrink: 0 }} />
                        <input
                            type="text"
                            placeholder="Search catalog..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                    </div>

                    <div className="pills-zone">
                        {FILTERS.map(f => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`pill ${activeFilter === f ? "on" : ""}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="sort-box">
                        <SlidersHorizontal size={12} strokeWidth={2.5} />
                        <select value={sort} onChange={e => setSort(e.target.value)}>
                            {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                        </select>
                    </div>
                </div>

                {/* Stat row */}
                {!isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.1 }}
                        className="stat-row"
                    >
                        <div className="stat-cell">
                            <span className="stat-label">Total Items</span>
                            <span className="stat-value accent">{String(products.length).padStart(2, "0")}</span>
                        </div>
                        <div className="stat-cell">
                            <span className="stat-label">Showing</span>
                            <span className="stat-value">{String(filtered.length).padStart(2, "0")}</span>
                        </div>
                        <div className="stat-cell">
                            <span className="stat-label">Category</span>
                            <span className="stat-value mono" style={{ fontSize: 16, paddingTop: 6 }}>
                                {activeFilter}
                            </span>
                        </div>
                        <div className="stat-cell" style={{ background: "var(--yellow)" }}>
                            <span className="stat-label">Status</span>
                            <span className="stat-value mono" style={{ fontSize: 16, paddingTop: 6 }}>
                                ● LIVE
                            </span>
                        </div>
                    </motion.div>
                )}

                {/* Loading */}
                {isLoading && (
                    <div className="spin-wrap">
                        <div className="spinner" />
                        <span className="spin-label">Syncing catalog…</span>
                    </div>
                )}

                {/* Grid */}
                {!isLoading && filtered.length > 0 && (
                    <>
                        <div className="sec-label">
                            <div className="sec-label-main">
                                <Zap size={14} />
                                All Products
                            </div>
                            <div className="sec-label-fill" />
                            <div className="sec-label-num">{String(filtered.length).padStart(3, "0")}</div>
                        </div>

                        <motion.div
                            className="pg"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-60px" }}
                            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
                        >
                            {filtered.map((product, idx) => (
                                <motion.div
                                    key={product.id}
                                    variants={{
                                        hidden: { opacity: 0, y: 24 },
                                        visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }
                                    }}
                                >
                                    <div className="card-shell">
                                        <ProductCard product={product} index={idx} />
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </>
                )}

                {/* Empty state */}
                {!isLoading && filtered.length === 0 && (
                    <div className="empty-wrap">
                        <div className="empty-box">
                            <div className="empty-icon">
                                <Package size={28} color="var(--white)" />
                            </div>
                            <p
                                className="mono"
                                style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(10,10,10,0.35)", marginBottom: 8 }}
                            >
                                Status — Empty
                            </p>
                            <h3
                                className="display"
                                style={{ fontSize: 56, color: "var(--black)", lineHeight: 0.9, marginBottom: 12 }}
                            >
                                Nothing<br />Here
                            </h3>
                            <p style={{ fontSize: 13, fontWeight: 400, lineHeight: 1.6, color: "rgba(10,10,10,0.5)", maxWidth: 280 }}>
                                New 2026 samples are arriving soon. Reach out for custom bulk orders in the meantime.
                            </p>
                            <button className="empty-cta">
                                Contact Us <ArrowRight size={13} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}