"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, PenTool, LayoutTemplate, Layers } from "lucide-react";
import { ServiceItem } from "@/types/service";

export function ServiceCard({ service }: { service: ServiceItem }) {
    const getIconForSlug = (slug: string) => {
        if (slug.includes('design')) return <PenTool className="h-10 w-10 mb-4 text-black" />;
        if (slug.includes('prototype') || slug.includes('mockup')) return <LayoutTemplate className="h-10 w-10 mb-4 text-black" />;
        return <Layers className="h-10 w-10 mb-4 text-black" />;
    };

    return (
        <Card
            className="flex flex-col border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 bg-white h-full"
        >
            <CardHeader className="bg-zinc-50 border-b-2 border-black p-6">
                <div className="flex justify-between items-start">
                    {getIconForSlug(service.slug)}
                    <div className="bg-black text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border-2 border-black">
                        Service
                    </div>
                </div>
                <CardTitle className="text-2xl font-black uppercase tracking-tight">{service.name}</CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-6 grow">
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Packages & Pricing</h4>
                    <div className="space-y-3">
                        {service.variants.map((variant) => (
                            <div key={variant.id} className="group p-3 border-2 border-black bg-zinc-50 hover:bg-[#90e8ff] transition-colors">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-sm">{variant.name}</span>
                                    <span className="font-black text-sm bg-white px-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        ₹{variant.base_price.toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-xs text-zinc-600 group-hover:text-black font-medium leading-snug line-clamp-2">
                                    {variant.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-6 pt-0">
                <Button
                    className="w-full bg-[#ff90e8] hover:bg-[#ff69b4] text-black font-black uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all h-12 text-sm"
                    asChild
                >
                    <Link href={`/services/${service.slug}`}>
                        Request Service <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
