import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import ProductInquiryForm from "./ProductInquiryForm";
import ProductReviews from "./ProductReviews";

interface Product {
    id: number;
    slug: string;
    name: string;
    description?: string;
    base_price: number;
    minimum_quantity: number;
    images: string[];
    features?: string[];
    config_schema: {
        sections: Array<{
            key: string;
            label: string;
            type: "dropdown" | "radio" | "number_input" | "text_input";
            options?: Array<{ label: string; value: string; price_mod: number; }>;
            min_val?: number;
            max_val?: number;
            price_per_unit?: number;
        }>;
    };
}

async function getProduct(id: string): Promise<Product | null> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`, {
            next: { revalidate: 3600 }
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export default async function ProductDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;
    const product = await getProduct(id);

    if (!product) notFound();

    const imageUrl = (product.images && product.images.length > 0)
        ? product.images[0]
        : "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop";

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-7xl mx-auto space-y-8">

                <Button variant="ghost" className="mb-4 hover:bg-zinc-200" asChild>
                    <Link href="/products">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Catalog
                    </Link>
                </Button>

                <div className="grid lg:grid-cols-2 gap-12">

                    {/* Left Column */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h1 className="text-5xl font-black tracking-tighter uppercase">{product.name}</h1>
                            <p className="text-xl text-zinc-600 leading-relaxed">
                                {product.description || "Premium binding and printing services for your business."}
                            </p>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs uppercase font-black text-zinc-500 tracking-widest">Base Pricing</span>
                                <div className="inline-flex items-center bg-[#fdf567] px-6 py-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-1 self-start">
                                    <span className="text-3xl font-black">₹{product.base_price}</span>
                                </div>
                            </div>
                        </div>

                        <div className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden aspect-video relative">
                            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        </div>

                        {product.features && product.features.length > 0 && (
                            <div className="space-y-4 pt-4">
                                <h3 className="text-2xl font-bold border-b-2 border-black pb-2">Product Specifications</h3>
                                <ul className="space-y-3">
                                    {product.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-lg">
                                            <CheckCircle2 className="h-6 w-6 shrink-0 mt-0.5" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Form */}
                    <div>
                        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sticky top-24">
                            <CardHeader className="border-b-4 border-black bg-zinc-100">
                                <CardTitle className="text-3xl font-black uppercase">Configure Order</CardTitle>
                                <p className="text-sm text-zinc-600 mb-2">Enter your requirements to get an exact quote.</p>
                            </CardHeader>
                            <CardContent className="p-6">
                                <ProductInquiryForm product={product} />
                            </CardContent>
                        </Card>
                    </div>

                </div>

                {/* Reviews */}
                <ProductReviews productId={product.id} />

            </div>
        </div>
    );
}