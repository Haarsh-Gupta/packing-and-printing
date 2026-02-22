"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, PenTool, BookOpen, Layers, Printer, Truck } from "lucide-react";

const processSteps = [
    {
        step: "01",
        title: "Submit Inquiry",
        desc: "Choose your specs and upload your design files. Tell us exactly what you need.",
        icon: <PenTool className="h-8 w-8" />,
        color: "#FF90E8"
    },
    {
        step: "02",
        title: "Get a Quote",
        desc: "Our team reviews your request and sets a transparent, competitive price.",
        icon: <BookOpen className="h-8 w-8" />,
        color: "#90E8FF"
    },
    {
        step: "03",
        title: "Accept & Pay",
        desc: "Approve the quote and complete a secure payment. No hidden fees.",
        icon: <Layers className="h-8 w-8" />,
        color: "#FDF567"
    },
    {
        step: "04",
        title: "Production",
        desc: "Your job hits the press. Track real-time progress from your dashboard.",
        icon: <Printer className="h-8 w-8" />,
        color: "#B8FF90"
    },
    {
        step: "05",
        title: "Delivery",
        desc: "Receive your premium printed goods at your doorstep, packed with care.",
        icon: <Truck className="h-8 w-8" />,
        color: "#FFB890"
    },
];

export default function HowItWorksSection() {
    return (
        <section id="how-it-works" className="py-16 px-6 bg-black text-white border-b-4 border-black relative overflow-hidden">
            {/* Decorative dot pattern */}
            <div className="absolute inset-0 opacity-[0.05]" style={{
                backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
                backgroundSize: '20px 20px'
            }} />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Section Header */}
                <div className="mb-12 text-center space-y-3">
                    <div className="inline-block bg-[#90e8ff] text-black px-4 py-2 font-black text-sm uppercase tracking-widest border-4 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] rotate-1">
                        Workflow
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-[0.9]">
                        How It Works
                    </h2>
                    <p className="text-base text-zinc-400 max-w-xl mx-auto font-medium">
                        From idea to doorstep in 5 simple steps. No complexity.
                    </p>
                </div>

                {/* Steps */}
                <div className="grid md:grid-cols-5 gap-6">
                    {processSteps.map((item, idx) => (
                        <div key={idx} className="group relative">
                            {/* Connector line */}
                            {idx < processSteps.length - 1 && (
                                <div className="hidden md:block absolute top-12 left-[calc(50%+40px)] w-[calc(100%-40px)] h-[3px] bg-zinc-800 z-0">
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-zinc-600 rounded-full" />
                                </div>
                            )}

                            <div className="relative z-10 text-center space-y-4">
                                {/* Step circle */}
                                <div
                                    className="w-14 h-14 mx-auto border-3 border-black rounded-full flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)] group-hover:-translate-y-2 group-hover:shadow-[5px_5px_0px_0px_rgba(255,255,255,0.15)] transition-all duration-200"
                                    style={{ backgroundColor: item.color }}
                                >
                                    <span className="text-black">{item.icon}</span>
                                </div>

                                {/* Step number */}
                                <div className="text-3xl font-black text-zinc-800 leading-none">
                                    {item.step}
                                </div>

                                {/* Title */}
                                <h3 className="text-lg font-black uppercase tracking-tight">
                                    {item.title}
                                </h3>

                                {/* Description */}
                                <p className="text-zinc-500 font-medium text-sm leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="mt-14 text-center">
                    <Button
                        size="lg"
                        className="bg-[#FF90E8] text-black h-12 px-8 text-base font-bold rounded-full border-3 border-black shadow-[3px_3px_0px_0px_rgba(255,144,232,0.3)] hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(255,144,232,0.3)] transition-all cursor-pointer"
                        asChild
                    >
                        <Link href="/products">
                            Start Your First Order <ArrowRight className="ml-3 w-6 h-6" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
