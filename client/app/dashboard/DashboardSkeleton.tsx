import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
    return (
        <div className="space-y-10 max-w-6xl mx-auto pb-16">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-black pb-8">
                <div className="space-y-3">
                    <Skeleton className="h-16 w-64 md:h-20 md:w-96 bg-zinc-300" />
                    <Skeleton className="h-6 w-80 md:w-[500px]" />
                </div>
                <div className="h-14 w-40 bg-zinc-200 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl animate-pulse" />
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    "bg-[#90e8ff]/50",
                    "bg-[#ff90e8]/50",
                    "bg-[#4be794]/50",
                    "bg-[#fdf567]/50",
                    "bg-[#a788fa]/50",
                    "bg-white",
                ].map((bg, i) => (
                    <div key={i} className={`${bg} border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl animate-pulse`}>
                        <div className="flex justify-between items-start mb-4">
                            <Skeleton className="h-11 w-11 bg-black/20 rounded-lg" />
                        </div>
                        <Skeleton className="h-9 w-20 bg-black/20 mb-2" />
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-28 bg-black/10" />
                            <Skeleton className="h-3 w-16 bg-black/10" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="grid md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                    <div key={i} className="border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white rounded-xl">
                        <div className="flex justify-between items-center mb-5 border-b-2 border-zinc-100 pb-4">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3].map((j) => (
                                <div key={j} className="flex items-center justify-between p-3 border-2 border-black bg-zinc-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded-lg border-2 border-black" />
                                        <div className="space-y-1.5">
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

            {/* Quick Links + Profile */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 border-2 border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white rounded-xl">
                    <div className="flex justify-between items-center mb-6 border-b-2 border-zinc-100 pb-4">
                        <Skeleton className="h-6 w-32" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((j) => (
                            <div key={j} className="flex items-center gap-3 p-4 border-2 border-black bg-zinc-50 rounded-lg">
                                <Skeleton className="h-9 w-9 bg-black/20 rounded-md" />
                                <Skeleton className="h-5 w-32" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="md:col-span-1 border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white text-center rounded-xl">
                    <Skeleton className="h-28 w-28 mx-auto rounded-full border-4 border-black mb-4" />
                    <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                    <Skeleton className="h-4 w-1/2 mx-auto mb-6" />
                    <Skeleton className="h-12 w-full border-2 border-black rounded-full" />
                </div>
            </div>
        </div>
    );
}
