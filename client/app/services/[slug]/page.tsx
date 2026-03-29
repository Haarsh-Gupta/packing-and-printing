import { notFound } from "next/navigation";
import { ServiceItem } from "@/types/service";
import ServiceDetailView from "./ServiceDetailView";

async function getService(slug: string): Promise<ServiceItem | null> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/services/${slug}`, {
            cache: 'no-store'
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
        <ServiceDetailView service={service} />
    );
}
