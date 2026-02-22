"use client";

// ── Inline SVG icons for each product type ──

function IconCard() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M7 8h4M7 12h10M7 16h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function IconBox() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
            <path d="M3 8l9-4 9 4v9l-9 4-9-4V8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M3 8l9 4 9-4M12 12v9" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    );
}

function IconBook() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
            <path d="M4 4h6c1 0 2 1 2 2v14c0-1-1-2-2-2H4V4zM20 4h-6c-1 0-2 1-2 2v14c0-1 1-2 2-2h6V4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
    );
}

function IconCatalog() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
            <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M9 7h6M9 11h6M9 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function IconLetter() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
            <rect x="4" y="3" width="16" height="18" rx="1" stroke="currentColor" strokeWidth="2" />
            <path d="M8 7h8M8 10h8M8 13h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="16" cy="17" r="2" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    );
}

function IconSticker() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M12 3c0 5-5 9-9 9" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 8l2 2M14 12l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function IconBrochure() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
            <path d="M3 4h18v16H3V4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M9 4v16M15 4v16" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    );
}

function IconLabel() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
            <path d="M4 4h10l6 8-6 8H4V4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="9" cy="12" r="1.5" fill="currentColor" />
        </svg>
    );
}

function IconPoster() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
            <rect x="4" y="2" width="16" height="20" rx="1" stroke="currentColor" strokeWidth="2" />
            <path d="M4 15l4-3 3 2 5-4 4 3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="9" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    );
}

function IconEnvelope() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
    );
}

function IconFlyer() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
            <path d="M5 3h14v18l-7-4-7 4V3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M9 8h6M9 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function IconBanner() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
            <path d="M4 3h16v14l-8 4-8-4V3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M9 8h6M9 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function IconCalendar() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="8" cy="15" r="1" fill="currentColor" />
            <circle cx="12" cy="15" r="1" fill="currentColor" />
            <circle cx="16" cy="15" r="1" fill="currentColor" />
        </svg>
    );
}

function IconNotebook() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
            <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M5 6h-2M5 10h-2M5 14h-2M5 18h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M9 7h6M9 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function IconGift() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
            <rect x="3" y="8" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
            <rect x="5" y="12" width="14" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8v12" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 8c-1-3-4-5-5-3s2 3 5 3c3 0 6-1 5-3s-4 0-5 3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    );
}

// ── Item lists with icons ──

const marqueeItems = [
    { label: "Business Cards", color: "#FF90E8", iconColor: "#C4006E", Icon: IconCard },
    { label: "Packaging Boxes", color: "#90E8FF", iconColor: "#0077B6", Icon: IconBox },
    { label: "Book Binding", color: "#FDF567", iconColor: "#B8860B", Icon: IconBook },
    { label: "Catalogs", color: "#B8FF90", iconColor: "#2D8B2D", Icon: IconCatalog },
    { label: "Letterheads", color: "#FFB890", iconColor: "#D2691E", Icon: IconLetter },
    { label: "Invoice Books", color: "#FF90E8", iconColor: "#C4006E", Icon: IconBook },
    { label: "Stickers", color: "#90E8FF", iconColor: "#0077B6", Icon: IconSticker },
    { label: "Brochures", color: "#FDF567", iconColor: "#B8860B", Icon: IconBrochure },
    { label: "Labels", color: "#B8FF90", iconColor: "#2D8B2D", Icon: IconLabel },
    { label: "Posters", color: "#FFB890", iconColor: "#D2691E", Icon: IconPoster },
    { label: "Envelopes", color: "#FF90E8", iconColor: "#C4006E", Icon: IconEnvelope },
    { label: "Flyers", color: "#90E8FF", iconColor: "#0077B6", Icon: IconFlyer },
    { label: "Banners", color: "#FDF567", iconColor: "#B8860B", Icon: IconBanner },
    { label: "Calendars", color: "#B8FF90", iconColor: "#2D8B2D", Icon: IconCalendar },
    { label: "Notebooks", color: "#FFB890", iconColor: "#D2691E", Icon: IconNotebook },
];

const marqueeItemsRow2 = [
    { label: "Gift Boxes", color: "#FDF567", iconColor: "#B8860B", Icon: IconGift },
    { label: "Folders", color: "#B8FF90", iconColor: "#2D8B2D", Icon: IconCatalog },
    { label: "Menus", color: "#FF90E8", iconColor: "#C4006E", Icon: IconBrochure },
    { label: "Tags", color: "#90E8FF", iconColor: "#0077B6", Icon: IconLabel },
    { label: "Certificates", color: "#FFB890", iconColor: "#D2691E", Icon: IconLetter },
    { label: "Corrugated Boxes", color: "#FDF567", iconColor: "#B8860B", Icon: IconBox },
    { label: "Mailers", color: "#FF90E8", iconColor: "#C4006E", Icon: IconEnvelope },
    { label: "Diaries", color: "#90E8FF", iconColor: "#0077B6", Icon: IconNotebook },
    { label: "Receipt Books", color: "#B8FF90", iconColor: "#2D8B2D", Icon: IconBook },
    { label: "Wrapping Paper", color: "#FFB890", iconColor: "#D2691E", Icon: IconPoster },
    { label: "Pamphlets", color: "#FDF567", iconColor: "#B8860B", Icon: IconFlyer },
    { label: "Tent Cards", color: "#FF90E8", iconColor: "#C4006E", Icon: IconCard },
    { label: "Door Hangers", color: "#B8FF90", iconColor: "#2D8B2D", Icon: IconLabel },
    { label: "Bookmarks", color: "#90E8FF", iconColor: "#0077B6", Icon: IconFlyer },
    { label: "Visiting Cards", color: "#FFB890", iconColor: "#D2691E", Icon: IconCard },
];

// ── Marquee Row Component ──

function MarqueeRow({ items, direction = "left", speed = 30 }: { items: typeof marqueeItems; direction?: "left" | "right"; speed?: number }) {
    return (
        <div className="overflow-hidden relative py-2">
            <div
                className={`flex gap-4 whitespace-nowrap ${direction === "left" ? "animate-marquee-left" : "animate-marquee-right"}`}
                style={{ animationDuration: `${speed}s`, width: "max-content" }}
            >
                {[...items, ...items].map((item, idx) => (
                    <span
                        key={idx}
                        className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-black font-bold text-sm rounded-full hover:scale-110 hover:-rotate-2 transition-all duration-200 cursor-default select-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        style={{ backgroundColor: item.color }}
                    >
                        <span style={{ color: item.iconColor }}>
                            <item.Icon />
                        </span>
                        <span className="text-black">{item.label}</span>
                    </span>
                ))}
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
        </div>
    );
}

// ── Main Section ──

export default function MarqueeSection() {
    return (
        <section className="py-12 bg-white overflow-hidden">
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
        </section>
    );
}
