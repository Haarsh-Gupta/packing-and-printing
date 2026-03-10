"use client";

import { motion } from "framer-motion";
import { staggerContainer, slideUpFade } from "@/lib/animations";
import { Star } from "lucide-react";

interface AnimatedHeroProps {
    videoSrc?: string;
    imageSrc?: string;
    title: React.ReactNode;
    description: string;
    ctaPlaceholder?: string;
    ctaButtonText?: string;
    showSocialProof?: boolean;
}

export default function AnimatedHero({
    videoSrc,
    imageSrc,
    title,
    description,
    ctaPlaceholder = "Enter your email for a custom quote...",
    ctaButtonText = "Get Started",
    showSocialProof = true,
}: AnimatedHeroProps) {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-start overflow-hidden">

            {/* Background Content */}
            <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                {videoSrc ? (
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover [transform:scaleY(-1)]"
                        src={videoSrc}
                    />
                ) : imageSrc ? (
                    <img
                        src={imageSrc}
                        alt="Hero background"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-[#f5e1ef]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-[rgba(255,255,255,0)] from-[26.416%] to-white to-[66.943%]" />
            </div>

            {/* Hero Content */}
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="relative z-10 w-full max-w-[1200px] mx-auto px-6 pt-[290px] flex flex-col items-center text-center gap-[32px]"
            >
                {/* Main Heading */}
                <motion.h1
                    variants={slideUpFade}
                    className="font-medium text-[50px] md:text-[80px] leading-[0.9] tracking-[-0.04em] text-[#1a1a1a]"
                >
                    {title}
                </motion.h1>

                {/* Description */}
                <motion.p
                    variants={slideUpFade}
                    className="text-[16px] md:text-[18px] text-[#373a46] opacity-80 max-w-[554px] leading-relaxed"
                >
                    {description}
                </motion.p>

                {/* Interactive CTA */}
                <motion.div variants={slideUpFade} className="w-full max-w-md mt-4">
                    <div className="flex items-center bg-[#fcfcfc] border border-gray-200/80 rounded-[40px] p-1.5 shadow-[0px_10px_40px_5px_rgba(194,194,194,0.25)] backdrop-blur-sm transition-all focus-within:ring-2 ring-zinc-200">
                        <input
                            type="email"
                            placeholder={ctaPlaceholder}
                            className="flex-1 bg-transparent px-5 py-2 outline-none text-[15px] text-zinc-800 placeholder:text-zinc-400"
                        />
                        <button className="bg-gradient-to-b from-zinc-700 to-black text-white px-7 py-3 rounded-[34px] text-[14px] font-medium shadow-[inset_-4px_-6px_25px_0px_rgba(201,201,201,0.08),inset_4px_4px_10px_0px_rgba(29,29,29,0.24)] hover:scale-[1.02] active:scale-[0.98] transition-transform">
                            {ctaButtonText}
                        </button>
                    </div>
                </motion.div>

                {/* Social Proof */}
                {showSocialProof && (
                    <motion.div variants={slideUpFade} className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={16} className="fill-[#FFB800] text-[#FFB800]" />
                            ))}
                        </div>
                        <span className="text-[14px] font-medium text-zinc-600">
                            1,020+ Reviews from global brands
                        </span>
                    </motion.div>
                )}
            </motion.div>

            {/* Subtle scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-400"
            >
                <span className="text-xs uppercase tracking-widest font-medium">Scroll to explore</span>
                <div className="w-[1px] h-8 bg-gradient-to-b from-zinc-300 to-transparent" />
            </motion.div>
        </section>
    );
}