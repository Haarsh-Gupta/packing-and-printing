<<<<<<< HEAD
"use client"; // This is required for useState and useEffect in Next.js

import { useState, useEffect } from "react";
=======
"use client";

import { useState, useEffect, useRef } from "react";
>>>>>>> d8eeee2 (just need to fix the backend but improve the landing page)
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

/* ── Hand-drawn doodle SVG components ───────────────────────── */

function DoodleBook({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 80 80" fill="none" className={className}>
            <path d="M20 15C18 15 15 17 15 20V60C15 63 17 65 20 65H60C63 65 65 63 65 60V20C65 17 63 15 60 15H20Z" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M40 15V65" stroke="black" strokeWidth="2" strokeLinecap="round" />
            <path d="M25 30H35" stroke="black" strokeWidth="2" strokeLinecap="round" />
            <path d="M25 38H33" stroke="black" strokeWidth="2" strokeLinecap="round" />
            <path d="M45 30H55" stroke="black" strokeWidth="2" strokeLinecap="round" />
            <path d="M45 38H53" stroke="black" strokeWidth="2" strokeLinecap="round" />
            <path d="M45 46H50" stroke="black" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function DoodleBox({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 80 80" fill="none" className={className}>
            <path d="M15 30L40 18L65 30V55L40 67L15 55V30Z" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 30L40 42L65 30" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M40 42V67" stroke="black" strokeWidth="2" strokeLinecap="round" />
            <path d="M27 24L52 36" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
        </svg>
    );
}

function DoodlePrinter({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 80 80" fill="none" className={className}>
            <rect x="20" y="10" width="40" height="20" rx="3" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
            <rect x="12" y="30" width="56" height="25" rx="4" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M22 55H58V68C58 70 56 72 54 72H26C24 72 22 70 22 68V55Z" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="54" cy="40" r="3" fill="black" />
            <path d="M28 62H52" stroke="black" strokeWidth="2" strokeLinecap="round" />
            <path d="M28 66H44" stroke="black" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function DoodleStar({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 50 50" fill="none" className={className}>
            <path d="M25 5L30 18L44 20L33 30L36 44L25 37L14 44L17 30L6 20L20 18L25 5Z" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="#FDF567" />
        </svg>
    );
}

function DoodleArrow({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 80 40" fill="none" className={className}>
            <path d="M5 30C15 30 25 10 40 10C55 10 60 25 75 20" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M68 14L75 20L66 24" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function DoodleScribble({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 60 60" fill="none" className={className}>
            <path d="M10 50C15 30 25 15 35 20C45 25 30 40 20 35C10 30 25 10 50 15" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    );
}

function DoodleHeart({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 50 50" fill="none" className={className}>
            <path d="M25 44C25 44 5 30 5 18C5 10 12 5 19 8C22 9 24 12 25 15C26 12 28 9 31 8C38 5 45 10 45 18C45 30 25 44 25 44Z" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="#FF90E8" fillOpacity="0.3" />
        </svg>
    );
}

function DoodleSparkle({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 40 40" fill="none" className={className}>
            <path d="M20 5L22 16L33 14L24 22L30 32L20 26L10 32L16 22L7 14L18 16L20 5Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

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
<<<<<<< HEAD
    // 1. State to track if the user has started scrolling
    const [isScrolled, setIsScrolled] = useState(false);

    // 2. Effect to listen for window scrolling
    useEffect(() => {
        const handleScroll = () => {
            // If the user scrolls down more than 50 pixels, trigger the color change
            if (window.scrollY > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        // Cleanup the event listener when the component unmounts
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <section
            className="relative overflow-hidden border-b-2 border-black"
            style={{
                backgroundColor: '#F9F6F0',
            }}
        >
            <div
                className="absolute inset-0 z-0 opacity-50 pointer-events-none"
                style={{
                    backgroundImage: "url('/background_doodle.png')",
                    backgroundSize: '1400px auto',
                    backgroundRepeat: 'repeat',
                    mixBlendMode: 'multiply',
                    opacity: 0.3,
                }}
            />

            {/* Background Graphic Element - Large Text */}
            <div className="absolute -top-20 -right-20 select-none pointer-events-none opacity-20">
                <span className="text-[30rem] font-black leading-none text-white mix-blend-overlay">PRINT</span>
            </div>
=======
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <section className="relative overflow-hidden" style={{ backgroundColor: '#FF90E8' }}>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.06]" style={{
                backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
                backgroundSize: '24px 24px'
            }} />
>>>>>>> d8eeee2 (just need to fix the backend but improve the landing page)

            {/* ── Floating Doodles ── */}
            {/* Top-left book */}
            <DoodleBook className="absolute top-16 left-[5%] w-16 md:w-20 opacity-20 doodle-float-1 hidden sm:block" />

            {/* Top-right box */}
            <DoodleBox className="absolute top-24 right-[8%] w-14 md:w-18 opacity-20 doodle-float-2 hidden sm:block" />

            {/* Left printer */}
            <DoodlePrinter className="absolute top-[45%] left-[3%] w-16 md:w-22 opacity-15 doodle-float-3 hidden md:block" />

            {/* Right star */}
            <DoodleStar className="absolute top-[30%] right-[5%] w-10 md:w-14 opacity-25 doodle-spin hidden sm:block" />

            {/* Bottom-left scribble */}
            <DoodleScribble className="absolute bottom-[20%] left-[10%] w-12 md:w-16 opacity-15 doodle-float-2 hidden md:block" />

            {/* Bottom-right arrow */}
            <DoodleArrow className="absolute bottom-[25%] right-[6%] w-16 md:w-24 opacity-20 doodle-float-1 hidden sm:block" />

            {/* Top-center heart */}
            <DoodleHeart className="absolute top-20 left-[25%] w-8 md:w-12 opacity-20 doodle-float-3 hidden lg:block" />

            {/* Mid-right sparkle */}
            <DoodleSparkle className="absolute top-[55%] right-[15%] w-8 md:w-10 opacity-20 doodle-spin-slow hidden md:block" />

            {/* Extra small doodles */}
            <DoodleStar className="absolute top-[60%] left-[15%] w-6 md:w-8 opacity-15 doodle-spin-slow hidden lg:block" />
            <DoodleSparkle className="absolute top-12 right-[25%] w-7 opacity-15 doodle-float-1 hidden lg:block" />
            <DoodleHeart className="absolute bottom-[30%] right-[25%] w-7 opacity-15 doodle-float-2 hidden lg:block" />

            <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 md:pt-32 md:pb-24 relative z-10">

                {/* Main Hero Content */}
                <div className="text-center space-y-8">
                    {/* Small badge */}
                    <div
                        className={`inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 text-sm font-bold uppercase tracking-widest rounded-full transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>Premium Printing & Packaging</span>
                    </div>

                    {/* Giant headline */}
                    <h1
                        className={`text-5xl md:text-7xl lg:text-[7rem] font-black leading-[0.85] tracking-tighter text-black transition-all duration-700 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
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

<<<<<<< HEAD
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Button size="lg" className="bg-[#4be794] text-black h-16 px-8 text-xl font-bold rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-[#4be794] transition-all" asChild>
=======
                    {/* CTA Buttons */}
                    <div
                        className={`flex flex-col sm:flex-row gap-4 justify-center pt-4 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    >
                        <Button
                            size="lg"
                            className="bg-black text-white h-12 px-8 text-base font-bold rounded-full border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,0.3)] transition-all cursor-pointer"
                            asChild
                        >
>>>>>>> d8eeee2 (just need to fix the backend but improve the landing page)
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
<<<<<<< HEAD

                {/* Right Content - The Visual */}
                <div className="relative hidden lg:block h-full min-h-[500px] flex items-center justify-center">
                    {/* Main Image with Brutalist Frame */}
                    <div className="relative z-20 border-4 border-black bg-white p-2 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] rotate-2 hover:rotate-0 transition-transform duration-500 ease-out origin-center w-full max-w-md ml-auto">
                        <div className="relative w-full aspect-[4/5] overflow-hidden border-2 border-black">
                            {/* 3. Dynamic classes added to the image to trigger based on scroll state */}
                            <img
                                src="https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop"
                                alt="Premium Book Binding"
                                className={`w-full h-full object-cover transition-all duration-700 ${isScrolled
                                        ? "grayscale-0 scale-100"
                                        : "grayscale hover:grayscale-0 scale-105 hover:scale-100"
                                    }`}
                            />
                        </div>

                        {/* Badge Overlay 1 */}
                        <div className="absolute -bottom-8 -left-8 bg-[#fdf567] border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-30 transform -rotate-3 hover:rotate-0 transition-transform">
                            <p className="font-black text-xl uppercase leading-none text-center">Fast<br />Shipping</p>
                        </div>

                        {/* Badge Overlay 2 */}
                        <div className="absolute -top-6 -right-6 bg-[#4be794] border-4 border-black p-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-30 transform rotate-3 hover:rotate-0 transition-transform">
                            <Truck className="w-8 h-8 text-black" />
                        </div>
                    </div>

                    {/* Decorative Element Behind */}
                    <div className="absolute top-20 right-0 w-3/4 h-3/4 border-4 border-black bg-white -z-10 translate-x-10 translate-y-10 opacity-50" />
                </div>

=======
>>>>>>> d8eeee2 (just need to fix the backend but improve the landing page)
            </div>

            {/* Bottom wave / transition */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1440 60" fill="none" className="w-full">
                    <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="white" />
                </svg>
            </div>

            {/* ── Doodle Animations ── */}
            <style jsx>{`
                @keyframes doodle-float-1 {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    25% { transform: translateY(-12px) rotate(3deg); }
                    50% { transform: translateY(-6px) rotate(-2deg); }
                    75% { transform: translateY(-18px) rotate(4deg); }
                }
                @keyframes doodle-float-2 {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    33% { transform: translateY(-15px) rotate(-4deg); }
                    66% { transform: translateY(-8px) rotate(3deg); }
                }
                @keyframes doodle-float-3 {
                    0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
                    30% { transform: translateY(-10px) rotate(5deg) scale(1.05); }
                    60% { transform: translateY(-20px) rotate(-3deg) scale(0.95); }
                }
                @keyframes doodle-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes doodle-spin-slow {
                    0% { transform: rotate(0deg) scale(1); }
                    50% { transform: rotate(180deg) scale(1.1); }
                    100% { transform: rotate(360deg) scale(1); }
                }
                @keyframes doodle-draw {
                    from { stroke-dashoffset: 500; }
                    to { stroke-dashoffset: 0; }
                }
                .doodle-float-1 { animation: doodle-float-1 6s ease-in-out infinite; }
                .doodle-float-2 { animation: doodle-float-2 8s ease-in-out infinite; }
                .doodle-float-3 { animation: doodle-float-3 7s ease-in-out infinite; }
                .doodle-spin { animation: doodle-spin 12s linear infinite; }
                .doodle-spin-slow { animation: doodle-spin-slow 15s linear infinite; }
                .doodle-draw { animation: doodle-draw 1.5s ease-out 0.8s forwards; }
            `}</style>
        </section>
    );
}