"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Product, SubProduct } from "@/types/product";
import { SubProductCard } from "@/components/products/SubProductCard";

/* ── Doodle SVG helpers (matching products catalog page) ──── */

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

function DoodleStar({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 50 50" fill="none" className={className}>
            <path d="M25 5L30 18L44 20L33 30L36 44L25 37L14 44L17 30L6 20L20 18L25 5Z" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="#FDF567" />
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

function DoodleScribble({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 60 60" fill="none" className={className}>
            <path d="M10 50C15 30 25 15 35 20C45 25 30 40 20 35C10 30 25 10 50 15" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    );
}

export default function ProductDetailView({ product }: { product: Product }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const activeVariants = product.sub_products?.filter(s => s.is_active !== false) || [];

    return (
        <main className="pp-root">

            {/* ══════════════════════════════════════════════════════
                HERO — matches landing page style
            ══════════════════════════════════════════════════════ */}
            <section className="pp-hero relative overflow-hidden">

                {/* Dot pattern */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(circle,#000_1px,transparent_1px)] bg-size-[24px_24px]"
                />

                {/* Floating doodles */}
                <DoodleBook     className="absolute top-16 left-[4%]        w-16 opacity-20 pp-doodle-float-1 hidden sm:block" />
                <DoodleBox      className="absolute top-20 right-[6%]       w-14 opacity-20 pp-doodle-float-2 hidden sm:block" />
                <DoodlePrinter  className="absolute top-[45%] left-[2%]     w-16 opacity-[0.15] pp-doodle-float-3 hidden md:block" />
                <DoodleStar     className="absolute top-[30%] right-[5%]    w-10 opacity-25 pp-doodle-spin hidden sm:block" />
                <DoodleScribble className="absolute bottom-[22%] left-[10%] w-12 opacity-[0.15] pp-doodle-float-2 hidden md:block" />
                <DoodleHeart    className="absolute top-16 left-[25%]       w-8  opacity-20 pp-doodle-float-3 hidden lg:block" />
                <DoodleStar     className="absolute top-[60%] left-[15%]    w-6  opacity-[0.15] pp-doodle-spin-slow hidden lg:block" />

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
                                href="/products"
                                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-black/60 hover:text-black transition-colors"
                            >
                                <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                                Products
                            </Link>
                            <span className="text-black/30 font-bold">/</span>
                            <span className="text-xs font-bold uppercase tracking-widest text-black">
                                {product.name}
                            </span>
                        </nav>

                        <h1
                            className={`pp-hero-title transition-all duration-600 ease-out delay-100 ${
                                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                            }`}
                        >
                            {product.name.split(" ").length > 2
                                ? <>{product.name.split(" ").slice(0, -1).join(" ")}<br /><em>{product.name.split(" ").slice(-1)[0]}.</em></>
                                : <><em>{product.name}.</em></>
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
                                <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                                {activeVariants.length} Variant{activeVariants.length !== 1 ? "s" : ""}
                            </span>
                            <span className="inline-flex items-center gap-1.5 bg-white text-black border-2 border-black text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full shadow-[2px_2px_0_#000]">
                                <span className="material-symbols-outlined text-[14px]">verified</span>
                                Premium Quality
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
                PRODUCT OVERVIEW — Rich Two-Column
            ══════════════════════════════════════════════════════ */}
            <div className="pp-content pt-12 pb-4">
                <div className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] items-stretch">

                        {/* Cover Image */}
                        <div className="relative h-56 md:h-auto bg-zinc-100 border-b-2 md:border-b-0 md:border-r-2 border-black overflow-hidden">
                            {product.cover_image ? (
                                <img
                                    src={product.cover_image}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-[#FF90E8]/20 to-accent-purple/20">
                                    <span className="text-zinc-300 font-black text-4xl uppercase tracking-tighter opacity-50">
                                        {product.name.charAt(0)}
                                    </span>
                                </div>
                            )}
                            {/* Accent corner */}
                            <div className="absolute top-3 left-3">
                                <span className="bg-[#fdf567] text-black text-[9px] font-black uppercase tracking-widest px-3 py-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    Overview
                                </span>
                            </div>
                        </div>

                        {/* Description + Highlights */}
                        <div className="p-6 sm:p-8 flex flex-col justify-center">
                            <h3 className="text-2xl font-black uppercase tracking-tight mb-4 flex items-center gap-3">
                                <span className="w-8 h-8 bg-[#FF90E8] border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
                                    <span className="material-symbols-outlined text-[16px]">description</span>
                                </span>
                                About This Product
                            </h3>

                            <p className="text-zinc-600 font-medium leading-relaxed text-[15px] mb-6">
                                {product.description || "Expertly crafted printing and binding solutions tailored for professionals and businesses. Experience unmatched quality and durability with every order."}
                            </p>

                            {/* Feature highlights */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { icon: "verified", label: "Premium Quality", color: "bg-[#4be794]" },
                                    { icon: "tune", label: "Custom Options", color: "bg-[#a788fa]" },
                                    { icon: "local_shipping", label: "Fast Delivery", color: "bg-[#90e8ff]" },
                                ].map(feat => (
                                    <div key={feat.label} className={`flex items-center gap-2.5 px-3 py-2.5 ${feat.color} border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                                        <span className="material-symbols-outlined text-[16px]">{feat.icon}</span>
                                        <span className="text-xs font-black uppercase tracking-wider">{feat.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════
                VARIANTS GRID
            ══════════════════════════════════════════════════════ */}
            <div className="pp-content">
                <div className="pp-section-header">
                    <h2 className="pp-section-heading">Available Variants</h2>
                    <span className="pp-section-sub">
                        {activeVariants.length} variant{activeVariants.length !== 1 ? "s" : ""} found
                    </span>
                </div>

                {activeVariants.length > 0 ? (
                    <div className="pp-grid">
                        {activeVariants.map((sub: SubProduct, index: number) => (
                            <div key={sub.id} className="pp-card">
                                <SubProductCard subProduct={sub} index={index} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="pp-empty">
                        <div className="pp-empty-icon">
                            <span className="material-symbols-outlined">inventory_2</span>
                        </div>
                        <p className="pp-empty-title">No variants yet</p>
                        <p className="pp-empty-body">
                            New variants are being added to this category. Check back soon or request a custom order.
                        </p>
                        <Link href="/services#contact" className="pp-empty-cta">
                            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            Add To Cart
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
                            Custom &amp; Bulk Orders
                        </div>
                        <h2 className="pp-cta-title">
                            Need something<br />
                            <em>different?</em>
                        </h2>
                        <p className="pp-cta-body">
                            Can&apos;t find the exact variant you need? We offer custom specifications,
                            bulk orders, and bespoke solutions tailored to your brand.
                        </p>
                    </div>

                    <div className="pp-cta-actions relative z-1">
                        <Link href="/contact" className="pp-btn-black">
                            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            Contact Sales
                        </Link>
                        <Link href="/products" className="pp-btn-outline">
                            Browse All Products
                        </Link>
                    </div>
                </div>
            </div>

        </main>
    );
}
