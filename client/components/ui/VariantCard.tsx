"use client";

import Link from "next/link";
import { Heart, Package } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/lib/store/store";
import { toggleWishlistItem, selectIsProductLiked } from "@/lib/store/wishlistSlice";

interface VariantCardProps {
    id: string | number;
    name: string;
    description?: string;
    price: number;
    slug: string;
    image?: string | null;
    index?: number;
    basePath: string; // e.g. "/products/customize" or "/services/request"
    buttonText: string;
    minQuantityInfo: string;
    showWishlist?: boolean;
}

export function VariantCard({
    id,
    name,
    description,
    price,
    slug,
    image,
    index = 0,
    basePath,
    buttonText,
    minQuantityInfo,
    showWishlist = false
}: VariantCardProps) {
    const dispatch = useDispatch<AppDispatch>();
    const isLiked = useSelector((state: RootState) => selectIsProductLiked(state, String(id)));

    const isNew = index % 3 === 0;
    const isTrending = index % 3 === 1;
    const isBestSeller = index % 3 === 2;

    let tag = null;
    let tagColor = "";
    if (isNew) { tag = "New"; tagColor = "bg-[#FFD700]"; }
    else if (isTrending) { tag = "Trending"; tagColor = "bg-[#39FF14]"; }
    else if (isBestSeller) { tag = "Best Seller"; tagColor = "bg-[#DDA0DD]"; }

    const originalPrice = price * 1.25;

    return (
        <div className="group relative flex flex-col h-[420px] overflow-hidden border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl">
            {/* Image Link Area */}
            <Link href={`${basePath}/${slug}`} className="absolute inset-0 z-0 h-[75%] w-full bg-gray-50 border-b-2 border-black overflow-hidden block">
                {image ? (
                    <img
                        src={image}
                        alt={name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-zinc-400 bg-zinc-100 transition-colors group-hover:bg-zinc-200">
                        <Package className="w-16 h-16 text-zinc-300 mb-2 transition-transform duration-500 group-hover:scale-110" />
                    </div>
                )}

                {tag && (
                    <div className="absolute top-4 right-4 z-20">
                        <span className={`inline-block ${tagColor} border-2 border-black px-3 py-1 text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                            {tag}
                        </span>
                    </div>
                )}
            </Link>

            {/* Favorite Button (Optional) */}
            {showWishlist && (
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        dispatch(toggleWishlistItem({ sub_product_id: String(id) }));
                    }}
                    className={`absolute bottom-[28%] right-4 z-20 flex items-center justify-center w-10 h-10 border-2 border-black rounded-full transition-all group/heart active:scale-95 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                        ${isLiked ? 'bg-pink-50' : 'bg-white hover:bg-pink-50'}`}
                >
                    <Heart className={`w-5 h-5 transition-all text-black group-hover/heart:scale-110 
                        ${isLiked ? 'text-primary fill-primary' : 'group-hover/heart:text-primary group-hover/heart:fill-primary'}`}
                    />
                </button>
            )}

            {/* Content Area */}
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-white p-4 flex flex-col justify-between h-[25%] group-hover:h-[52%] transition-all duration-300 ease-in-out pointer-events-none pb-6">
                <div className="flex flex-col gap-1 pointer-events-auto">
                    <Link href={`${basePath}/${slug}`}>
                        <h3 className="font-display text-lg font-bold uppercase leading-tight tracking-tight truncate hover:text-primary transition-colors">
                            {name}
                        </h3>
                    </Link>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black">₹{price.toLocaleString()}</span>
                        <span className="text-sm font-bold text-gray-400 line-through">₹{originalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    {minQuantityInfo && <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{minQuantityInfo}</span>}
                </div>

                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-3 pointer-events-auto">
                    {description && (
                        <p className="text-[11px] font-medium leading-normal text-gray-600 line-clamp-2">
                            {description}
                        </p>
                    )}
                    <Link
                        href={`${basePath}/${slug}`}
                        className="w-full h-10 flex items-center justify-center bg-black text-white border-2 border-black font-black text-xs uppercase hover:bg-primary transition-colors shadow-[4px_4px_0px_0px_rgba(238,43,140,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                    >
                        {buttonText}
                    </Link>
                </div>
            </div>
        </div>
    );
}
