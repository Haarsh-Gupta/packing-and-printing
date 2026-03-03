import { notFound } from "next/navigation";
import ProductInquiryForm from "../../[id]/ProductInquiryForm";
import ProductReviews from "../../[id]/ProductReviews";
import ProductImageCarousel from "@/components/products/ProductImageCarousel";

async function getSubProduct(slug: string) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/sub-products/${slug}`, {
            next: { revalidate: 3600 }
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export default async function CustomizeProductPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params;
    const subProduct = await getSubProduct(slug);

    if (!subProduct) notFound();

    return (
        <div className="min-h-screen bg-background-light text-border-black pb-20">
            {/* Header Section */}
            <div className="border-b-3 border-border-black bg-accent-blue/20">
                <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">
                        Customize Variant
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 uppercase">
                        {subProduct.name}
                    </h1>
                    {subProduct.description && (
                        <p className="text-lg text-border-black/80 font-medium max-w-2xl">
                            {subProduct.description}
                        </p>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
                <div className="grid lg:grid-cols-[1fr_400px] gap-12 lg:gap-20 items-start">

                    {/* Left Column: Image preview */}
                    <div className="lg:sticky lg:top-10">
                        <ProductImageCarousel
                            images={subProduct.images || []}
                            productName={subProduct.name}
                        />
                    </div>

                    {/* Right Column: Customization Form */}
                    <div className="bg-white border-3 border-border-black shadow-neubrutalism p-6 sm:p-8 relative">
                        {/* Decorative ribbon */}
                        <div className="absolute -top-3 -right-3 bg-accent-yellow border-2 border-border-black px-4 py-1 text-xs font-black shadow-neubrutalism-sm rotate-6">
                            STYLE IT
                        </div>
                        <h3 className="font-display text-2xl font-black uppercase mb-6 border-b-2 border-border-black pb-3">
                            Configuration
                        </h3>
                        <ProductInquiryForm product={subProduct} />
                    </div>
                </div>

                <div className="mt-24 pt-16 border-t-3 border-border-black text-center max-w-2xl mx-auto">
                    <h3 className="text-2xl font-black uppercase mb-4 text-[#ff00ff]">Customer Reviews</h3>
                    <p className="mb-8 font-medium">See what businesses say about this particular product variant and our customization quality.</p>
                    <ProductReviews productId={subProduct.id} />
                </div>
            </div>
        </div>
    );
}
