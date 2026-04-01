"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ServiceItem, SubService } from "@/types/service";
import { SubServiceCard } from "@/components/services/SubServiceCard";

/* ── Doodle SVG helpers (matching services catalog page) ──── */

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

function DoodleSparkle({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 40 40" fill="none" className={className}>
            <path d="M20 5L22 16L33 14L24 22L30 32L20 26L10 32L16 22L7 14L18 16L20 5Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

export default function ServiceDetailView({ service }: { service: ServiceItem }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const activeVariants = service.sub_services?.filter(s => s.is_active !== false) || [];

    return (
        <main className="pp-root">

            {/* ══════════════════════════════════════════════════════
                HERO — matches landing / services catalog style
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

                    {/* Left — content */}
                    <div>
                        {/* Breadcrumb */}
                        <nav
                            className={`flex items-center gap-2 mb-6 transition-all duration-600 ease-out ${
                                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                            }`}
                        >
                            <Link
                                href="/services"
                                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-black/60 hover:text-black transition-colors"
                            >
                                <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                                Services
                            </Link>
                            <span className="text-black/30 font-bold">/</span>
                            <span className="text-xs font-bold uppercase tracking-widest text-black">
                                {service.name}
                            </span>
                        </nav>

                        <h1
                            className={`pp-hero-title transition-all duration-600 ease-out delay-100 ${
                                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                            }`}
                        >
                            {service.name.split(" ").length > 2
                                ? <>{service.name.split(" ").slice(0, -1).join(" ")}<br /><em>{service.name.split(" ").slice(-1)[0]}.</em></>
                                : <><em>{service.name}.</em></>
                            }
                        </h1>

                        {/* Description moved to page body */}

                        {/* Quick stat pills */}
                        <div
                            className={`flex flex-wrap gap-3 transition-all duration-600 ease-out delay-300 ${
                                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                            }`}
                        >
                            <span className="inline-flex items-center gap-1.5 bg-black text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full">
                                <span className="material-symbols-outlined text-[14px]">design_services</span>
                                {activeVariants.length} Tier{activeVariants.length !== 1 ? "s" : ""}
                            </span>
                            <span className="inline-flex items-center gap-1.5 bg-white text-black border-2 border-black text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full shadow-[2px_2px_0_#000]">
                                <span className="material-symbols-outlined text-[14px]">bolt</span>
                                Fast Turnaround
                            </span>
                        </div>
                    </div>

                    {/* Right — deco */}
                    <div className="pp-hero-right">
                        <div className="pp-hero-deco" aria-hidden>
                            {String(activeVariants.length).padStart(2, "0")}
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════
                SERVICE OVERVIEW
            ══════════════════════════════════════════════════════ */}
            <div className="pp-content pt-12 pb-4">
                <div className="border-2 border-black bg-white p-6 sm:p-8 relative">
                    <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
                         Service Overview
                    </h3>
                    <p className="text-zinc-600 font-medium leading-relaxed max-w-4xl">
                        {(service as any).description || "Professional implementation and expert guidance tailored specifically for your structured requirements and operations. Experience unmatched quality."}
                    </p>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════
                TIERS / SUB-SERVICES GRID
            ══════════════════════════════════════════════════════ */}
            <div className="pp-content">
                <div className="pp-section-header">
                    <h2 className="pp-section-heading">Available Tiers &amp; Services</h2>
                    <span className="pp-section-sub">
                        {activeVariants.length} tier{activeVariants.length !== 1 ? "s" : ""} found
                    </span>
                </div>

                {activeVariants.length > 0 ? (
                    <div className="pp-grid">
                        {activeVariants.map((variant: SubService, index: number) => (
                            <div key={variant.id} className="pp-card">
                                <SubServiceCard variant={variant} index={index} serviceSlug={service.slug} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="pp-empty">
                        <div className="pp-empty-icon">
                            <span className="material-symbols-outlined">design_services</span>
                        </div>
                        <p className="pp-empty-title">No tiers yet</p>
                        <p className="pp-empty-body">
                            New service tiers are being added. Check back soon or request custom work.
                        </p>
                        <Link href="/contact" className="pp-empty-cta">
                            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            Contact the Studio
                        </Link>
                    </div>
                )}
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
                            Need something<br />
                            <em>bespoke?</em>
                        </h2>
                        <p className="pp-cta-body">
                            Our master designers handle complex bespoke engineering and prototyping
                            projects daily. Reach out and let&apos;s bring your vision to life.
                        </p>
                    </div>

                    <div className="pp-cta-actions relative z-1">
                        <Link href="/contact" className="pp-btn-black">
                            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            Contact Us
                        </Link>
                        <Link href="/services" className="pp-btn-outline">
                            Browse All Services
                        </Link>
                    </div>
                </div>
            </div>

        </main>
    );
}
