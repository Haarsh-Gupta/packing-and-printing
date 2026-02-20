import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import ServiceInquiryForm from "./ServiceInquiryForm";
import { ServiceItem } from "@/types/service";

async function getService(slug: string): Promise<ServiceItem | null> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/services/${slug}`, {
            next: { revalidate: 3600 }
        });

        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        console.error("Failed to fetch service:", error);
        return null;
    }
}

export default async function ServiceDetailPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params;
    const service = await getService(slug);

    if (!service) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-white relative overflow-hidden">
            {/* Background Decorative Pattern */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[24px_24px]"></div>

            <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
                {/* Back Button */}
                <Button variant="ghost" className="mb-8 hover:bg-zinc-100 border-2 border-transparent hover:border-black transition-all" asChild>
                    <Link href="/services">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
                    </Link>
                </Button>

                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Left Column: Service Details */}
                    <div className="space-y-8">
                        <div className="space-y-6">
                            <div className="inline-block bg-[#90e8ff] border-4 border-black px-4 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-1">
                                <span className="text-xs font-black uppercase tracking-widest text-black">Professional Service</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
                                {service.name}
                            </h1>
                            <p className="text-xl md:text-2xl font-bold text-zinc-600 leading-tight border-l-8 border-black pl-6 py-2">
                                Professional implementation and expert guidance for your specialized requirements.
                            </p>
                        </div>

                        {/* Service Value Propositions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            <div className="p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                                <CheckCircle2 className="h-10 w-10 text-[#4be794] mb-4" />
                                <h3 className="text-xl font-black uppercase mb-2">Expert Review</h3>
                                <p className="text-sm font-medium text-zinc-500">Every inquiry is reviewed by our master studio technicians.</p>
                            </div>
                            <div className="p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-[#fdf567]">
                                <ShieldCheck className="h-10 w-10 text-black mb-4" />
                                <h3 className="text-xl font-black uppercase mb-2">Guaranteed Quality</h3>
                                <p className="text-sm font-black text-black">We ensure your structural prototypes meet industry standards.</p>
                            </div>
                        </div>

                        {/* Variants List Section */}
                        <div className="space-y-4 pt-4">
                            <h3 className="text-2xl font-black uppercase tracking-tighter border-b-4 border-black pb-2">Available Expertise</h3>
                            <div className="space-y-4">
                                {service.variants.map((variant) => (
                                    <div key={variant.id} className="p-5 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center group hover:bg-zinc-50 transition-colors">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-xl">{variant.name}</h4>
                                            <p className="text-sm text-zinc-500 font-medium max-w-sm">{variant.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] uppercase font-black text-zinc-400 block mb-1">Starting at</span>
                                            <span className="text-2xl font-black">₹{variant.base_price.toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: The Configuration Form */}
                    <div className="relative">
                        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sticky top-24 overflow-hidden rounded-none">
                            <CardHeader className="border-b-4 border-black bg-[#ff90e8] p-8">
                                <CardTitle className="text-4xl font-black uppercase tracking-tighter text-black">Request Quote</CardTitle>
                                <p className="text-sm font-bold text-black opacity-80 uppercase tracking-widest">Select your variant and requirements below</p>
                            </CardHeader>
                            <CardContent className="p-8 bg-white">
                                <Suspense fallback={<div className="h-64 flex items-center justify-center font-bold animate-pulse uppercase tracking-widest text-zinc-300">Configuring Studio...</div>}>
                                    <ServiceInquiryForm service={service} />
                                </Suspense>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
