import React from "react";
import { Skeleton } from "@/components/SkeletonStore";

export default function OrderDetailSkeleton() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto pt-4 animate-pulse">
            {/* Header / Back Link Skeleton */}
            <div className="space-y-4">
                <Skeleton className="h-4 w-32" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-black pb-6">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64 md:w-80" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                    <Skeleton className="h-10 w-32 rounded-full" />
                </div>
            </div>

            {/* Status Steps Skeleton */}
            <div className="border-4 border-black p-6 md:p-8 bg-zinc-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-2xl">
                <div className="hidden md:flex justify-between items-start mb-8 relative">
                    <div className="absolute top-5 left-0 w-full h-1 bg-zinc-200 -z-10" />
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex flex-col items-center gap-3 bg-zinc-50 px-2">
                            <Skeleton className="h-10 w-10 rounded-full border-2 border-black" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    ))}
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-3 w-full rounded-full" />
                </div>
            </div>

            {/* Price Summary Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="border-4 border-black p-5 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl space-y-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-8 w-32" />
                    </div>
                ))}
            </div>

            {/* Order Items Skeleton */}
            <div className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden">
                <div className="border-b-2 border-black p-4 bg-zinc-50">
                    <Skeleton className="h-5 w-32" />
                </div>
                <div className="p-6 space-y-8">
                    {[1, 2].map((i) => (
                        <div key={i} className="flex flex-col sm:flex-row gap-6 pb-6 border-b-2 border-zinc-100 last:border-0 last:pb-0">
                            <Skeleton className="w-full sm:w-32 h-32 shrink-0 border-2 border-black rounded-lg" />
                            <div className="flex-1 space-y-4">
                                <Skeleton className="h-6 w-3/4" />
                                <div className="flex gap-4">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <Skeleton className="h-16 w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
