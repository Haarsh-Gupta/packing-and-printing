"use client";

import Link from "next/link";
import { ServiceItem } from "@/types/service";
import { ArrowRight, Settings } from "lucide-react";

interface ServiceCardProps {
    service: ServiceItem;
    index: number;
}

export function ServiceCard({ service, index }: ServiceCardProps) {
    const accentColors = [
        "bg-[#FFD700]",      // yellow
        "bg-[#DDA0DD]",      // purple
        "bg-[#98FB98]",      // green
        "bg-[#87CEEB]",      // blue
    ];
    const itemColor = accentColors[index % accentColors.length];

    const itemCountText = service.sub_services && service.sub_services.length > 0
        ? `${service.sub_services.length} Tiers`
        : "0 Tiers";

    const coverImage = service.cover_image || null;

    return (
        <Link
            href={`/services/${service.slug}`}
            className="group relative flex flex-col h-[400px] overflow-hidden border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl no-underline"
        >
            {/* Image */}
            <div className="relative flex-1 overflow-hidden bg-zinc-100">
                {coverImage ? (
                    <img
                        src={coverImage}
                        alt={service.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center">
                        <Settings className="w-16 h-16 text-zinc-300" />
                    </div>
                )}

                {/* Item count badge — top right */}
                <span
                    className={`absolute top-3 right-3 z-10 ${itemColor} border-2 border-black text-[10px] font-black uppercase tracking-wide px-2.5 py-1 shadow-[2px_2px_0px_0px_#000]`}
                >
                    {itemCountText}
                </span>
            </div>

            {/* Info panel */}
            <div className="bg-white border-t-2 border-black px-4 pt-3 pb-4 translate-y-0 transition-all duration-300">
                <h3 className="font-black text-[15px] uppercase leading-tight tracking-tight text-black mb-0 truncate">
                    {service.name}
                </h3>

                {/* Hover reveal */}
                <div className="max-h-0 overflow-hidden group-hover:max-h-20 transition-all duration-300 ease-in-out">
                    <p className="text-xs text-zinc-500 leading-relaxed mt-1.5 mb-3 line-clamp-2">
                        {service.description || "Professional services tailored for your business needs."}
                    </p>
                    <div className="flex items-center justify-end">
                        <div className="inline-flex items-center gap-1.5 bg-[#4f46e5] text-white border-2 border-black text-[11px] font-black uppercase px-3 py-1.5 shadow-[2px_2px_0px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all duration-100">
                            Explore Service
                            <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}