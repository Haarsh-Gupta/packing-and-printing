"use client";

import { useState } from "react";
import Link from "next/link";
import { Product } from "@/types/product";
import { ArrowRight, Package, ChevronDown } from "lucide-react";

interface ProductCardProps {
    product: Product;
    index: number;
}

const CARD_STYLES = `
    .desktop-card { display: flex; }
    .mobile-card  { display: none;  }
    @media (max-width: 640px) {
        .desktop-card { display: none;  }
        .mobile-card  { display: block; }
    }
`;

export function ProductCard({ product, index }: ProductCardProps) {
    const [expanded, setExpanded] = useState(false);

    const variantCountText = product.sub_products?.length > 0
        ? `${product.sub_products.length} Variations`
        : "0 Variations";

    const coverImage = product.cover_image || null;

    return (
        <>
            <style>{CARD_STYLES}</style>

            {/* ══════════ DESKTOP CARD ══════════ */}
            {/* aspect-square on the Link itself, hover panel is absolute overlay */}
            <Link
                href={`/products/${product.slug}`}
                className="desktop-card group relative flex-col aspect-square w-full overflow-hidden border-2 border-black bg-white rounded-2xl no-underline transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
                {/* Image fills the whole square */}
                <div className="absolute inset-0 bg-zinc-100">
                    {coverImage ? (
                        <img
                            src={coverImage}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-16 h-16 text-zinc-300" />
                        </div>
                    )}
                </div>

                {/* Bottom info strip — always visible, sits at bottom */}
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-black px-4 pt-3 pb-3 z-10">
                    <div className="flex justify-between items-center">
                        <h3 className="font-black text-[15px] uppercase leading-tight tracking-tight text-black truncate pr-2">
                            {product.name}
                        </h3>
                        <span className="text-[10px] font-black bg-zinc-100 px-2.5 py-1 border border-black rounded shadow-[1px_1px_0px_0px_#000] shrink-0 uppercase tracking-tight">
                            {variantCountText}
                        </span>
                    </div>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                        Premium Branding Collection
                    </p>
                </div>

                {/* Hover overlay — slides up from bottom, absolute so it NEVER affects grid height */}
                <div className="absolute inset-0 z-20 flex flex-col justify-end translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
                    <div className="bg-white border-t-2 border-black px-4 py-4">
                        <p className="text-[11px] text-zinc-600 leading-relaxed mb-3 line-clamp-3">
                            {product.description || "High-quality corporate merchandise customized with your brand logo and identity."}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-3">
                            <span className="text-[8px] font-black px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-700 rounded-sm">IN STOCK</span>
                            <span className="text-[8px] font-black px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-700 rounded-sm">BULK PRICING</span>
                            <span className="text-[8px] font-black px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-700 rounded-sm">CUSTOMIZABLE</span>
                        </div>
                        <div className="w-full flex items-center justify-center gap-1.5 bg-[#4f46e5] text-white border-2 border-black text-[11px] font-black uppercase px-3 py-2 shadow-[2px_2px_0px_0px_#000]">
                            Configure Product <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                    </div>
                </div>
            </Link>

            {/* ══════════ MOBILE CARD — tap accordion ══════════ */}
            <div className="mobile-card w-full overflow-hidden border-2 border-black bg-white rounded-2xl" style={{ boxSizing: "border-box", maxWidth: "100%" }}>
                {/* Square image — padding-top 100% trick for reliable mobile aspect ratio */}
                <Link href={`/products/${product.slug}`} className="block relative w-full overflow-hidden bg-zinc-100" style={{ paddingTop: "100%", height: 0 }}>
                    {coverImage ? (
                        <img src={coverImage} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Package className="w-12 h-12 text-zinc-300" />
                        </div>
                    )}
                </Link>

                {/* Tap row: name + chevron */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-white border-t-2 border-black text-left"
                >
                    <div className="min-w-0 pr-2">
                        <h3 className="font-black text-[12px] uppercase leading-tight tracking-tight text-black truncate">
                            {product.name}
                        </h3>
                        <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
                            Premium Branding
                        </p>
                    </div>
                    <ChevronDown
                        size={15}
                        strokeWidth={2.5}
                        className="shrink-0 text-black transition-transform duration-200"
                        style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
                    />
                </button>

                {/* Expandable drawer */}
                <div
                    className="overflow-hidden transition-all duration-300 ease-in-out bg-white"
                    style={{ maxHeight: expanded ? "180px" : "0px", opacity: expanded ? 1 : 0 }}
                >
                    <div className="px-3 pb-3 border-t border-zinc-100">
                        <p className="text-[11px] text-zinc-600 leading-relaxed mt-2 mb-3">
                            {product.description || "High-quality corporate merchandise customized with your brand logo and identity."}
                        </p>
                        <Link
                            href={`/products/${product.slug}`}
                            className="w-full flex items-center justify-center gap-1.5 bg-[#4f46e5] text-white border-2 border-black text-[11px] font-black uppercase px-3 py-2 no-underline"
                        >
                            Configure <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}