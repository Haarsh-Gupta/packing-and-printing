import React from "react";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`animate-pulse rounded-md bg-zinc-200 ${className}`}
            {...props}
        />
    );
}

export function CardSkeleton({ className = "" }) {
    return (
        <div className={`bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl p-5 ${className}`}>
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/4 mb-6" />
            <div className="flex gap-2">
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
        </div>
    );
}

export function ProductCardSkeleton() {
    return (
        <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden">
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

export function HeaderSkeleton() {
    return (
        <div className="bg-[#90e8ff] border-b-2 border-black p-8 md:p-12">
            <div className="max-w-6xl mx-auto space-y-4">
                <Skeleton className="h-6 w-32 bg-white/50" />
                <Skeleton className="h-12 md:h-16 w-1/2 bg-black/10" />
                <Skeleton className="h-4 w-1/3 bg-black/5" />
            </div>
        </div>
    );
}

export function ConfigPageSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-8 animate-pulse">
            {/* Breadcrumb */}
            <Skeleton className="h-4 w-48" />

            <div className="grid lg:grid-cols-[1fr_440px] gap-8 lg:gap-14 items-start">
                {/* Left Column: Gallery & Info */}
                <div className="space-y-8">
                    {/* Gallery */}
                    <Skeleton className="w-full aspect-[4/3] border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" />

                    {/* Value Props */}
                    <div className="border-2 border-black rounded-2xl overflow-hidden bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="h-12 bg-zinc-50 border-b-2 border-black px-5 flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-zinc-100">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="p-5 space-y-3">
                                    <Skeleton className="h-9 w-9 rounded-lg" />
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-6 w-20" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Title & Config */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-12 w-48 border-2 border-black rounded-xl" />
                    </div>

                    <div className="border-4 border-black p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl space-y-6">
                        <Skeleton className="h-6 w-32 border-b-2 border-zinc-100 pb-2" />
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-3">
                                <Skeleton className="h-4 w-20" />
                                <div className="grid grid-cols-3 gap-2">
                                    <Skeleton className="h-10 rounded-lg" />
                                    <Skeleton className="h-10 rounded-lg" />
                                    <Skeleton className="h-10 rounded-lg" />
                                </div>
                            </div>
                        ))}
                        <Skeleton className="h-14 w-full rounded-xl border-2 border-black mt-4" />
                    </div>
                </div>
            </div>
        </div>
    );
}
