"use client";

// Inline logo components — guaranteed to render, no external files needed
function EYLogo() {
    return (
        <svg viewBox="0 0 80 40" className="h-14 md:h-16 w-auto">
            <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="28" fill="#2D2D2D">EY</text>
        </svg>
    );
}

function FICCILogo() {
    return (
        <svg viewBox="0 0 120 40" className="h-14 md:h-16 w-auto">
            <path d="M12 8C8 12 6 20 10 28C14 36 22 36 26 30C20 34 14 30 12 22C10 14 14 10 18 8C16 8 14 8 12 8Z" fill="#4CAF50" />
            <text x="75" y="50%" dominantBaseline="central" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="24" fill="#1B3A5C">FICCI</text>
        </svg>
    );
}

function HondaLogo() {
    return (
        <svg viewBox="0 0 130 40" className="h-14 md:h-16 w-auto">
            <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="26" fill="#CC0000" letterSpacing="2">HONDA</text>
        </svg>
    );
}

function IxigoLogo() {
    return (
        <svg viewBox="0 0 110 40" className="h-14 md:h-16 w-auto">
            <rect width="110" height="40" rx="6" fill="#F97316" />
            <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="24" fill="#FFFFFF">ixigo</text>
        </svg>
    );
}

function PeLocalLogo() {
    return (
        <svg viewBox="0 0 150 40" className="h-14 md:h-16 w-auto">
            <circle cx="20" cy="20" r="16" fill="#6366F1" />
            <text x="20" y="21" dominantBaseline="central" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="13" fill="#FFFFFF">vP</text>
            <text x="95" y="50%" dominantBaseline="central" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="20" fill="#333">PeLocal</text>
        </svg>
    );
}

function LiveMintLogo() {
    return (
        <svg viewBox="0 0 140 40" className="h-14 md:h-16 w-auto">
            <text x="5" y="50%" dominantBaseline="central" fontFamily="Georgia, serif" fontWeight="400" fontSize="20" fill="#888">live</text>
            <text x="55" y="50%" dominantBaseline="central" fontFamily="Georgia, serif" fontWeight="900" fontSize="26" fill="#1a1a1a">mint</text>
        </svg>
    );
}

function HBRLogo() {
    return (
        <svg viewBox="0 0 180 40" className="h-14 md:h-16 w-auto">
            <text x="50%" y="14" dominantBaseline="central" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="400" fontSize="10" fill="#333" letterSpacing="1.5">HARVARD BUSINESS</text>
            <text x="50%" y="32" dominantBaseline="central" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="14" fill="#C41230" letterSpacing="3">REVIEW</text>
        </svg>
    );
}

function IndusTowersLogo() {
    return (
        <svg viewBox="0 0 130 40" className="h-14 md:h-16 w-auto">
            <text x="50%" y="16" dominantBaseline="central" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="20" fill="#006B3F">indus</text>
            <text x="50%" y="34" dominantBaseline="central" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="400" fontSize="10" fill="#666" letterSpacing="2.5">TOWERS</text>
        </svg>
    );
}

function BISLogo() {
    return (
        <svg viewBox="0 0 44 44" className="h-14 md:h-16 w-auto">
            <circle cx="22" cy="22" r="20" fill="none" stroke="#1E3A5F" strokeWidth="2" />
            <circle cx="22" cy="22" r="16" fill="none" stroke="#1E3A5F" strokeWidth="1" />
            <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="12" fill="#1E3A5F">BIS</text>
        </svg>
    );
}

const companyLogos = [
    { name: "EY", Component: EYLogo },
    { name: "FICCI", Component: FICCILogo },
    { name: "Honda", Component: HondaLogo },
    { name: "ixigo", Component: IxigoLogo },
    { name: "PeLocal", Component: PeLocalLogo },
    { name: "LiveMint", Component: LiveMintLogo },
    { name: "Harvard Business Review", Component: HBRLogo },
    { name: "Indus Towers", Component: IndusTowersLogo },
    { name: "BIS", Component: BISLogo },
];

export default function TrustedBySection() {
    return (
        <section className="py-16 px-6 bg-white border-b-4 border-black">
            <div className="max-w-6xl mx-auto">
                {/* Section Label */}
                <div className="text-center mb-12">
                    <div className="inline-block bg-[#FFB890] text-black px-4 py-2 font-black text-sm uppercase tracking-widest border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-1">
                        Trusted Partners
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-black mt-5 leading-[0.9]">
                        Trusted by <span className="text-zinc-400">leading companies.</span>
                    </h2>
                </div>
            </div>

            {/* Scrolling logos */}
            <div className="relative">
                {/* Fade edges */}
                <div className="absolute left-0 top-0 bottom-0 w-28 bg-linear-to-r from-white to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-28 bg-linear-to-l from-white to-transparent z-10 pointer-events-none" />

                {/* Logo scroll row */}
                <div className="overflow-hidden py-6">
                    <div className="flex items-center animate-trusted-scroll" style={{ width: "max-content" }}>
                        {[...companyLogos, ...companyLogos, ...companyLogos].map((company, idx) => (
                            <div
                                key={idx}
                                className="shrink-0 flex items-center justify-center px-10 md:px-14 opacity-80 hover:opacity-100 transition-opacity duration-300"
                                title={company.name}
                            >
                                <company.Component />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes trusted-scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-33.333%); }
                }
                .animate-trusted-scroll {
                    animation: trusted-scroll 25s linear infinite;
                }
                .animate-trusted-scroll:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </section>
    );
}
