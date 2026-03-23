import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { PaymentDeclaration } from "@/types";
import { Loader2, CheckCircle, XCircle, Search, ExternalLink, Calendar, CreditCard, Hash } from "lucide-react";

export default function Declarations() {
    const [declarations, setDeclarations] = useState<PaymentDeclaration[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchDeclarations = () => {
        setLoading(true);
        api<PaymentDeclaration[]>("/admin/orders/declarations/pending")
            .then(setDeclarations)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchDeclarations();
    }, []);

    const handleReview = async (id: string, orderId: string, isApproved: boolean) => {
        let reason = null;
        if (!isApproved) {
            reason = prompt("Reason for rejecting this payment declaration?");
            if (reason === null) return; // cancelled
            if (!reason.trim()) {
                alert("A rejection reason is required.");
                return;
            }
        }

        setProcessingId(id);
        try {
            await api(`/admin/orders/${orderId}/declarations/${id}/review`, {
                method: "PATCH",
                body: JSON.stringify({
                    is_approved: isApproved,
                    rejection_reason: reason
                })
            });
            // remove from list
            setDeclarations(declarations.filter(d => d.id !== id));
        } catch (e: any) {
            alert(e.message || "Failed to process review.");
        } finally {
            setProcessingId(null);
        }
    };

    const filtered = declarations.filter(d => 
        !search || 
        d.order_id.toLowerCase().includes(search.toLowerCase()) || 
        d.utr_number?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="animate-fade-in flex flex-col gap-0 font-sans h-full">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white m-0">
                        Payment Declarations
                    </h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 m-0">{declarations.length} pending reviews</p>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input
                            type="text" placeholder="Search Order ID or UTR..." value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="h-9 pl-8 pr-3 w-[220px] border border-slate-200 dark:border-slate-800 rounded-lg text-[13px] text-slate-900 dark:text-white bg-white dark:bg-slate-900 outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                {loading ? (
                    <div className="p-12 text-center text-slate-400 dark:text-slate-500">
                        <Loader2 size={24} className="animate-spin text-blue-500 mx-auto" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-16 text-center text-slate-400 dark:text-slate-500">
                        <CheckCircle size={32} className="text-emerald-500 mx-auto mb-3 opacity-80" />
                        <p className="text-sm font-semibold text-slate-900 dark:text-white m-0">All caught up</p>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 m-0">No pending payment declarations to review.</p>
                    </div>
                ) : (
                    <div className="overflow-y-auto flex-1 p-5">
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
                            {filtered.map(dec => (
                                <div key={dec.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 m-0">ORDER ID</p>
                                            <p className="text-[13px] font-bold text-blue-500 dark:text-blue-400 m-0">#{dec.order_id.toString().split('-')[0].toUpperCase()}</p>
                                        </div>
                                        <div className="px-2 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-full text-[10px] font-bold">PENDING</div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                                        <div>
                                            <p className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-semibold mb-0.5 m-0"><CreditCard size={10} /> MODE</p>
                                            <p className="text-xs text-slate-900 dark:text-white m-0 font-medium">{dec.payment_mode}</p>
                                        </div>
                                        <div>
                                            <p className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-semibold mb-0.5 m-0"><Hash size={10} /> UTR NUMBER</p>
                                            <p className="text-xs text-slate-900 dark:text-white m-0 font-medium">{dec.utr_number || 'N/A'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-semibold mb-0.5 m-0"><Calendar size={10} /> DECLARED ON</p>
                                            <p className="text-xs text-slate-900 dark:text-white m-0 font-medium">{new Date(dec.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {dec.screenshot_url && (
                                        <a href={dec.screenshot_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 text-xs text-blue-500 dark:text-blue-400 font-medium p-2 border border-blue-200 dark:border-blue-500/30 rounded-md bg-blue-50 dark:bg-blue-500/10 no-underline transition-colors hover:bg-blue-100 dark:hover:bg-blue-500/20">
                                            <ExternalLink size={14} /> View Screenshot proof
                                        </a>
                                    )}

                                    <div className="flex gap-2 mt-auto pt-2">
                                        <button 
                                            onClick={() => handleReview(dec.id, dec.order_id as string, true)}
                                            disabled={processingId !== null}
                                            className={`flex-1 p-2 border-none bg-emerald-500 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${processingId ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-emerald-600'}`}>
                                            {processingId === dec.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Approve
                                        </button>
                                        <button 
                                            onClick={() => handleReview(dec.id, dec.order_id as string, false)}
                                            disabled={processingId !== null}
                                            className={`flex-1 p-2 border-none bg-red-100 dark:bg-red-500/20 text-red-500 dark:text-red-400 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${processingId ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-red-200 dark:hover:bg-red-500/30'}`}>
                                            {processingId === dec.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
