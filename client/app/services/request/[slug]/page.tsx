import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { FileText, ChevronRight, Package, Layers, Hash, Receipt, Shield, Ruler, Settings2, Sparkles, Star, Weight, Printer, Droplets, Maximize, MapPin, Award, Zap, Leaf, Edit, Scissors, Wand2, CheckCircle, BadgeCheck, Clock, Palette, Briefcase } from "lucide-react";
import ServiceInquiryForm from "../../[slug]/ServiceInquiryForm";
import ProductImageCarousel from "@/components/products/ProductImageCarousel";
import ServiceReviews from "./ServiceReviews";
import sanitizeHtml from 'sanitize-html';

const sanitizeOptions = {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'h4', 'span']),
    allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt', 'width', 'height'], span: ['style'] }
};

const ACCENT_COLORS = [
    { bg: 'bg-accent-green/20', border: 'border-accent-green/50', text: 'text-green-800', iconBg: 'bg-accent-green' },
    { bg: 'bg-accent-yellow/20', border: 'border-accent-yellow/50', text: 'text-amber-800', iconBg: 'bg-accent-yellow' },
    { bg: 'bg-accent-purple/20', border: 'border-accent-purple/50', text: 'text-purple-800', iconBg: 'bg-accent-purple' },
    { bg: 'bg-accent-blue/20', border: 'border-accent-blue/50', text: 'text-blue-800', iconBg: 'bg-accent-blue' },
];

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

const ADMIN_FEATURE_ICONS: Record<string, any> = {
    star: Star,
    fabric: Layers,
    weight: Weight,
    print: Printer,
    wash: Droplets,
    sizes: Maximize,
    origin: MapPin,
    quality: Award,
    speed: Zap,
    eco: Leaf,
    custom: Edit,
    package: Package,
    ruler: Ruler,
    scissors: Scissors,
    wand: Wand2,
    shield: Shield,
    default: CheckCircle
};

function getFeatureIcon(key: string) {
    const lowerKey = key.toLowerCase();
    for (const [pattern, Icon] of Object.entries(FEATURE_ICONS)) {
        if (lowerKey.includes(pattern)) return Icon;
    }
    return FEATURE_ICONS.default;
}

// Data fetching
async function getSubService(slug: string) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/services/subservices/${slug}`, {
            cache: 'no-store'
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

async function getServices() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/services`, {
            cache: 'no-store'
        });
        if (!res.ok) return [];
        return res.json();
    } catch {
        return [];
    }
}

export default async function ServiceRequestPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params;
    
    // Fetch variant AND all services to find parent service
    const subService = await getSubService(slug);
    if (!subService) notFound();

    const services = await getServices();
    const parentService = services.find((s: any) => s.id === subService.service_id);

    if (!parentService) notFound();

    const configSections = subService.config_schema?.sections || [];
    
    // Quick statistics
    const configCount = configSections.length;
    let totalOptions = 0;
    configSections.forEach((s: any) => {
        if (s.options) totalOptions += s.options.length;
    });

    // Build value proposition highlights for services
    const valueProps = [
        {
            icon: BadgeCheck,
            label: 'Expert Fulfillment',
            value: 'Top Rated',
            detail: 'Executed by professionals with strict quality assurance.',
        },
        {
            icon: Receipt,
            label: 'Best Value',
            value: `From ₹${subService.price_per_unit?.toLocaleString()}`,
            detail: 'Competitive pricing tailored to your specific project needs.',
        },
        {
            icon: Clock,
            label: 'Reliable Delivery',
            value: 'On Time',
            detail: 'Strict adherence to project timelines and milestones.',
        },
        {
            icon: Zap,
            label: 'Quick Turnaround',
            value: 'Fast Speed',
            detail: 'Optimized workflows for the fastest possible completion time.',
        },
    ];

    return (
        <div className="min-h-screen bg-site-bg text-border-black pb-20">

            {/* ============================================ */}
            {/* BREADCRUMBS                                  */}
            {/* ============================================ */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2">
                <nav className="flex items-center gap-1.5 text-sm font-bold text-zinc-500">
                    <Link href="/services" className="hover:text-black transition-colors">
                        Services
                    </Link>
                    {parentService && (
                        <>
                            <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                            <Link href={`/services/${parentService.slug}`} className="hover:text-black transition-colors">
                                {parentService.name}
                            </Link>
                        </>
                    )}
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="text-black truncate max-w-[200px]">{subService.name}</span>
                </nav>
            </div>

            {/* ============================================ */}
            {/* SECTION 1: HERO — Image Left + Info Right    */}
            {/* ============================================ */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10">
                <div className="grid lg:grid-cols-[1fr_440px] gap-8 lg:gap-14 items-start">

                    {/* Left: Gallery + Below-Gallery Content */}
                    <div className="space-y-8">
                        {/* Image Carousel */}
                        <ProductImageCarousel
                            images={subService.images || []}
                            productName={subService.name}
                        />

                        {/* Below Carousel: Value Props */}
                        <div className="border-2 border-border-black rounded-2xl overflow-hidden bg-white shadow-neubrutalism-sm">
                            <div className="bg-accent-green/10 border-b-2 border-border-black px-5 py-3.5 flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-accent-green border-2 border-border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <BadgeCheck className="h-4 w-4 text-black" />
                                </div>
                                <div>
                                    <p className="font-black text-sm uppercase tracking-wide">Why Choose This Service</p>
                                    <p className="text-[11px] text-zinc-500 font-medium">Quality you can trust</p>
                                </div>
                            </div>

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

                        {/* ─── BELOW VALUE PROPS: Reviews CTA ─── */}
                        <div className="border-3 border-border-black rounded-2xl bg-white shadow-neubrutalism-sm flex flex-col md:flex-row items-center justify-between p-6 md:p-8 gap-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-yellow/20 rounded-bl-full -z-10 transition-transform group-hover:scale-110 duration-500" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent-blue/10 rounded-tr-full -z-10 transition-transform group-hover:scale-110 duration-500" />
                            
                            <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left z-10 w-full">
                                <div className="h-14 w-14 bg-accent-yellow border-2 border-border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
                                    <Star className="h-7 w-7 text-black fill-black" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-black text-xl md:text-2xl uppercase tracking-tight mb-1">Used this Service?</h3>
                                    <p className="text-sm text-zinc-600 font-medium leading-relaxed max-w-sm mx-auto md:mx-0">
                                        Help others by sharing your experience. We value your feedback!
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="#reviews"
                                className="whitespace-nowrap inline-flex items-center justify-center h-14 px-8 font-black uppercase tracking-widest border-2 border-border-black bg-white text-black hover:bg-accent-yellow/20 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all rounded-xl text-sm z-10 w-full md:w-auto"
                            >
                                Write a Review
                            </Link>
                        </div>
                    </div>

                    {/* Right Column: Info + Config Form */}
                    <div className="lg:sticky lg:top-6 space-y-5">

                        {/* Title Block */}
                        <div>
                            {parentService && (
                                <Link
                                    href={`/services/${parentService.slug}`}
                                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-2 hover:text-black transition-colors"
                                >
                                    <Briefcase className="h-3 w-3" />
                                    {parentService.name}
                                </Link>
                            )}
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                                {subService.name}
                            </h1>
                        </div>

                        {/* Price Badge */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="bg-accent-green text-black px-5 py-2.5 font-black text-base border-2 border-border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] rounded-xl inline-flex items-center gap-2">
                                Base: ₹{subService.price_per_unit?.toLocaleString()}
                            </span>
                        </div>

                        {/* Quick Info Pills */}
                        <div className="flex flex-wrap gap-2">
                            {subService.hsn_code && (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-600 bg-accent-blue/15 border border-accent-blue/30 px-3 py-1.5 rounded-lg">
                                    <Hash className="h-3 w-3" />
                                    HSN: {subService.hsn_code}
                                </span>
                            )}
                        </div>

                        {/* Short description teaser */}
                        {subService.description && (
                            <p className="text-sm text-zinc-600 font-medium leading-relaxed line-clamp-3 border-l-4 border-accent-green pl-4">
                                {subService.description.replace(/<[^>]*>/g, '').slice(0, 200)}
                                {subService.description.replace(/<[^>]*>/g, '').length > 200 ? '...' : ''}
                            </p>
                        )}

                        {/* Configuration Form Card */}
                        <div className="bg-white border-3 border-border-black shadow-neubrutalism p-6 sm:p-8 relative rounded-2xl">
                            <h3 className="font-display text-xl font-black uppercase mb-6 border-b-2 border-border-black pb-3 flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-accent-green/20 border-2 border-border-black flex items-center justify-center">
                                    <Settings2 className="h-4 w-4" />
                                </div>
                                Customize Service
                            </h3>
                            <ServiceInquiryForm service={parentService} activeVariant={subService} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================ */}
            {/* SECTION 2: ABOUT — Full Width Accent Banner  */}
            {/* ============================================ */}
            {subService.description && (
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
                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(subService.description, sanitizeOptions) }}
                            />
                        </div>
                    </div>
                </section>
            )}

            {/* ============================================ */}
            {/* SECTION 3: KEY FEATURES — Accent Icon Grid   */}
            {/* ============================================ */}
            {((subService.features && subService.features.length > 0) || configSections.length > 0) && (
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
                                {subService.features && subService.features.length > 0 ? (
                                    subService.features.map((feat: any, idx: number) => {
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
                                                                ? `Custom quantity${section.min_val !== undefined ? ` (min: ${section.min_val})` : ''}${section.max_val !== undefined ? ` (max: ${section.max_val})` : ''}.${section.price_per_unit ? ` ₹${section.price_per_unit}/unit.` : ''}`
                                                                : 'Enter your custom value.'
                                                    }
                                                </p>
                                                {/* Show top options as tags */}
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
                                    {subService.specifications && subService.specifications.length > 0 ? (
                                        subService.specifications.map((spec: any, idx: number) => (
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
                                        <td className="px-6 py-4 font-black uppercase tracking-widest text-xs text-zinc-600 bg-zinc-50 border-r border-zinc-200">
                                            <div className="flex items-center gap-2.5">
                                                <Receipt className="h-3.5 w-3.5 text-accent-green" />
                                                Base Price
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-zinc-800">
                                            <span className="text-accent-green font-black">₹{subService.price_per_unit?.toLocaleString()}</span> / unit
                                        </td>
                                    </tr>
                                    {subService.hsn_code && (
                                        <tr className="border-b border-zinc-200 hover:bg-accent-green/5 transition-colors">
                                            <td className="px-6 py-4 font-black uppercase tracking-widest text-xs text-zinc-600 bg-zinc-50 border-r border-zinc-200">
                                                <div className="flex items-center gap-2.5">
                                                    <Hash className="h-3.5 w-3.5 text-accent-blue" />
                                                    HSN/SAC Code
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-zinc-800">
                                                {subService.hsn_code}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================ */}
            {/* SECTION 5: REVIEWS                           */}
            {/* ============================================ */}
            <section id="reviews" className="border-t-2 border-border-black/10 bg-white pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
                    <Suspense fallback={<div className="text-center py-12 font-bold text-zinc-400">Loading reviews...</div>}>
                        <ServiceReviews serviceId={subService.id} slug={slug} />
                    </Suspense>
                </div>
            </section>

        </div>
    );
}
