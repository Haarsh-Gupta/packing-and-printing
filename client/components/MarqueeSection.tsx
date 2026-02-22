"use client";

import { useEffect, useRef, useState } from "react";

// Marquee items representing what BookBind can print
const marqueeItems = [
    { label: "Business Cards", color: "#FF90E8" },
    { label: "Packaging Boxes", color: "#90E8FF" },
    { label: "Book Binding", color: "#FDF567" },
    { label: "Catalogs", color: "#B8FF90" },
    { label: "Letterheads", color: "#FFB890" },
    { label: "Invoice Books", color: "#FF90E8" },
    { label: "Stickers", color: "#90E8FF" },
    { label: "Brochures", color: "#FDF567" },
    { label: "Labels", color: "#B8FF90" },
    { label: "Posters", color: "#FFB890" },
    { label: "Envelopes", color: "#FF90E8" },
    { label: "Flyers", color: "#90E8FF" },
    { label: "Banners", color: "#FDF567" },
    { label: "Calendars", color: "#B8FF90" },
    { label: "Notebooks", color: "#FFB890" },
];

const marqueeItemsRow2 = [
    { label: "Gift Boxes", color: "#FDF567" },
    { label: "Folders", color: "#B8FF90" },
    { label: "Menus", color: "#FF90E8" },
    { label: "Tags", color: "#90E8FF" },
    { label: "Certificates", color: "#FFB890" },
    { label: "Corrugated Boxes", color: "#FDF567" },
    { label: "Mailers", color: "#FF90E8" },
    { label: "Diaries", color: "#90E8FF" },
    { label: "Receipt Books", color: "#B8FF90" },
    { label: "Wrapping Paper", color: "#FFB890" },
    { label: "Pamphlets", color: "#FDF567" },
    { label: "Tent Cards", color: "#FF90E8" },
    { label: "Door Hangers", color: "#B8FF90" },
    { label: "Bookmarks", color: "#90E8FF" },
    { label: "Visiting Cards", color: "#FFB890" },
];

function MarqueeRow({ items, direction = "left", speed = 30 }: { items: typeof marqueeItems; direction?: "left" | "right"; speed?: number }) {
    return (
        <div className="overflow-hidden relative py-2">
            <div
                className={`flex gap-4 whitespace-nowrap ${direction === "left" ? "animate-marquee-left" : "animate-marquee-right"}`}
                style={{
                    animationDuration: `${speed}s`,
                }}
            >
                {/* Double the items for seamless loop */}
                {[...items, ...items].map((item, idx) => (
                    <span
                        key={idx}
                        className="inline-flex items-center px-4 py-2 border-2 border-black font-bold text-sm rounded-full hover:scale-105 transition-transform cursor-default select-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        style={{ backgroundColor: item.color }}
                    >
                        {item.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function MarqueeSection() {
    return (
        <section className="py-12 bg-white border-b-4 border-black overflow-hidden">
            <div className="max-w-6xl mx-auto px-6 mb-8">
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-black text-center">
                    Unlimited <span className="bg-[#FDF567] px-2 inline-block -rotate-1">possibilities</span>
                </h2>
                <p className="text-center text-sm text-zinc-500 font-medium mt-3 max-w-xl mx-auto">
                    Discover everything we can print, package, and ship for your business.
                </p>
            </div>

            {/* Scrolling marquees */}
            <div className="space-y-3">
                <MarqueeRow items={marqueeItems} direction="left" speed={40} />
                <MarqueeRow items={marqueeItemsRow2} direction="right" speed={45} />
                <MarqueeRow items={[...marqueeItems].reverse()} direction="left" speed={35} />
            </div>

            <style jsx>{`
                @keyframes marquee-left {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                @keyframes marquee-right {
                    0% { transform: translateX(-50%); }
                    100% { transform: translateX(0); }
                }
                .animate-marquee-left {
                    animation: marquee-left linear infinite;
                }
                .animate-marquee-right {
                    animation: marquee-right linear infinite;
                }
            `}</style>
        </section>
    );
}
