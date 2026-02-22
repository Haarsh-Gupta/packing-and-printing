"use client";

import { useState } from "react";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
    {
        name: "Arjun Mehta",
        role: "Founder, QuickBite Foods",
        content: "BookBind completely transformed our packaging. The custom corrugated boxes are incredibly sturdy, and the print quality is flawless. It gave our brand the premium feel we desperately needed.",
        avatarSeed: "ArjunM",
        amount: "₹2,40,000",
        amountLabel: "saved on packaging",
        color: "#FF90E8"
    },
    {
        name: "Priya Sharma",
        role: "Operations Manager, TechNova",
        content: "Getting custom invoice books printed used to be a massive headache. With BookBind, I just uploaded our logo, configured the triplicate pages, and they arrived perfectly bound in 3 days. Phenomenal service.",
        avatarSeed: "PriyaS",
        amount: "3 Days",
        amountLabel: "turnaround time",
        color: "#90E8FF"
    },
    {
        name: "Rohan Desai",
        role: "Marketing Director, Bloom Cafe",
        content: "The premium business cards with gold-foil embossing were an absolute hit at our last networking event. The interface to configure the print job was so intuitive. We won't go anywhere else.",
        avatarSeed: "RohanD",
        amount: "10,000+",
        amountLabel: "cards delivered",
        color: "#FDF567"
    },
    {
        name: "Anjali Gupta",
        role: "Creative Lead, DesignStudio",
        content: "I appreciate the attention to detail. The color reproduction on our catalogs was 100% accurate to the digital proofs. Highly recommended for professionals who care about quality.",
        avatarSeed: "AnjaliG",
        amount: "100%",
        amountLabel: "color accuracy",
        color: "#B8FF90"
    }
];

export default function Testimonials() {
    const [active, setActive] = useState(0);

    const next = () => setActive((prev) => (prev + 1) % testimonials.length);
    const prev = () => setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);

    return (
        <section className="py-16 px-6 bg-white">
            <div className="max-w-6xl mx-auto">

                {/* Section Header */}
                <div className="text-center mb-12 space-y-3">
                    <div className="inline-block bg-[#fdf567] text-black px-4 py-2 font-black text-sm uppercase tracking-widest border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-1">
                        Success Stories
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-black leading-[0.9]">
                        Trusted by businesses<br />
                        <span className="text-zinc-400">across India.</span>
                    </h2>
                </div>

                {/* Featured Testimonial - Large Card */}
                <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-stretch">
                    {/* Main card */}
                    <div
                        className="border-3 border-black rounded-2xl p-8 md:p-10 relative shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-colors duration-500"
                        style={{ backgroundColor: testimonials[active].color }}
                    >
                        {/* Big stat */}
                        <div className="mb-8">
                            <div className="text-4xl md:text-6xl font-black text-black leading-none tracking-tighter">
                                {testimonials[active].amount}
                            </div>
                            <div className="text-sm font-bold text-black/60 uppercase tracking-wider mt-1">
                                {testimonials[active].amountLabel}
                            </div>
                        </div>

                        {/* Quote */}
                        <Quote className="h-10 w-10 text-black/20 mb-4" />
                        <p className="text-base md:text-lg font-medium text-black/80 leading-relaxed max-w-2xl">
                            {testimonials[active].content}
                        </p>

                        {/* Author */}
                        <div className="flex items-center gap-3 mt-6 pt-6 border-t-3 border-black/10">
                            <div className="h-12 w-12 rounded-full border-3 border-black overflow-hidden bg-white">
                                <img
                                    src={`https://api.dicebear.com/9.x/open-peeps/svg?seed=${testimonials[active].avatarSeed}&backgroundColor=ffdfbf`}
                                    alt={testimonials[active].name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <h4 className="font-black text-xl text-black">{testimonials[active].name}</h4>
                                <p className="text-sm font-bold text-black/60">{testimonials[active].role}</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation side panel */}
                    <div className="flex lg:flex-col gap-3 justify-center">
                        <button
                            onClick={prev}
                            className="w-14 h-14 bg-white border-4 border-black rounded-full flex items-center justify-center hover:bg-[#FF90E8] hover:-translate-y-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>

                        {/* Dots */}
                        {testimonials.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActive(idx)}
                                className={`w-4 h-4 rounded-full border-3 border-black transition-all cursor-pointer ${active === idx ? 'bg-black scale-125' : 'bg-white hover:bg-zinc-200'}`}
                            />
                        ))}

                        <button
                            onClick={next}
                            className="w-14 h-14 bg-white border-4 border-black rounded-full flex items-center justify-center hover:bg-[#FF90E8] hover:-translate-y-1 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Bottom mini cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    {testimonials.map((t, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActive(idx)}
                            className={`p-4 border-4 border-black rounded-xl text-left transition-all cursor-pointer ${active === idx
                                ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1'
                                : 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                }`}
                            style={{ backgroundColor: active === idx ? t.color : 'white' }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full border-2 border-black overflow-hidden bg-white shrink-0">
                                    <img
                                        src={`https://api.dicebear.com/9.x/open-peeps/svg?seed=${t.avatarSeed}&backgroundColor=ffdfbf`}
                                        alt={t.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-sm text-black truncate">{t.name}</p>
                                    <p className="text-xs text-black/50 truncate">{t.role}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}