import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { Review, ReviewListResponse, Product, Service } from "@/types";
import {
    Star, Search, Trash2, Package, User,
    Calendar, Loader2, MessageSquare,
    ShieldAlert, BadgeCheck,
    ChevronLeft, ChevronRight, Layers, Tags
} from "lucide-react";

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
    }, [filters.skip, activeTab, filters.parent_id, filters.sub_id]);

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

    const handleParentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(f => ({ ...f, parent_id: e.target.value, sub_id: "all", skip: 0 }));
    };

    const handleSubChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(f => ({ ...f, sub_id: e.target.value, skip: 0 }));
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
        <div className="flex flex-col h-full font-['Inter'] bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] px-2 pb-12">
            
            {/* Header Area */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8">
                <div>
                    <nav className="flex items-center gap-2 text-[10px] font-bold text-blue-600 dark:text-[#adc6ff] mb-2 tracking-widest uppercase">
                        <span>Feedback</span>
                        <span>/</span>
                        <span className="text-slate-600 dark:text-[#c3c5d8]/60">Moderation</span>
                    </nav>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-[#dae2fd] m-0">
                        Reviews Audit Log
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex p-1 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/30 rounded-lg">
                        <button
                            onClick={() => setActiveTab("product")}
                            className={`px-6 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${
                                activeTab === "product" 
                                    ? "bg-[#1f70e3] text-white shadow-sm" 
                                    : "text-slate-500 dark:text-[#8d90a1] hover:text-slate-900 dark:hover:text-[#dae2fd]"
                            }`}
                        >
                            Products
                        </button>
                        <button
                            onClick={() => setActiveTab("service")}
                            className={`px-6 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${
                                activeTab === "service" 
                                    ? "bg-[#1f70e3] text-white shadow-sm" 
                                    : "text-slate-500 dark:text-[#8d90a1] hover:text-slate-900 dark:hover:text-[#dae2fd]"
                            }`}
                        >
                            Services
                        </button>
                    </div>

                    <div className="relative">
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#434655]" />
                        <input 
                            placeholder="Filter by User ID..."
                            className="pl-9 pr-3 h-10 w-48 text-xs font-mono text-blue-600 dark:text-[#adc6ff] bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/40 rounded-lg focus:border-blue-400 dark:border-[#adc6ff] outline-none transition-colors placeholder:text-[#434655]/70"
                            value={filters.user_id}
                            onChange={e => setFilters(f => ({ ...f, user_id: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && fetchReviews()}
                        />
                    </div>

                    <button onClick={fetchReviews} disabled={loading} className="h-10 px-5 rounded-lg flex items-center justify-center font-bold text-[11px] uppercase tracking-widest bg-[#adc6ff] hover:bg-white text-[#001a42] transition-colors shadow-[0_4px_12px_rgba(173,198,255,0.2)] disabled:opacity-50 min-w-[100px]">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <><Search size={14} className="mr-2" /> Apply</>}
                    </button>
                </div>
            </div>

            {/* Filtering Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-[#131b2e] p-5 rounded-2xl border border-slate-200 dark:border-[#434655]/30 mb-8">
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-[#c3c5d8]">
                        <Layers size={14} className="text-slate-500 dark:text-[#8d90a1]" /> Parent Category
                    </label>
                    <select 
                        value={filters.parent_id} 
                        onChange={handleParentChange}
                        className="w-full h-11 px-3 bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/40 rounded-lg text-sm font-bold text-slate-900 dark:text-[#dae2fd] focus:border-blue-400 dark:border-[#adc6ff] outline-none transition-colors"
                    >
                        <option value="all">Global (All {activeTab === "product" ? "Products" : "Services"})</option>
                        {(activeTab === "product" ? products : services).map(item => (
                            <option key={item.id} value={item.id.toString()}>{item.name}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-[#c3c5d8]">
                        <Tags size={14} className="text-slate-500 dark:text-[#8d90a1]" /> Specific Variant Link
                    </label>
                    <select 
                        value={filters.sub_id} 
                        onChange={handleSubChange} 
                        disabled={filters.parent_id === "all"}
                        className="w-full h-11 px-3 bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/40 rounded-lg text-sm font-bold text-slate-900 dark:text-[#dae2fd] focus:border-blue-400 dark:border-[#adc6ff] outline-none transition-colors disabled:opacity-50"
                    >
                        <option value="all">All Variants</option>
                        {subItems.map(sub => (
                            <option key={sub.id} value={sub.id.toString()}>{sub.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 flex flex-col flex-1 overflow-hidden min-h-[400px]">
                {loading && !reviewData ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20">
                        <Loader2 size={32} className="animate-spin text-blue-600 dark:text-[#adc6ff] mb-4" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 dark:text-[#c3c5d8]">Accessing Logs...</p>
                    </div>
                ) : !reviewData || reviewData.reviews.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 flex items-center justify-center mb-4 text-[#434655]">
                            <MessageSquare size={32} />
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-[#dae2fd] uppercase tracking-widest">No Log Entries</h3>
                        <p className="text-xs text-slate-500 dark:text-[#8d90a1] mt-2 max-w-sm">Adjust query parameters or target a different vector space.</p>
                        <button onClick={resetFilters} className="mt-6 px-4 py-2 border border-slate-200 dark:border-[#434655]/40 hover:border-blue-400 dark:hover:border-[#adc6ff]/50 rounded text-[10px] font-bold tracking-widest uppercase text-blue-600 dark:text-[#adc6ff] transition-colors">
                            Clear Parameters
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col flex-1">
                        <div className="px-6 py-4 bg-slate-100 dark:bg-[#0b1326]/50 border-b border-slate-200 dark:border-[#434655]/20 flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1]">
                                Rendering {reviewData.reviews.length} of {reviewData.total} items
                            </span>
                            
                            <div className="flex items-center gap-2">
                                <button
                                    className="p-1.5 text-slate-600 dark:text-[#c3c5d8] bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/40 rounded hover:text-blue-600 dark:hover:text-[#adc6ff] hover:border-blue-400 dark:hover:border-[#adc6ff]/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                    disabled={filters.skip === 0}
                                    onClick={() => setFilters(f => ({ ...f, skip: Math.max(0, f.skip - f.limit) }))}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-[10px] font-bold text-blue-600 dark:text-[#adc6ff] px-3 py-1 bg-[#1f70e3]/10 border border-[#1f70e3]/20 rounded font-mono">
                                    PAGE {Math.floor(filters.skip / filters.limit) + 1}
                                </span>
                                <button
                                    className="p-1.5 text-slate-600 dark:text-[#c3c5d8] bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/40 rounded hover:text-blue-600 dark:hover:text-[#adc6ff] hover:border-blue-400 dark:hover:border-[#adc6ff]/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                    disabled={filters.skip + filters.limit >= reviewData.total}
                                    onClick={() => setFilters(f => ({ ...f, skip: f.skip + f.limit }))}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="divide-y divide-[#434655]/10 flex-1 overflow-y-auto custom-scrollbar">
                            {reviewData.reviews.map((r) => (
                                <div key={r.id} className="p-6 flex gap-6 hover:bg-slate-50 dark:hover:bg-[#171f33]/80 transition-colors group">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-[#0b1326] flex items-center justify-center shrink-0 border border-slate-200 dark:border-[#434655]/30 overflow-hidden">
                                        {r.user?.profile_picture ? (
                                            <img src={r.user?.profile_picture} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={20} className="text-[#434655]" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-extrabold text-slate-900 dark:text-[#dae2fd] text-sm">{r.user?.name || "Ghost Node"}</h3>
                                                    {r.is_verified && (
                                                        <span className="inline-flex items-center gap-1 bg-[#34d399]/10 text-[#34d399] border border-[#34d399]/20 px-1.5 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest">
                                                            <BadgeCheck size={10} /> Validated
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                            <Star key={s} size={12} className={s <= r.rating ? "fill-[#fcd34d] text-[#fcd34d]" : "text-[#434655]"} />
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 dark:text-[#8d90a1] font-bold flex items-center gap-1.5 uppercase tracking-wider">
                                                        <Calendar size={12} className="text-[#434655]" /> {new Date(r.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>

                                            <button 
                                                className="opacity-0 group-hover:opacity-100 text-[#434655] hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 p-2 rounded-lg transition-all"
                                                onClick={() => deleteReview(r.id)}
                                                title="Purge Entry"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <p className="text-[13px] leading-relaxed text-slate-600 dark:text-[#c3c5d8] italic bg-slate-50 dark:bg-[#0b1326] p-4 rounded-xl border border-slate-200 dark:border-[#434655]/20">
                                            "{r.comment}"
                                        </p>

                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-[#0b1326] rounded-lg border border-slate-200 dark:border-[#434655]/30">
                                            <Package size={14} className="text-[#434655]" />
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-wider">
                                                {r.product?.name || r.service?.name || "Unlinked Asset"}
                                                <span className="mx-2 text-[#434655]">|</span>
                                                <span className="text-slate-500 dark:text-[#8d90a1] font-mono">ID_{r.product? r.product.id : r.service?.id}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Warning */}
            <div className="mt-6 p-4 bg-[#f59e0b]/10 rounded-xl border border-[#f59e0b]/20 flex gap-4 items-start">
                <ShieldAlert size={20} className="text-[#fcd34d] shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#fcd34d]">System Advisory</h4>
                    <p className="text-xs text-slate-600 dark:text-[#c3c5d8]/80 mt-1 leading-relaxed">
                        Log removal is destructive. Exercise discretion according to standard operating parameters (spam/bot signatures).
                    </p>
                </div>
            </div>
        </div>
    );
}
