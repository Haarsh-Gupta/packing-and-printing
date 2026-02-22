"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
    return (
        <section id="contact" className="py-16 px-6 bg-[#FF90E8] border-b-4 border-black relative overflow-hidden">
            {/* Decorative rings */}
            <div className="absolute -top-40 -right-40 w-[500px] h-[500px] border-[40px] border-black/5 rounded-full" />
            <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] border-[20px] border-black/5 rounded-full" />

            <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-black leading-[0.9]">
                    Share your brand.<br />
                    <span className="bg-black text-[#FF90E8] px-3 inline-block mt-2">We&apos;ll print it.</span>
                </h2>

                <p className="text-base md:text-lg font-medium text-black/70 max-w-2xl mx-auto leading-relaxed">
                    Select a product to start your inquiry. Upload files, customize specs, and get a transparent quote — all from your dashboard.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
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
                        className="bg-white text-black h-12 px-8 text-base font-bold rounded-full border-3 border-black hover:bg-[#FDF567] transition-all cursor-pointer"
                        asChild
                    >
                        <Link href="/services">
                            Browse Services
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
