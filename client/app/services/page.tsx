import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Package, Layers } from "lucide-react";
import { ServiceItem } from "@/types/service";
import { ServiceCard } from "@/components/services/ServiceCard";

async function getServices(): Promise<ServiceItem[]> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/services/`, {
            next: { revalidate: 3600 }
        });

        if (!res.ok) return [];
        return res.json();
    } catch (error) {
        console.error("Failed to fetch services:", error);
        return [];
    }
}

export default async function ServicesCatalogPage() {
    const services = await getServices();

    return (
        <div className="min-h-screen bg-white relative overflow-hidden">
            {/* Background Decorative Pattern */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[24px_24px]"></div>

            <div className="max-w-7xl mx-auto px-6 py-24 relative z-10">
                {/* Energetic Page Header */}
                <div className="relative mb-20">
                    <div className="bg-[#90e8ff] border-4 border-black p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rotate-1 relative rounded-xl">
                        <div className="absolute -top-6 -left-6 bg-[#fdf567] border-2 border-black px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-3 z-20 rounded-md">
                            <span className="text-sm font-black uppercase tracking-[0.3em]">The Studio</span>
                        </div>
                        <div className="space-y-6 relative z-10">
                            <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.85] text-black">
                                Studio <br />
                                <span className="text-white drop-shadow-[5px_5px_0px_rgba(0,0,0,1)]">Solutions.</span>
                            </h1>
                            <p className="text-xl md:text-2xl font-black text-black/80 max-w-2xl leading-tight border-l-8 border-black pl-8 py-2">
                                Professional structural design and bespoke prototyping for high-end commerce.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section Divider */}
                <div className="flex items-center gap-6 mb-16 overflow-hidden">
                    <div className="h-1 flex-1 bg-black"></div>
                    <div className="bg-black text-white px-8 py-2 font-black uppercase tracking-[0.4em] text-xs -rotate-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(144,232,255,1)]">
                        Strategic_Consulting
                    </div>
                    <div className="h-1 flex-1 bg-black"></div>
                </div>

                {services.length === 0 ? (
                    <div className="col-span-full text-center py-32 bg-zinc-50 border-8 border-dashed border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,0.1)]">
                        <Layers className="w-24 h-24 mx-auto text-zinc-300 mb-6" />
                        <h3 className="text-4xl font-black uppercase tracking-tighter">Studio Offline</h3>
                        <p className="text-xl font-bold text-zinc-500 mt-4">We are currently recalibrating our service tiers. Check back soon.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-12">
                        {services.map((service) => (
                            <ServiceCard key={service.id} service={service} />
                        ))}
                    </div>
                )}

                {/* High Impact Call-to-Action */}
                <div className="mt-40 relative group">
                    <div className="absolute inset-0 bg-[#4be794] border-2 border-black translate-x-4 translate-y-4 z-0 group-hover:translate-x-6 group-hover:translate-y-6 transition-all duration-300 rounded-xl"></div>
                    <div className="relative bg-white border-2 border-black p-12 md:p-24 z-10 flex flex-col lg:flex-row items-center justify-between gap-12 overflow-hidden rounded-xl">
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full translate-y-32 -translate-x-32"></div>
                        <div className="space-y-8 max-w-2xl relative z-10">
                            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">
                                Custom <br />
                                <span className="bg-[#ff90e8] px-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] inline-block mt-2 -rotate-1 rounded-md">Architect?</span>
                            </h2>
                            <p className="text-xl md:text-2xl font-bold text-zinc-600 leading-tight">
                                Can't find exactly what you're looking for? Our master designers handle complex bespoke engineering daily. Let's talk structure.
                            </p>
                        </div>
                        <Button size="lg" className="bg-black text-white hover:bg-black hover:scale-105 border-2 border-black shadow-[8px_8px_0px_0px_rgba(255,144,232,1)] hover:shadow-[12px_12px_0px_0px_rgba(253,245,103,1)] transition-all text-2xl h-24 px-16 font-black uppercase shrink-0 rounded-full relative z-10" asChild>
                            <Link href="/#contact">Talk to Studio <ArrowRight className="ml-6 h-10 w-10" /></Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}