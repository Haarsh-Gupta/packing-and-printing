"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, ChevronDown, SlidersHorizontal } from "lucide-react";
import { ServiceItem } from "@/types/service";
import { ServiceCard } from "@/components/services/ServiceCard";
import { staggerContainer, cardReveal } from "@/lib/animations";

// ══════════════ CONSTANTS ══════════════
const FILTERS = ["All", "Design", "Consulting", "Printing", "Prototyping"] as const;
const SORT_OPTIONS = ["Newest", "Popular", "A–Z"] as const;

const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  :root {
    --off-white:  #e0e9f8ff;
    --ink:       #0d0d0d;
    --yellow:    #f5e642;
    --shadow-sm: 3px 3px 0 var(--ink);
    --shadow-md: 5px 5px 0 var(--ink);
  }

  .display { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.01em; }
  .body-f   { font-family: 'DM Sans', sans-serif; }

  /* Filter pill */
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
  }
  .pill:hover {
    background: var(--ink);
    color: var(--off-white);
  }
  .pill.active {
    background: var(--ink);
    color: var(--yellow);
    box-shadow: var(--shadow-sm);
  }

  /* Sort select wrapper */
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
  }
  .sort-wrap:hover {
    box-shadow: var(--shadow-sm);
    transform: translate(-1px,-1px);
  }
  .sort-wrap select {
    appearance: none;
    background: transparent;
    border: none;
    outline: none;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    color: inherit;
    cursor: pointer;
  }

  /* Hero search */
  .search-box {
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1.5px solid rgba(255,255,255,0.25);
    background: rgba(255,255,255,0.08);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    padding: 10px 18px;
    transition: border-color 0.15s, background 0.15s;
  }
  .search-box:focus-within {
    border-color: var(--yellow);
    background: rgba(255,255,255,0.13);
  }
  .search-box input {
    background: transparent;
    border: none;
    outline: none;
    color: white;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 400;
    letter-spacing: 0.03em;
    width: 200px;
  }
  .search-box input::placeholder { color: rgba(255,255,255,0.38); }

  .no-sb::-webkit-scrollbar { display: none; }
  .no-sb { -ms-overflow-style: none; scrollbar-width: none; }
`;

export default function ServicesCatalogPage() {
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("All");
    const [sort, setSort] = useState("Newest");
    const [query, setQuery] = useState("");

    useEffect(() => {
        async function fetchServices() {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/services?_t=${Date.now()}`
                );
                if (!res.ok) throw new Error("Failed to fetch services");
                const data = await res.json();
                setServices(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchServices();
    }, []);

    return (
        <main className="min-h-screen body-f" style={{ background: "var(--off-white)" }}>
            <style>{PAGE_STYLES}</style>

            {/* ══════════════ HERO — FULL-BLEED VIDEO BG ══════════════ */}
            <section className="relative w-full" style={{ height: "68vh", minHeight: 560 }}>

                {/* Video */}
                <video
                    src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260302_085640_276ea93b-d7da-4418-a09b-2aa5b490e838.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: "brightness(0.78)" }}
                />

                {/* Gradient scrim — fades into page background at base */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.1) 35%, rgba(0,0,0,0.2) 78%, #e0e9f8ff 100%)",
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

                {/* Text — pinned to bottom-left inside constrained column */}
                <div
                    className="absolute bottom-0 left-0 right-0"
                    style={{ maxWidth: "66vw", margin: "0 auto", padding: "0 24px 56px" }}
                >
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: {},
                            visible: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
                        }}
                    >
                        {/* Eyebrow label */}
                        <motion.p
                            variants={{
                                hidden: { opacity: 0, y: 10 },
                                visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
                            }}
                            className="body-f text-[11px] font-medium uppercase tracking-[0.22em] mb-5"
                            style={{ color: "var(--yellow)" }}
                        >
                            Studio Catalog — 2026
                        </motion.p>

                        {/* Heading */}
                        <motion.h1
                            variants={{
                                hidden: { opacity: 0, y: 28 },
                                visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
                            }}
                            className="display text-white leading-[0.9]"
                            style={{ fontSize: "clamp(58px, 8vw, 118px)" }}
                        >
                            Professional<br />
                            <span style={{ WebkitTextStroke: "2px white", color: "transparent" }}>
                                Services
                            </span>
                            {" "}<span style={{ color: "var(--yellow)" }}>&amp;</span> Studio
                        </motion.h1>

                        {/* Sub-row: description + search */}
                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: 16 },
                                visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
                            }}
                            className="mt-8 flex flex-col sm:flex-row items-start sm:items-end gap-5"
                        >
                            <p
                                className="body-f text-[14px] font-light leading-relaxed max-w-[340px]"
                                style={{ color: "rgba(255,255,255,0.6)" }}
                            >
                                From conceptual mockups to full architectural setups — executed with precision by our studio masters.
                            </p>

                            <div className="search-box sm:ml-auto shrink-0">
                                <Search size={13} color="rgba(255,255,255,0.45)" />
                                <input
                                    type="text"
                                    placeholder="Search services..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ══════════════ FILTER BAR ══════════════ */}
            <div style={{ maxWidth: "66vw", margin: "0 auto", padding: "0 24px" }}>
                <div
                    className="flex items-center justify-between gap-4 py-5 border-b-2"
                    style={{ borderColor: "var(--ink)" }}
                >
                    {/* Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto no-sb">
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

                    {/* Sort */}
                    <div className="sort-wrap shrink-0">
                        <SlidersHorizontal size={11} strokeWidth={2} />
                        <select value={sort} onChange={(e) => setSort(e.target.value)}>
                            {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                        <ChevronDown size={11} strokeWidth={2} />
                    </div>
                </div>

                {/* Count label */}
                <p
                    className="body-f text-[11px] font-medium uppercase tracking-[0.14em] mt-4 mb-8"
                    style={{ color: "rgba(13,13,13,0.32)" }}
                >
                    {isLoading
                        ? "Loading…"
                        : `${services.length} service${services.length !== 1 ? "s" : ""} available`}
                </p>
            </div>

            {/* ══════════════ SERVICE GRID ══════════════ */}
            <div style={{ maxWidth: "66vw", margin: "0 auto", padding: "0 24px 100px" }}>

                {isLoading ? (
                    <div className="py-36 flex justify-center items-center gap-3">
                        <div
                            className="w-5 h-5 rounded-full animate-spin border-2"
                            style={{ borderColor: "var(--ink)", borderTopColor: "transparent" }}
                        />
                        <span
                            className="body-f text-[11px] font-medium uppercase tracking-widest"
                            style={{ color: "rgba(13,13,13,0.38)" }}
                        >
                            Fetching…
                        </span>
                    </div>
                ) : services.length > 0 ? (
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-60px" }}
                        className="grid gap-6"
                        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))" }}
                    >
                        {services.map((service, idx) => (
                            <motion.div key={service.id} variants={cardReveal}>
                                <ServiceCard service={service} index={idx} />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-36 text-center">
                        <div
                            className="w-16 h-16 border-2 flex items-center justify-center mb-5"
                            style={{
                                borderColor: "var(--ink)",
                                background: "var(--yellow)",
                                boxShadow: "var(--shadow-md)",
                            }}
                        >
                            <span className="display text-[30px]" style={{ color: "var(--ink)" }}>?</span>
                        </div>
                        <h3 className="display mb-2" style={{ fontSize: "38px", color: "var(--ink)" }}>
                            Nothing Here Yet
                        </h3>
                        <p
                            className="body-f text-[13px] font-light leading-relaxed max-w-xs"
                            style={{ color: "rgba(13,13,13,0.45)" }}
                        >
                            We're updating our catalog. Contact us for bespoke requests.
                        </p>
                    </div>
                )}
            </div>

        </main>
    );
}