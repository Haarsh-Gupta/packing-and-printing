"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ServiceItem } from "@/types/service";
import { ServiceCard } from "@/components/services/ServiceCard";

/* ── Doodle SVG helpers ──────────────────────────────────────── */

function DoodlePenTool({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 80 80" fill="none" className={className}>
            <path d="M55 20L60 25L30 55L20 60L25 50L55 20Z" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M48 27L53 32" stroke="black" strokeWidth="2" strokeLinecap="round" />
            <circle cx="20" cy="60" r="3" stroke="black" strokeWidth="2" />
        </svg>
    );
}

function DoodleLayers({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 80 80" fill="none" className={className}>
            <path d="M15 55L40 67L65 55" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 45L40 57L65 45" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 35L40 47L65 35L40 23L15 35Z" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function DoodlePalette({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 80 80" fill="none" className={className}>
            <path d="M40 15C25 15 12 27 12 42C12 52 18 58 27 58C30 58 33 55 33 52C33 50 35 48 38 48H50C58 48 68 42 68 33C68 22 55 15 40 15Z" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="25" cy="32" r="4" fill="#FF90E8" stroke="black" strokeWidth="2" />
            <circle cx="38" cy="24" r="4" fill="#FDF567" stroke="black" strokeWidth="2" />
            <circle cx="52" cy="28" r="4" fill="#b8f0c8" stroke="black" strokeWidth="2" />
            <circle cx="58" cy="40" r="4" fill="#c8d8ff" stroke="black" strokeWidth="2" />
        </svg>
    );
}

function DoodleStar({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 50 50" fill="none" className={className}>
            <path d="M25 5L30 18L44 20L33 30L36 44L25 37L14 44L17 30L6 20L20 18L25 5Z" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="#c8d8ff" />
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

function DoodleSparkle({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 40 40" fill="none" className={className}>
            <path d="M20 5L22 16L33 14L24 22L30 32L20 26L10 32L16 22L7 14L18 16L20 5Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/* ── Filter config ───────────────────────────────────────────── */

const FILTERS = [
    { label: "All Services",  color: "bg-black text-white",         keyword: "" },
    { label: "Design",        color: "bg-[#b8f0c8] text-black",     keyword: "design" },
    { label: "Consulting",    color: "bg-[#ffd6e8] text-black",     keyword: "consulting" },
    { label: "Printing",      color: "bg-[#fff0a0] text-black",     keyword: "printing" },
    { label: "Prototyping",   color: "bg-[#c8d8ff] text-black",     keyword: "prototyping" },
] as const;

/* ── Why Us strip ────────────────────────────────────────────── */

const WHY_CARDS = [
    {
        num: "01",
        icon: <span className="material-symbols-outlined text-[22px]">verified</span>,
        color: "#c8d8ff",
        tw: "bg-[#c8d8ff]",
        title: "Expert studio",
        body: "Every service is handled by specialists — from pre-press designers to production engineers with years in the trade.",
    },
    {
        num: "02",
        icon: <span className="material-symbols-outlined text-[22px]">receipt_long</span>,
        color: "#fff0a0",
        tw: "bg-[#fff0a0]",
        title: "Transparent pricing",
        body: "No hidden fees. You get a detailed quote before any work begins. Approve, negotiate, or cancel — your call.",
    },
    {
        num: "03",
        icon: <span className="material-symbols-outlined text-[22px]">bolt</span>,
        color: "#b8f0c8",
        tw: "bg-[#b8f0c8]",
        title: "Fast turnaround",
        body: "Rush jobs accepted. Our studio keeps capacity reserved for urgent requests with guaranteed delivery windows.",
    },
];

/* ── Page ───────────────────────────────────────────────────── */

export default function ServicesCatalogPage() {
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [activeKeyword, setActiveKeyword] = useState("");
    const [mounted, setMounted] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 16;

    useEffect(() => {
        setMounted(true);
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/services?_t=${Date.now()}&limit=1000`)
            .then((r) => (r.ok ? r.json() : []))
            .then(setServices)
            .catch(() => setServices([]));
    }, []);

    const visible = services.filter((s) => {
        const haystack = s.name.toLowerCase();
        return activeKeyword === "" || haystack.includes(activeKeyword);
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [activeKeyword]);

    const paginated = visible.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(visible.length / itemsPerPage);

    return (
        <>
            <main className="pp-root">

                {/* ══════════════════════════════════════════════════════
                    HERO
                ══════════════════════════════════════════════════════ */}
                <section className="pp-hero bg-[#c8d8ff] relative overflow-hidden">

                    {/* Dot pattern */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(circle,#000_1px,transparent_1px)] bg-size-[24px_24px]"
                    />

                    {/* Floating doodles */}
                    <DoodlePenTool  className="absolute top-14 left-[4%]         w-16 opacity-20 pp-doodle-float-1 hidden sm:block" />
                    <DoodleLayers   className="absolute top-20 right-[6%]        w-14 opacity-20 pp-doodle-float-2 hidden sm:block" />
                    <DoodlePalette  className="absolute top-[42%] left-[2%]      w-16 opacity-20 pp-doodle-float-3 hidden md:block" />
                    <DoodleStar     className="absolute top-[28%] right-[5%]     w-10 opacity-25 pp-doodle-spin   hidden sm:block" />
                    <DoodleArrow    className="absolute bottom-[20%] right-[5%]  w-20 opacity-20 pp-doodle-float-1 hidden sm:block" />
                    <DoodleSparkle  className="absolute top-[55%] right-[14%]    w-8  opacity-20 pp-doodle-spin-slow hidden md:block" />
                    <DoodleStar     className="absolute top-12 right-[25%]       w-7  opacity-[0.15] pp-doodle-float-2 hidden lg:block" />
                    <DoodleSparkle  className="absolute top-[60%] left-[15%]     w-6  opacity-[0.15] pp-doodle-float-3 hidden lg:block" />

                    <div className="pp-hero-inner relative z-1">

                        {/* Left */}
                        <div>
                            <h1
                                className={`pp-hero-title transition-all duration-600 ease-out ${
                                    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                                }`}
                            >
                                Explore our<br />
                                <em>service catalog.</em>
                            </h1>

                            <p
                                className={`pp-hero-sub transition-all duration-600 ease-out delay-150 ${
                                    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                                }`}
                            >
                                From conceptual mockups to full production setups — every service
                                is executed with precision by our studio masters.
                            </p>


                        </div>

                        {/* Right — deco */}
                        <div className="pp-hero-right">
                            <div className="pp-hero-deco" aria-hidden>
                                {String(services.length).padStart(2, "0")}
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
                                <span className="material-symbols-outlined text-[14px]">filter_list_off</span>
                                Reset
                            </button>
                        </div>
                    </div>
                </nav>

                {/* ══════════════════════════════════════════════════════
                    SERVICE GRID
                ══════════════════════════════════════════════════════ */}
                <div className="pp-content">
                    <div className="pp-section-header">
                        <h2 className="pp-section-heading">
                            {activeKeyword
                                ? FILTERS.find((f) => f.keyword === activeKeyword)?.label ?? "Services"
                                : "All Categories"}
                        </h2>
                        <span className="pp-section-sub">
                            {visible.length} service{visible.length !== 1 ? "s" : ""} found
                        </span>
                    </div>

                    <div className="pp-grid">
                        {paginated.length > 0 ? (
                            paginated.map((service, index) => (
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
                                    New services are being added. Check back soon or request custom work.
                                </p>
                                <Link href="/contact" className="pp-empty-cta">
                                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                    Contact the Studio
                                </Link>
                            </div>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-12 bg-white/50 backdrop-blur-sm px-6 py-3 rounded-full border border-black/5 mx-auto w-max">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-black/10 hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black transition-all"
                            >
                                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                            </button>
                            <span className="text-[11px] font-bold tracking-widest uppercase mx-2 text-black/60">
                                Page <span className="text-black">{currentPage}</span> of <span className="text-black">{totalPages}</span>
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-black/10 hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black transition-all"
                            >
                                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════
                    WHY US STRIP
                ══════════════════════════════════════════════════════ */}
                <div className="pp-strip-wrap">
                    <div className="pp-strip-header">
                        <span className="pp-strip-tag">Why us</span>
                        <span className="pp-strip-title">What sets us apart.</span>
                    </div>
                    <div className="pp-strip-grid">
                        {WHY_CARDS.map((card) => (
                             <div key={card.num} className="pp-strip-card bg-white">
                                <div className="flex items-center justify-between">
                                    <div className={`pp-strip-icon ${card.tw}`}>
                                        {card.icon}
                                    </div>
                                    <span className="pp-strip-num">{card.num}</span>
                                </div>
                                <p className="pp-strip-card-title">{card.title}</p>
                                <p className="pp-strip-card-body">{card.body}</p>
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

                        <div className="relative z-1">
                            <div className="pp-cta-badge">
                                <span className="material-symbols-outlined text-[12px]">support_agent</span>
                                Custom Studio Work
                            </div>
                            <h2 className="pp-cta-title">
                                Can&apos;t find what<br />
                                <em>you need?</em>
                            </h2>
                            <p className="pp-cta-body">
                                Can&apos;t find exactly what you&apos;re looking for? Our master designers handle
                                complex bespoke engineering and prototyping projects daily.
                            </p>
                        </div>

                        <div className="pp-cta-actions relative z-1">
                            <Link href="/contact" className="pp-btn-black">
                                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
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