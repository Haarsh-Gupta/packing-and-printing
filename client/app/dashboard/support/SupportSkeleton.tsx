import React from "react";
import { Skeleton, CardSkeleton } from "@/components/SkeletonStore";

export default function SupportSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <Skeleton className="h-10 w-32 md:h-12 md:w-48" />
                <div className="flex gap-2 w-full md:w-auto">
                    <Skeleton className="h-10 w-full md:w-64" />
                    <Skeleton className="h-10 w-10 shrink-0" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}
