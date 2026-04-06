import { Skeleton } from "@/components/SkeletonStore";

export function DashboardSkeleton() {
    return (
        <div className="space-y-10 max-w-6xl mx-auto pb-16 animate-pulse">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-black pb-8">
                <div className="space-y-3">
                    <Skeleton className="h-12 w-64 md:h-16 md:w-96" />
                    <Skeleton className="h-5 w-80 md:w-[500px]" />
                </div>
                <Skeleton className="h-12 w-40 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl" />
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    "bg-[#90e8ff]/20",
                    "bg-[#ff90e8]/20",
                    "bg-[#4be794]/20",
                    "bg-[#fdf567]/20",
                    "bg-[#a788fa]/20",
                    "bg-white",
                ].map((bg, i) => (
                    <div key={i} className={`${bg} border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl space-y-4`}>
                        <div className="flex justify-between items-start">
                            <Skeleton className="h-10 w-10 rounded-lg border-2 border-black" />
                        </div>
                        <Skeleton className="h-8 w-24" />
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-12" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="grid md:grid-cols-2 gap-8">
                {[1, 2].map((i) => (
                    <div key={i} className="border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white rounded-2xl overflow-hidden">
                        <div className="flex justify-between items-center p-5 border-b-4 border-black bg-zinc-50">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-12" />
                        </div>
                        <div className="p-5 space-y-4">
                            {[1, 2, 3].map((j) => (
                                <div key={j} className="flex items-center justify-between p-4 border-2 border-black bg-zinc-50 rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-12 w-12 rounded-xl border-2 border-black" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-6 w-16 rounded-full border-2 border-black" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
