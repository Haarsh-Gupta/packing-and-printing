import React from "react";
import { Skeleton } from "@/components/SkeletonStore";

export default function TicketDetailSkeleton() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between border-b-4 border-black pb-6">
                <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-64 md:w-96" />
                </div>
                <Skeleton className="h-10 w-24 rounded-lg" />
            </div>

            {/* Messages Skeleton */}
            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${i % 2 === 0 ? 'bg-zinc-100' : 'bg-white'}`}>
                            <Skeleton className="h-4 w-48 mb-2" />
                            <Skeleton className="h-4 w-32" />
                            <div className="mt-2 flex justify-end">
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Skeleton */}
            <div className="pt-8">
                <div className="bg-white border-4 border-black p-4 rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <div className="flex justify-end">
                        <Skeleton className="h-12 w-32 rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}
