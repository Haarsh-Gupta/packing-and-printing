import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function OrderSkeleton() {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-hidden border-2 border-black shadow-none transition-all duration-300">
                    <div className="flex flex-col sm:flex-row">
                        <Skeleton className="w-full sm:w-48 h-48 sm:h-auto shrink-0" />
                        <div className="flex-1 flex flex-col p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-4 w-12" />
                            </div>
                            <Skeleton className="h-7 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />

                            <div className="bg-zinc-50 p-3 rounded-lg flex justify-between items-center border border-zinc-100">
                                <div className="space-y-1">
                                    <Skeleton className="h-3 w-8" />
                                    <Skeleton className="h-5 w-16" />
                                </div>
                                <Separator orientation="vertical" className="h-8" />
                                <div className="space-y-1">
                                    <Skeleton className="h-3 w-8" />
                                    <Skeleton className="h-5 w-16" />
                                </div>
                                <Separator orientation="vertical" className="h-8" />
                                <div className="text-right space-y-1">
                                    <Skeleton className="h-3 w-8 ml-auto" />
                                    <Skeleton className="h-5 w-16 ml-auto" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 pb-6 pt-2">
                        <div className="relative mt-2">
                            <Skeleton className="h-2 w-full mb-4" />
                            <div className="flex justify-between">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <CardFooter className="p-4 bg-zinc-50 flex justify-between items-center gap-3">
                        <Skeleton className="h-8 w-24" />
                        <div className="flex gap-2">
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-8 w-20" />
                        </div>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
