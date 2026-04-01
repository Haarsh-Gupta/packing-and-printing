"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface CatalogCardProps {
    title: string;
    description?: string;
    image?: string | null;
    href: string;
    badgeText: string;
    index: number;
    buttonText?: string;
    grayscale?: boolean;
}

export function CatalogCard({
    title,
    description,
    image,
    href,
    badgeText,
    index,
    buttonText = "Explore",
    grayscale = false
}: CatalogCardProps) {
    const accentColors = [
        "bg-accent-yellow",
        "bg-accent-purple",
        "bg-accent-green",
        "bg-accent-blue"
    ];
    const itemColor = accentColors[index % accentColors.length];

    return (
        <Link
            href={href}
            className="group relative flex flex-col h-[450px] overflow-hidden border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl"
        >
            {/* Image Layer */}
            <div className="absolute inset-0 z-0 bg-zinc-100">
                {image ? (
                    <img
                        src={image}
                        alt={title}
                        className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${grayscale ? 'grayscale group-hover:grayscale-0' : ''}`}
                    />
                ) : (
                    <div className="h-full w-full bg-zinc-200 flex items-center justify-center">
                        <span className="text-zinc-400 font-bold uppercase tracking-widest text-xs">No Image</span>
                    </div>
                )}
            </div>

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-white border-t-2 border-black translate-y-[calc(100%-85px)] group-hover:translate-y-0 transition-transform duration-300 ease-in-out">
                <div className="p-4">
                    <div className="flex items-start justify-between mb-4 gap-2">
                        <h3 className="font-display text-xl font-black uppercase leading-tight tracking-tight line-clamp-2">
                            {title}
                        </h3>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${itemColor} px-2 py-1 border-2 border-black shrink-0 mt-1`}>
                            {badgeText}
                        </span>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                        <p className="text-sm font-medium leading-relaxed text-gray-800 mb-4 line-clamp-2">
                            {description || "Premium selection customized for your unique brand needs."}
                        </p>

                        <div className="flex items-center justify-end">
                            <div className="flex h-10 px-4 items-center justify-center bg-primary text-white border-2 border-black font-bold text-xs uppercase transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-neubrutalism-sm">
                                {buttonText}
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
