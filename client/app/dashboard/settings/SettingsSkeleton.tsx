import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function SettingsSkeleton() {
    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-12">
            <div className="border-b-4 border-black pb-6 space-y-2">
                <Skeleton className="h-12 w-64 bg-zinc-300" />
                <Skeleton className="h-6 w-96" />
            </div>

            <div className="grid gap-8">
                {/* SECTION 1 Skeleton */}
                <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none">
                    <CardHeader className="bg-zinc-50 border-b-2 border-black">
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <Skeleton className="h-40 w-40 rounded-full border-4 border-black shrink-0 mx-auto md:mx-0" />
                            <div className="flex-1 w-full space-y-6">
                                <Skeleton className="h-12 w-full border-2 border-black" />
                                <Skeleton className="h-32 w-full border-2 border-dashed border-zinc-200" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* SECTION 2 Skeleton */}
                    <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none h-fit">
                        <CardHeader className="bg-zinc-50 border-b-2 border-black">
                            <Skeleton className="h-6 w-40" />
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <Skeleton className="h-12 w-full" />
                        </CardContent>
                    </Card>

                    {/* SECTION 3 Skeleton */}
                    <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none h-fit">
                        <CardHeader className="bg-zinc-50 border-b-2 border-black">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-4 w-56 mt-2" />
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <Skeleton className="h-12 w-12 mx-auto" />
                            <Skeleton className="h-6 w-48 mx-auto" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
