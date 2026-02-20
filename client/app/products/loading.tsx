import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

export default function Loading() {
    return (
        <div className="min-h-screen bg-slate-50 py-16 px-4">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Page Header Skeleton */}
                <div className="space-y-4 max-w-2xl">
                    <Skeleton className="h-12 w-3/4 bg-zinc-300" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-5/6" />
                </div>

                {/* Products Grid Skeleton */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card
                            key={i}
                            className="flex flex-col border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white"
                        >
                            <CardHeader>
                                <Skeleton className="w-full h-48 border-2 border-black mb-4" />
                                <Skeleton className="h-8 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6 mt-1" />
                            </CardHeader>

                            <CardContent className="flex-grow">
                                <Skeleton className="h-8 w-32 border-2 border-black" />
                            </CardContent>

                            <CardFooter>
                                <Skeleton className="w-full h-12" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
