import React from "react";
import { Skeleton, ProductCardSkeleton } from "@/components/SkeletonStore";

export default function Loading() {
    return (
        <div className="min-h-screen bg-site-bg animate-pulse">
            {/* Hero Skeleton (Matching Landing/Detail style) */}
            <section className="bg-[#90e8ff] border-b-2 border-black p-8 md:p-12 relative overflow-hidden">
                <div className="max-w-6xl mx-auto space-y-6 relative z-1">
                    <Skeleton className="h-4 w-32 bg-white/50" />
                    <Skeleton className="h-16 md:h-24 w-2/3 bg-black/10" />
                    <div className="flex gap-3">
                        <Skeleton className="h-10 w-32 rounded-full bg-black/5" />
                        <Skeleton className="h-10 w-32 rounded-full bg-black/5 border-2 border-black/10" />
                    </div>
                </div>
                {/* Deco Element */}
                <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 text-[150px] font-black text-black/5 select-none leading-none">
                    00
                </div>
            </section>

            {/* Overview Card Skeleton */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl overflow-hidden mb-16">
                    <div className="grid grid-cols-1 md:grid-cols-[340px_1fr]">
                        <Skeleton className="h-64 md:h-auto bg-zinc-100 border-b-4 md:border-b-0 md:border-r-4 border-black" />
                        <div className="p-8 space-y-6">
                            <Skeleton className="h-8 w-48" />
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                                <Skeleton className="h-4 w-4/5" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-12 border-2 border-black rounded-xl" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Variants Grid Header */}
                <div className="mb-8 space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-32" />
                </div>

                {/* Variants Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map((i) => (
                        <ProductCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}
