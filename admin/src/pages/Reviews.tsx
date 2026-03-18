import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { Review, ReviewListResponse, Product, Service } from "@/types";
import {
    Star, Search, Trash2, Package, User,
    Calendar, Loader2, MessageSquare,
    AlertCircle, ShieldAlert, BadgeCheck,
    ChevronLeft, ChevronRight, Filter, Layers, Tags
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };

export default function Reviews() {
    // Data states
    const [reviewData, setReviewData] = useState<ReviewListResponse | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    
    // UI states
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"product" | "service">("product");
    
    // Filter states
    const [filters, setFilters] = useState({
        parent_id: "all",
        sub_id: "all",
        user_id: "",
        skip: 0,
        limit: 10
    });

    // Fetch initial data (categories)
    useEffect(() => {
        Promise.all([
            api<Product[]>("/admin/products/"),
            api<Service[]>("/admin/services/")
        ]).then(([p, s]) => {
            setProducts(p);
            setServices(s);
        }).catch(console.error);
    }, []);

    // Fetch reviews whenever filters change
    useEffect(() => {
        fetchReviews();
    }, [filters.skip, activeTab]);

    const fetchReviews = () => {
        setLoading(true);
        
        const params = new URLSearchParams();
        params.append("skip", filters.skip.toString());
        params.append("limit", filters.limit.toString());
        
        if (filters.user_id.trim()) {
            params.append("user_id", filters.user_id.trim());
        }

        if (activeTab === "product") {
            if (filters.sub_id !== "all") params.append("product_id", filters.sub_id);
            else if (filters.parent_id !== "all") params.append("parent_product_id", filters.parent_id);
        } else {
            if (filters.sub_id !== "all") params.append("service_id", filters.sub_id);
            else if (filters.parent_id !== "all") params.append("parent_service_id", filters.parent_id);
        }

        api<ReviewListResponse>(`/admin/reviews/all?${params.toString()}`)
            .then(setReviewData)
            .catch(e => {
                console.error(e);
                setReviewData(null);
            })
            .finally(() => setLoading(false));
    };

    const deleteReview = async (id: number) => {
        if (!confirm("Permanently remove this review?")) return;
        try {
            await api(`/admin/reviews/${id}`, { method: "DELETE" });
            fetchReviews();
        } catch (e) { 
            console.error(e); 
            alert("Failed to delete review.");
        }
    };

    const handleParentChange = (val: string) => {
        setFilters(f => ({ ...f, parent_id: val, sub_id: "all", skip: 0 }));
    };

    const handleSubChange = (val: string) => {
        setFilters(f => ({ ...f, sub_id: val, skip: 0 }));
    };

    const resetFilters = () => {
        setFilters({
            parent_id: "all",
            sub_id: "all",
            user_id: "",
            skip: 0,
            limit: 10
        });
    };

    const currentParent = activeTab === "product" 
        ? products.find(p => p.id.toString() === filters.parent_id)
        : services.find(s => s.id.toString() === filters.parent_id);

    const subItems = activeTab === "product"
        ? (currentParent as Product)?.sub_products || []
        : (currentParent as Service)?.sub_services || [];

    return (
        <div className="animate-fade-in space-y-6" style={{ fontFamily: "'DM Sans', system-ui" }}>
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted-foreground)', ...mono, marginBottom: '4px' }}>
                        Customer Feedback
                    </p>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>
                        Reviews Moderation
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Tabs value={activeTab} onValueChange={(v: any) => { setActiveTab(v); setFilters(f => ({ ...f, parent_id: "all", sub_id: "all", skip: 0 })); }} className="w-auto">
                        <TabsList className="bg-secondary/50 rounded-xl p-1 h-11 border border-border">
                            <TabsTrigger value="product" className="rounded-lg px-4 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">Products</TabsTrigger>
                            <TabsTrigger value="service" className="rounded-lg px-4 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">Services</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="relative">
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                            placeholder="Filter by User ID..."
                            className="pl-9 h-11 w-48 text-xs font-bold rounded-xl border-border bg-card"
                            value={filters.user_id}
                            onChange={e => setFilters(f => ({ ...f, user_id: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && fetchReviews()}
                            style={mono}
                        />
                    </div>

                    <Button onClick={fetchReviews} disabled={loading} className="h-11 px-6 rounded-xl font-black text-xs uppercase tracking-widest bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-200">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} className="mr-2" />}
                        Apply
                    </Button>
                </div>
            </div>

            {/* Filtering Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-secondary/20 p-4 rounded-2xl border border-border/50">
                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1" style={mono}>
                        <Layers size={10} /> Parent Category
                    </label>
                    <Select value={filters.parent_id} onValueChange={handleParentChange}>
                        <SelectTrigger className="h-12 rounded-xl bg-card border-border font-bold text-sm">
                            <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="all">All {activeTab === "product" ? "Products" : "Services"}</SelectItem>
                            {(activeTab === "product" ? products : services).map(item => (
                                <SelectItem key={item.id} value={item.id.toString()}>{item.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1" style={mono}>
                        <Tags size={10} /> Specific Variant
                    </label>
                    <Select value={filters.sub_id} onValueChange={handleSubChange} disabled={filters.parent_id === "all"}>
                        <SelectTrigger className="h-12 rounded-xl bg-card border-border font-bold text-sm">
                            <SelectValue placeholder="Select Variant" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="all">All Variants</SelectItem>
                            {subItems.map(sub => (
                                <SelectItem key={sub.id} value={sub.id.toString()}>{sub.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
                {loading && !reviewData ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-4">
                        <Loader2 size={32} className="animate-spin text-zinc-300" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground" style={mono}>Accessing Logs...</p>
                    </div>
                ) : !reviewData || reviewData.reviews.length === 0 ? (
                    <div className="py-32 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center">
                            <MessageSquare size={32} className="text-muted-foreground/30" />
                        </div>
                        <div>
                            <h3 className="font-black text-lg">No Reviews Found</h3>
                            <p className="text-sm text-muted-foreground mt-1 max-w-xs">Adjust your filters or try a different category to see customer feedback.</p>
                        </div>
                        <Button variant="outline" onClick={resetFilters} className="mt-4 rounded-xl font-bold text-xs uppercase tracking-widest">Clear Filters</Button>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        <div className="px-6 py-4 bg-secondary/10 border-b border-border flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground" style={mono}>
                                Showing {reviewData.reviews.length} of {reviewData.total} entries
                            </span>
                            
                            <div className="flex items-center gap-1">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-lg"
                                    disabled={filters.skip === 0}
                                    onClick={() => setFilters(f => ({ ...f, skip: Math.max(0, f.skip - f.limit) }))}
                                >
                                    <ChevronLeft size={16} />
                                </Button>
                                <span className="text-xs font-bold px-3 py-1 bg-white border border-border rounded-lg" style={mono}>
                                    {Math.floor(filters.skip / filters.limit) + 1}
                                </span>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-lg"
                                    disabled={filters.skip + filters.limit >= reviewData.total}
                                    onClick={() => setFilters(f => ({ ...f, skip: f.skip + f.limit }))}
                                >
                                    <ChevronRight size={16} />
                                </Button>
                            </div>
                        </div>

                        <div className="divide-y divide-border">
                            {reviewData.reviews.map((r) => (
                                <div key={r.id} className="p-6 flex gap-6 hover:bg-slate-50 transition-colors group">
                                    <div className="w-12 h-12 rounded-full bg-secondary/80 flex items-center justify-center shrink-0 border border-border overflow-hidden">
                                        {r.user?.profile_picture ? (
                                            <img src={r.user.profile_picture} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={20} className="text-muted-foreground/40" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-black text-sm">{r.user?.name || "Anonymous User"}</h3>
                                                    {r.is_verified && (
                                                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider" style={mono}>
                                                            <BadgeCheck size={10} /> Verified
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                            <Star key={s} size={10} className={s <= r.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"} />
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1" style={mono}>
                                                        <Calendar size={10} /> {new Date(r.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>

                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 rounded-xl"
                                                onClick={() => deleteReview(r.id)}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>

                                        <p className="text-sm leading-relaxed text-slate-600 font-medium italic">
                                            "{r.comment}"
                                        </p>

                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary/30 rounded-lg border border-border/50">
                                            <Package size={12} className="text-muted-foreground" />
                                            <span className="text-[10px] font-bold uppercase tracking-tight" style={mono}>
                                                {r.product?.name || r.service?.name || "Unknown Item"}
                                                <span className="mx-2 text-muted-foreground/30">|</span>
                                                <span className="text-muted-foreground">ID: {r.product? r.product.id : r.service?.id}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="px-6 py-8 border-t border-border bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="text-xs text-muted-foreground font-medium">
                                Showing <span className="font-bold text-foreground">{filters.skip + 1}</span> to <span className="font-bold text-foreground">{Math.min(filters.skip + filters.limit, reviewData.total)}</span> of <span className="font-bold text-foreground">{reviewData.total}</span> total reviews
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    disabled={filters.skip === 0}
                                    onClick={() => setFilters(f => ({ ...f, skip: Math.max(0, f.skip - f.limit) }))}
                                    className="rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-4"
                                >
                                    <ChevronLeft size={14} className="mr-2" /> Previous
                                </Button>
                                <Button 
                                    variant="outline" 
                                    disabled={filters.skip + filters.limit >= reviewData.total}
                                    onClick={() => setFilters(f => ({ ...f, skip: f.skip + f.limit }))}
                                    className="rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-4"
                                >
                                    Next <ChevronRight size={14} className="ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Warning */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                <ShieldAlert size={20} className="text-amber-600 shrink-0" />
                <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-amber-900" style={mono}>Moderator Advisory</h4>
                    <p className="text-xs text-amber-800/80 mt-0.5 leading-relaxed font-medium">
                        Deleting a review is a permanent action. Only remove content that violates Terms of Service, contains hate speech, or is clearly identified as spam/bot activity.
                    </p>
                </div>
            </div>
        </div>
    );
}
