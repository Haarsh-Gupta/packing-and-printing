import { notFound } from "next/navigation";
import { ServiceItem } from "@/types/service";
import { SubServiceCard } from "@/components/services/SubServiceCard";

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
        <div className="min-h-screen bg-white text-zinc-900 pb-20">
            <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">

                <div className="mb-10 max-w-2xl">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">Service Category</span>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 uppercase">
                        {service.name}
                    </h1>
                    <p className="text-lg text-zinc-500 font-medium leading-relaxed">
                        Professional implementation and expert guidance tailored specifically for your structured requirements and operations. Experience unmatched quality.
                    </p>
                </div>

                <div className="mb-16">
                    <h2 className="text-3xl font-black uppercase tracking-tight mb-8">Available Tiers & Services</h2>
                    {service.sub_services && service.sub_services.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {service.sub_services.map((variant, index) => (
                                <SubServiceCard key={variant.id} variant={variant} index={index} serviceSlug={service.slug} />
                            ))}
                        </div>
                    ) : (
                        <div className="p-10 border-4 border-black bg-zinc-50 shadow-neubrutalism">
                            <p className="font-bold text-lg">No designated variants found for this service category currently.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
