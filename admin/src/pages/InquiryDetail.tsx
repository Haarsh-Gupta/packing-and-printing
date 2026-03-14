import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { InquiryGroup } from "@/types";
import {
    MessageSquare, Send, User, Calendar, Package, Layers,
    IndianRupee, FileText, Hash, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, ArrowLeft, Calculator
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string; icon: typeof AlertCircle }> = {
    PENDING: { color: '#f59e0b', bg: '#fffbeb', dot: '#f59e0b', icon: Clock },
    UNDER_REVIEW: { color: '#8b5cf6', bg: '#f5f3ff', dot: '#8b5cf6', icon: FileText },
    QUOTED: { color: '#2563eb', bg: '#eff6ff', dot: '#2563eb', icon: IndianRupee },
    NEGOTIATION: { color: '#0891b2', bg: '#ecfeff', dot: '#0891b2', icon: MessageSquare },
    ACCEPTED: { color: '#16a34a', bg: '#f0fdf4', dot: '#16a34a', icon: CheckCircle2 },
    REJECTED: { color: '#dc2626', bg: '#fef2f2', dot: '#dc2626', icon: XCircle },
    CANCELLED: { color: '#737373', bg: '#f5f5f5', dot: '#737373', icon: XCircle },
    EXPIRED: { color: '#a1a1aa', bg: '#f4f4f5', dot: '#a1a1aa', icon: Clock },
};

const UserStatusIndicator = ({ isOnline }: { isOnline: boolean }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ 
                width: '8px', height: '8px', borderRadius: '50%', 
                background: isOnline ? '#22c55e' : '#a1a1aa',
                boxShadow: isOnline ? '0 0 10px rgba(34, 197, 94, 0.4)' : 'none'
            }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: isOnline ? '#16a34a' : '#71717a' }}>
                {isOnline ? 'Active Now' : 'Offline'}
            </span>
        </div>
    );
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

function ItemCalculator({ item, subProducts, subServices }: { item: any, subProducts: any[], subServices: any[] }) {
    const [open, setOpen] = useState(false);

    // We need to initialize state from the db schema and the user's selected options.
    const [basePrice, setBasePrice] = useState<number>(0);
    const [options, setOptions] = useState<any[]>([]);

    useEffect(() => {
        if (!open) return;

        let initialBase = 0;
        let initOpts: any[] = [];

        if (item.subproduct_id) {
            const prod = subProducts.find(p => p.id === item.subproduct_id);
            if (prod) {
                initialBase = prod.base_price || 0;
                if (prod.config_schema?.sections) {
                    prod.config_schema.sections.forEach((sec: any) => {
                        const userVal = item.selected_options?.[sec.key];
                        if (userVal !== undefined) {
                            if (sec.type === "dropdown" || sec.type === "radio") {
                                const matchedOpt = sec.options?.find((o: any) => String(o.value) === String(userVal));
                                initOpts.push({
                                    key: sec.key,
                                    label: sec.label,
                                    type: "mod",
                                    userChoice: userVal,
                                    val: matchedOpt ? parseFloat(matchedOpt.price_mod || "0") : 0
                                });
                            } else if (sec.type === "number_input") {
                                initOpts.push({
                                    key: sec.key,
                                    label: sec.label,
                                    type: "ppu",
                                    userChoice: userVal, // qty
                                    val: parseFloat(sec.price_per_unit || "0")
                                });
                            }
                        }
                    });
                }
            }
        } else if (item.subservice_id) {
            const serv = subServices.find(s => s.id === item.subservice_id);
            if (serv) {
                initialBase = serv.price_per_unit || 0;
            }
        }

        setBasePrice(initialBase);
        setOptions(initOpts);
    }, [open, item, subProducts, subServices]);

    const updateOpt = (index: number, newVal: number) => {
        const newOpts = [...options];
        newOpts[index].val = newVal;
        setOptions(newOpts);
    };

    if (!open) {
        return (
            <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="mt-3 h-8 text-xs font-semibold text-[#136dec] border-[#136dec]/20 hover:bg-[#136dec]/10">
                <Calculator size={14} className="mr-2" /> Open Pricing Sandbox
            </Button>
        );
    }

    let unitTotal = basePrice;
    options.forEach(o => {
        if (o.type === "mod") {
            unitTotal += (o.val || 0);
        } else if (o.type === "ppu") {
            const qty = parseFloat(String(o.userChoice) || "0");
            unitTotal += (qty * (o.val || 0));
        }
    });
    const finalTotal = unitTotal * (item.quantity || 1);

    return (
        <div className="mt-4 p-4 rounded-xl border border-[#136dec]/30 bg-[#eff6ff]/30 shadow-inner">
            <div className="flex items-center justify-between mb-3 border-b border-[#2563eb]/20 pb-2">
                <p className="font-bold text-[#1e40af] flex items-center gap-2 text-sm"><Calculator size={14} /> Item Sandbox Calculator</p>
                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-[#2563eb]" onClick={() => setOpen(false)}>Close</Button>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                    <span className="text-xs font-bold text-slate-700">Base Price (₹)</span>
                    <Input type="number" className="w-24 h-7 text-xs text-right font-bold" value={basePrice} onChange={e => setBasePrice(parseFloat(e.target.value) || 0)} />
                </div>

                {options.map((opt, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">{opt.label}</span>
                            <span className="text-[10px] text-slate-500 uppercase">{opt.userChoice}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">{opt.type === "ppu" ? "₹/unit" : "+₹"}</span>
                            <Input type="number" className="w-20 h-7 text-xs text-right font-bold" value={opt.val === 0 ? "" : opt.val} placeholder="0" onChange={e => updateOpt(i, parseFloat(e.target.value) || 0)} />
                        </div>
                    </div>
                ))}

                <div className="pt-2 flex justify-between items-center mt-2 border-t border-slate-200/50">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Unit: ₹{unitTotal.toLocaleString()} × {item.quantity}</p>
                    </div>
                    <p className="text-xl font-black text-[#1e40af]">₹{finalTotal.toLocaleString()}</p>
                </div>
            </div>
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

    const [subProducts, setSubProducts] = useState<any[]>([]);
    const [subServices, setSubServices] = useState<any[]>([]);
    const [userDetails, setUserDetails] = useState<any>(null);
    const [remoteTyping, setRemoteTyping] = useState(false);

    // Typing indicator throttle
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const wsRef = React.useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!id) return;
        setDetailLoading(true);
        Promise.all([
            api<InquiryGroup>(`/admin/inquiries/${id}`),
            api<any[]>("/admin/products/subproducts").catch(() => []),
            api<any[]>("/admin/services/subservices").catch(() => [])
        ])
            .then(([inquiry, prods, servs]) => {
                setSelected(inquiry);
                setSubProducts(prods);
                setSubServices(servs);
                // Fetch user details for online status from Redis-aware endpoint
                api<any>(`/admin/users/${inquiry.user_id}`).then(setUserDetails).catch(console.warn);
            })
            .catch(console.error)
            .finally(() => setDetailLoading(false));
    }, [id]);

    useEffect(() => {
        if (!id) return;

        // Admin uses "admin_token" stored by the Vite admin app
        const activeToken = localStorage.getItem("admin_token") || "";
        const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000";
        const wsBase = apiBase.replace(/^http/, "ws");
        const wsUrl = `${wsBase}/inquiries/ws/${id}?token=${activeToken}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "new_message") {
                    setSelected(prev => {
                        if (!prev) return prev;
                        const exists = (prev.messages || []).some((m: any) =>
                            m.id === data.message.id || String(m.id) === String(data.message.id)
                        );
                        if (exists) return prev;
                        return { ...prev, messages: [...(prev.messages || []), data.message] };
                    });
                    setRemoteTyping(false);
                } else if (data.type === "typing") {
                    // Show indicator only when the USER (non-admin) is typing
                    if (!data.is_admin) {
                        setRemoteTyping(data.is_typing);
                    }
                }
            } catch (e) {
                console.error("WS Parse Error", e);
            }
        };

        ws.onerror = () => console.warn("WS error for inquiry", id);

        return () => {
            ws.close();
            wsRef.current = null;
        };
    }, [id]);

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setReply(e.target.value);
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            if (!isTyping) {
                setIsTyping(true);
                wsRef.current.send(JSON.stringify({ type: "typing", is_typing: true }));
            }
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({ type: "typing", is_typing: false }));
                }
            }, 1500);
        }
    };

    const transitionStatus = async (newStatus: string) => {
        if (!selected) return;
        setSending(true);
        try {
            const res = await api<InquiryGroup>(`/admin/inquiries/${selected.id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus }),
            });
            setSelected(res);
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    const sendQuote = async () => {
        if (!selected || !quoteForm.amount) return;
        setSending(true);
        try {
            await api(`/admin/inquiries/${selected.id}/quote`, {
                method: "PATCH",
                body: JSON.stringify({
                    total_quoted_price: parseFloat(quoteForm.amount),
                    admin_notes: quoteForm.notes || null,
                    valid_for_days: parseInt(quoteForm.validDays) || 7,
                }),
            });
            setQuoteForm({ amount: "", notes: "", validDays: "7" });
            const data = await api<InquiryGroup>(`/admin/inquiries/${selected.id}`);
            setSelected(data);
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    const sendMessage = async () => {
        if (!selected || !reply.trim()) return;
        const msgContent = reply.trim();
        setSending(true);
        try {
            const res = await api<any>(`/admin/inquiries/${selected.id}/messages`, {
                method: "POST",
                body: JSON.stringify({ content: msgContent }),
            });

            // Optimistically append message locally so admin sees it immediately
            if (res && res.id) {
                setSelected(prev => {
                    if (!prev) return prev;
                    // Avoid duplicate if WS already delivered it
                    const exists = (prev.messages || []).some((m: any) => m.id === res.id);
                    if (exists) return prev;
                    return {
                        ...prev,
                        messages: [...(prev.messages || []), res]
                    };
                });
            }

            setReply("");
            // Stop typing indicator
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: "typing", is_typing: false }));
                setIsTyping(false);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            }
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

            <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-visible lg:overflow-hidden min-h-[800px] lg:min-h-0">

                {/* Left pane: Details and items */}
                <div className="flex flex-col flex-auto lg:overflow-y-auto bg-card border border-border rounded-lg">
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', background: 'var(--secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)', letterSpacing: '0.1em' }}>
                                    #{shortId(selected.id)}
                                </span>
                                <UserStatusIndicator isOnline={userDetails?.is_online} />
                            </div>
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
                                        {item.line_item_price != null ? (
                                            <p style={{ fontSize: '13px', fontWeight: 800, color: '#2563eb', marginTop: '8px', fontFamily: "'DM Mono', monospace" }}>₹{item.line_item_price.toLocaleString()}</p>
                                        ) : (
                                            <ItemCalculator item={item} subProducts={subProducts} subServices={subServices} />
                                        )}
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

                        <Separator />
                        <div>
                            <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontFamily: "'DM Mono', monospace", marginBottom: '12px' }}>Actions</p>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {selected.status !== 'REJECTED' && (
                                    <Button size="sm" variant="outline" onClick={() => transitionStatus('REJECTED')} className="text-red-600 border-red-200 hover:bg-red-50">
                                        <XCircle size={14} className="mr-2" /> Reject Inquiry
                                    </Button>
                                )}
                                {selected.status === 'QUOTED' && (
                                    <Button size="sm" variant="outline" onClick={() => transitionStatus('NEGOTIATION')} className="text-cyan-600 border-cyan-200 hover:bg-cyan-50">
                                        <MessageSquare size={14} className="mr-2" /> Move to Negotiation
                                    </Button>
                                )}
                                {(selected.status === 'REJECTED' || selected.status === 'CANCELLED') && (
                                    <Button size="sm" variant="outline" onClick={() => transitionStatus('PENDING')}>
                                        <Clock size={14} className="mr-2" /> Reopen
                                    </Button>
                                )}
                            </div>
                        </div>

                        {(['PENDING', 'UNDER_REVIEW', 'QUOTED', 'NEGOTIATION'] as string[]).includes(selected.status) && (
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

                <div className="w-full lg:w-[400px] shrink-0 flex flex-col bg-card border border-border rounded-lg overflow-hidden relative h-[600px] lg:h-full">
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--secondary)' }}>
                        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontFamily: "'DM Mono', monospace" }}>Messages</p>
                    </div>

                    <div id="chat-messages-container" style={{ 
                        flex: 1, 
                        overflowY: "auto", 
                        padding: "16px",
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px' 
                    }}>
                        {(!selected.messages || selected.messages.length === 0) ? (
                            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', textAlign: 'center', marginTop: "20px" }}>No messages yet.</p>
                        ) : (
                            selected.messages.map((m) => {
                                const isAdmin = m.sender_id !== selected.user_id;
                                return (
                                    <div key={m.id} style={{ 
                                        alignSelf: isAdmin ? 'flex-end' : 'flex-start', 
                                        maxWidth: '85%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: isAdmin ? 'flex-end' : 'flex-start'
                                    }}>
                                        <div style={{ 
                                            padding: '8px 12px', 
                                            borderRadius: '12px', 
                                            borderTopRightRadius: isAdmin ? '2px' : '12px', 
                                            borderTopLeftRadius: isAdmin ? '12px' : '2px', 
                                            background: isAdmin ? 'var(--foreground)' : 'var(--secondary)', 
                                            color: isAdmin ? 'var(--background)' : 'var(--foreground)', 
                                            fontSize: '13px', 
                                            fontWeight: 500, 
                                            lineHeight: 1.4,
                                            wordBreak: 'break-word'
                                        }}>
                                            {m.content}
                                        </div>
                                        <p style={{ 
                                            fontSize: '8px', 
                                            fontWeight: 700, 
                                            color: 'var(--muted-foreground)', 
                                            fontFamily: "'DM Mono', monospace", 
                                            marginTop: '3px',
                                            opacity: 0.7
                                        }}>
                                            {isAdmin ? 'Admin · ' : ''}{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                );
                            })
                        )}
                        {remoteTyping && (
                            <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                                <div style={{ padding: '6px 12px', borderRadius: '12px', background: 'var(--secondary)', color: 'var(--muted-foreground)', fontSize: '11px', fontWeight: 600, fontStyle: 'italic' }}>
                                    User is typing...
                                </div>
                            </div>
                        )}
                    </div>

                    {(['PENDING', 'UNDER_REVIEW', 'QUOTED', 'NEGOTIATION', 'ACCEPTED', 'REJECTED', 'CANCELLED'] as string[]).includes(selected.status) && (
                        <div style={{ 
                            padding: '16px', 
                            borderTop: '1px solid var(--border)', 
                            background: 'var(--secondary)',
                            marginTop: 'auto'
                        }}>
                            <div style={{ display: 'flex', width: '100%', gap: '10px' }}>
                                <Input 
                                    placeholder="Type a message..." 
                                    value={reply} 
                                    onChange={handleTyping} 
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} 
                                    style={{ flex: 1, height: '38px', fontSize: '13px', background: 'var(--card)' }} 
                                />
                                <Button size="icon" onClick={sendMessage} disabled={sending || !reply.trim()} style={{ height: '38px', width: '38px' }}>
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
