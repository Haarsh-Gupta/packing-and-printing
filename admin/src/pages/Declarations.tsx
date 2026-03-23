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
        <div className="flex flex-col h-full font-['Inter'] bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] px-2 pb-12 animate-fade-in">
            {/* Top bar */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                    <nav className="flex items-center gap-2 text-[10px] font-bold text-blue-600 dark:text-[#adc6ff] mb-2 tracking-widest uppercase">
                        <span>Economic Control</span>
                        <span>/</span>
                        <span className="text-slate-600 dark:text-[#c3c5d8]/60">Settlement Claims</span>
                    </nav>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-[#dae2fd] m-0">
                        Payment Declarations
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-[#c3c5d8] mt-1 m-0">Awaiting clearance for {declarations.length} incoming nodes</p>
                </div>
                <div className="relative shrink-0">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#434655]" />
                    <input
                        type="text" placeholder="Query Order Hash or UTR..." value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="h-10 pl-9 pr-3 w-full sm:w-72 border border-slate-200 dark:border-[#434655]/40 rounded-lg text-xs font-mono text-blue-600 dark:text-[#adc6ff] bg-white dark:bg-[#131b2e] outline-none focus:border-blue-400 dark:border-[#adc6ff] transition-colors placeholder:text-[#434655]/60"
                    />
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-[#434655]/20 bg-slate-100 dark:bg-[#0b1326]/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CreditCard size={16} className="text-[#fcd34d]" />
                        <h2 className="text-[11px] uppercase tracking-widest font-extrabold text-slate-900 dark:text-[#dae2fd] m-0">Verification Queue</h2>
                    </div>
                </div>

                {loading ? (
                    <div className="flex-1 p-16 flex flex-col items-center justify-center text-slate-600 dark:text-[#c3c5d8] gap-3">
                        <Loader2 size={24} className="animate-spin text-blue-600 dark:text-[#adc6ff]" />
                        <p className="text-[10px] font-bold uppercase tracking-widest m-0">Scanning Block Data...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex-1 p-16 flex flex-col items-center justify-center text-[#434655]">
                        <CheckCircle size={40} className="mb-4 text-[#34d399]/50" strokeWidth={1.5} />
                        <p className="text-sm font-extrabold text-slate-900 dark:text-[#dae2fd] m-0 tracking-tight">Zero Delta</p>
                        <p className="text-xs text-slate-600 dark:text-[#c3c5d8] mt-1.5 m-0 max-w-[240px] text-center leading-relaxed">Network status is nominal. No pending value structures await verification.</p>
                    </div>
                ) : (
                    <div className="overflow-y-auto custom-scrollbar flex-1 p-6">
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
                            {filtered.map(dec => (
                                <div key={dec.id} className="group bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 hover:border-blue-400 dark:hover:border-[#adc6ff]/50 hover:bg-slate-50 dark:hover:bg-[#171f33]/60 transition-all rounded-xl p-5 flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-500 dark:text-[#8d90a1] uppercase tracking-[0.2em] mb-1 m-0">Ledger Index</p>
                                            <p className="text-sm font-extrabold text-slate-900 dark:text-[#dae2fd] font-mono m-0">#{dec.order_id.toString().split('-')[0].toUpperCase()}</p>
                                        </div>
                                        <div className="px-2 py-1 bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#fcd34d] rounded-sm text-[9px] font-bold uppercase tracking-widest animate-pulse">
                                            AWAITING
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-px bg-[#434655]/20 rounded-lg overflow-hidden border border-slate-200 dark:border-[#434655]/20">
                                        <div className="bg-slate-50 dark:bg-[#0b1326] p-3 text-center sm:text-left group-hover:bg-slate-50 dark:hover:bg-[#171f33] transition-colors">
                                            <p className="flex items-center justify-center sm:justify-start gap-1.5 text-[9px] text-slate-500 dark:text-[#8d90a1] font-bold uppercase tracking-widest mb-1 m-0"><CreditCard size={10} className="text-blue-600 dark:text-[#adc6ff]" /> Protocol</p>
                                            <p className="text-[11px] font-extrabold text-slate-900 dark:text-[#dae2fd] m-0">{dec.payment_mode}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-[#0b1326] p-3 text-center sm:text-left group-hover:bg-slate-50 dark:hover:bg-[#171f33] transition-colors">
                                            <p className="flex items-center justify-center sm:justify-start gap-1.5 text-[9px] text-slate-500 dark:text-[#8d90a1] font-bold uppercase tracking-widest mb-1 m-0"><Hash size={10} className="text-blue-600 dark:text-[#adc6ff]" /> Cipher</p>
                                            <p className="text-[10px] font-mono font-bold text-blue-600 dark:text-[#adc6ff] m-0 truncate">{dec.utr_number || 'NULL'}</p>
                                        </div>
                                        <div className="col-span-2 bg-slate-50 dark:bg-[#0b1326] p-3 text-center sm:text-left group-hover:bg-slate-50 dark:hover:bg-[#171f33] transition-colors border-t border-slate-200 dark:border-[#434655]/20">
                                            <p className="flex items-center justify-center sm:justify-start gap-1.5 text-[9px] text-slate-500 dark:text-[#8d90a1] font-bold uppercase tracking-widest mb-1 m-0"><Calendar size={10} className="text-blue-600 dark:text-[#adc6ff]" /> Epoch Signature</p>
                                            <p className="text-[11px] font-bold text-slate-600 dark:text-[#c3c5d8] m-0">{new Date(dec.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {dec.screenshot_url && (
                                        <a href={dec.screenshot_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-[10px] text-blue-600 dark:text-[#adc6ff] font-bold uppercase tracking-widest p-2 border border-[#1f70e3]/40 rounded-lg bg-[#1f70e3]/10 no-underline transition-all hover:bg-[#1f70e3]/20 hover:border-[#1f70e3] hover:text-white">
                                            <ExternalLink size={14} /> Inspect Visual Auth
                                        </a>
                                    )}

                                    <div className="flex gap-3 mt-auto pt-2">
                                        <button 
                                            onClick={() => handleReview(dec.id, dec.order_id as string, true)}
                                            disabled={processingId !== null}
                                            className={`flex-1 h-10 border-none bg-[#34d399]/10 text-[#34d399] hover:bg-[#34d399] hover:text-black hover:shadow-[0_0_15px_rgba(52,211,153,0.3)] rounded-lg text-[10px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${processingId ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                                            {processingId === dec.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Approve
                                        </button>
                                        <button 
                                            onClick={() => handleReview(dec.id, dec.order_id as string, false)}
                                            disabled={processingId !== null}
                                            className={`flex-1 h-10 border-none bg-[#ffb4ab]/10 text-[#ffb4ab] hover:bg-[#ffb4ab] hover:text-[#001a42] hover:shadow-[0_0_15px_rgba(255,180,171,0.3)] rounded-lg text-[10px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${processingId ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
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
