import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package, ArrowRight } from "lucide-react";
import { Product } from "@/types/product";
import { ProductCard } from "@/components/products/ProductCard";

async function getProducts(): Promise<Product[]> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?type=product`, { cache: 'no-store' });
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
        <div className="min-h-screen bg-white relative overflow-hidden">
            {/* Background Decorative Pattern */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[24px_24px]"></div>

            <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
                {/* Energetic Page Header */}
                <div className="relative mb-10">
                    <div className="inline-block bg-[#ff90e8] border-4 border-black px-4 py-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-1 mb-6">
                        <span className="text-sm font-black uppercase tracking-[0.2em]">Our Collections</span>
                    </div>
                    <div className="space-y-4 max-w-4xl">
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none text-black">
                            Print <span className="text-[#4be794]">Perfected</span>
                        </h1>
                        <p className="text-lg md:text-xl font-bold text-zinc-600 leading-tight border-l-8 border-black pl-6 py-1">
                            Premium binding and custom packaging for your brand.
                        </p>
                    </div>
                </div>

                {/* Section Divider - Dynamic */}
                <div className="flex items-center gap-4 mb-12">
                    <div className="h-4 w-4 rounded-full bg-black"></div>
                    <div className="h-[2px] flex-1 bg-black"></div>
                    <span className="font-black uppercase tracking-widest text-xs">Scroll to Explore</span>
                </div>

                {/* Products Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}

                    {products.length === 0 && (
                        <div className="col-span-full text-center py-20 bg-zinc-50 border-4 border-dashed border-black">
                            <Package className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
                            <h3 className="text-2xl font-bold">The catalog is temporarily empty</h3>
                            <p className="text-zinc-500">Please check back later for our new premium releases.</p>
                        </div>
                    )}
                </div>

                {/* High Impact Call-to-Action */}
                <div className="mt-24 relative">
                    <div className="absolute inset-0 bg-[#90e8ff] border-4 border-black translate-x-3 translate-y-3 z-0"></div>
                    <div className="relative bg-white border-4 border-black p-10 md:p-16 z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="space-y-4 max-w-xl">
                            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
                                Need something <br />
                                <span className="underline decoration-[#fdf567] decoration-8 underline-offset-4">Full Custom?</span>
                            </h2>
                            <p className="text-lg font-bold text-zinc-600">
                                Upload your own files and tell us what you need. From custom molds to unique textures, we bring your vision to life.
                            </p>
                        </div>
                        <Button size="lg" className="bg-black text-white hover:bg-[#4be794] hover:text-black border-4 border-black shadow-[8px_8px_0px_0px_rgba(75,231,148,1)] hover:shadow-none transition-all text-xl h-20 px-12 font-black uppercase shrink-0" asChild>
                            <Link href="/services#contact">Get Started <ArrowRight className="ml-4 h-8 w-8" /></Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}