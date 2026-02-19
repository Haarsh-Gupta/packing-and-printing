import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, UploadCloud, CheckCircle2 } from "lucide-react";
import ProductInquiryForm from "./ProductInquiryForm"; // We'll create this client component next

// Define the shape of your Product based on your FastAPI schema
// Define the shape of your Product based on your FastAPI schema
interface Product {
    id: number;
    slug: string;
    name: string;
    description?: string;
    base_price: number;
    minimum_quantity: number;
    image_url: string | null;
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

// Fetch the product from your FastAPI backend
async function getProduct(id: string): Promise<Product | null> {
    try {
        // Replace with your actual backend endpoint
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`, {
            // Revalidate every hour, or use 'no-store' for real-time updates
            next: { revalidate: 3600 }
        });

        if (!res.ok) return null;
        return res.json();
    } catch (error) {
        return null;
    }
}

// The Page Component receives the URL 'id' via props automatically
export default async function ProductDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;
    const product = await getProduct(id);

    // If the backend returns 404, trigger the custom Not Found page we built earlier!
    if (!product) {
        notFound();
    }

    // Fallback image if none exists in the DB
    const imageUrl = product.image_url || "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop";

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Back Button */}
                <Button variant="ghost" className="mb-4 hover:bg-zinc-200" asChild>
                    <Link href="/products">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Catalog
                    </Link>
                </Button>

                <div className="grid lg:grid-cols-2 gap-12">

                    {/* Left Column: Product Details & Image */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h1 className="text-5xl font-black tracking-tighter uppercase">{product.name}</h1>
                            <p className="text-xl text-zinc-600 leading-relaxed">
                                {product.description || "Premium binding and printing services for your business."}
                            </p>
                            <div className="inline-block bg-zinc-100 px-4 py-2 border-2 border-black text-lg font-bold">
                                Base Price: ₹{product.base_price}
                            </div>
                        </div>

                        {/* Neo-brutalist Image Frame */}
                        <div className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden aspect-video relative">
                            <img
                                src={imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Features List */}
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

                    {/* Right Column: The Configuration Form */}
                    <div>
                        <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sticky top-24">
                            <CardHeader className="border-b-4 border-black bg-zinc-100">
                                <CardTitle className="text-3xl font-black uppercase">Configure Order</CardTitle>
                                <p className="text-sm text-zinc-600 mb-2">Enter your requirements to get an exact quote.</p>
                            </CardHeader>
                            <CardContent className="p-6">

                                {/* We pass the entire product object to the client component to handle the submission */}
                                <ProductInquiryForm product={product} />

                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </div>
    );
}