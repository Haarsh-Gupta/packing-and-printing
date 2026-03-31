import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { InquiryGroup } from "@/types";
import {
    MessageSquare, Send, User, Calendar, Package, Layers, Mail, Phone,
    IndianRupee, FileText, Hash, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, ArrowLeft, Calculator
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string; icon: typeof AlertCircle }> = {
    DRAFT: { color: 'text-slate-500 dark:text-[#c3c5d8]', bg: 'bg-slate-100 dark:bg-[#434655]/10', dot: 'bg-slate-400 dark:bg-[#c3c5d8]', icon: FileText },
    SUBMITTED: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', dot: 'bg-amber-500 dark:bg-amber-400', icon: Clock },
    UNDER_REVIEW: { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', dot: 'bg-purple-500 dark:bg-purple-400', icon: FileText },
    NEGOTIATING: { color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/10', dot: 'bg-cyan-500 dark:bg-cyan-400', icon: MessageSquare },
    QUOTED: { color: 'text-blue-600 dark:text-[#adc6ff]', bg: 'bg-blue-50 dark:bg-[#adc6ff]/10', dot: 'bg-blue-500 dark:bg-[#adc6ff]', icon: IndianRupee },
    ACCEPTED: { color: 'text-emerald-600 dark:text-[#34d399]', bg: 'bg-emerald-50 dark:bg-[#34d399]/10', dot: 'bg-emerald-500 dark:bg-[#34d399]', icon: CheckCircle2 },
    REJECTED: { color: 'text-red-600 dark:text-[#ffb4ab]', bg: 'bg-red-50 dark:bg-[#ffb4ab]/10', dot: 'bg-red-500 dark:bg-[#ffb4ab]', icon: XCircle },
    CANCELLED: { color: 'text-slate-500 dark:text-[#8d90a1]', bg: 'bg-slate-100 dark:bg-[#434655]/10', dot: 'bg-slate-400 dark:bg-[#8d90a1]', icon: XCircle },
    EXPIRED: { color: 'text-slate-500 dark:text-[#8d90a1]', bg: 'bg-slate-100 dark:bg-[#2d3449]/30', dot: 'bg-slate-400 dark:bg-[#8d90a1]', icon: Clock },
};

const ADMIN_ALLOWED_TRANSITIONS: Record<string, string[]> = {
    SUBMITTED:    ['UNDER_REVIEW', 'REJECTED', 'CANCELLED'],
    UNDER_REVIEW: ['NEGOTIATING', 'REJECTED', 'CANCELLED'],
    NEGOTIATING:  ['REJECTED', 'CANCELLED'],
    QUOTED:       ['NEGOTIATING', 'CANCELLED', 'EXPIRED'],
    EXPIRED:      ['NEGOTIATING', 'CANCELLED'],
    ACCEPTED:     ['CANCELLED'],
    REJECTED:     ['NEGOTIATING'],
    CANCELLED:    ['NEGOTIATING'],
};

const UserStatusIndicator = ({ isOnline }: { isOnline: boolean }) => {
    return (
        <div className="flex items-center gap-1.5 transition-colors">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#34d399] shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-300 dark:bg-[#c3c5d8]/40'}`} />
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isOnline ? 'text-emerald-500 dark:text-[#34d399]' : 'text-slate-400 dark:text-[#c3c5d8]/60'}`}>
                {isOnline ? 'Active Now' : 'Offline'}
            </span>
        </div>
    );
};

const StatusPill = ({ status }: { status: string }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.CANCELLED;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${cfg.bg} rounded border border-slate-200 dark:border-white/5 text-[10px] font-bold uppercase tracking-widest ${cfg.color} transition-colors`}>
            <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />
            {status.replace(/_/g, ' ')}
        </span>
    );
};

function shortId(uuid: string) {
    return uuid.slice(0, 8).toUpperCase();
}

function InfoCard({ label, icon: Icon, value, sub }: { label: string; icon: typeof User; value: string; sub: string }) {
    return (
        <div className="p-4 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/20 rounded-xl transition-colors shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#c3c5d8] mb-2 flex items-center gap-1.5">
                <Icon size={12} className="text-blue-500 dark:text-[#adc6ff]" /> {label}
            </p>
            <p className="text-base font-bold text-slate-900 dark:text-[#dae2fd]">{value}</p>
            <p className="text-[11px] text-slate-500 dark:text-[#c3c5d8]/70 font-medium mt-1">{sub}</p>
        </div>
    );
}

function ItemCalculator({ item, subProducts, subServices, onApplyPrice }: { item: any, subProducts: any[], subServices: any[], onApplyPrice?: (p: number) => void }) {
    const [open, setOpen] = useState(false);
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
                            if (sec.type === "dropdown") {
                                const arr = Array.isArray(userVal) ? userVal : [userVal];
                                arr.forEach(val => {
                                    const matchedOpt = sec.options?.find((o: any) => String(o.value) === String(val));
                                    initOpts.push({ key: `${sec.key}-${val}`, label: `${sec.label} (${val})`, type: "mod", userChoice: val, val: matchedOpt ? parseFloat(matchedOpt.price_mod || "0") : 0 });
                                });
                            } else if (sec.type === "radio") {
                                const matchedOpt = sec.options?.find((o: any) => String(o.value) === String(userVal));
                                initOpts.push({ key: sec.key, label: sec.label, type: "mod", userChoice: userVal, val: matchedOpt ? parseFloat(matchedOpt.price_mod || "0") : 0 });
                            } else if (sec.type === "number_input") {
                                initOpts.push({ key: sec.key, label: sec.label, type: "ppu", userChoice: userVal, val: parseFloat(sec.price_per_unit || "0") });
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
            <button onClick={() => setOpen(true)} className="mt-3 h-8 px-3 rounded text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-[#adc6ff] border border-blue-200 dark:border-[#adc6ff]/20 hover:bg-blue-50 dark:hover:bg-[#adc6ff]/10 flex items-center transition-colors">
                <Calculator size={13} className="mr-1.5" /> Pricing Sandbox
            </button>
        );
    }

    let unitTotal = basePrice;
    options.forEach(o => {
        if (o.type === "mod") unitTotal += (o.val || 0);
        else if (o.type === "ppu") unitTotal += (parseFloat(String(o.userChoice) || "0") * (o.val || 0));
    });
    const finalTotal = unitTotal * (item.quantity || 1);

    return (
        <div className="mt-4 p-4 rounded-xl border border-blue-200 dark:border-[#adc6ff]/20 bg-white dark:bg-[#131b2e] shadow-lg transition-colors">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-[#434655]/20 pb-3">
                <p className="font-bold text-blue-600 dark:text-[#adc6ff] flex items-center gap-1.5 text-xs uppercase tracking-wider transition-colors"><Calculator size={14} /> Item Sandbox Mode</p>
                <button className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#c3c5d8] hover:text-slate-600 dark:hover:text-slate-900 dark:hover:text-[#dae2fd] transition-colors" onClick={() => setOpen(false)}>Close</button>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-[#0b1326] px-3 py-2 rounded-lg border border-slate-100 dark:border-[#434655]/20 transition-colors">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-[#c3c5d8]">Base Price (₹)</span>
                    <input type="number" className="w-20 h-6 bg-transparent text-slate-900 dark:text-[#dae2fd] text-xs text-right font-bold outline-none" value={basePrice} onChange={e => setBasePrice(parseFloat(e.target.value) || 0)} />
                </div>
                {options.map((opt, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-[#0b1326] px-3 py-2 rounded-lg border border-slate-100 dark:border-[#434655]/20 transition-colors">
                        <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-[#c3c5d8]">{opt.label}</span>
                            <span className="text-[9px] text-blue-500 dark:text-[#adc6ff] uppercase tracking-wider mt-0.5">{opt.userChoice}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-slate-300 dark:text-[#434655] font-bold font-mono uppercase">{opt.type === "ppu" ? "₹/unit" : "+₹"}</span>
                            <input type="number" className="w-16 h-6 bg-transparent text-slate-900 dark:text-[#dae2fd] text-xs text-right font-bold outline-none border-b border-slate-200 dark:border-[#434655]/40 focus:border-blue-500 dark:focus:border-blue-400 dark:border-[#adc6ff] transition-colors" value={opt.val === 0 ? "" : opt.val} placeholder="0" onChange={e => updateOpt(i, parseFloat(e.target.value) || 0)} />
                        </div>
                    </div>
                ))}
                <div className="pt-3 flex justify-between items-center mt-3 border-t border-slate-100 dark:border-[#434655]/20">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-[#c3c5d8] uppercase tracking-wider">Unit: ₹{unitTotal.toLocaleString()} × {item.quantity || 1}</p>
                    <div className="flex items-center gap-2">
                        <p className="text-lg font-black text-blue-600 dark:text-[#adc6ff] transition-colors">₹{finalTotal.toLocaleString()}</p>
                        {onApplyPrice && (
                            <button
                                onClick={() => { onApplyPrice(finalTotal); setOpen(false); }}
                                className="ml-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm"
                            >
                                Apply
                            </button>
                        )}
                    </div>
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
    const [itemPrices, setItemPrices] = useState<Record<string, number>>({});
    const [itemDiscounts, setItemDiscounts] = useState<Record<string, number>>({});
    const [itemTaxDiscounts, setItemTaxDiscounts] = useState<Record<string, number>>({});
    const [discountPercentage, setDiscountPercentage] = useState<number>(0);
    const [showWarning, setShowWarning] = useState(false);

    const [subProducts, setSubProducts] = useState<any[]>([]);
    const [subServices, setSubServices] = useState<any[]>([]);
    const [userDetails, setUserDetails] = useState<any>(null);
    const [adminMe, setAdminMe] = useState<any>(null);
    const [remoteTyping, setRemoteTyping] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const wsRef = React.useRef<WebSocket | null>(null);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [selected?.messages]);

    useEffect(() => {
        if (!selected) return;
        if (Object.keys(itemPrices).length === 0 && !quoteForm.amount && Object.keys(itemDiscounts).length === 0 && discountPercentage === 0) return;
        
        let calculatedTaxAmt = 0;
        let subtotal = 0;
        
        selected.items.forEach(item => {
             const baseItemPrice = itemPrices[item.id] !== undefined ? itemPrices[item.id] : (item.line_item_price || item.total_estimated_price || (item.estimated_price * item.quantity) || 0);
             if (baseItemPrice > 0) {
                 const itemSysTaxRate = (item.cgst_rate || 0) + (item.sgst_rate || 0);
                 const effectiveRate = itemSysTaxRate;
                 const waiverPerc = itemTaxDiscounts[item.id] || 0;
                 
                 const localDiscount = itemDiscounts[item.id] || 0;
                 const stackedDiscountRate = Math.min(100, discountPercentage + localDiscount);
                 const itemDiscountAmt = baseItemPrice * (stackedDiscountRate / 100);
                 const taxableValue = baseItemPrice - itemDiscountAmt;
                 
                 subtotal += taxableValue;
                 calculatedTaxAmt += taxableValue * (effectiveRate / 100) * (1 - (waiverPerc / 100));
             }
        });
        
        const finalAmount = subtotal + calculatedTaxAmt;
        if (Math.abs(parseFloat(quoteForm.amount || "0") - finalAmount) > 0.01) {
             setQuoteForm(prev => ({ ...prev, amount: finalAmount.toFixed(2) }));
        }
    }, [itemPrices, itemTaxDiscounts, itemDiscounts, discountPercentage, selected]);

    useEffect(() => {
        if (!selected || !quoteForm.amount) {
            setShowWarning(false);
            return;
        }
        const sysTotal = selected.items.reduce((sum, item) => sum + ((item as any).total_estimated_price || 0), 0);
        if (parseFloat(quoteForm.amount) < sysTotal && sysTotal > 0) {
            setShowWarning(true);
        } else {
            setShowWarning(false);
        }
    }, [quoteForm.amount, selected]);

    useEffect(() => {
        if (!id) return;
        setDetailLoading(true);
        Promise.all([
            api<InquiryGroup>(`/admin/inquiries/${id}`),
            api<any[]>("/admin/products/subproducts").catch(() => []),
            api<any[]>("/admin/services/subservices").catch(() => []),
            api<any>("/users/me").catch(() => null)
        ]).then(([inquiry, prods, servs, me]) => {
            setSelected(inquiry);
            setSubProducts(prods);
            setSubServices(servs);
            setAdminMe(me);
            api<any>(`/admin/users/${inquiry.user_id}`).then(setUserDetails).catch(console.warn);
        }).catch(console.error).finally(() => setDetailLoading(false));
    }, [id]);

    useEffect(() => {
        if (!id) return;
        const activeToken = localStorage.getItem("admin_token") || "";
        const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000";
        const wsBase = apiBase.replace(/^http/, "ws");
        const wsUrl = `${wsBase}/inquiries/ws/${id}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "new_message") {
                    setSelected(prev => {
                        if (!prev) return prev;
                        const exists = (prev.messages || []).some((m: any) => String(m.id) === String(data.message.id));
                        if (exists) return prev;
                        return { ...prev, messages: [...(prev.messages || []), data.message] };
                    });
                    setRemoteTyping(false);
                } else if (data.type === "typing") {
                    const isFromMe = String(data.user_id) === String(adminMe?.id);
                    if (!isFromMe && !data.is_admin) {
                        setRemoteTyping(data.is_typing);
                    }
                }
            } catch (e) {
                console.error("WS Parse Error", e);
            }
        };
        ws.onerror = () => console.warn("WS error for inquiry", id);
        return () => { ws.close(); wsRef.current = null; };
    }, [id, adminMe]);

    const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setReply(e.target.value);
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            if (!isTyping) {
                setIsTyping(true);
                wsRef.current.send(JSON.stringify({ type: "typing", is_typing: true }));
            }
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: "typing", is_typing: false }));
            }, 1500);
        }
    };

    const transitionStatus = async (newStatus: string) => {
        if (!selected) return;
        setSending(true);
        try {
            const res = await api<InquiryGroup>(`/admin/inquiries/${selected.id}/status`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
            setSelected(res);
        } catch (e) { console.error(e); } finally { setSending(false); }
    };

    const sendQuote = async () => {
        if (!selected || !quoteForm.amount) return;
        setSending(true);
        try {
            let taxAmt = 0;
            let totalDiscountAmt = 0;
            
            const lineItems = selected.items.map(item => {
                 const baseItemPrice = itemPrices[item.id] !== undefined ? itemPrices[item.id] : (item.line_item_price || item.total_estimated_price || (item.estimated_price * item.quantity) || 0);
                 
                 let itemDiscountAmt = 0;
                 let itemGstAmt = 0;
                 let taxableValue = baseItemPrice;
                 
                 const localDiscount = itemDiscounts[item.id] || 0;
                 const stackedDiscountRate = Math.min(100, discountPercentage + localDiscount);

                 if (baseItemPrice > 0) {
                     itemDiscountAmt = baseItemPrice * (stackedDiscountRate / 100);
                     taxableValue = baseItemPrice - itemDiscountAmt;
                     
                     const itemSysTaxRate = (item.cgst_rate || 0) + (item.sgst_rate || 0);
                     const waiverPerc = itemTaxDiscounts[item.id] || 0;
                     itemGstAmt = taxableValue * (itemSysTaxRate / 100) * (1 - (waiverPerc / 100));
                     taxAmt += itemGstAmt;
                     totalDiscountAmt += itemDiscountAmt;
                 }

                 return {
                     item_id: item.id,
                     line_item_price: baseItemPrice,
                     discount_type: stackedDiscountRate > 0 ? "percentage" : null,
                     discount_value: stackedDiscountRate,
                     discount_amount: itemDiscountAmt,
                     taxable_value: taxableValue,
                     gst_amount: itemGstAmt
                 };
            });

            await api(`/admin/inquiries/${selected.id}/quote`, {
                method: "PATCH",
                body: JSON.stringify({ 
                    total_price: parseFloat(quoteForm.amount), 
                    admin_notes: quoteForm.notes || null, 
                    valid_days: parseInt(quoteForm.validDays) || 7,
                    tax_amount: taxAmt,
                    discount_amount: totalDiscountAmt,
                    line_items: lineItems
                }),
            });
            setQuoteForm({ amount: "", notes: "", validDays: "7" });
            setItemPrices({});
            const data = await api<InquiryGroup>(`/admin/inquiries/${selected.id}`);
            setSelected(data);
        } catch (e) { console.error(e); } finally { setSending(false); }
    };

    const sendMessage = async () => {
        if (!selected || !reply.trim()) return;
        setSending(true);
        try {
            const res = await api<any>(`/admin/inquiries/${selected.id}/messages`, { method: "POST", body: JSON.stringify({ content: reply.trim() }) });
            if (res && res.id) {
                setSelected(prev => {
                    if (!prev) return prev;
                    if ((prev.messages || []).some((m: any) => m.id === res.id)) return prev;
                    return { ...prev, messages: [...(prev.messages || []), res] };
                });
            }
            setReply("");
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: "typing", is_typing: false }));
                setIsTyping(false);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            }
        } catch (e) { console.error(e); } finally { setSending(false); }
    };

    if (detailLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-[#0b1326] min-h-screen">
                <Loader2 size={28} className="text-blue-600 dark:text-[#adc6ff] animate-spin" />
            </div>
        );
    }

    if (!selected) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-[#0b1326] min-h-screen">
                <MessageSquare size={40} className="text-[#434655]" />
                <p className="text-[13px] font-bold text-slate-600 dark:text-[#c3c5d8]">Inquiry not found or deleted.</p>
                <button className="px-4 py-2 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/20 rounded-lg text-xs font-bold text-blue-600 dark:text-[#adc6ff] tracking-widest uppercase hover:bg-slate-50 dark:hover:bg-[#171f33] transition-colors" onClick={() => navigate('/inquiries')}>Go Back</button>
            </div>
        );
    }

    return (
        <main className="min-h-screen p-8 lg:p-12 bg-[#f7f9fb] dark:bg-[#0b1326] text-[#191c1e] dark:text-[#dae2fd] antialiased font-['Inter'] overflow-y-auto custom-scrollbar transition-colors">
            {/* Header Section */}
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-[#2170e4]/10 text-[#0058be] dark:text-[#adc6ff] px-3 py-1 rounded text-xs font-bold tracking-wider uppercase font-headline">
                            {selected.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[#424754] dark:text-[#c3c5d8] text-sm font-medium">INQ-{selected.display_id || selected.id.slice(0, 8)}</span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#191c1e] dark:text-[#dae2fd] font-headline">
                        {selected.items[0]?.subproduct_name || selected.items[0]?.product_name || selected.items[0]?.subservice_name || selected.items[0]?.service_name || "Project Inquiry"}
                    </h2>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => navigate('/inquiries')} className="flex items-center gap-2 px-4 py-2 bg-[#eceef0] dark:bg-slate-800 text-[#191c1e] dark:text-[#dae2fd] rounded-lg text-sm font-semibold hover:bg-[#e0e3e5] dark:hover:bg-slate-700 transition-all hover:-translate-y-px">
                        <ArrowLeft size={18} /> Back
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-10">
                {/* Left Column (7/12) */}
                <div className="col-span-12 lg:col-span-7 space-y-8">
                    
                    {/* User Information Card */}
                    <section className="bg-white dark:bg-[#131b2e] rounded-xl p-8 shadow-sm border border-[#eceef0] dark:border-[#434655]/20 transition-colors">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#424754] dark:text-[#c3c5d8]">Customer Profile</h3>
                            <User size={18} className="text-[#424754]/40 dark:text-[#c3c5d8]/40" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex flex-col">
                                <span className="text-[0.65rem] uppercase font-bold text-[#424754]/60 dark:text-[#c3c5d8]/60 mb-1 tracking-wider">Name</span>
                                <span className="text-base font-semibold text-[#191c1e] dark:text-[#dae2fd]">{userDetails?.name || 'Anonymous Client'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[0.65rem] uppercase font-bold text-[#424754]/60 dark:text-[#c3c5d8]/60 mb-1 tracking-wider">Email</span>
                                <span className="text-base font-semibold text-[#191c1e] dark:text-[#dae2fd] truncate max-w-[200px]">{userDetails?.email || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[0.65rem] uppercase font-bold text-[#424754]/60 dark:text-[#c3c5d8]/60 mb-1 tracking-wider">Phone</span>
                                <span className="text-base font-semibold text-[#191c1e] dark:text-[#dae2fd]">{userDetails?.phone || 'N/A'}</span>
                            </div>
                        </div>
                    </section>

                    {/* Items List Section */}
                    <section className="bg-white dark:bg-[#131b2e] rounded-xl p-8 shadow-sm border border-[#eceef0] dark:border-[#434655]/20 transition-colors">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#424754] dark:text-[#c3c5d8]">Service Catalog Items</h3>
                            <span className="text-xs font-bold text-[#0058be] dark:text-[#adc6ff] tracking-tight">{selected.items.length} ITEMS TOTAL</span>
                        </div>
                        <div className="space-y-6">
                            {selected.items.map((item) => {
                                const itemImage = item.display_images?.[0] || item.images?.[0];
                                const catalogPrice = (() => {
                                    if (item.subproduct_id) {
                                        const p = subProducts.find((sp: any) => sp.id === item.subproduct_id);
                                        return p?.base_price || 0;
                                    }
                                    if (item.subservice_id) {
                                        const s = subServices.find((ss: any) => ss.id === item.subservice_id);
                                        return s?.price_per_unit || 0;
                                    }
                                    return 0;
                                })();
                                const unitPrice = (item.estimated_price || 0) > 0 ? (item.estimated_price || 0) : catalogPrice;
                                const gstRate = (item.cgst_rate || 0) + (item.sgst_rate || 0);
                                const itemTotal = item.total_estimated_price || (unitPrice * item.quantity);
                                const itemTax = item.computed_tax_amount || (itemTotal * gstRate / 100);
                                
                                const currentBase = itemPrices[item.id] !== undefined ? itemPrices[item.id] : (item.line_item_price || itemTotal || 0);
                                const currentLocalDisc = itemDiscounts[item.id] || 0;
                                const currentStackedRate = Math.min(100, discountPercentage + currentLocalDisc);
                                const currentDiscAmount = currentBase * (currentStackedRate / 100);
                                const currentTaxable = currentBase - currentDiscAmount;
                                const currentWaiver = itemTaxDiscounts[item.id] || 0;
                                const currentGstAmt = currentTaxable * (gstRate / 100) * (1 - (currentWaiver / 100));
                                
                                return (
                                <div key={item.id} className="p-5 rounded-xl border border-[#eceef0] dark:border-[#434655]/20 bg-[#f7f9fb] dark:bg-[#060e20] group hover:border-[#0058be]/30 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 rounded-lg overflow-hidden border border-[#eceef0] dark:border-[#434655]/20 shrink-0 bg-white dark:bg-[#131b2e]">
                                                {itemImage ? (
                                                    <img src={itemImage} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        {item.service_id ? <Layers size={22} className="text-[#0058be] dark:text-[#adc6ff]" /> : <Package size={22} className="text-[#0058be] dark:text-[#adc6ff]" />}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-[#191c1e] dark:text-[#dae2fd] text-sm">{item.subproduct_name || item.product_name || item.subservice_name || item.service_name || "Custom Item"}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {item.hsn_code && (
                                                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-slate-100 dark:bg-[#434655]/20 text-slate-500 dark:text-[#c3c5d8] rounded border border-slate-200 dark:border-[#434655]/30">HSN: {item.hsn_code}</span>
                                                    )}
                                                    {item.variant_name && <span className="text-[10px] text-[#424754] dark:text-[#c3c5d8] font-medium opacity-70">{item.variant_name}</span>}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                    <span className="text-[10px] font-bold text-[#424754]/60 dark:text-[#c3c5d8]/60 uppercase tracking-wider">Qty: {item.quantity}</span>
                                                    {catalogPrice > 0 && (
                                                        <span className="text-[10px] font-bold text-slate-400 dark:text-[#c3c5d8]/40 uppercase tracking-wider">Base: ₹{catalogPrice.toLocaleString()}/unit</span>
                                                    )}
                                                    {unitPrice > 0 && unitPrice !== catalogPrice && (
                                                        <span className="text-[10px] font-bold text-blue-500 dark:text-[#adc6ff] uppercase tracking-wider">Calc: ₹{unitPrice.toLocaleString()}/unit</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 flex flex-col items-end gap-2">
                                            <div className="flex items-center gap-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Base (₹)</label>
                                                <input 
                                                    type="number"
                                                    className="w-24 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/40 rounded p-1.5 text-right text-sm font-bold text-slate-900 dark:text-[#dae2fd] focus:border-blue-500 outline-none"
                                                    value={currentBase}
                                                    onChange={e => setItemPrices(prev => ({ ...prev, [item.id]: parseFloat(e.target.value) || 0 }))}
                                                />
                                            </div>
                                            <div className="flex flex-col items-end w-32 gap-1 mt-1">
                                                <div className="flex items-center justify-between w-full">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Item Disc</label>
                                                    <span className="text-[9px] font-bold text-blue-500">{itemDiscounts[item.id] || 0}%</span>
                                                </div>
                                                <input 
                                                    type="range"
                                                    className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                                    min="0" max="100"
                                                    value={itemDiscounts[item.id] || 0}
                                                    onChange={e => setItemDiscounts(prev => ({ ...prev, [item.id]: parseFloat(e.target.value) }))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Tax & pricing info bar */}
                                    <div className="mt-4 flex items-center justify-between border-t border-[#eceef0] dark:border-[#434655]/20 pt-3">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded">
                                                Taxable: ₹{currentTaxable.toLocaleString(undefined, {maximumFractionDigits: 2})}
                                            </span>
                                            {gstRate > 0 ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#c3c5d8]">
                                                        CGST: {item.cgst_rate || 0}% + SGST: {item.sgst_rate || 0}%
                                                    </span>
                                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-200/50 bg-amber-50 px-2 py-0.5 rounded">
                                                        Tax: ₹{currentGstAmt.toLocaleString(undefined, {maximumFractionDigits: 2})}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-[#c3c5d8]/40">GST: Exempt</span>
                                            )}
                                            <select 
                                                className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/30 rounded px-2 py-1 text-[10px] font-bold text-slate-900 dark:text-[#dae2fd] outline-none h-6 uppercase tracking-wider"
                                                value={itemTaxDiscounts[item.id] || 0}
                                                onChange={e => setItemTaxDiscounts(prev => ({ ...prev, [item.id]: parseFloat(e.target.value) }))}>
                                                <option value="0">Default Tax</option>
                                                <option value="100">Waive Tax</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ItemCalculator item={item} subProducts={subProducts} subServices={subServices} onApplyPrice={(p) => setItemPrices(prev => ({ ...prev, [item.id]: p }))} />
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                            {/* Total Summary */}
                            {(() => {
                                let totalTaxable = 0;
                                let totalTax = 0;
                                let totalBase = 0;
                                
                                selected.items.forEach(item => {
                                    const currentBase = itemPrices[item.id] !== undefined ? itemPrices[item.id] : (item.line_item_price || item.total_estimated_price || (item.estimated_price * item.quantity) || 0);
                                    totalBase += currentBase;
                                    const currentLocalDisc = itemDiscounts[item.id] || 0;
                                    const currentStackedRate = Math.min(100, discountPercentage + currentLocalDisc);
                                    const currentDiscAmount = currentBase * (currentStackedRate / 100);
                                    const currentTaxable = currentBase - currentDiscAmount;
                                    totalTaxable += currentTaxable;
                                    
                                    const gstRate = (item.cgst_rate || 0) + (item.sgst_rate || 0);
                                    const currentWaiver = itemTaxDiscounts[item.id] || 0;
                                    totalTax += currentTaxable * (gstRate / 100) * (1 - (currentWaiver / 100));
                                });
                                
                                const discountAmt = totalBase - totalTaxable;

                                return (
                                    <div className="pt-4 border-t border-[#eceef0] dark:border-[#434655]/20 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-[#c3c5d8]">Base Contract</span>
                                            <span className="text-sm font-bold text-slate-800 dark:text-[#dae2fd]">₹{totalBase.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                                        </div>
                                        {discountAmt > 0 && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400">Total Discount</span>
                                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">-₹{discountAmt.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400">Taxable Value</span>
                                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{totalTaxable.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                                        </div>
                                        {totalTax > 0 && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600 dark:text-amber-400">GST (CGST + SGST)</span>
                                                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">+₹{totalTax.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#434655]/20 mt-2">
                                            <span className="text-[12px] font-black uppercase tracking-[0.15em] text-slate-800 dark:text-[#dae2fd]">Grand Total (Realtime)</span>
                                            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹{(totalTaxable + totalTax).toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </section>

                    {/* Quote History Section */}
                    <section className="bg-white dark:bg-[#131b2e] rounded-xl p-8 shadow-sm border border-[#eceef0] dark:border-[#434655]/20 transition-colors">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#424754] dark:text-[#c3c5d8]">Quote History</h3>
                            <span className="text-xs font-bold text-[#0058be] dark:text-[#adc6ff] tracking-tight">{selected.quote_versions?.length || 0} VERSIONS</span>
                        </div>
                        <div className="border-l-2 border-[#eceef0] dark:border-[#434655]/20 ml-4 space-y-12">
                            {(selected.quote_versions?.length || 0) > 0 ? (
                                [...(selected.quote_versions || [])].sort((a,b) => b.version - a.version).map((vq, idx) => (
                                    <div key={vq.id} className={`relative pl-10 ${idx !== 0 ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ring-4 ring-white dark:ring-[#131b2e] transition-all ${idx === 0 ? 'bg-[#0058be] scale-110 shadow-[0_0_10px_rgba(0,88,190,0.3)]' : 'bg-[#d8dadc] dark:bg-slate-700'}`}></div>
                                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                                            <div>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${idx === 0 ? 'text-[#0058be] dark:text-[#adc6ff]' : 'text-[#424754] dark:text-[#c3c5d8]'}`}>
                                                    {idx === 0 ? 'Current Version' : `Archive - V.${vq.version}`}
                                                </span>
                                                <h4 className="text-xl font-bold text-[#191c1e] dark:text-[#dae2fd] mt-1">V.{String(vq.version).padStart(2, '0')} - {idx === 0 ? 'Final Revision' : 'Previous Proposal'}</h4>
                                                {idx !== 0 && <p className="text-[11px] font-medium text-[#424754] dark:text-[#c3c5d8] mt-1">Status: Superseded</p>}
                                            </div>
                                            <div className="text-right mt-2 md:mt-0">
                                                <span className="block text-2xl font-black text-[#191c1e] dark:text-[#dae2fd]">₹{vq.total_price.toLocaleString()}</span>
                                                <span className="text-[10px] text-[#424754] dark:text-[#c3c5d8] font-bold uppercase tracking-wider opacity-60">Expires {vq.valid_until ? new Date(vq.valid_until).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                        </div>
                                        {idx === 0 && (
                                            <div className="bg-[#f7f9fb] dark:bg-[#060e20] rounded-lg p-6 border border-[#eceef0] dark:border-[#434655]/20">
                                                <h5 className="text-[10px] font-bold uppercase tracking-widest text-[#424754] dark:text-[#c3c5d8] mb-4 opacity-70">Internal Proposal Summary</h5>
                                                <p className="text-sm text-[#424754] dark:text-[#c3c5d8] leading-relaxed italic font-medium">"{vq.admin_notes || 'No notes provided with this quote version.'}"</p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="pl-10 text-[13px] font-medium text-[#424754]/40 dark:text-[#c3c5d8]/40 italic py-4">
                                    Strategic quotation pending. Use the workflow panel to emit initial pricing.
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Chat/Messages Section */}
                    <section className="bg-white dark:bg-[#131b2e] rounded-xl shadow-sm border border-slate-200 dark:border-[#434655]/20 flex flex-col h-[550px] overflow-hidden transition-colors">
                        <div className="p-6 border-b border-slate-100 dark:border-[#434655]/20 flex items-center justify-between bg-white dark:bg-[#131b2e]">
                            <div className="flex items-center gap-3">
                                <MessageSquare size={18} className="text-blue-600 dark:text-[#adc6ff]" />
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-[#c3c5d8]">Communication Thread</h3>
                                {userDetails && <UserStatusIndicator isOnline={userDetails.is_online} />}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-[#c3c5d8]/40 uppercase tracking-widest">
                                {selected.messages?.length || 0} Packets logged
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-[#0b1326]/50 shadow-inner custom-scrollbar transition-colors">
                            {selected.messages?.map((m) => {
                                const isMe = String(m.sender_id) === String(adminMe?.id);
                                const isAdmin = m.sender_id !== selected.user_id;
                                return (
                                    <div key={m.id} className={`flex items-start gap-4 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse text-right' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm ${isAdmin ? 'bg-blue-600 text-white ring-2 ring-blue-500/10' : 'bg-blue-100 dark:bg-[#d8e2ff] text-blue-900 dark:text-[#001a42] ring-2 ring-blue-100/20 dark:ring-[#d8e2ff]/20'}`}>
                                            {isAdmin ? 'AD' : (userDetails?.name?.[0]?.toUpperCase() || 'CL')}
                                        </div>
                                        <div className={`p-4 rounded-2xl shadow-sm ${isAdmin ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/20 text-slate-900 dark:text-[#dae2fd] rounded-tl-none'}`}>
                                            <p className="text-sm leading-relaxed font-medium">{m.content}</p>
                                            <span className={`text-[9px] mt-2 block font-black uppercase tracking-widest ${isAdmin ? 'text-white/60' : 'text-slate-400 dark:text-[#c3c5d8]/40'}`}>
                                                {isAdmin ? 'SYSTEM ADMIN' : (userDetails?.name?.toUpperCase() || 'CLIENT')} • {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                        
                        {remoteTyping && (
                            <div className="px-6 py-2 bg-slate-50 dark:bg-[#0b1326]/50 border-t border-slate-200/50 dark:border-[#434655]/10 shrink-0">
                                <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/20 px-3 py-2 w-fit rounded-xl rounded-bl-none flex items-center shadow-sm">
                                    <div className="flex gap-1 py-1">
                                        <span className="w-1.5 h-1.5 bg-blue-600/50 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-blue-600/50 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                        <span className="w-1.5 h-1.5 bg-blue-600/50 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="p-6 bg-white dark:bg-[#131b2e] border-t border-slate-100 dark:border-[#434655]/20 transition-colors">
                            <div className="relative group">
                                <textarea 
                                    className="w-full bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/20 rounded-xl p-4 pr-16 text-sm dark:text-[#dae2fd] focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 dark:text-[#c3c5d8]/30" 
                                    placeholder="Draft a message to the client..."
                                    value={reply}
                                    onChange={handleTyping}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                />
                                <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                                    <button disabled={sending || !reply.trim()} onClick={sendMessage} className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                                        {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column (5/12) */}
                <div className="col-span-12 lg:col-span-5 space-y-8">
                    {/* Action Controls */}
                    <section className="bg-white dark:bg-[#131b2e] rounded-xl p-8 shadow-sm border border-slate-200 dark:border-[#434655]/20 transition-colors">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-[#c3c5d8] mb-8">Inquiry Workflow</h3>
                        <div className="space-y-6">
                            <div className="p-6 bg-slate-50 dark:bg-[#0b1326] border border-slate-100 dark:border-[#434655]/20 rounded-2xl relative overflow-hidden group transition-colors">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
                                <div className="flex items-center gap-3 mb-6 relative z-10">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-[#dae2fd] text-sm">{selected.active_quote ? "Revise Quotation" : "Emit Initial Quotation"}</h4>
                                        <p className="text-[10px] text-slate-500 dark:text-[#c3c5d8] font-bold uppercase tracking-widest opacity-60">Strategic Proposal</p>
                                    </div>
                                </div>
                                <div className="space-y-5 relative z-10">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-[#c3c5d8]/50">Global Discount Slider</label>
                                            <span className="text-[11px] font-black text-blue-600 dark:text-blue-400">{discountPercentage}%</span>
                                        </div>
                                        <input 
                                            className="w-full h-2 bg-slate-200 dark:bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                                            type="range" 
                                            min="0" max="100"
                                            value={discountPercentage}
                                            onChange={e => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="group/field">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-[#c3c5d8]/50 mb-2 group-focus-within/field:text-blue-600 dark:group-focus-within/field:text-blue-600 dark:text-[#adc6ff] transition-colors">Total Contract Value (INR)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300 dark:text-[#424754]/30 group-focus-within/field:text-blue-600/50 dark:group-focus-within/field:text-blue-600 dark:text-[#adc6ff]/50 transition-colors">₹</span>
                                            <input 
                                                className={`w-full bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/20 rounded-xl pl-9 pr-4 py-3.5 font-black text-lg focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 dark:focus:border-blue-400 dark:border-[#adc6ff] ${showWarning ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-[#dae2fd]'} transition-all outline-none`}
                                                type="number" 
                                                value={quoteForm.amount}
                                                onChange={e => setQuoteForm({ ...quoteForm, amount: e.target.value })}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {showWarning && (
                                            <div className="flex items-center gap-1.5 mt-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                                                <AlertCircle size={12} /> Value below system cost estimates
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-[#c3c5d8]/50 mb-2">Validity Days</label>
                                            <input 
                                                className="w-full bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/20 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 dark:focus:border-blue-400 dark:border-[#adc6ff] text-slate-900 dark:text-[#dae2fd] transition-all outline-none" 
                                                type="number" 
                                                value={quoteForm.validDays}
                                                onChange={e => setQuoteForm({ ...quoteForm, validDays: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <button 
                                                onClick={sendQuote}
                                                disabled={sending || !quoteForm.amount}
                                                className="w-full h-[46px] bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {sending ? <Loader2 size={16} className="animate-spin" /> : (selected.active_quote ? "Re-Emit" : "Emit")}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-[#c3c5d8]/50 mb-2">Proposal Narrative</label>
                                        <Textarea 
                                            placeholder="Outline the core logic for the client..." 
                                            value={quoteForm.notes} 
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                                            className="min-h-[100px] text-xs bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/20 focus:ring-2 focus:ring-blue-500 dark:text-[#dae2fd] p-4 font-medium leading-relaxed transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-[#c3c5d8] uppercase tracking-[0.2em]">Manual State Override</label>
                                <select 
                                    className="w-full bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-[#dae2fd] outline-none focus:border-blue-500 dark:focus:border-blue-400 dark:border-[#adc6ff] transition-colors appearance-none"
                                    onChange={(e) => {
                                        if(window.confirm(`Are you sure you want to change status to ${e.target.value}?`)) {
                                            transitionStatus(e.target.value);
                                        }
                                    }}
                                    value={selected.status}
                                    disabled={sending || !(ADMIN_ALLOWED_TRANSITIONS[selected.status] && ADMIN_ALLOWED_TRANSITIONS[selected.status].length > 0)}
                                >
                                    <option value={selected.status} disabled>Current: {selected.status.replace(/_/g, ' ')}</option>
                                    {(ADMIN_ALLOWED_TRANSITIONS[selected.status] || []).map(s => (
                                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                     {/* Internal Notes */}
                    <section className="bg-white dark:bg-[#131b2e] rounded-xl p-8 shadow-sm border border-slate-200 dark:border-[#434655]/20 transition-colors">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-[#c3c5d8]">Internal Intelligence</h3>
                            <div className="bg-slate-100 dark:bg-[#eceef0]/10 p-1.5 rounded-lg">
                                <FileText size={16} className="text-slate-400 dark:text-[#c3c5d8]/40" />
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-[#0b1326] border border-slate-100 dark:border-[#434655]/20 rounded-xl p-6 relative transition-colors">
                            <div className="absolute top-4 left-4 w-1 h-8 bg-blue-600/20 dark:bg-[#0058be]/20 rounded-full"></div>
                            <p className="text-xs text-slate-600 dark:text-[#c3c5d8] leading-relaxed pl-4 font-medium italic">
                                {selected.admin_notes || "No internal strategic intelligence recorded for this inquiry. Recording preferences or negotiation leverage here is recommended."}
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
