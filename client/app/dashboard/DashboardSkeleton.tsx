import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

export function DashboardSkeleton() {
    return (
        <div className="p-8 md:p-12 space-y-12 bg-white min-h-screen">
            {/* Header Section Skeleton */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-black pb-8">
                <div className="space-y-4">
                    <Skeleton className="h-16 w-64 md:h-20 md:w-96 bg-zinc-300" />
                    <Skeleton className="h-6 w-80 md:w-[500px]" />
                </div>
                <div className="flex gap-4">
                    <div className="h-14 w-40 bg-zinc-200 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-pulse" />
                </div>
            </header>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className={`border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-pulse ${i === 1 ? 'bg-[#90e8ff]/50' : i === 2 ? 'bg-[#ff90e8]/50' : 'bg-[#fdf567]/50'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <Skeleton className="h-12 w-12 bg-black/20" />
                        </div>
                        <Skeleton className="h-10 w-16 bg-black/20 mb-2" />
                        <Skeleton className="h-6 w-32 bg-black/20" />
                    </div>
                ))}
            </div>

            {/* Main Content Split Skeleton */}
            <div className="grid md:grid-cols-3 gap-8">
                {/* Recent Activity Feed Skeleton */}
                <div className="md:col-span-2 border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white space-y-6">
                    <div className="flex justify-between items-center mb-6 border-b-4 border-zinc-100 pb-4">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-48 w-full border-2 border-dashed border-zinc-200" />
                    </div>
                </div>

                {/* Profile/Quick Actions Skeleton */}
                <div className="md:col-span-1 space-y-8">
                    <div className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white text-center space-y-4">
                        <Skeleton className="h-32 w-32 mx-auto rounded-full border-4 border-black" />
                        <Skeleton className="h-6 w-3/4 mx-auto" />
                        <Skeleton className="h-4 w-1/2 mx-auto" />
                        <Skeleton className="h-12 w-full border-2 border-black" />
                    </div>
                </div>
            </div>
        </div>
    );
}
