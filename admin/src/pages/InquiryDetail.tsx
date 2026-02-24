import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { InquiryGroup } from "@/types";
import {
    MessageSquare, Send, User, Calendar, Package, Layers,
    IndianRupee, FileText, Hash, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, ArrowLeft
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string; icon: typeof AlertCircle }> = {
    PENDING: { color: '#f59e0b', bg: '#fffbeb', dot: '#f59e0b', icon: Clock },
    QUOTED: { color: '#2563eb', bg: '#eff6ff', dot: '#2563eb', icon: IndianRupee },
    ACCEPTED: { color: '#16a34a', bg: '#f0fdf4', dot: '#16a34a', icon: CheckCircle2 },
    REJECTED: { color: '#dc2626', bg: '#fef2f2', dot: '#dc2626', icon: XCircle },
};

const StatusPill = ({ status }: { status: string }) => {
    const cfg = STATUS_CONFIG[status] || { color: '#737373', bg: '#f5f5f5', dot: '#737373', icon: AlertCircle };
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 10px',
            background: cfg.bg,
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 700,
            color: cfg.color,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontFamily: "'DM Mono', monospace",
        }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
            {status}
        </span>
    );
};

function shortId(uuid: string) {
    return uuid.slice(0, 8).toUpperCase();
}

function InfoCard({ label, icon: Icon, value, sub }: { label: string; icon: typeof User; value: string; sub: string }) {
    return (
        <div style={{
            padding: '16px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            background: 'var(--secondary)',
        }}>
            <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontFamily: "'DM Mono', monospace", marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon size={10} /> {label}
            </p>
            <p style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--foreground)' }}>{value}</p>
            <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontWeight: 500, marginTop: '2px' }}>{sub}</p>
        </div>
    );
}

export default function InquiryDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [selected, setSelected] = useState<InquiryGroup | null>(null);
    const [detailLoading, setDetailLoading] = useState(true);
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);
    const [quoteForm, setQuoteForm] = useState({ amount: "", notes: "", validDays: "7" });

    useEffect(() => {
        if (!id) return;
        setDetailLoading(true);
        api<InquiryGroup>(`/inquiries/admin/${id}`)
            .then(setSelected)
            .catch(console.error)
            .finally(() => setDetailLoading(false));
    }, [id]);

    const sendQuote = async () => {
        if (!selected || !quoteForm.amount) return;
        setSending(true);
        try {
            await api(`/inquiries/admin/${selected.id}/quote`, {
                method: "PATCH",
                body: JSON.stringify({
                    total_quoted_price: parseFloat(quoteForm.amount),
                    admin_notes: quoteForm.notes || null,
                    valid_for_days: parseInt(quoteForm.validDays) || 7,
                }),
            });
            setQuoteForm({ amount: "", notes: "", validDays: "7" });
            const data = await api<InquiryGroup>(`/inquiries/admin/${selected.id}`);
            setSelected(data);
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    const sendMessage = async () => {
        if (!selected || !reply.trim()) return;
        setSending(true);
        try {
            await api(`/inquiries/admin/${selected.id}/messages`, {
                method: "POST",
                body: JSON.stringify({ content: reply }),
            });
            setReply("");
            const data = await api<InquiryGroup>(`/inquiries/admin/${selected.id}`);
            setSelected(data);
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    if (detailLoading) {
        return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={28} style={{ color: 'var(--muted-foreground)', animation: 'spin 0.8s linear infinite' }} />
            </div>
        );
    }

    if (!selected) {
        return (
            <div style={{ padding: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <MessageSquare size={40} style={{ color: 'var(--border)' }} />
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted-foreground)' }}>Inquiry not found.</p>
                <Button variant="outline" onClick={() => navigate('/inquiries')}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: "'DM Sans', system-ui", height: "calc(100vh - 100px)" }}>

            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                <Button variant="ghost" size="sm" onClick={() => navigate('/inquiries')} style={{ color: "var(--muted-foreground)" }}>
                    <ArrowLeft size={16} style={{ marginRight: "6px" }} /> Back
                </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', gap: '24px', flex: 1, overflow: 'hidden' }}>

                {/* Left pane: Details and items */}
                <div style={{ flex: "1 1 auto", display: 'flex', flexDirection: 'column', overflowY: 'auto', background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px" }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', background: 'var(--secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)', letterSpacing: '0.1em' }}>
                                #{shortId(selected.id)}
                            </span>
                            <StatusPill status={selected.status} />
                        </div>
                        <h1 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.03em' }}>Inquiry Details</h1>
                        <p style={{ fontSize: '13px', color: "var(--muted-foreground)" }}>
                            {selected.items.length} {selected.items.length === 1 ? 'item' : 'items'} · Created {new Date(selected.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                    </div>

                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <InfoCard label="Customer" icon={User} value={`ID: ${shortId(selected.user_id)}`} sub={`User ${selected.user_id.slice(0, 12)}...`} />
                            <InfoCard label="Submitted" icon={Calendar} value={new Date(selected.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} sub={new Date(selected.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                        </div>

                        {selected.total_quoted_price && (
                            <div style={{ padding: '16px 20px', border: '1px solid #2563eb30', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2563eb', fontFamily: "'DM Mono', monospace", marginBottom: '4px' }}>Quoted Price</p>
                                    <p style={{ fontSize: '24px', fontWeight: 900, color: '#1e40af', letterSpacing: '-0.03em' }}>₹{selected.total_quoted_price.toLocaleString()}</p>
                                </div>
                                {selected.quote_valid_until && (
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', fontFamily: "'DM Mono', monospace", marginBottom: '2px' }}>Valid Until</p>
                                        <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151', fontFamily: "'DM Mono', monospace" }}>{new Date(selected.quote_valid_until).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <Separator />

                        <div>
                            <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontFamily: "'DM Mono', monospace", marginBottom: '12px' }}>Cart Items ({selected.items.length})</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {selected.items.map((item) => (
                                    <div key={item.id} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--card)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: item.service_id ? '#f0fdf4' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {item.service_id ? <FileText size={14} style={{ color: '#16a34a' }} /> : <Package size={14} style={{ color: '#2563eb' }} />}
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '-0.02em' }}>{item.template_name || item.service_name || (item.template_id ? `Product #${item.template_id}` : `Service #${item.service_id}`)}</p>
                                                    {item.variant_name && <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontWeight: 500 }}>Variant: {item.variant_name}</p>}
                                                </div>
                                            </div>
                                            <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: "'DM Mono', monospace", padding: '2px 8px', background: 'var(--secondary)', borderRadius: '4px' }}>QTY: {item.quantity}</span>
                                        </div>
                                        {item.selected_options && Object.keys(item.selected_options).length > 0 && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: item.notes ? '10px' : 0 }}>
                                                {Object.entries(item.selected_options).map(([k, v]) => (
                                                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                                                        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted-foreground)', fontFamily: "'DM Mono', monospace" }}>{k.replace(/_/g, ' ')}</span>
                                                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--foreground)' }}>{typeof v === 'boolean' ? (v ? 'YES' : 'NO') : String(v)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {item.notes && <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontStyle: 'italic', marginTop: '4px' }}>"{item.notes}"</p>}
                                        {item.line_item_price != null && <p style={{ fontSize: '13px', fontWeight: 800, color: '#2563eb', marginTop: '8px', fontFamily: "'DM Mono', monospace" }}>₹{item.line_item_price.toLocaleString()}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {selected.admin_notes && (
                            <>
                                <Separator />
                                <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--secondary)' }}>
                                    <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontFamily: "'DM Mono', monospace", marginBottom: '8px' }}>Admin Notes</p>
                                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', lineHeight: 1.6 }}>{selected.admin_notes}</p>
                                </div>
                            </>
                        )}

                        {(selected.status === 'PENDING' || selected.status === 'QUOTED') && (
                            <>
                                <Separator />
                                <div>
                                    <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontFamily: "'DM Mono', monospace", marginBottom: '12px' }}>{selected.status === 'QUOTED' ? 'Update Quotation' : 'Send Quotation'}</p>
                                    <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--secondary)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '12px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)' }}>Total Amount (₹)</label>
                                                <Input type="number" placeholder="5000" value={quoteForm.amount} onChange={e => setQuoteForm({ ...quoteForm, amount: e.target.value })} style={{ height: '40px', fontWeight: 800, fontSize: '16px' }} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)' }}>Valid Days</label>
                                                <Input type="number" min="1" value={quoteForm.validDays} onChange={e => setQuoteForm({ ...quoteForm, validDays: e.target.value })} style={{ height: '40px', fontWeight: 700, fontSize: '14px' }} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)' }}>Notes for Customer</label>
                                            <Textarea placeholder="Pricing breakdown, terms, delivery timeline..." value={quoteForm.notes} onChange={e => setQuoteForm({ ...quoteForm, notes: e.target.value })} style={{ minHeight: '80px', fontSize: '13px' }} />
                                        </div>
                                        <Button onClick={sendQuote} disabled={sending || !quoteForm.amount} style={{ width: '100%', height: '40px', fontWeight: 700, fontSize: '13px' }}>
                                            {sending ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <><IndianRupee size={14} style={{ marginRight: '6px' }} /> Send Quotation</>}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right pane: Chat */}
                <div style={{ width: '400px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--secondary)' }}>
                        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontFamily: "'DM Mono', monospace" }}>Messages</p>
                    </div>

                    <ScrollArea style={{ flex: 1, padding: "16px" }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {(!selected.messages || selected.messages.length === 0) ? (
                                <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', textAlign: 'center', marginTop: "20px" }}>No messages yet.</p>
                            ) : (
                                selected.messages.map((m) => {
                                    const isAdmin = m.sender_id !== selected.user_id;
                                    return (
                                        <div key={m.id} style={{ alignSelf: isAdmin ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                            <div style={{ padding: '10px 14px', borderRadius: '12px', borderTopRightRadius: isAdmin ? '2px' : '12px', borderTopLeftRadius: isAdmin ? '12px' : '2px', background: isAdmin ? 'var(--foreground)' : 'var(--secondary)', color: isAdmin ? 'var(--background)' : 'var(--foreground)', fontSize: '13px', fontWeight: 500, lineHeight: 1.5 }}>
                                                {m.content}
                                            </div>
                                            <p style={{ fontSize: '9px', fontWeight: 700, color: 'var(--muted-foreground)', fontFamily: "'DM Mono', monospace", marginTop: '4px', textAlign: isAdmin ? 'right' : 'left' }}>
                                                {isAdmin ? 'Admin · ' : ''}{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </ScrollArea>

                    {(selected.status === 'PENDING' || selected.status === 'QUOTED') && (
                        <div style={{ padding: '16px', borderTop: '1px solid var(--border)', background: 'var(--secondary)' }}>
                            <div style={{ display: 'flex', width: '100%', gap: '10px' }}>
                                <Input placeholder="Type a message..." value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} style={{ flex: 1, height: '36px', fontSize: '13px' }} />
                                <Button size="icon" onClick={sendMessage} disabled={sending || !reply.trim()} style={{ height: '36px', width: '36px' }}>
                                    <Send size={16} />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
