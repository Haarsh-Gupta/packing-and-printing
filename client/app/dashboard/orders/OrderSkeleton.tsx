import { Skeleton } from "@/components/SkeletonStore";

export function OrderSkeleton() {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border-4 border-black p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl overflow-hidden flex flex-col md:flex-row">
                    {/* Image Area */}
                    <Skeleton className="w-full md:w-48 h-48 md:h-auto shrink-0 bg-zinc-100 border-b-4 md:border-b-0 md:border-r-4 border-black" />
                    
                    <div className="flex-1 p-6 space-y-4">
                        <div className="flex justify-between items-start">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-6 w-16 rounded-full border-2 border-black" />
                        </div>
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-48" />
                        
                        <div className="flex items-center gap-4 border-t-2 border-zinc-100 pt-4">
                            <div className="space-y-1">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-5 w-24" />
                            </div>
                            <div className="w-[1px] h-10 bg-zinc-200" />
                            <div className="space-y-1">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-5 w-24" />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Skeleton className="h-10 w-24 rounded-lg border-2 border-black" />
                            <Skeleton className="h-10 w-32 rounded-lg bg-black/10" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
