import Link from "next/link";
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
        <main className="grow bg-background-light text-border-black pb-20">
            {/* Header Section */}
            <div className="border-b-3 border-border-black bg-accent-blue/20">
                <div className="mx-auto max-w-7xl px-4 py-12 lg:px-10 lg:py-16">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <div className="inline-block px-3 py-1 mb-4 text-xs font-black uppercase tracking-wider bg-accent-yellow border-2 border-border-black shadow-neubrutalism-sm">
                                Catalog 2024
                            </div>
                            <h2 className="font-display text-5xl font-black uppercase leading-none tracking-tighter text-border-black lg:text-7xl">
                                Product<br />Categories
                            </h2>
                            <p className="mt-6 text-xl font-medium text-border-black/80 max-w-xl">
                                Browse our curated catalog of custom printing and packaging solutions designed to elevate your brand identity.
                            </p>
                        </div>
                        <div className="w-full lg:hidden">
                            <div className="relative flex items-center">
                                <input className="h-12 w-full rounded-none border-3 border-border-black bg-white px-4 font-medium placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-0 shadow-neubrutalism-sm" placeholder="Search for products..." type="text" />
                                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-border-black">
                                    <span className="material-symbols-outlined font-black">search</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="sticky top-[76px] z-40 border-b-3 border-border-black bg-white">
                <div className="mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto px-4 py-3 lg:px-10 no-scrollbar">
                    <button className="flex items-center gap-2 whitespace-nowrap bg-border-black px-4 py-2 font-bold text-white shadow-neubrutalism-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all border-2 border-border-black">
                        <span className="material-symbols-outlined text-[20px]">grid_view</span>
                        All Categories
                    </button>
                    <button className="whitespace-nowrap bg-white border-2 border-border-black px-4 py-2 font-bold text-border-black shadow-neubrutalism-sm hover:bg-accent-yellow hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                        Office
                    </button>
                    <button className="whitespace-nowrap bg-white border-2 border-border-black px-4 py-2 font-bold text-border-black shadow-neubrutalism-sm hover:bg-accent-green hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                        Packaging
                    </button>
                    <button className="whitespace-nowrap bg-white border-2 border-border-black px-4 py-2 font-bold text-border-black shadow-neubrutalism-sm hover:bg-accent-purple hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                        Apparel
                    </button>
                    <button className="whitespace-nowrap bg-white border-2 border-border-black px-4 py-2 font-bold text-border-black shadow-neubrutalism-sm hover:bg-accent-blue hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                        Marketing
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="mx-auto max-w-7xl px-4 py-12 lg:px-10">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {products.map((product, index) => (
                        <ProductCard key={product.id} product={product} index={index} />
                    ))}
                    {products.length === 0 && (
                        <div className="p-10 border-4 border-black bg-zinc-50 shadow-neubrutalism col-span-full text-center">
                            <p className="font-bold text-lg">No designated categories found currently.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom CTA */}
            <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 lg:px-10">
                <div className="relative overflow-hidden border-3 border-border-black bg-accent-yellow p-8 shadow-neubrutalism-lg lg:p-12">
                    <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border-3 border-border-black bg-white opacity-50"></div>
                    <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full border-3 border-border-black bg-primary opacity-20"></div>
                    <div className="relative z-10 flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-2xl">
                            <h2 className="font-display text-3xl font-black uppercase leading-tight tracking-tight text-border-black lg:text-5xl">
                                Can't find what you need?
                            </h2>
                            <p className="mt-4 text-lg font-medium text-border-black">
                                We offer custom sourcing for large enterprise orders. Our team will find exactly what you're looking for.
                            </p>
                        </div>
                        <div className="flex shrink-0 flex-col gap-4 sm:flex-row">
                            <Link href="/services#contact" className="flex items-center justify-center whitespace-nowrap bg-border-black px-8 py-4 font-bold text-white shadow-neubrutalism hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all border-2 border-border-black text-lg">
                                CONTACT SALES
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}