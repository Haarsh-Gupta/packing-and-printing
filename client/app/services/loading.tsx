import React from "react";
import { ProductCardSkeleton, HeaderSkeleton } from "@/components/SkeletonStore";

export default function Loading() {
    return (
        <div className="min-h-screen bg-site-bg">
            <HeaderSkeleton />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <ProductCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}
