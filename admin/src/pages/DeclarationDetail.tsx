import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { PaymentDeclaration } from "@/types";
import { 
    ArrowLeft, 
    Calendar, 
    CheckCircle, 
    CreditCard, 
    ExternalLink, 
    Hash, 
    Loader2, 
    Shield, 
    XCircle,
    Info,
    User,
    Clipboard
} from "lucide-react";

export default function DeclarationDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [declaration, setDeclaration] = useState<PaymentDeclaration | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        api<PaymentDeclaration>(`/admin/orders/declarations/${id}`)
            .then(setDeclaration)
            .catch(err => {
                console.error(err);
                alert("Failed to load declaration details.");
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handleReview = async (isApproved: boolean) => {
        if (!declaration) return;
        let reason = null;
        if (!isApproved) {
            reason = prompt("Reason for rejecting this payment declaration?");
            if (reason === null) return;
            if (!reason.trim()) {
                alert("Rejection reason is mandatory.");
                return;
            }
        }

        setProcessing(true);
        try {
            await api(`/admin/orders/${declaration.order_id}/declarations/${declaration.id}/review`, {
                method: "PATCH",
                body: JSON.stringify({
                    is_approved: isApproved,
                    rejection_reason: reason
                })
            });
            // Reload
            const updated = await api<PaymentDeclaration>(`/admin/orders/declarations/${id}`);
            setDeclaration(updated);
            alert(isApproved ? "Payment approved successfully." : "Payment rejected.");
        } catch (e: any) {
            alert(e.message || "Failed to process review.");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-600 dark:text-[#c3c5d8]">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p className="text-[10px] uppercase font-bold tracking-widest">Retrieving Transaction Metadata...</p>
            </div>
        );
    }

    if (!declaration) {
        return (
            <div className="p-8 text-center text-red-500">
                <XCircle size={48} className="mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-bold">Node Not Found</h2>
                <p className="text-sm opacity-70 mt-2">The requested declaration hash does not exist in the shard.</p>
                <button onClick={() => navigate(-1)} className="mt-6 text-blue-500 font-bold uppercase tracking-widest text-[10px]">Back to registry</button>
            </div>
        );
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-[#f59e0b]/10 border-[#f59e0b]/20 text-[#fcd34d] shadow-[0_0_15px_rgba(245,158,11,0.1)]';
            case 'APPROVED': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
            case 'REJECTED': return 'bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
            default: return 'bg-slate-500/10 border-slate-500/20 text-slate-500';
        }
    };

    return (
        <div className="flex flex-col h-full font-['Inter'] bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] px-2 pb-12 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-[10px] font-bold text-blue-600 dark:text-[#adc6ff] mb-4 tracking-widest uppercase hover:underline"
                >
                    <ArrowLeft size={14} /> Back to Registry
                </button>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div>
                        <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8]/60 mb-2 tracking-widest uppercase">
                            <span>Settlement Verification</span>
                            <span>/</span>
                            <span className="text-blue-600 dark:text-[#adc6ff]">{declaration.id.toString().slice(0, 8)}</span>
                        </nav>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-[#dae2fd] m-0">
                            Declaration Detail
                        </h1>
                        <p className="text-xs text-slate-600 dark:text-[#c3c5d8] mt-1 m-0">Verification of payment node for Order #{declaration.order_id.toString().split('-')[0].toUpperCase()}</p>
                    </div>
                    <div className={`px-4 py-2 border rounded-xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 ${getStatusStyle(declaration.status)}`}>
                        {declaration.status === 'PENDING' && <Loader2 size={14} className="animate-spin" />}
                        {declaration.status === 'APPROVED' && <CheckCircle size={14} />}
                        {declaration.status === 'REJECTED' && <XCircle size={14} />}
                        {declaration.status}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left side: Main Info */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    {/* Metadata Card */}
                    <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-[#434655]/20 bg-slate-100 dark:bg-[#0b1326]/50 flex items-center gap-3">
                            <Info size={16} className="text-blue-600 dark:text-[#adc6ff]" />
                            <h2 className="text-[11px] uppercase tracking-widest font-extrabold text-slate-900 dark:text-[#dae2fd] m-0">Node Parameters</h2>
                        </div>
                        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-y-10 gap-x-12">
                            <DetailRow icon={Clipboard} label="Order Hash" value={declaration.order_id} isMono />
                            <DetailRow icon={Hash} label="UTR Signature" value={declaration.utr_number || "NULL (SMS PARSED)"} isMono />
                            <DetailRow icon={CreditCard} label="Payment Protocol" value={declaration.payment_mode} />
                            <DetailRow icon={Calendar} label="Submission Epoch" value={new Date(declaration.created_at).toLocaleString()} />
                            <DetailRow icon={User} label="User Identity" value={String(declaration.user_id)} isMono />
                            <DetailRow icon={Shield} label="Milestone Key" value={declaration.milestone_id} isMono />
                        </div>
                    </div>

                    {/* Review Section */}
                    {declaration.status === 'PENDING' && (
                        <div className="bg-[#1f70e3]/5 border-2 border-dashed border-[#1f70e3]/20 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="text-lg font-extrabold text-slate-900 dark:text-[#dae2fd] mb-1">Human-in-the-Loop Review</h3>
                                <p className="text-xs text-slate-600 dark:text-[#c3c5d8] m-0">Verify the UTR against bank records before committing the state change.</p>
                            </div>
                            <div className="flex gap-4 shrink-0">
                                <button 
                                    onClick={() => handleReview(false)}
                                    disabled={processing}
                                    className="h-12 px-8 bg-red-500/10 text-red-500 border-2 border-red-500/20 hover:bg-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-red-500/20"
                                >
                                    Reject Node
                                </button>
                                <button 
                                    onClick={() => handleReview(true)}
                                    disabled={processing}
                                    className="h-12 px-8 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-emerald-500/20 flex items-center gap-2"
                                >
                                    {processing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} 
                                    Approve Settlement
                                </button>
                            </div>
                        </div>
                    )}

                    {declaration.status === 'REJECTED' && (
                        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8">
                            <h3 className="text-sm font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <XCircle size={16} /> Rejection Reason
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-[#c3c5d8] leading-relaxed italic m-0">
                                "{declaration.rejection_reason || "No reason provided."}"
                            </p>
                        </div>
                    )}

                    {declaration.status === 'APPROVED' && (
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-8 flex items-center gap-6">
                            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center shrink-0">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-emerald-500 uppercase tracking-widest mb-1">Settlement Finalized</h3>
                                <p className="text-xs text-slate-600 dark:text-[#c3c5d8] m-0">This transaction has been successfully verified and committed to the ledger.</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Reviewed At: {declaration.reviewed_at ? new Date(declaration.reviewed_at).toLocaleString() : 'N/A'}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right side: Visual Auth */}
                <div className="flex flex-col gap-8">
                    <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 shadow-sm overflow-hidden sticky top-8">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-[#434655]/20 bg-slate-100 dark:bg-[#0b1326]/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ExternalLink size={16} className="text-[#fcd34d]" />
                                <h2 className="text-[11px] uppercase tracking-widest font-extrabold text-slate-900 dark:text-[#dae2fd] m-0">Visual Auth</h2>
                            </div>
                        </div>
                        <div className="p-1 min-h-[300px] bg-slate-100 dark:bg-[#0b1326]/30 flex items-center justify-center">
                            {declaration.screenshot_url ? (
                                <a href={declaration.screenshot_url} target="_blank" rel="noreferrer" className="group relative block w-full">
                                    <img 
                                        src={declaration.screenshot_url} 
                                        alt="Payment Proof" 
                                        className="w-full h-auto rounded-xl grayscale hover:grayscale-0 transition-all duration-500 cursor-zoom-in shadow-xl"
                                    />
                                    <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <span className="bg-white text-black px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl">Open Lens</span>
                                    </div>
                                </a>
                            ) : (
                                <div className="text-center p-12">
                                    <Shield size={32} className="mx-auto mb-4 opacity-10" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">No Visual Document Attached</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6">
                            <p className="text-[10px] text-slate-500 dark:text-[#8d90a1] leading-relaxed m-0 text-center font-medium italic">
                                Note: Metadata (UTR) is primary. Visual auth is secondary fallback for manual clarification if required.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailRow({ icon: Icon, label, value, isMono = false }: { icon: any, label: string, value: any, isMono?: boolean }) {
    return (
        <div className="flex flex-col gap-2 group">
            <div className="flex items-center gap-2">
                <Icon size={12} className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-[#adc6ff] transition-colors" />
                <span className="text-[9px] font-bold text-slate-500 dark:text-[#8d90a1] uppercase tracking-[0.2em]">{label}</span>
            </div>
            <p className={`text-[11px] font-bold m-0 transition-all ${isMono ? 'font-mono text-blue-600 dark:text-[#adc6ff] bg-[#adc6ff]/5 px-2 py-1 rounded border border-transparent group-hover:border-[#adc6ff]/20' : 'text-slate-900 dark:text-[#dae2fd]'}`}>
                {String(value)}
            </p>
        </div>
    );
}
