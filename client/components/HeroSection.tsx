"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

/* ── Animated Counter ───────────────────────── */

function AnimatedCounter({ target, label }: { target: number; label: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    const duration = 2000;
                    const steps = 60;
                    const increment = target / steps;
                    let current = 0;
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            setCount(target);
                            clearInterval(timer);
                        } else {
                            setCount(Math.floor(current));
                        }
                    }, duration / steps);
                }
            },
            { threshold: 0.5 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target]);

    return (
        <div ref={ref} className="text-center">
            <div className="text-5xl md:text-7xl font-black tracking-tighter text-black leading-none">
                {count.toLocaleString()}+
            </div>
            <div className="text-sm md:text-base font-bold uppercase tracking-wider text-zinc-600 mt-2">
                {label}
            </div>
        </div>
    );
}

/* ── Hero Section ───────────────────────── */

export default function HeroSection() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <section className="relative overflow-hidden bg-[#FF90E8]">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle,#000_1px,transparent_1px)] bg-size-[24px_24px]" />

            <div className="max-w-6xl mx-auto px-6 pt-20 pb-32 md:pt-32 md:pb-48 relative z-10">

                {/* Main Hero Content */}
                <div className="text-center space-y-8">

                    {/* Giant headline */}
                    <h1
                        className={`text-4xl md:text-7xl lg:text-[7rem] font-black leading-[0.85] tracking-tighter text-black transition-all duration-700 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    >
                        Print your<br />
                        <span className="relative inline-block">
                            dream brand.
                            {/* Animated underline */}
                            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 400 12" fill="none">
                                <path
                                    d="M2 8C50 2 150 2 200 6C250 10 350 4 398 2"
                                    stroke="black"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    className={`${mounted ? 'doodle-draw' : ''}`}
                                    strokeDasharray="500"
                                    strokeDashoffset={mounted ? "0" : "500"}
                                />
                            </svg>
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p
                        className={`text-lg md:text-xl text-black/70 max-w-2xl mx-auto font-medium leading-relaxed transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    >
                        From custom packaging to intricate binding, we bring your vision to life
                        with precision and style. Simple pricing, fast delivery.
                    </p>
                    {/* CTA Buttons */}
                    <div
                        className={`flex flex-col sm:flex-row gap-4 justify-center pt-4 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    >
                        <Button
                            size="lg"
                            className="bg-black text-white h-12 px-8 text-base font-bold rounded-full border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,0.3)] transition-all cursor-pointer"
                            asChild
                        >
                            <Link href="/products">
                                Start Printing <ArrowRight className="ml-3 w-6 h-6" />
                            </Link>
                        </Button>

                        <Button
                            size="lg"
                            variant="outline"
                            className="bg-white text-black h-12 px-8 text-base font-bold rounded-full border-3 border-black hover:bg-[#fdf567] transition-all cursor-pointer"
                            asChild
                        >
                            <Link href="/services">
                                Our Services
                            </Link>
                        </Button>
                    </div>

                    {/* Social Proof */}
                    <div
                        className={`flex items-center justify-center gap-4 pt-6 transition-all duration-700 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}
                    >
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-3 border-black bg-white overflow-hidden shadow-sm">
                                    <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=user${i}&backgroundColor=ffffff`} alt="User" />
                                </div>
                            ))}
                        </div>
                        <p className="text-sm font-bold text-black/80">
                            Trusted by <span className="font-black text-black">500+</span> local businesses
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom wave / transition */}
            <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 pointer-events-none">
                <svg
                    viewBox="0 0 2880 120"
                    preserveAspectRatio="none"
                    className="w-[200%] min-w-[200%] h-16 md:h-20 block"
                >
                    <g opacity="0.4">
                        <animateTransform attributeName="transform" type="translate" from="0 0" to="-1440 0" dur="15s" repeatCount="indefinite" />
                        <path
                            d="M 0 60 C 240 25 480 25 720 60 C 960 95 1200 95 1440 60 C 1680 25 1920 25 2160 60 C 2400 95 2640 95 2880 60 V 120 H 0 Z"
                            fill="var(--site-bg)"
                        />
                    </g>
                    <g>
                        <animateTransform attributeName="transform" type="translate" from="0 0" to="-1440 0" dur="10s" repeatCount="indefinite" />
                        <path
                            d="M 0 60 C 240 10 480 10 720 60 C 960 110 1200 110 1440 60 C 1680 10 1920 10 2160 60 C 2400 110 2640 110 2880 60 V 120 H 0 Z"
                            fill="var(--site-bg)"
                        />
                    </g>
                </svg>
            </div>
        </section>
    );
}