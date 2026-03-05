import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ServiceInquiryForm from "../../[slug]/ServiceInquiryForm";
import ServiceReviews from "./ServiceReviews";
import ProductImageCarousel from "@/components/products/ProductImageCarousel";
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

export default async function ServiceRequestPage({
    params,
    searchParams
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { slug } = await params;
    const resolvedSearchParams = await searchParams;
    const variantSlug = resolvedSearchParams?.variant as string | undefined;

    const service = await getService(slug);

    if (!service) {
        notFound();
    }

    // Find active variant logic
    let activeVariant = service.sub_services && service.sub_services.length > 0 ? service.sub_services[0] : null;

    if (variantSlug && service.sub_services) {
        const matchingVariant = service.sub_services.find(v => v.slug === variantSlug);
        if (matchingVariant) {
            activeVariant = matchingVariant;
        }
    }

    const images = activeVariant?.images && activeVariant.images.length > 0
        ? activeVariant.images
        : (service.cover_image ? [service.cover_image] : []);

    return (
        <div className="min-h-screen bg-background-light text-border-black pb-20">
            {/* Header Section */}
            <div className="border-b-3 border-border-black bg-accent-blue/20">
                <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                    <Button variant="ghost" className="mb-4 hover:bg-zinc-100 border-2 border-transparent hover:border-black transition-all" asChild>
                        <Link href={`/services/${slug}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Service Variants
                        </Link>
                    </Button>
                    <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block animate-fade-in">
                        Customize Service
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 uppercase animate-fade-up">
                        {service.name}
                    </h1>
                    <p className="text-lg text-border-black/80 font-medium max-w-2xl">
                        {activeVariant?.description || "Professional implementation and expert guidance tailored specifically for your structured requirements and operations. Experience unmatched quality."}
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
                <div className="grid lg:grid-cols-[1fr_400px] gap-12 lg:gap-20 items-start">

                    {/* Left Column: Image, Details, Reviews */}
                    <div className="space-y-12">
                        <ProductImageCarousel
                            images={images}
                            productName={activeVariant?.name || service.name}
                        />

                        {/* Service Details Section */}
                        <div className="border-2 border-black bg-white p-6 sm:p-8">
                            <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
                                <FileText className="h-5 w-5" /> Service Details
                            </h3>
                            <p className="text-zinc-600 font-medium mb-6 leading-relaxed">
                                {activeVariant?.description || "Professional implementation and expert guidance tailored specifically for your structured requirements and operations. Experience unmatched quality."}
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3 text-sm font-medium text-zinc-700">
                                    <CheckCircle2 className="h-5 w-5 text-[#90e8ff] shrink-0" />
                                    Expert Review by master studio technicians
                                </li>
                                <li className="flex items-start gap-3 text-sm font-medium text-zinc-700">
                                    <CheckCircle2 className="h-5 w-5 text-[#90e8ff] shrink-0" />
                                    Guaranteed Quality meeting industry standards
                                </li>
                                <li className="flex items-start gap-3 text-sm font-medium text-zinc-700">
                                    <CheckCircle2 className="h-5 w-5 text-[#90e8ff] shrink-0" />
                                    Dedicated support for custom requirements
                                </li>
                            </ul>
                        </div>

                        {/* Customer Reviews Section */}
                        <div className="pt-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-black uppercase border-b-2 border-black pb-1 inline-block">
                                    Customer Reviews
                                </h3>
                                <a href="#" className="text-sm font-black uppercase hover:underline">
                                    View All
                                </a>
                            </div>
                            {activeVariant ? (
                                <ServiceReviews serviceId={activeVariant.id} serviceSlug={activeVariant.slug} />
                            ) : (
                                <p>No reviews available.</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Configuration Form */}
                    <div className="lg:sticky lg:top-10">
                        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none z-10 bg-white">
                            <CardHeader className="border-b-4 border-black bg-[#ff90e8] p-8">
                                <CardTitle className="text-4xl font-black uppercase tracking-tighter text-black">Request Quote</CardTitle>
                                <p className="text-sm font-bold text-black opacity-80 uppercase tracking-widest">Select your requirements below</p>
                            </CardHeader>
                            <CardContent className="p-8 bg-white">
                                <Suspense fallback={<div className="h-64 flex items-center justify-center font-bold animate-pulse uppercase tracking-widest text-zinc-300">Configuring Studio...</div>}>
                                    {activeVariant ? <ServiceInquiryForm service={service} activeVariant={activeVariant} /> : <p>Variant not found</p>}
                                </Suspense>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
