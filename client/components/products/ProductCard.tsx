"use client";

import Link from "next/link";
import { Star, PlayCircle } from "lucide-react";
import { Product } from "@/types/product";

export function ProductCard({ product }: { product: Product }) {
    return (
        <div className="group flex flex-col bg-[#111111] border-2 border-black rounded-sm overflow-hidden transition-all duration-300 hover:shadow-[8px_8px_0px_0px_rgba(210,217,247,1)] h-full">
            {/* Image Section */}
            <Link href={`/products/${product.slug}`} className="block relative aspect-square overflow-hidden border-b-2 border-black">
                {product.images && product.images.length > 0 ? (
                    <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                        <span className="text-zinc-600 font-black text-4xl italic">BIND</span>
                    </div>
                )}
                {/* Optional Overlays like the 'Pr' or 'Ae' icons from image could be added if product type existed */}
            </Link>

            {/* Content Section */}
            <div className="p-4 flex flex-col grow space-y-3">
                <Link href={`/products/${product.slug}`}>
                    <h3 className="text-lg font-bold text-white leading-tight hover:text-[#ff90e8] transition-colors line-clamp-2">
                        {product.name}
                    </h3>
                </Link>

                {/* Author / Brand Line */}
                <div className="flex items-center gap-2 text-zinc-400">
                    <PlayCircle className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                    <span className="text-xs font-bold hover:text-white cursor-pointer transition-colors underline underline-offset-2">
                        bookbind.co
                    </span>
                </div>

                {/* Rating Line */}
                <div className="flex items-center gap-1.5 pt-1">
                    <Star className="w-4 h-4 fill-white text-white" />
                    <span className="text-sm font-bold text-white">4.8</span>
                    <span className="text-xs font-medium text-zinc-500">(73)</span>
                </div>
            </div>

            {/* Price Flag Section */}
            <div className="p-4 pt-0 mt-auto flex items-end justify-between">
                <div className="relative group/price">
                    {/* Pink Neubrutalist Flag */}
                    <div className="bg-[#ff90e8] text-black font-black px-4 py-1.5 text-sm relative z-10 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        ₹{product.base_price}+
                    </div>
                    {/* Flag tail using a polygon-like div/after or just a sharp corner */}
                    <div className="absolute top-0 -right-2 w-4 h-full bg-[#ff90e8] border-r-2 border-y-2 border-black origin-left -skew-x-12 z-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"></div>
                </div>
            </div>
        </div>
    );
}
