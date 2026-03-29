"use client";

import { SubService } from "@/types/service";
import { VariantCard } from "@/components/ui/VariantCard";

interface SubServiceCardProps {
    variant: SubService;
    index?: number;
    serviceSlug: string; 
}

export function SubServiceCard({ variant, index = 0 }: SubServiceCardProps) {
    const coverImage = variant.images && variant.images.length > 0 ? variant.images[0] : null;

    return (
        <VariantCard
            id={variant.id}
            name={variant.name}
            description={variant.description || "Professional expertise."}
            price={variant.price_per_unit}
            slug={variant.slug}
            image={coverImage}
            index={index}
            basePath="/services/request"
            buttonText="Request Quote"
            minQuantityInfo={`MOQ: ${variant.minimum_quantity} Units`}
            showWishlist={false}
        />
    );
}
