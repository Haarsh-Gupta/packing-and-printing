import { notFound } from "next/navigation";
import { FileText, CheckCircle2 } from "lucide-react";
import ServiceInquiryForm from "../../[slug]/ServiceInquiryForm";
import ProductImageCarousel from "@/components/products/ProductImageCarousel";
import ServiceReviews from "./ServiceReviews";
import sanitizeHtml from 'sanitize-html';

const sanitizeOptions = {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'h1', 'h2', 'h3', 'h4', 'span' ]),
    allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt', 'width', 'height'], span: ['style'] }
};
async function getSubService(slug: string) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/services/subservices/${slug}`, {
            cache: 'no-store'
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

async function getServices() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/services`, {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
}

export default async function ServiceRequestPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params;
    
    // Fetch variant AND all services to find parent service
    const subService = await getSubService(slug);
    if (!subService) notFound();

    const services = await getServices();
    const parentService = services.find((s: any) => s.id === subService.service_id);

    if (!parentService) notFound();

    return (
        <div className="min-h-screen bg-site-bg text-border-black pb-20">
            {/* Header Section */}
            <div className="border-b-3 border-border-black bg-accent-yellow/20">
                <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">
                        Customize Service
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 uppercase">
                        {subService.name}
                    </h1>
                    <div className="flex items-center gap-3">
                        <span className="bg-white text-black px-4 py-1.5 font-black uppercase text-sm border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] rounded-md">
                            Base Price: ₹{subService.base_price?.toLocaleString()}
                        </span>
                    </div>
                    {/* Description moved to body */}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
                <div className="grid lg:grid-cols-[1fr_400px] gap-12 lg:gap-20 items-start">

                    {/* Left Column: Image, Details */}
                    <div className="space-y-12">
                        <ProductImageCarousel
                            images={subService.images || []}
                            productName={subService.name}
                        />

                        {/* Service Details Section */}
                        <div className="border-2 border-black bg-white p-6 sm:p-8">
                            <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
                                <FileText className="h-5 w-5" /> Service Details
                            </h3>
                            {subService.description ? (
                                <div 
                                    className="prose prose-zinc prose-a:text-accent-green max-w-none text-zinc-600 font-medium leading-relaxed break-words overflow-hidden [&_img]:max-w-full [&_pre]:overflow-x-auto [&_pre]:max-w-full" 
                                    style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(subService.description, sanitizeOptions) }} 
                                />
                            ) : (
                                <p className="text-zinc-500 italic">No details provided.</p>
                            )}
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
                            <ServiceReviews serviceId={subService.id} slug={slug} />
                        </div>
                    </div>

                    {/* Right Column: Customization Form */}
                    <div className="lg:sticky lg:top-10">
                        <div className="bg-white border-3 border-border-black shadow-neubrutalism p-6 sm:p-8 relative">
                            {/* Decorative ribbon */}
                            <div className="absolute -top-3 -right-3 bg-accent-green border-2 border-border-black px-4 py-1 text-xs font-black shadow-neubrutalism-sm rotate-6">
                                ADD TO CART
                            </div>
                            <h3 className="font-display text-2xl font-black uppercase mb-6 border-b-2 border-border-black pb-3">
                                Configuration
                            </h3>
                            <ServiceInquiryForm service={parentService} activeVariant={subService} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
