import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package, ArrowRight } from "lucide-react";
import { Product } from "@/types/product";
import { ProductCard } from "@/components/products/ProductCard";

async function getProducts(): Promise<Product[]> {
    try {

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?_t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) {
            throw new Error(`Failed to fetch products: ${res.status}`);
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
            {/* <div className="absolute inset-0 z-0 opacity-40 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[24px_24px]"></div> */}

            <div className="max-w-7xl mx-auto px-6 pt-24 pb-12 relative z-10">
                {/* Refined Minimal Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="max-w-xl">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-px bg-black"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40">Premium Catalog</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-black leading-none uppercase">
                            The Goods.
                        </h1>
                    </div>
                </div>
            </div>

            {/* Dark Grid Section */}
            <div className="bg-[#1a1a1a] border-t-2 border-black py-20 px-6 relative">
                <div className="max-w-7xl mx-auto relative z-10">
                    {/* Filter Bar matching image */}
                    <div className="flex justify-start md:justify-end mb-12 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
                        <div className="flex items-center gap-6 text-sm font-bold tracking-tight bg-black px-8 py-3 rounded-full border border-zinc-800 shadow-xl">
                            <button className="text-white hover:text-[#ff90e8] transition-colors whitespace-nowrap bg-zinc-800 px-4 py-1.5 rounded-full border border-zinc-700">Curated</button>
                            <button className="text-zinc-500 hover:text-white transition-colors whitespace-nowrap">Trending</button>
                            <button className="text-zinc-500 hover:text-white transition-colors whitespace-nowrap">Hot & New</button>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}

                        {products.length === 0 && (
                            <div className="col-span-full text-center py-24 bg-[#111111] border-2 border-dashed border-zinc-800 rounded-sm">
                                <Package className="w-20 h-20 mx-auto text-zinc-800 mb-6" />
                                <h3 className="text-2xl font-black text-white uppercase italic">Silence in the Studio</h3>
                                <p className="text-zinc-500 font-bold max-w-sm mx-auto mt-2 italic">New premium releases are currently being printed.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* High Impact Call-to-Action */}
            <div className="mt-24 relative">
                <div className="absolute inset-0 bg-[#90e8ff] border-2 border-black translate-x-3 translate-y-3 z-0 rounded-xl"></div>
                <div className="relative bg-white border-2 border-black p-10 md:p-16 z-10 flex flex-col md:flex-row items-center justify-between gap-10 rounded-xl">
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
    );
}