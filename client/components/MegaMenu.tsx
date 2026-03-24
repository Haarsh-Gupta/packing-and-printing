"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, ArrowRight } from "lucide-react";

interface SubItem {
    id: number;
    name: string;
    slug: string;
}

interface MainItem {
    id: number;
    name: string;
    slug: string;
    sub_products?: SubItem[];
    sub_services?: SubItem[];
}

interface MegaMenuProps {
    title: string;
    href: string;
    items: MainItem[];
    type: "product" | "service";
}

export default function MegaMenu({ title, href, items, type }: MegaMenuProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [activeItem, setActiveItem] = useState<MainItem | null>(null);

    // Default to first item if none hovered
    const currentItem = activeItem || items[0];

    return (
        <div 
            className="relative h-full flex items-center"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setActiveItem(null);
            }}
        >
            <Link 
                href={href} 
                className={`flex items-center gap-1 hover:text-[#FF90E8] transition-colors h-full ${isHovered ? 'text-[#FF90E8]' : ''}`}
            >
                {title}
            </Link>

            {/* Dropdown Container */}
            <div 
                className={`absolute top-full left-1/2 -translate-x-1/2 pt-4 transition-all duration-300 ease-out z-[200] ${
                    isHovered ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
                }`}
            >
                <div className="bg-white border-2 border-black rounded-[2rem] shadow-neubrutalism-sm w-[600px] flex overflow-hidden">
                    
                    {/* Left Column: Categories */}
                    <div className="w-1/2 border-r-2 border-black p-6 bg-zinc-50">
                        <div className="flex items-center justify-between mb-4 px-2">
                             <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Categories</h4>
                             <Link href={href} className="text-[9px] font-black uppercase text-black hover:underline flex items-center gap-1">
                                View All <ArrowRight className="w-2.5 h-2.5" />
                             </Link>
                        </div>
                        <div className="space-y-1">
                            {items.slice(0, 8).map((item) => (
                                <button
                                    key={item.id}
                                    onMouseEnter={() => setActiveItem(item)}
                                    className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-between group ${
                                        currentItem?.id === item.id 
                                        ? 'bg-black text-white' 
                                        : 'text-zinc-600 hover:bg-zinc-200 hover:text-black'
                                    }`}
                                >
                                    {item.name}
                                    <ChevronRight className={`w-4 h-4 transition-transform ${currentItem?.id === item.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Sub-items */}
                    <div className="w-1/2 p-8 bg-white max-h-[450px] overflow-y-auto">
                        {currentItem && (
                            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#FF90E8] mb-4">
                                    {currentItem.name} Models
                                </h4>
                                <div className="grid grid-cols-1 gap-y-3">
                                    {(currentItem.sub_products || currentItem.sub_services)?.map((sub) => (
                                        <Link
                                            key={sub.id}
                                            href={type === "product" ? `/products/customize/${sub.slug}` : `/services/request/${sub.slug}`}
                                            className="text-sm font-bold text-black border-2 border-transparent hover:border-black hover:bg-accent-blue/10 rounded-lg px-3 py-2 transition-all flex items-center justify-between group"
                                        >
                                            {sub.name}
                                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                        </Link>
                                    ))}
                                    {!(currentItem.sub_products?.length || currentItem.sub_services?.length) && (
                                        <p className="text-xs text-zinc-400 font-medium italic p-4 border border-dashed border-zinc-200 rounded-xl">
                                            No sub-items found for this category.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
