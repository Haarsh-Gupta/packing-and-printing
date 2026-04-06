import { Skeleton } from "@/components/SkeletonStore";

export function InquirySkeleton() {
    return (
        <div className="grid gap-8 animate-pulse">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border-4 border-black p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl overflow-hidden">
                    {/* Header */}
                    <div className="p-5 border-b-4 border-black bg-zinc-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                        <Skeleton className="h-10 w-28 rounded-full border-2 border-black" />
                    </div>

                    {/* Content */}
                    <div className="p-8 grid md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <Skeleton className="h-6 w-40" />
                            <div className="space-y-4">
                                {[1, 2, 3].map((j) => (
                                    <div key={j} className="flex justify-between items-center border-b-2 border-zinc-50 pb-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6 md:border-l-4 md:border-black md:pl-10 md:border-dashed">
                            <Skeleton className="h-6 w-40" />
                            <div className="space-y-4">
                                <Skeleton className="h-12 w-full rounded-xl border-2 border-black" />
                                <Skeleton className="h-4 w-40" />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t-4 border-black bg-zinc-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <Skeleton className="h-11 w-48 rounded-xl border-2 border-black" />
                        <div className="flex gap-4">
                            <Skeleton className="h-11 w-28 rounded-xl border-2 border-black" />
                            <Skeleton className="h-11 w-28 rounded-xl bg-black/10" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
