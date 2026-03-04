"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { Product, SubProduct } from "@/types/product";
import { SubProductCard } from "@/components/products/SubProductCard";

export default function ProductDetailView({ product }: { product: Product }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Categories usually have a cover_image. We'll use this or a generic placeholder.
    const images = product.cover_image
        ? [product.cover_image]
        : ["https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop"];

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div className="min-h-screen bg-white text-zinc-900 pb-20">
            <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">

                <div className="mb-10 max-w-2xl">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">Category Overview</span>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 uppercase">
                        {product.name}
                    </h1>
                    <p className="text-lg text-zinc-500 font-medium leading-relaxed">
                        {product.description || "Expertly crafted printing and binding solutions tailored for professionals and businesses. Experience unmatched quality and durability."}
                    </p>
                </div>

                <div className="mb-16">
                    <h2 className="text-3xl font-black uppercase tracking-tight mb-8">Available Variants</h2>
                    {product.sub_products && product.sub_products.filter(s => s.is_active !== false).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {product.sub_products.filter(s => s.is_active !== false).map((sub: SubProduct, index: number) => (
                                <SubProductCard key={sub.id} subProduct={sub} index={index} />
                            ))}
                        </div>
                    ) : (
                        <div className="p-10 border-4 border-black bg-zinc-50 shadow-neubrutalism">
                            <p className="font-bold text-lg">No designated variants found for this category currently.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
