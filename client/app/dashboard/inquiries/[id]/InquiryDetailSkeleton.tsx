import React from "react";
import { Skeleton } from "@/components/SkeletonStore";

export default function InquiryDetailSkeleton() {
    return (
        <div className="space-y-6 max-w-6xl mx-auto min-h-[calc(100vh-100px)] lg:h-[calc(100vh-100px)] flex flex-col pt-4">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between border-b-4 border-black pb-6 shrink-0">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 shrink-0" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48 md:w-64" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-10 w-24 rounded-full" />
                    <Skeleton className="h-10 w-32 rounded-none" />
                </div>
            </div>

            {/* Body Skeleton */}
            <div className="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-6 grow overflow-hidden pb-6">
                {/* Left Specs Sidebar */}
                <div className="lg:col-span-1 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
                    <div className="bg-zinc-50 border-b-2 border-black p-4">
                        <Skeleton className="h-6 w-32" />
                    </div>
                    <div className="p-5 space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-3 w-20" />
                            {[1, 2].map((i) => (
                                <div key={i} className="bg-zinc-50 border-2 border-zinc-200 p-4 space-y-3">
                                    <div className="flex gap-4">
                                        <Skeleton className="w-16 h-16 shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Chat Panel */}
                <div className="lg:col-span-2 border-2 border-black bg-zinc-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
                    <div className="bg-white border-b-2 border-black px-5 py-4 flex justify-between items-center">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="grow p-5 space-y-6">
                        <div className="flex justify-start">
                            <Skeleton className="h-20 w-[70%] rounded-xl" />
                        </div>
                        <div className="flex justify-end">
                            <Skeleton className="h-16 w-[60%] rounded-xl" />
                        </div>
                        <div className="flex justify-start">
                            <Skeleton className="h-24 w-[75%] rounded-xl" />
                        </div>
                    </div>
                    <div className="p-4 bg-white border-t-2 border-black">
                        <Skeleton className="h-12 w-full rounded-none" />
                    </div>
                </div>
            </div>
        </div>
    );
}
