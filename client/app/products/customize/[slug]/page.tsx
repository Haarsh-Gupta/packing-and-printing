import { notFound } from "next/navigation";
import { FileText, CheckCircle2 } from "lucide-react";
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

                    {/* Left Column: Image, Details, Reviews */}
                    <div className="space-y-12">
                        <ProductImageCarousel
                            images={subProduct.images || []}
                            productName={subProduct.name}
                        />

                        {/* Product Details Section */}
                        <div className="border-2 border-black bg-white p-6 sm:p-8">
                            <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
                                <FileText className="h-5 w-5" /> Product Details
                            </h3>
                            <p className="text-zinc-600 font-medium mb-6 leading-relaxed">
                                {subProduct.description || "Our Eco-Kraft Mailer Boxes are the perfect sustainable packaging solution for e-commerce brands. Made from 90% recycled material and fully recyclable, these boxes don't just protect your products—they protect the planet."}
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3 text-sm font-medium text-zinc-700">
                                    <CheckCircle2 className="h-5 w-5 text-pink-500 shrink-0" />
                                    Sturdy E-flute corrugated cardboard (1.5mm thick)
                                </li>
                                <li className="flex items-start gap-3 text-sm font-medium text-zinc-700">
                                    <CheckCircle2 className="h-5 w-5 text-pink-500 shrink-0" />
                                    Water-based ink printing (Eco-friendly)
                                </li>
                                <li className="flex items-start gap-3 text-sm font-medium text-zinc-700">
                                    <CheckCircle2 className="h-5 w-5 text-pink-500 shrink-0" />
                                    Instant self-sealing adhesive strip available
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
                            <ProductReviews productId={subProduct.id} />
                        </div>
                    </div>

                    {/* Right Column: Customization Form */}
                    <div className="lg:sticky lg:top-10">
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
                </div>
            </div>
        </div>
    );
}
