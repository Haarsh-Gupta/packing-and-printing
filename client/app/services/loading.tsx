import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <main className="min-h-screen bg-[#f7f5f2]">

            {/* Hero skeleton */}
            <section className="bg-[#c8d8ff] border-b-2 border-black">
                <div className="max-w-[1280px] mx-auto px-6 lg:px-12 py-16 lg:py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-56 rounded-full bg-black/10" />
                            <Skeleton className="h-16 w-5/6 bg-black/10" />
                            <Skeleton className="h-16 w-4/6 bg-black/10" />
                            <Skeleton className="h-5 w-full bg-black/10" />
                            <Skeleton className="h-5 w-3/4 bg-black/10" />
                            <div className="flex gap-3 pt-2">
                                <Skeleton className="h-12 w-44 rounded-full bg-black/10" />
                                <Skeleton className="h-12 w-44 rounded-full bg-black/10" />
                            </div>
                        </div>
                        <div className="hidden lg:grid grid-cols-2 gap-3">
                            {[1, 2, 3, 4].map(i => (
                                <Skeleton key={i} className="h-28 rounded-2xl bg-black/10" />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Toolbar skeleton */}
            <div className="bg-white border-b-2 border-black">
                <div className="max-w-[1280px] mx-auto px-6 lg:px-12 py-3.5 flex flex-col gap-3">
                    <Skeleton className="h-11 w-full rounded-full bg-zinc-200" />
                    <div className="flex gap-2 flex-wrap">
                        {[1, 2, 3, 4, 5].map(i => (
                            <Skeleton key={i} className="h-8 w-28 rounded-full bg-zinc-200" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid skeleton */}
            <div className="max-w-[1280px] mx-auto px-6 lg:px-12 py-10 pb-20">
                <div className="flex items-center justify-between mb-8">
                    <Skeleton className="h-8 w-36 bg-zinc-200" />
                    <Skeleton className="h-9 w-32 rounded-full bg-zinc-200" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex flex-col border-2 border-black rounded-2xl overflow-hidden bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <Skeleton className="bg-zinc-200" style={{ height: "280px" }} />
                            <div className="p-4 border-t-2 border-black space-y-2">
                                <Skeleton className="h-5 w-3/4 bg-zinc-200" />
                                <Skeleton className="h-3.5 w-1/2 bg-zinc-200" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
