"use client";

import Link from "next/link";
import { Heart, Package } from "lucide-react";
import { SubProduct } from "@/types/product";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/lib/store/store";
import { toggleWishlistItem, selectIsProductLiked } from "@/lib/store/wishlistSlice";

export function SubProductCard({ subProduct, index = 0 }: { subProduct: SubProduct; index?: number }) {
    const dispatch = useDispatch<AppDispatch>();
    const isLiked = useSelector((state: RootState) => selectIsProductLiked(state, subProduct.id));

    // Grab first image if available
    const coverImage = subProduct.images && subProduct.images.length > 0 ? subProduct.images[0] : null;

    const isNew = index % 3 === 0;
    const isTrending = index % 3 === 1;
    const isBestSeller = index % 3 === 2;

    let tag = null;
    let tagColor = "";
    if (isNew) { tag = "New"; tagColor = "bg-[#FFD700]"; }
    else if (isTrending) { tag = "Trending"; tagColor = "bg-[#39FF14]"; }
    else if (isBestSeller) { tag = "Best Seller"; tagColor = "bg-[#DDA0DD]"; }

    // Fake struck-through price
    const originalPrice = subProduct.base_price * 1.25;

    return (
        <div className="group relative flex flex-col h-[420px] overflow-hidden border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-2xl">
            <Link href={`/products/customize/${subProduct.slug}`} className="absolute inset-0 z-0 h-[75%] w-full bg-gray-50 border-b-4 border-black overflow-hidden block">
                {coverImage ? (
                    <img
                        src={coverImage}
                        alt={subProduct.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-zinc-400">
                        <Package className="w-16 h-16 text-zinc-300 mb-2" />
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

            {/* Favorite Button */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    dispatch(toggleWishlistItem({ sub_product_id: subProduct.id }));
                }}
                className={`absolute bottom-[28%] right-4 z-20 flex items-center justify-center w-10 h-10 border-2 border-black rounded-full transition-all group/heart active:scale-95 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                    ${isLiked ? 'bg-pink-50' : 'bg-white hover:bg-pink-50'}`}
            >
                <Heart className={`w-5 h-5 transition-all text-black group-hover/heart:scale-110 
                    ${isLiked ? 'text-primary fill-primary' : 'group-hover/heart:text-primary group-hover/heart:fill-primary'}`}
                />
            </button>

            <div className="absolute bottom-0 left-0 right-0 z-10 bg-white p-4 flex flex-col justify-between h-[25%] group-hover:h-[45%] transition-all duration-300 ease-in-out pointer-events-none">
                <div className="flex flex-col gap-1 pointer-events-auto">
                    <Link href={`/products/customize/${subProduct.slug}`}>
                        <h3 className="font-display text-lg font-bold uppercase leading-tight tracking-tight truncate hover:text-primary transition-colors">
                            {subProduct.name}
                        </h3>
                    </Link>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black">₹{subProduct.base_price.toLocaleString()}</span>
                        <span className="text-sm font-bold text-gray-400 line-through">₹{originalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                </div>

                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-3 pointer-events-auto">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Min. Order: {subProduct.minimum_quantity} Units
                    </p>
                    <Link
                        href={`/products/customize/${subProduct.slug}`}
                        className="w-full h-10 flex items-center justify-center bg-black text-white border-2 border-black font-black text-xs uppercase hover:bg-primary transition-colors shadow-[4px_4px_0px_0px_rgba(238,43,140,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                    >
                        Customize
                    </Link>
                </div>
            </div>
        </div>
    );
}
