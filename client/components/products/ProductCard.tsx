"use client";

import { Product } from "@/types/product";
import { CatalogCard } from "@/components/ui/CatalogCard";

interface ProductCardProps {
    product: Product;
    index: number;
}

export function ProductCard({ product, index }: ProductCardProps) {
    const itemCountText = product.sub_products ? `${product.sub_products.length} Items` : '0 Items';

    return (
        <CatalogCard
            title={product.name}
            description={product.description || "Premium products customized for your brand."}
            image={product.cover_image}
            href={`/products/${product.slug}`}
            badgeText={itemCountText}
            index={index}
            buttonText="Explore Category"
        />
    );
}
