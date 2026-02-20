"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ArrowRight } from "lucide-react";
import { Product } from "@/types/product";

export function ProductCard({ product }: { product: Product }) {
    return (
        <Card
            className="flex flex-col border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 bg-white h-full"
        >
            <CardHeader>
                {product.images && product.images.length > 0 ? (
                    <div className="w-full h-48 border-2 border-black mb-4 overflow-hidden bg-zinc-100 relative">
                        <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-full h-48 border-2 border-black mb-4 flex items-center justify-center bg-zinc-100">
                        <Package className="h-16 w-16 text-zinc-400" />
                    </div>
                )}
                <CardTitle className="text-2xl font-bold">{product.name}</CardTitle>
                <CardDescription className="text-base text-zinc-600 line-clamp-3">
                    {product.description || "Premium quality printing solutions."}
                </CardDescription>
            </CardHeader>

            <CardContent className="grow">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-black text-zinc-400 tracking-widest">Starting at only</span>
                    <div className="inline-flex items-baseline gap-1 bg-[#fdf567] px-4 py-1 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-2 self-start mb-2">
                        <span className="text-sm font-bold">₹</span>
                        <span className="text-4xl font-black tracking-tighter">{product.base_price}</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter>
                <Button
                    className="w-full bg-[#4be794] hover:bg-[#3cd083] text-black font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all h-12 px-8 text-lg"
                    asChild
                >
                    <Link href={`/products/${product.slug}`}>
                        Configure & Order <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
