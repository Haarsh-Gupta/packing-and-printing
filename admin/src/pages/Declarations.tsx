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

    const handleReview = async (id: string, isApproved: boolean) => {
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
            await api(`/admin/orders/declarations/${id}/review`, {
                method: "POST",
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', fontFamily: "'Inter', system-ui", height: '100%' }}>
            {/* Top bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.025em', color: '#18181b', margin: 0 }}>
                        Payment Declarations
                    </h1>
                    <p style={{ fontSize: '13px', color: '#71717a', marginTop: '3px' }}>{declarations.length} pending reviews</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
                        <input
                            type="text" placeholder="Search Order ID or UTR..." value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                height: '36px', paddingLeft: '30px', paddingRight: '12px', width: '220px',
                                border: '1px solid #e4e4e7', borderRadius: '9px', fontSize: '13px',
                                color: '#18181b', background: 'white', fontFamily: "'Inter', system-ui", outline: 'none',
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden flex flex-col" style={{ minHeight: '400px' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#a1a1aa' }}>
                        <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', color: '#3b82f6', margin: '0 auto' }} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '64px', textAlign: 'center', color: '#a1a1aa' }}>
                        <CheckCircle size={32} style={{ color: '#10b981', margin: '0 auto 12px', opacity: 0.8 }} />
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#18181b', margin: 0 }}>All caught up</p>
                        <p style={{ fontSize: '13px', color: '#71717a', marginTop: '4px' }}>No pending payment declarations to review.</p>
                    </div>
                ) : (
                    <div style={{ overflowY: 'auto', flex: 1, padding: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                            {filtered.map(dec => (
                                <div key={dec.id} style={{ border: '1px solid #e4e4e7', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <p style={{ fontSize: '11px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>ORDER ID</p>
                                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#3b82f6', margin: 0 }}>#{dec.order_id.toString().split('-')[0].toUpperCase()}</p>
                                        </div>
                                        <div style={{ padding: '4px 8px', background: '#fef3c7', color: '#d97706', borderRadius: '99px', fontSize: '10px', fontWeight: 700 }}>PENDING</div>
                                    </div>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f9f9f9', padding: '12px', borderRadius: '8px' }}>
                                        <div>
                                            <p style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#a1a1aa', fontWeight: 600, margin: '0 0 2px' }}><CreditCard size={10} /> MODE</p>
                                            <p style={{ fontSize: '12px', color: '#18181b', margin: 0, fontWeight: 500 }}>{dec.payment_mode}</p>
                                        </div>
                                        <div>
                                            <p style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#a1a1aa', fontWeight: 600, margin: '0 0 2px' }}><Hash size={10} /> UTR NUMBER</p>
                                            <p style={{ fontSize: '12px', color: '#18181b', margin: 0, fontWeight: 500 }}>{dec.utr_number || 'N/A'}</p>
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <p style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#a1a1aa', fontWeight: 600, margin: '0 0 2px' }}><Calendar size={10} /> DECLARED ON</p>
                                            <p style={{ fontSize: '12px', color: '#18181b', margin: 0, fontWeight: 500 }}>{new Date(dec.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {dec.screenshot_url && (
                                        <a href={dec.screenshot_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#3b82f6', textDecoration: 'none', fontWeight: 500, padding: '8px', border: '1px solid #bfdbfe', borderRadius: '6px', background: '#eff6ff', justifyContent: 'center' }}>
                                            <ExternalLink size={14} /> View Screenshot proof
                                        </a>
                                    )}

                                    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                                        <button 
                                            onClick={() => handleReview(dec.id, true)}
                                            disabled={processingId !== null}
                                            style={{ flex: 1, padding: '8px', border: 'none', background: '#10b981', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: processingId ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                            {processingId === dec.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Approve
                                        </button>
                                        <button 
                                            onClick={() => handleReview(dec.id, false)}
                                            disabled={processingId !== null}
                                            style={{ flex: 1, padding: '8px', border: 'none', background: '#fee2e2', color: '#ef4444', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: processingId ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
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
