import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { FileText, ChevronRight, Package, Layers, Hash, Receipt, Shield, Ruler, Settings2, Sparkles } from "lucide-react";
import ProductInquiryForm from "../../[id]/ProductInquiryForm";
import ProductReviews from "../../[id]/ProductReviews";
import ProductImageCarousel from "@/components/products/ProductImageCarousel";
import sanitizeHtml from 'sanitize-html';

const sanitizeOptions = {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'h4', 'span']),
    allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt', 'width', 'height'], span: ['style'] }
};

async function getSubProduct(slug: string) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/sub-products/${slug}`, {
            cache: 'no-store'
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

async function getParentProduct(productId: number) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, { cache: 'no-store' });
        if (!res.ok) return null;
        const products = await res.json();
        return products.find((p: any) => p.id === productId) || null;
    } catch {
        return null;
    }
}

// Map config section keys to icons for the feature grid
const FEATURE_ICONS: Record<string, any> = {
    size: Ruler,
    paper: Layers,
    cover: Shield,
    finish: Sparkles,
    color: Sparkles,
    material: Layers,
    binding: Settings2,
    type: Package,
    default: Settings2,
};

function getFeatureIcon(key: string) {
    const lowerKey = key.toLowerCase();
    for (const [pattern, Icon] of Object.entries(FEATURE_ICONS)) {
        if (lowerKey.includes(pattern)) return Icon;
    }
    return FEATURE_ICONS.default;
}

export default async function CustomizeProductPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params;
    const subProduct = await getSubProduct(slug);
    if (!subProduct) notFound();

    const parentProduct = await getParentProduct(subProduct.product_id);
    const configSections = subProduct.config_schema?.sections || [];

    // Build quick feature bullets from config sections
    const quickFeatures = configSections.slice(0, 5).map((section: any) => {
        if (section.options && section.options.length > 0) {
            return `${section.label}: ${section.options.length} options available`;
        }
        if (section.type === 'number_input') {
            return `${section.label}: Customizable range`;
        }
        return `${section.label}: Custom input`;
    });

    return (
        <div className="min-h-screen bg-site-bg text-border-black">

            {/* ============================================ */}
            {/* BREADCRUMBS                                  */}
            {/* ============================================ */}
            <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
                <nav className="flex items-center gap-1.5 text-sm font-bold text-zinc-500">
                    <Link href="/products" className="hover:text-black transition-colors">
                        Products
                    </Link>
                    {parentProduct && (
                        <>
                            <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                            <Link href={`/products/${parentProduct.slug}`} className="hover:text-black transition-colors">
                                {parentProduct.name}
                            </Link>
                        </>
                    )}
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="text-black truncate max-w-[200px]">{subProduct.name}</span>
                </nav>
            </div>


            {/* ============================================ */}
            {/* SECTION 1: HERO — Image Left + Info Right    */}
            {/* ============================================ */}
            <section className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                <div className="grid lg:grid-cols-[1fr_420px] gap-10 lg:gap-16 items-start">

                    {/* Left: Image Gallery */}
                    <div>
                        <ProductImageCarousel
                            images={subProduct.images || []}
                            productName={subProduct.name}
                        />
                    </div>

                    {/* Right: Product Info + Config Form */}
                    <div className="lg:sticky lg:top-6 space-y-6">

                        {/* Title + Price Block */}
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-tight">
                                {subProduct.name}
                            </h1>
                            {parentProduct && (
                                <p className="text-sm font-bold text-zinc-500 mt-1 uppercase tracking-widest">
                                    {parentProduct.name}
                                </p>
                            )}
                        </div>

                        {/* Price Badge */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="bg-accent-green text-black px-5 py-2 font-black uppercase text-sm border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] rounded-md">
                                From ₹{subProduct.base_price?.toLocaleString()}
                            </span>
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                Min. Order: {subProduct.minimum_quantity} units
                            </span>
                        </div>

                        {/* Quick Feature Bullets */}
                        {quickFeatures.length > 0 && (
                            <ul className="space-y-2 border-t-2 border-b-2 border-black/10 py-4">
                                {quickFeatures.map((feature: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2.5 text-sm font-medium text-zinc-700">
                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-black shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                                {subProduct.hsn_code && (
                                    <li className="flex items-start gap-2.5 text-sm font-medium text-zinc-700">
                                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-black shrink-0" />
                                        HSN Code: {subProduct.hsn_code}
                                    </li>
                                )}
                            </ul>
                        )}

                        {/* Configuration Form Card */}
                        <div className="bg-white border-3 border-border-black shadow-neubrutalism p-6 sm:p-8 relative rounded-xl">
                            <div className="absolute -top-3 -right-3 bg-accent-yellow border-2 border-border-black px-4 py-1 text-xs font-black shadow-neubrutalism-sm rotate-6 rounded-sm">
                                CONFIGURE
                            </div>
                            <h3 className="font-display text-xl font-black uppercase mb-6 border-b-2 border-border-black pb-3 flex items-center gap-2">
                                <Settings2 className="h-5 w-5" /> Customization
                            </h3>
                            <ProductInquiryForm product={subProduct} />
                        </div>
                    </div>
                </div>
            </section>


            {/* ============================================ */}
            {/* SECTION 2: ABOUT — Split Layout              */}
            {/* ============================================ */}
            {subProduct.description && (
                <section className="border-t-2 border-black/10">
                    <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
                        <div className="grid md:grid-cols-[280px_1fr] gap-8 md:gap-16 items-start">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
                                    About
                                </h2>
                                <div className="h-1 w-16 bg-black mt-3" />
                            </div>
                            <div
                                className="prose prose-zinc prose-lg prose-a:text-pink-500 max-w-none text-zinc-600 font-medium leading-relaxed break-words overflow-hidden [&_img]:max-w-full [&_pre]:overflow-x-auto [&_pre]:max-w-full"
                                style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(subProduct.description, sanitizeOptions) }}
                            />
                        </div>
                    </div>
                </section>
            )}


            {/* ============================================ */}
            {/* SECTION 3: KEY FEATURES — Icon Grid           */}
            {/* ============================================ */}
            {configSections.length > 0 && (
                <section className="border-t-2 border-black/10 bg-white">
                    <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
                        <div className="grid md:grid-cols-[280px_1fr] gap-8 md:gap-16 items-start">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
                                    Key Features
                                </h2>
                                <div className="h-1 w-16 bg-black mt-3" />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-8">
                                {configSections.map((section: any) => {
                                    const Icon = getFeatureIcon(section.key);
                                    const optionCount = section.options?.length || 0;

                                    return (
                                        <div key={section.key} className="flex flex-col items-start">
                                            <div className="h-14 w-14 border-2 border-black rounded-xl bg-site-bg flex items-center justify-center mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                <Icon className="h-6 w-6 text-black" />
                                            </div>
                                            <h3 className="font-black text-lg uppercase tracking-tight mb-1">
                                                {section.label}
                                            </h3>
                                            <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                                                {section.type === 'dropdown' && optionCount > 0
                                                    ? `Choose from ${optionCount} options. Multi-select available.`
                                                    : section.type === 'radio' && optionCount > 0
                                                        ? `${optionCount} variants to choose from.`
                                                        : section.type === 'number_input'
                                                            ? `Custom quantity${section.min_val !== undefined ? ` (min: ${section.min_val})` : ''}${section.max_val !== undefined ? ` (max: ${section.max_val})` : ''}.${section.price_per_unit ? ` ₹${section.price_per_unit}/unit.` : ''}`
                                                            : 'Enter your custom value.'
                                                }
                                            </p>
                                            {/* Show top options as tags */}
                                            {section.options && section.options.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-3">
                                                    {section.options.slice(0, 4).map((opt: any) => (
                                                        <span key={opt.value} className="text-[11px] font-bold uppercase tracking-wide bg-zinc-100 border border-zinc-200 text-zinc-600 px-2 py-0.5 rounded">
                                                            {opt.label.replace(/#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/g, '').trim()}
                                                        </span>
                                                    ))}
                                                    {section.options.length > 4 && (
                                                        <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-400 px-1 py-0.5">
                                                            +{section.options.length - 4} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>
            )}


            {/* ============================================ */}
            {/* SECTION 4: SPECIFICATIONS TABLE               */}
            {/* ============================================ */}
            <section className="border-t-2 border-black/10">
                <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
                    <div className="grid md:grid-cols-[280px_1fr] gap-8 md:gap-16 items-start">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
                                Specifications
                            </h2>
                            <div className="h-1 w-16 bg-black mt-3" />
                        </div>

                        <div className="border-2 border-black rounded-xl overflow-hidden bg-white">
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr className="border-b border-zinc-200">
                                        <td className="px-6 py-4 font-black uppercase tracking-widest text-xs text-zinc-500 bg-zinc-50 w-[40%] flex items-center gap-2">
                                            <Package className="h-4 w-4 inline" /> Product Type
                                        </td>
                                        <td className="px-6 py-4 font-bold text-zinc-800 capitalize">
                                            {subProduct.type || 'Product'}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-zinc-200">
                                        <td className="px-6 py-4 font-black uppercase tracking-widest text-xs text-zinc-500 bg-zinc-50 flex items-center gap-2">
                                            <Receipt className="h-4 w-4 inline" /> Base Price
                                        </td>
                                        <td className="px-6 py-4 font-bold text-zinc-800">
                                            ₹{subProduct.base_price?.toLocaleString()} per unit
                                        </td>
                                    </tr>
                                    <tr className="border-b border-zinc-200">
                                        <td className="px-6 py-4 font-black uppercase tracking-widest text-xs text-zinc-500 bg-zinc-50 flex items-center gap-2">
                                            <Layers className="h-4 w-4 inline" /> Min. Order Quantity
                                        </td>
                                        <td className="px-6 py-4 font-bold text-zinc-800">
                                            {subProduct.minimum_quantity} units
                                        </td>
                                    </tr>
                                    {subProduct.hsn_code && (
                                        <tr className="border-b border-zinc-200">
                                            <td className="px-6 py-4 font-black uppercase tracking-widest text-xs text-zinc-500 bg-zinc-50 flex items-center gap-2">
                                                <Hash className="h-4 w-4 inline" /> HSN Code
                                            </td>
                                            <td className="px-6 py-4 font-bold text-zinc-800">
                                                {subProduct.hsn_code}
                                            </td>
                                        </tr>
                                    )}
                                    {(subProduct.cgst_rate > 0 || subProduct.sgst_rate > 0) && (
                                        <tr className="border-b border-zinc-200">
                                            <td className="px-6 py-4 font-black uppercase tracking-widest text-xs text-zinc-500 bg-zinc-50 flex items-center gap-2">
                                                <Receipt className="h-4 w-4 inline" /> GST
                                            </td>
                                            <td className="px-6 py-4 font-bold text-zinc-800">
                                                CGST: {subProduct.cgst_rate}% + SGST: {subProduct.sgst_rate}% = {subProduct.cgst_rate + subProduct.sgst_rate}% Total
                                            </td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td className="px-6 py-4 font-black uppercase tracking-widest text-xs text-zinc-500 bg-zinc-50 flex items-center gap-2">
                                            <Settings2 className="h-4 w-4 inline" /> Configuration Options
                                        </td>
                                        <td className="px-6 py-4 font-bold text-zinc-800">
                                            {configSections.length} customizable {configSections.length === 1 ? 'section' : 'sections'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>


            {/* ============================================ */}
            {/* SECTION 5: REVIEWS                           */}
            {/* ============================================ */}
            <section className="border-t-2 border-black/10 bg-white pb-20">
                <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
                    <Suspense fallback={<div className="text-center py-12 font-bold text-zinc-400">Loading reviews...</div>}>
                        <ProductReviews productId={subProduct.id} />
                    </Suspense>
                </div>
            </section>

        </div>
    );
}
