import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ArrowRight } from "lucide-react";

interface Product {
    id: number;
    slug: string;
    name: string;
    base_price: number;
    description?: string;
    images?: string[]; // Added images array
}

async function getProducts(): Promise<Product[]> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/`, { cache: 'no-store' });
        if (!res.ok) {
            throw new Error('Failed to fetch products');
        }
        return res.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

export default async function ProductsPage() {
    const products = await getProducts();

    return (
        <div className="min-h-screen bg-slate-50 py-16 px-4">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Page Header */}
                <div className="space-y-4 max-w-2xl">
                    <h1 className="text-5xl font-black tracking-tighter uppercase">Our Products</h1>
                    <p className="text-xl text-zinc-600">
                        Select a product below to configure your dimensions, paper quality, and request a custom quote from our printing press.
                    </p>
                </div>

                {/* Products Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map((product) => (
                        <Card
                            key={product.id}
                            className="flex flex-col border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 bg-white"
                        >
                            <CardHeader>
                                {product.images && product.images.length > 0 ? (
                                    <div className="w-full h-48 border-2 border-black mb-4 overflow-hidden bg-zinc-100 relative">
                                        <img
                                            src={product.images[0]}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full h-48 border-2 border-black mb-4 flex items-center justify-center bg-zinc-100">
                                        <Package className="h-16 w-16 text-zinc-400" />
                                    </div>
                                )}
                                <CardTitle className="text-2xl font-bold">{product.name}</CardTitle>
                                <CardDescription className="text-base text-zinc-600 line-clamp-3">
                                    {product.description || "Premium quality printing solutions."}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex-grow">
                                <div className="inline-block bg-zinc-100 px-3 py-1 border-2 border-black text-sm font-bold mt-2">
                                    Starts at ₹{product.base_price}
                                </div>
                            </CardContent>

                            <CardFooter>
                                <Button
                                    className="w-full bg-black text-white hover:bg-zinc-800 text-lg h-12"
                                    asChild
                                >
                                    {/* Routes to a dynamic page using the SLUG */}
                                    <Link href={`/products/${product.slug}`}>
                                        Configure & Order <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}

                    {products.length === 0 && (
                        <div className="col-span-full text-center py-12 text-zinc-500">
                            No products found. Please check back later.
                        </div>
                    )}
                </div>

                {/* Custom Inquiry Call-to-Action */}
                <div className="mt-16 bg-white border-2 border-black p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black">Need something completely custom?</h2>
                        <p className="text-zinc-600">
                            Upload your own `.cdr` or `.ai` vector files and tell us exactly what you need. We handle custom molds and unique print jobs.
                        </p>
                    </div>
                    <Button size="lg" variant="outline" className="border-2 border-black shrink-0 text-lg h-14 px-8" asChild>
                        <Link href="/inquiry/custom">Request Custom Quote</Link>
                    </Button>
                </div>

            </div>
        </div>
    );
}