import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

export function InquirySkeleton() {
    return (
        <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
                <Card key={i} className="border border-black/10 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="bg-zinc-50 border-b border-black/10 pb-4 flex flex-row items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-32 bg-zinc-300" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                        <Skeleton className="h-8 w-24 rounded-full border border-black/10" />
                    </CardHeader>

                    <CardContent className="p-6 grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-32 bg-zinc-300" />
                            <div className="grid grid-cols-2 gap-y-4">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </div>

                        <div className="space-y-4 border-l border-dashed border-black/10 pl-8">
                            <Skeleton className="h-6 w-32 bg-zinc-300" />
                            <div className="space-y-4">
                                <Skeleton className="h-10 w-40" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="bg-zinc-50 border-t border-black/10 p-4 flex gap-4 justify-between items-center">
                        <Skeleton className="h-10 w-40" />
                        <div className="flex gap-4">
                            <Skeleton className="h-10 w-24 rounded-full" />
                            <Skeleton className="h-10 w-24 rounded-full" />
                        </div>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
