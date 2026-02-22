import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function AboutSection() {
    return (
        <section id="about" className="py-16 px-6 bg-[#FDF567] overflow-hidden relative">
            {/* Decorative */}
            <div className="absolute top-10 right-10 text-[20rem] font-black text-black/[0.03] leading-none select-none pointer-events-none hidden lg:block">
                PRINT
            </div>

            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center relative z-10">

                {/* Left Content */}
                <div className="space-y-8">
                    <div className="inline-block bg-white text-black px-4 py-2 font-black text-sm uppercase tracking-widest border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-2">
                        Who We Are
                    </div>

                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-[0.95] text-black">
                        Instead of guessing...
                        <br />
                        <span className="bg-black text-[#FDF567] px-3 inline-block mt-2">start printing!</span>
                    </h2>

                    <p className="text-base text-black/70 leading-relaxed font-medium">
                        BookBind was born out of a simple frustration: getting custom, high-quality printing shouldn&apos;t require endless emails and confusing pricing. We combined state-of-the-art production with a seamless digital platform.
                    </p>

                    <ul className="space-y-4 pt-2">
                        {[
                            "Premium quality inks & imported materials",
                            "Transparent quoted pricing system",
                            "End-to-end custom fulfillment & shipping",
                            "Real-time order tracking dashboard"
                        ].map((item, i) => (
                            <li key={i} className="flex items-center text-base font-bold text-black gap-3">
                                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="h-5 w-5 text-[#FDF567]" />
                                </div>
                                {item}
                            </li>
                        ))}
                    </ul>

                    <Button
                        size="lg"
                        className="bg-black text-white rounded-full border-4 border-black text-lg h-14 px-8 mt-4 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.5)] transition-all cursor-pointer"
                        asChild
                    >
                        <Link href="/about">
                            Read Our Story <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                </div>

                {/* Right Content - Stats & Visual */}
                <div className="relative">
                    {/* Main Image */}
                    <div className="border-4 border-black rounded-3xl shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden relative z-10">
                        <img
                            src="https://images.unsplash.com/photo-1562664377-709f2c337eb2?q=80&w=800&auto=format&fit=crop"
                            alt="Printing Press in Action"
                            className="w-full aspect-[4/5] object-cover grayscale hover:grayscale-0 transition-all duration-700"
                        />
                    </div>

                    {/* Floating Stat 1 */}
                    <div className="absolute -bottom-4 -left-4 md:-left-8 bg-[#FF90E8] border-3 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-20 hover:-translate-y-2 transition-transform">
                        <div className="text-3xl md:text-4xl font-black text-black">10+</div>
                        <div className="text-xs font-bold uppercase text-black/60 mt-1">Years of Craft</div>
                    </div>

                    {/* Floating Stat 2 */}
                    <div className="absolute -top-4 -right-4 md:-right-8 bg-[#90E8FF] border-3 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-20 hidden sm:block hover:-translate-y-2 transition-transform">
                        <div className="text-3xl md:text-4xl font-black text-black">1M+</div>
                        <div className="text-xs font-bold uppercase text-black/60 mt-1">Prints Delivered</div>
                    </div>
                </div>

            </div>
        </section>
    );
}