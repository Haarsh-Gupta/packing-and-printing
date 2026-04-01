"use client";

import { SubProduct } from "@/types/product";
import { VariantCard } from "@/components/ui/VariantCard";

interface SubProductCardProps {
    subProduct: SubProduct;
    index?: number;
}

export function SubProductCard({ subProduct, index = 0 }: SubProductCardProps) {
    const coverImage = subProduct.images && subProduct.images.length > 0 ? subProduct.images[0] : null;

    return (
        <VariantCard
            id={subProduct.id}
            name={subProduct.name}
            description={subProduct.description}
            price={subProduct.base_price}
            slug={subProduct.slug}
            image={coverImage}
            index={index}
            basePath="/products/customize"
            buttonText="Customize"
            minQuantityInfo={`Min. Order: ${subProduct.minimum_quantity} Units`}
            showWishlist={true}
        />
    );
}
