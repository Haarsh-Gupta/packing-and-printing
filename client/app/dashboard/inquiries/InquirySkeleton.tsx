import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

export function InquirySkeleton() {
    return (
        <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
                <Card key={i} className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-none overflow-hidden">
                    <CardHeader className="bg-zinc-50 border-b-2 border-black pb-4 flex flex-row items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-32 bg-zinc-300" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                        <Skeleton className="h-8 w-24 rounded-none border-2 border-black" />
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

                        <div className="space-y-4 border-l-2 border-dashed border-zinc-300 pl-8">
                            <Skeleton className="h-6 w-32 bg-zinc-300" />
                            <div className="space-y-4">
                                <Skeleton className="h-10 w-40" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="bg-zinc-100 border-t-2 border-black p-4 flex gap-4 justify-between items-center">
                        <Skeleton className="h-10 w-40" />
                        <div className="flex gap-4">
                            <Skeleton className="h-10 w-24 rounded-none" />
                            <Skeleton className="h-10 w-24 rounded-none" />
                        </div>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
