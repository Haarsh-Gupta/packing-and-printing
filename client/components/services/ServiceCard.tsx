"use client";

import Link from "next/link";
import { ServiceItem } from "@/types/service";
import { ArrowRight } from "lucide-react";

interface ServiceCardProps {
    service: ServiceItem;
    index: number;
}

export function ServiceCard({ service, index }: ServiceCardProps) {
    const accentColors = [
        "bg-accent-yellow",
        "bg-accent-purple",
        "bg-accent-green",
        "bg-accent-blue"
    ];
    const itemColor = accentColors[index % accentColors.length];

    const itemCountText = service.sub_services && service.sub_services.length > 0 ? `${service.sub_services.length} Tiers` : '0 Tiers';
    const coverImage = service.cover_image || null;

    return (
        <Link
            href={`/services/${service.slug}`}
            className="group relative flex flex-col h-[450px] overflow-hidden border-4 border-black bg-white shadow-neubrutalism transition-all hover:-translate-y-1 hover:shadow-neubrutalism-lg rounded-2xl"
        >
            {/* Image Layer */}
            <div className="absolute inset-0 z-0">
                {coverImage ? (
                    <img
                        src={coverImage}
                        alt={service.name}
                        className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="h-full w-full bg-zinc-200"></div>
                )}
            </div>

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-white border-t-4 border-black translate-y-[calc(100%-85px)] group-hover:translate-y-0 transition-transform duration-300 ease-in-out">
                <div className="p-4">
                    <div className="flex items-start justify-between mb-4 gap-2">
                        <h3 className="font-display text-xl font-black uppercase leading-tight tracking-tight line-clamp-2">
                            {service.name}
                        </h3>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${itemColor} px-2 py-1 border-2 border-black shrink-0 mt-1`}>
                            {itemCountText}
                        </span>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                        <p className="text-sm font-medium leading-relaxed text-gray-800 mb-4 line-clamp-2">
                            Premium professional services configured for you.
                        </p>

                        <div className="flex items-center justify-end">
                            <div className="flex h-10 px-4 items-center justify-center bg-primary text-white border-2 border-black font-bold text-xs uppercase transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-neubrutalism-sm">
                                Explore Service
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}