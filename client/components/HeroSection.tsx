import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Truck } from "lucide-react";

export default function HeroSection() {
    return (
        <section
            className="relative overflow-hidden border-b-2 border-black"
            style={{
                backgroundColor: 'var(--site-bg, #ffffff)'
            }}
        >
            {/* Background Graphic Element - Large Text */}
            <div className="absolute -top-20 -right-20 select-none pointer-events-none opacity-20">
                <span className="text-[30rem] font-black leading-none text-white mix-blend-overlay">PRINT</span>
            </div>

            <div className="max-w-7xl mx-auto px-4 pt-20 pb-24 md:pt-32 md:pb-40 grid lg:grid-cols-2 gap-12 items-center relative z-10">

                {/* Left Content */}
                <div className="space-y-8">
                    <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-full">
                        <Star className="w-4 h-4 fill-current text-[#4be794]" />
                        <span>Premium Printing Solutions</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black leading-[0.9] tracking-tighter uppercase text-slate-900 bg-white/50 backdrop-blur-sm p-4 inline-block -mx-4 rounded-xl border-2 border-black/5">
                        Start Your <br />
                        <span className="text-zinc-500">Dream Brand.</span>
                    </h1>

                    <p className="text-xl text-zinc-600 max-w-lg leading-relaxed font-bold bg-white/80 p-2 rounded-lg">
                        From custom packaging to intricate binding, we bring your vision to life with precision and style. Simple pricing, fast delivery.
                    </p>


                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Button size="lg" className="bg-[#4be794] text-black h-16 px-8 text-xl font-bold rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-[#4be794] transition-all" asChild>
                            <Link href="/products">
                                Start Printing <ArrowRight className="ml-3 w-6 h-6" />
                            </Link>
                        </Button>

                        <Button size="lg" variant="outline" className="bg-white text-black h-16 px-8 text-xl font-bold rounded-none border-2 border-black hover:bg-zinc-50" asChild>
                            <Link href="/services">
                                Our Services
                            </Link>
                        </Button>
                    </div>

                    <div className="flex items-center gap-4 text-sm font-medium text-zinc-500 pt-4 border-t border-zinc-300 mt-8 w-fit pr-8">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-zinc-200 overflow-hidden shadow-sm">
                                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${i}&backgroundColor=e5e5e5`} alt="User" />
                                </div>
                            ))}
                        </div>
                        <p>Trusted by <span className="font-bold text-black">500+</span> Local Businesses</p>
                    </div>
                </div>

                {/* Right Content - The Visual */}
                <div className="relative hidden lg:block h-full min-h-[500px] flex items-center justify-center">
                    {/* Main Image with Brutalist Frame */}
                    <div className="relative z-20 border-4 border-black bg-white p-2 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] rotate-2 hover:rotate-0 transition-transform duration-500 ease-out origin-center w-full max-w-md ml-auto">
                        <div className="relative w-full aspect-[4/5] overflow-hidden border-2 border-black">
                            <img
                                src="https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop"
                                alt="Premium Book Binding"
                                className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-700 scale-105 hover:scale-100"
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

            </div>
        </section>
    );
}
