"use client";

import { ServiceItem } from "@/types/service";
import { CatalogCard } from "@/components/ui/CatalogCard";

interface ServiceCardProps {
    service: ServiceItem;
    index: number;
}

export function ServiceCard({ service, index }: ServiceCardProps) {
    const itemCountText = service.sub_services && service.sub_services.length > 0 ? `${service.sub_services.length} Tiers` : '0 Tiers';

    return (
        <CatalogCard
            title={service.name}
            description="Premium professional services configured for you."
            image={service.cover_image}
            href={`/services/${service.slug}`}
            badgeText={itemCountText}
            index={index}
            buttonText="Explore Service"
            grayscale={true}
        />
    );
}