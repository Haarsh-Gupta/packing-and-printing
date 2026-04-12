import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import {
    FileText, ChevronRight, Package, Layers, Hash, Receipt, Shield, Ruler,
    Settings2, Sparkles, Star, Weight, Printer, Droplets, Maximize, MapPin,
    Award, Zap, Leaf, Edit, Scissors, Wand2, CheckCircle, BadgeCheck,
    Truck, Clock, Palette, Box, Info, ArrowRight
} from "lucide-react";
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

const FEATURE_ICONS: Record<string, any> = {
    size: Ruler, paper: Layers, cover: Shield, finish: Sparkles,
    color: Palette, material: Layers, binding: Settings2,
    type: Package, page: FileText, spiral: Sparkles,
    outer: Shield, inner: Layers, lamination: Sparkles,
    print: Printer, quantity: Hash, text: Edit,
    emboss: Award, foil: Zap, gsm: Weight,
    default: Settings2,
};

const ADMIN_FEATURE_ICONS: Record<string, any> = {
    star: Star, fabric: Layers, weight: Weight, print: Printer,
    wash: Droplets, sizes: Maximize, origin: MapPin, quality: Award,
    speed: Zap, eco: Leaf, custom: Edit, package: Package,
    ruler: Ruler, scissors: Scissors, wand: Wand2, shield: Shield,
    default: CheckCircle
};

function getFeatureIcon(key: string) {
    const lowerKey = key.toLowerCase();
    for (const [pattern, Icon] of Object.entries(FEATURE_ICONS)) {
        if (lowerKey.includes(pattern)) return Icon;
    }
    return FEATURE_ICONS.default;
}

// Accent color cycling for visual variety
const ACCENT_COLORS = [
    { bg: 'bg-accent-green/15', border: 'border-accent-green/40', text: 'text-emerald-700', iconBg: 'bg-accent-green' },
    { bg: 'bg-accent-yellow/15', border: 'border-accent-yellow/40', text: 'text-amber-700', iconBg: 'bg-accent-yellow' },
    { bg: 'bg-accent-purple/15', border: 'border-accent-purple/40', text: 'text-purple-700', iconBg: 'bg-accent-purple' },
    { bg: 'bg-accent-blue/15', border: 'border-accent-blue/40', text: 'text-sky-700', iconBg: 'bg-accent-blue' },
];

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

    // Count options for summary display
    const totalOptions = configSections.reduce((sum: number, s: any) => sum + (s.options?.length || 0), 0);
    const configCount = configSections.length;

    // Extract color options count if any
    const colorSection = configSections.find((s: any) => s.label.toLowerCase().includes('color'));
    const colorCount = colorSection?.options?.length || 0;

    // Extract size/variant options
    const sizeSection = configSections.find((s: any) =>
        s.label.toLowerCase().includes('size') || s.label.toLowerCase().includes('variant')
    );

    // Build value proposition highlights
    const valueProps = [
        {
            icon: BadgeCheck,
            label: 'Premium Quality',
            value: 'Top Rated',
            detail: 'Manufactured with premium materials and quality assurance.',
        },
        {
            icon: Receipt,
            label: 'Best Price',
            value: `From ₹${subProduct.base_price?.toLocaleString()}`,
            detail: 'Competitive pricing with bulk order discounts available.',
        },
        {
            icon: Truck,
            label: 'Reliable Delivery',
            value: 'Pan India',
            detail: 'Shipped across India with tracking and safe packaging.',
        },
        {
            icon: Clock,
            label: 'Quick Turnaround',
            value: 'Fast Production',
            detail: 'Orders optimized for fastest possible production time.',
        },
    ];

    return (
        <div className="min-h-screen bg-site-bg text-border-black">

            {/* ============================================ */}
            {/* BREADCRUMBS                                  */}
            {/* ============================================ */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2">
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
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10">
                <div className="grid lg:grid-cols-[1fr_500px] gap-8 lg:gap-14 items-start">

                    {/* ─── Left Column: Gallery + Below-Gallery Content ─── */}
                    <div className="space-y-8">
                        {/* Image Gallery */}
                        <ProductImageCarousel
                            images={subProduct.images || []}
                            productName={subProduct.name}
                        />

                        {/* ─── BELOW CAROUSEL: Value Props (Printify style) ─── */}
                        <div className="border-2 border-border-black rounded-2xl overflow-hidden bg-white shadow-neubrutalism-sm">
                            {/* Header */}
                            <div className="bg-accent-green/10 border-b-2 border-border-black px-5 py-3.5 flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-accent-green border-2 border-border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <BadgeCheck className="h-4 w-4 text-black" />
                                </div>
                                <div>
                                    <p className="font-black text-sm uppercase tracking-wide">Why Choose This Product</p>
                                    <p className="text-[11px] text-zinc-500 font-medium">Quality you can trust</p>
                                </div>
                            </div>

                            {/* Grid of value cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4">
                                {valueProps.map((prop, idx) => {
                                    const Icon = prop.icon;
                                    const isLast = idx === valueProps.length - 1;
                                    return (
                                        <div
                                            key={idx}
                                            className={`p-5 flex flex-col gap-2 ${!isLast ? 'border-r-2 border-border-black/10' : ''} ${idx < 2 ? 'border-b-2 border-border-black/10 md:border-b-0' : ''} hover:bg-zinc-50 transition-colors`}
                                        >
                                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${ACCENT_COLORS[idx].iconBg} border border-black/20`}>
                                                <Icon className="h-4.5 w-4.5 text-black stroke-[2.5]" />
                                            </div>
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">{prop.label}</p>
                                            <p className="font-black text-lg leading-tight tracking-tight">{prop.value}</p>
                                            <p className="text-xs text-zinc-500 font-medium leading-relaxed">{prop.detail}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ─── BELOW VALUE PROPS: Quick Product Summary ─── */}
                        <div className="border-2 border-border-black rounded-2xl overflow-hidden bg-white shadow-neubrutalism-sm">
                            <div className="px-5 py-4 border-b-2 border-border-black/10 flex items-center gap-2">
                                <Palette className="h-4 w-4 text-zinc-500" />
                                <p className="font-black text-sm uppercase tracking-wide">Product Options Overview</p>
                            </div>

                            <div className="grid grid-cols-3 divide-x divide-border-black/10">
                                {/* Configurations */}
                                <div className="p-5">
                                    <p className="tpaext-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Configurations</p>
                                    <p className="font-black text-2xl">{configCount}</p>
                                    <p className="text-xs text-zinc-500 font-medium mt-1">customizable options</p>
                                </div>

                                {/* Colors or Total Options */}
                                {colorCount > 0 ? (
                                    <div className="p-5">
                                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Colors • {colorCount}</p>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {colorSection.options.slice(0, 12).map((opt: any, i: number) => {
                                                const hexMatch = opt.label.match(/#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/);
                                                const color = hexMatch ? hexMatch[0] : '#E4E4E7';
                                                return (
                                                    <div
                                                        key={i}
                                                        className="h-6 w-6 rounded-full border-2 border-black/20 hover:scale-110 transition-transform cursor-default"
                                                        style={{ backgroundColor: color }}
                                                        title={opt.label.replace(/#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/g, '').trim()}
                                                    />
                                                );
                                            })}
                                            {colorCount > 12 && (
                                                <div className="h-6 w-6 rounded-full border-2 border-black/20 bg-zinc-100 flex items-center justify-center">
                                                    <span className="text-[8px] font-black text-zinc-500">+{colorCount - 12}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-5">
                                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">Total Options</p>
                                        <p className="font-black text-2xl">{totalOptions}</p>
                                        <p className="text-xs text-zinc-500 font-medium mt-1">choices available</p>
                                    </div>
                                )}

                                {/* Min Order / Total Options */}
                                <div className="p-5">
                                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">{colorCount > 0 ? 'Total Options' : 'Min. Order'}</p>
                                    <p className="font-black text-2xl">{colorCount > 0 ? totalOptions : subProduct.minimum_quantity}</p>
                                    <p className="text-xs text-zinc-500 font-medium mt-1">{colorCount > 0 ? 'choices available' : 'units minimum'}</p>
                                </div>
                            </div>

                            {/* Feature tags like Printify */}
                            {configSections.length > 0 && (
                                <div className="px-5 py-4 border-t-2 border-border-black/10 flex flex-wrap gap-2">
                                    {configSections.map((section: any) => (
                                        <span
                                            key={section.key}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-zinc-700 bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-lg hover:bg-accent-purple/10 hover:border-accent-purple/30 transition-colors"
                                        >
                                            {section.label}
                                            {section.options && (
                                                <span className="text-[10px] text-zinc-400 font-black">• {section.options.length}</span>
                                            )}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ─── Right Column: Product Info + Config Form ─── */}
                    <div className="lg:sticky lg:top-6 space-y-5">

                        {/* Title Block */}
                        <div>
                            {parentProduct && (
                                <Link
                                    href={`/products/${parentProduct.slug}`}
                                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-2 hover:text-black transition-colors"
                                >
                                    <Package className="h-3 w-3" />
                                    {parentProduct.name}
                                </Link>
                            )}
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                                {subProduct.name}
                            </h1>
                        </div>

                        {/* Price + Min Order */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="bg-accent-green text-black px-5 py-2.5 font-black text-base border-2 border-border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] rounded-xl inline-flex items-center gap-2">
                                From ₹{subProduct.base_price?.toLocaleString()}
                            </span>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">
                                    Min. Order
                                </span>
                                <span className="text-sm font-black text-black">
                                    {subProduct.minimum_quantity} units
                                </span>
                            </div>
                        </div>

                        {/* Quick Info Pills */}
                        <div className="flex flex-wrap gap-2">
                            {subProduct.hsn_code && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-600 bg-accent-blue/15 border border-accent-blue/30 px-3 py-1.5 rounded-lg">
                                    <Hash className="h-3 w-3" />
                                    HSN: {subProduct.hsn_code}
                                </span>
                            )}
                            {(subProduct.cgst_rate > 0 || subProduct.sgst_rate > 0) && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-600 bg-accent-yellow/15 border border-accent-yellow/30 px-3 py-1.5 rounded-lg">
                                    <Receipt className="h-3 w-3" />
                                    GST: {subProduct.cgst_rate + subProduct.sgst_rate}%
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-600 bg-accent-purple/15 border border-accent-purple/30 px-3 py-1.5 rounded-lg">
                                <Settings2 className="h-3 w-3" />
                                {configCount} Configurations
                            </span>
                        </div>

                        {/* Short description teaser */}
                        {subProduct.description && (
                            <p className="text-sm text-zinc-600 font-medium leading-relaxed line-clamp-3 border-l-4 border-accent-green pl-4">
                                {subProduct.description.replace(/<[^>]*>/g, '').slice(0, 200)}
                                {subProduct.description.replace(/<[^>]*>/g, '').length > 200 ? '...' : ''}
                            </p>
                        )}

                        {/* Configuration Form Card */}
                        <div className="bg-white border-3 border-border-black shadow-neubrutalism p-6 sm:p-8 relative rounded-2xl">
                            <div className="absolute -top-3.5 -right-3 bg-accent-yellow border-2 border-border-black px-4 py-1.5 text-xs font-black shadow-neubrutalism-sm rotate-3 rounded-lg uppercase tracking-wide">
                                ⚡ Configure
                            </div>
                            <h3 className="font-display text-xl font-black uppercase mb-6 border-b-2 border-border-black pb-3 flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-accent-green/20 border-2 border-border-black flex items-center justify-center">
                                    <Settings2 className="h-4 w-4" />
                                </div>
                                Customize Your Order
                            </h3>
                            <ProductInquiryForm product={subProduct} />
                        </div>
                    </div>
                </div>
            </section>


            {/* ============================================ */}
            {/* SECTION 2: ABOUT — Full Width Accent Banner  */}
            {/* ============================================ */}
            {subProduct.description && (
                <section className="border-t-2 border-border-black/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
                        <div className="grid md:grid-cols-[280px_1fr] gap-8 md:gap-16 items-start">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
                                    About
                                </h2>
                                <div className="h-1.5 w-16 bg-accent-green mt-3 rounded-full" />
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
            {/* SECTION 3: KEY FEATURES — Accent Icon Grid   */}
            {/* ============================================ */}
            {((subProduct.features && subProduct.features.length > 0) || configSections.length > 0) && (
                <section className="border-t-2 border-border-black/10 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
                        <div className="grid md:grid-cols-[280px_1fr] gap-8 md:gap-16 items-start">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
                                    Key Features
                                </h2>
                                <div className="h-1.5 w-16 bg-accent-yellow mt-3 rounded-full" />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                {subProduct.features && subProduct.features.length > 0 ? (
                                    subProduct.features.map((feat: any, idx: number) => {
                                        const Icon = ADMIN_FEATURE_ICONS[feat.icon] || ADMIN_FEATURE_ICONS.default;
                                        const accent = ACCENT_COLORS[idx % ACCENT_COLORS.length];
                                        return (
                                            <div key={idx} className={`flex flex-col items-start ${accent.bg} border-2 border-border-black p-6 rounded-2xl shadow-neubrutalism-sm hover:-translate-y-1 hover:shadow-neubrutalism transition-all`}>
                                                <div className={`h-12 w-12 border-2 border-black rounded-xl ${accent.iconBg} flex items-center justify-center mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                                                    <Icon className="h-6 w-6 text-black stroke-[2.5]" />
                                                </div>
                                                <h3 className="font-black text-lg uppercase tracking-tight mb-2">
                                                    {feat.label}
                                                </h3>
                                                <p className="text-sm text-zinc-600 font-medium leading-relaxed">
                                                    {feat.detail}
                                                </p>
                                            </div>
                                        );
                                    })
                                ) : (
                                    configSections.map((section: any, idx: number) => {
                                        const Icon = getFeatureIcon(section.key);
                                        const optionCount = section.options?.length || 0;
                                        const accent = ACCENT_COLORS[idx % ACCENT_COLORS.length];

                                        return (
                                            <div key={section.key} className={`flex flex-col items-start border-2 border-border-black p-6 rounded-2xl hover:-translate-y-1 hover:shadow-neubrutalism transition-all bg-white shadow-neubrutalism-sm`}>
                                                <div className={`h-12 w-12 border-2 border-black rounded-xl ${accent.iconBg} flex items-center justify-center mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                                                    <Icon className="h-5 w-5 text-black" />
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
                                                                ? `Custom quantity${section.min_val !== undefined ? ` (min: ${section.min_val})` : ''}${section.max_val !== undefined ? ` (max: ${section.max_val})` : ''}.${section.default_val !== undefined ? ` Base: ${section.default_val}.` : ''}${section.price_per_unit ? ` ₹${section.price_per_unit}/unit delta.` : ''}`
                                                                : 'Enter your custom value.'
                                                    }
                                                </p>
                                                {/* Show top options as tags (only for dropdown/radio with meaningful labels) */}
                                                {section.options && section.options.length > 0 && (section.type === 'dropdown' || section.type === 'radio') && (
                                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                                        {section.options.slice(0, 4).map((opt: any) => {
                                                            const cleanLabel = opt.label.replace(/#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/g, '').trim();
                                                            if (!cleanLabel || cleanLabel.toLowerCase() === 'choice a') return null;
                                                            return (
                                                                <span key={opt.value} className={`text-[11px] font-bold uppercase tracking-wide ${accent.bg} ${accent.text} border ${accent.border} px-2.5 py-0.5 rounded-md`}>
                                                                    {cleanLabel}
                                                                </span>
                                                            );
                                                        })}
                                                        {section.options.length > 4 && (
                                                            <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-400 px-1 py-0.5">
                                                                +{section.options.length - 4} more
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}


            {/* ============================================ */}
            {/* SECTION 4: SPECIFICATIONS TABLE               */}
            {/* ============================================ */}
            <section className="border-t-2 border-border-black/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
                    <div className="grid md:grid-cols-[280px_1fr] gap-8 md:gap-16 items-start">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
                                Specifications
                            </h2>
                            <div className="h-1.5 w-16 bg-accent-blue mt-3 rounded-full" />
                        </div>

                        <div className="border-2 border-border-black rounded-2xl overflow-hidden bg-white shadow-neubrutalism-sm">
                            <table className="w-full text-sm">
                                <tbody>
                                    {subProduct.specifications && subProduct.specifications.length > 0 ? (
                                        subProduct.specifications.map((spec: any, idx: number) => (
                                            <tr key={idx} className="border-b border-zinc-200 hover:bg-accent-green/5 transition-colors">
                                                <td className="px-6 py-4 font-black uppercase tracking-widest text-xs text-zinc-600 bg-zinc-50 w-[40%] border-r border-zinc-200">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="h-2 w-2 rounded-full bg-accent-green" />
                                                        {spec.label}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-zinc-800">
                                                    {spec.value}
                                                </td>
                                            </tr>
                                        ))
                                    ) : null}

                                    {/* System Specifications */}
                                    <tr className="border-b border-zinc-200 hover:bg-accent-green/5 transition-colors">
                                        <td className="px-6 py-4 font-black uppercase tracking-widest text-xs text-zinc-600 bg-zinc-50 w-[40%] border-r border-zinc-200">
                                            <div className="flex items-center gap-2.5">
                                                <Package className="h-3.5 w-3.5 text-accent-purple" />
                                                Product Type
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-zinc-800 capitalize">
                                            {subProduct.type || 'Standard Assembly'}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-zinc-200 hover:bg-accent-green/5 transition-colors">
                                        <td className="px-6 py-4 font-black uppercase tracking-widest text-xs text-zinc-600 bg-zinc-50 border-r border-zinc-200">
                                            <div className="flex items-center gap-2.5">
                                                <Receipt className="h-3.5 w-3.5 text-accent-green" />
                                                Base Price
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-zinc-800">
                                            <span className="text-accent-green font-black">₹{subProduct.base_price?.toLocaleString()}</span> per unit
                                        </td>
                                    </tr>
                                    <tr className="border-b border-zinc-200 hover:bg-accent-green/5 transition-colors">
                                        <td className="px-6 py-4 font-black uppercase tracking-widest text-xs text-zinc-600 bg-zinc-50 border-r border-zinc-200">
                                            <div className="flex items-center gap-2.5">
                                                <Layers className="h-3.5 w-3.5 text-accent-yellow" />
                                                Min. Order Quantity
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-zinc-800">
                                            {subProduct.minimum_quantity} units
                                        </td>
                                    </tr>
                                    {subProduct.hsn_code && (
                                        <tr className="border-b border-zinc-200 hover:bg-accent-green/5 transition-colors">
                                            <td className="px-6 py-4 font-black uppercase tracking-widest text-xs text-zinc-600 bg-zinc-50 border-r border-zinc-200">
                                                <div className="flex items-center gap-2.5">
                                                    <Hash className="h-3.5 w-3.5 text-accent-blue" />
                                                    HSN Code
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-zinc-800">
                                                {subProduct.hsn_code}
                                            </td>
                                        </tr>
                                    )}
                                    {(subProduct.cgst_rate > 0 || subProduct.sgst_rate > 0) && (
                                        <tr className="border-b border-zinc-200 hover:bg-accent-green/5 transition-colors">
                                            <td className="px-6 py-4 font-black uppercase tracking-widest text-xs text-zinc-600 bg-zinc-50 border-r border-zinc-200">
                                                <div className="flex items-center gap-2.5">
                                                    <Receipt className="h-3.5 w-3.5 text-accent-yellow" />
                                                    GST
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-zinc-800">
                                                <span className="bg-accent-yellow/15 text-amber-700 border border-accent-yellow/30 px-2.5 py-1 rounded-lg text-xs font-black">
                                                    CGST: {subProduct.cgst_rate}% + SGST: {subProduct.sgst_rate}% = {subProduct.cgst_rate + subProduct.sgst_rate}% Total
                                                </span>
                                            </td>
                                        </tr>
                                    )}
                                    <tr className="hover:bg-accent-green/5 transition-colors">
                                        <td className="px-6 py-4 font-black uppercase tracking-widest text-xs text-zinc-600 bg-zinc-50 border-r border-zinc-200">
                                            <div className="flex items-center gap-2.5">
                                                <Settings2 className="h-3.5 w-3.5 text-accent-purple" />
                                                Configurations
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-zinc-800">
                                            <span className="bg-accent-purple/15 text-purple-700 border border-accent-purple/30 px-2.5 py-1 rounded-lg text-xs font-black">
                                                {configSections.length} available
                                            </span>
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
            <section className="border-t-2 border-border-black/10 bg-white pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
                    <Suspense fallback={<div className="text-center py-12 font-bold text-zinc-400">Loading reviews...</div>}>
                        <ProductReviews productId={subProduct.id} />
                    </Suspense>
                </div>
            </section>

        </div>
    );
}
