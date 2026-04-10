import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api, apiBlob } from "@/lib/api";
import type { Order, OrderStatus } from "@/types";
import {
    ChevronRight, Printer, Edit, User, Wallet, ExternalLink, RotateCw, XCircle, CreditCard, Mail, Phone, Loader2, ArrowLeft,
    Package, FileText, Layers, Info, Calendar, AlertTriangle, Eye, Save, Plus, Trash2
} from "lucide-react";
import { StatusPill } from "./Orders"; // Reuse StatusPill from Orders.tsx if exported, or redefine

// Redefining StatusPill locally for self-containment if needed, or better, export from Orders.tsx
// Since I can't easily modify Orders.tsx and import in same step, I'll redefine a similar one here matching the mockup.

const DETAIL_STATUS_CONFIG: Record<string, { color: string; bg: string; borderColor: string }> = {
    WAITING_PAYMENT: { color: 'text-amber-400', bg: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
    PARTIALLY_PAID: { color: 'text-blue-400', bg: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
    PAID: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
    PROCESSING: { color: 'text-purple-400', bg: 'bg-purple-500/10', borderColor: 'border-purple-500/20' },
    READY: { color: 'text-sky-400', bg: 'bg-sky-500/10', borderColor: 'border-sky-500/20' },
    SHIPPED: { color: 'text-indigo-400', bg: 'bg-indigo-500/10', borderColor: 'border-indigo-500/20' },
    DELIVERED: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
    CANCELLED: { color: 'text-rose-400', bg: 'bg-rose-500/10', borderColor: 'border-rose-500/20' },
};

const LocalStatusPill = ({ status }: { status: string }) => {
    const cfg = DETAIL_STATUS_CONFIG[status] || { color: 'text-slate-600 dark:text-[#c3c5d8]', bg: 'bg-[#434655]/20', borderColor: 'border-slate-200 dark:border-[#434655]/30' };
    const label = status.replace(/_/g, ' ');
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${cfg.bg} ${cfg.color} border ${cfg.borderColor}`}>
            {label}
        </span>
    );
};

export default function OrderDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [linkedInquiry, setLinkedInquiry] = useState<any | null>(null);
    const [updating, setUpdating] = useState(false);
    const [downloading, setDownloading] = useState(false);

    // Reschedule states
    const [showReschedule, setShowReschedule] = useState(false);
    const [rescheduling, setRescheduling] = useState(false);
    const [splitType, setSplitType] = useState<'FULL' | 'HALF' | 'CUSTOM'>('HALF');
    const [customMilestones, setCustomMilestones] = useState<{label: string, percentage: number}[]>([
        {label: '', percentage: 0},
        {label: '', percentage: 0}
    ]);

    // Invoice data editor state
    const [showInvoiceEditor, setShowInvoiceEditor] = useState(false);
    const [invoiceData, setInvoiceData] = useState<any>(null);
    const [invoiceLoading, setInvoiceLoading] = useState(false);
    const [invoiceSaving, setInvoiceSaving] = useState(false);
    const [invoiceWarning, setInvoiceWarning] = useState<string | null>(null);
    const [invoiceConfigured, setInvoiceConfigured] = useState(false);
    const [orderTotal, setOrderTotal] = useState(0);
    const [previewLoading, setPreviewLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await api<any>(`/admin/orders/${id}`);
            setOrder(data);
            if (data.inquiry_id) {
                api(`/admin/inquiries/${data.inquiry_id}`).then(setLinkedInquiry).catch(console.error);
            }
        } catch (e) {
            console.error("Failed to fetch order details", e);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadInvoice = async () => {
        setDownloading(true);
        try {
            const blob = await apiBlob(`/orders/my/${id}/invoice`);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Invoice_${order?.order_number || id}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error(err);
            alert("Failed to download invoice. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    const handleReschedule = async () => {
        try {
            setRescheduling(true);
            const payload: any = { split_type: splitType };
            
            if (splitType === 'CUSTOM') {
                const total = customMilestones.reduce((acc, curr) => acc + Number(curr.percentage), 0);
                if (Math.abs(total - 100) > 0.01) {
                    alert("Custom percentages must sum to exactly 100%. Currently: " + total + "%");
                    setRescheduling(false);
                    return;
                }
                const filtered = customMilestones.filter(m => m.label.trim() !== '' && m.percentage > 0);
                if (filtered.length < 2 || filtered.length > 5) {
                    alert("Please provide between 2 and 5 valid custom milestones.");
                    setRescheduling(false);
                    return;
                }
                payload.milestones = filtered;
            }
            
            const res = await api(`/admin/orders/${id}/milestones`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            setOrder((res as any).data || res); // Depending on standard wrapper
            await fetchData(); // Refresh entirely to be safe
            setShowReschedule(false);
            setSplitType('HALF');
            setCustomMilestones([{label: '', percentage: 0}, {label: '', percentage: 0}]);
        } catch (e: any) {
            console.error(e);
            alert(e.message || "Failed to update payment schedule");
        } finally {
            setRescheduling(false);
        }
    };

    // Invoice data helpers
    const fetchInvoiceData = async () => {
        setInvoiceLoading(true);
        try {
            const res = await api<any>(`/admin/orders/${id}/invoice-data`);
            setInvoiceData(res.invoice_data);
            setInvoiceConfigured(res.is_configured);
            setInvoiceWarning(res.warning || null);
            setOrderTotal(res.order_total || 0);
        } catch (e) {
            console.error('Failed to load invoice data', e);
        } finally {
            setInvoiceLoading(false);
        }
    };

    const calcItemsTotal = () => {
        if (!invoiceData?.items) return 0;
        return invoiceData.items.reduce((acc: number, it: any) => acc + (it.unit_price || 0) * (it.quantity || 1), 0);
    };

    const calcTaxTotal = () => {
        if (!invoiceData?.items) return 0;
        return invoiceData.items.reduce((acc: number, it: any) => {
            const taxable = (it.unit_price || 0) * (it.quantity || 1) - (it.discount_amount || 0);
            return acc + taxable * ((it.cgst_rate || 0) + (it.sgst_rate || 0) + (it.igst_rate || 0) + (it.cess_rate || 0)) / 100;
        }, 0);
    };

    const calcGrandTotal = () => {
        const items = calcItemsTotal();
        const tax = calcTaxTotal();
        const shipping = invoiceData?.shipping_amount || 0;
        const shippingTax = shipping * (invoiceData?.shipping_gst_rate || 0) / 100;
        return items + tax + shipping + shippingTax;
    };

    const updateInvoiceItem = (idx: number, field: string, value: any) => {
        const newItems = [...(invoiceData?.items || [])];
        newItems[idx] = { ...newItems[idx], [field]: value };
        setInvoiceData({ ...invoiceData, items: newItems });
    };

    const addInvoiceItem = () => {
        const newItems = [...(invoiceData?.items || []), {
            item_id: null, description: 'New Item', quantity: 1, unit_price: 0,
            hsn_sac: '', cgst_rate: 0, sgst_rate: 0, igst_rate: 0, cess_rate: 0,
            discount_amount: 0, discount_type: null, discount_value: 0, unit: 'Nos'
        }];
        setInvoiceData({ ...invoiceData, items: newItems });
    };

    const removeInvoiceItem = (idx: number) => {
        const newItems = (invoiceData?.items || []).filter((_: any, i: number) => i !== idx);
        setInvoiceData({ ...invoiceData, items: newItems });
    };

    const handleSaveInvoiceData = async () => {
        setInvoiceSaving(true);
        try {
            const res = await api<any>(`/admin/orders/${id}/invoice-data`, {
                method: 'PUT',
                body: JSON.stringify(invoiceData)
            });
            setInvoiceConfigured(res.is_configured);
            setInvoiceWarning(res.warning || null);
            alert('Invoice data saved successfully!');
        } catch (e: any) {
            alert(e.message || 'Failed to save invoice data');
        } finally {
            setInvoiceSaving(false);
        }
    };

    const handlePreviewInvoice = async () => {
        setPreviewLoading(true);
        try {
            // Save first
            await api(`/admin/orders/${id}/invoice-data`, {
                method: 'PUT',
                body: JSON.stringify(invoiceData)
            });
            // Then preview
            const blob = await apiBlob(`/admin/orders/${id}/invoice-preview`);
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (e: any) {
            alert(e.message || 'Failed to preview invoice');
        } finally {
            setPreviewLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 size={40} className="animate-spin text-[#1f70e3]" />
            <p className="text-sm font-bold text-slate-500 dark:text-[#8d90a1] uppercase tracking-widest">Retrieving Secure Payload...</p>
        </div>
    );

    if (!order) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <XCircle size={40} className="text-rose-500/50" />
            <p className="text-sm font-bold text-slate-500 dark:text-[#8d90a1] uppercase tracking-widest">Order Not Found</p>
            <button onClick={() => navigate('/orders')} className="text-[#1f70e3] font-bold text-xs uppercase tracking-widest mt-4">Back to Registry</button>
        </div>
    );

    const amountPaid = order.amount_paid || 0;
    const balance = Number(order.total_amount) - amountPaid;
    const progress = Math.min(100, Math.round((amountPaid / Number(order.total_amount)) * 100));

    // Material design based colors match (hardcoded to preserve UI fidelity)
    return (
        <div className="flex flex-col font-['Inter'] animate-fade-in bg-slate-50 dark:bg-[#0b1326] -m-8 p-8 min-h-screen text-slate-900 dark:text-[#dae2fd]">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
                <div>
                    <nav className="flex items-center gap-2 text-slate-500 dark:text-[#8d90a1] text-[10px] font-bold uppercase tracking-widest mb-3">
                        <Link to="/orders" className="hover:text-blue-600 dark:hover:text-[#adc6ff] transition-colors">Orders Registry</Link>
                        <ChevronRight size={12} className="opacity-50" />
                        <span className="text-blue-600 dark:text-[#adc6ff]">{order.order_number || `ORD-${new Date(order.created_at).getFullYear()}-${order.id.toString().slice(0, 8).toUpperCase()}`}</span>
                    </nav>
                    <div className="flex flex-wrap items-center gap-4">
                        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-[#dae2fd]">Order Profile</h2>
                        <LocalStatusPill status={order.status} />
                    </div>
                    <p className="text-slate-500 dark:text-[#8d90a1] text-xs font-medium mt-2 flex items-center gap-2">
                        System timestamp: <span className="text-slate-600 dark:text-[#c3c5d8]">{new Date(order.created_at).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleDownloadInvoice} disabled={downloading} className="bg-white dark:bg-[#131b2e] hover:bg-slate-50 dark:hover:bg-[#171f33] text-blue-600 dark:text-[#adc6ff] border border-slate-200 dark:border-[#434655]/30 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-wait">
                        {downloading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Printer size={16} />
                                Invoice
                            </>
                        )}
                    </button>
                    <button className="bg-linear-to-br from-[#1f70e3] to-[#004395] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#1f70e3]/20 hover:opacity-90 transition-all flex items-center gap-2">
                        <Edit size={16} />
                        Edit Manifest
                    </button>
                </div>
            </div>

            {/* Bento Grid: Summary Section */}
            <div className="grid grid-cols-12 gap-8 mb-8">
                {/* User Info Card */}
                {/* Enhanced User Identity Card */}
                <div className="col-span-12 lg:col-span-4 bg-white dark:bg-[#131b2e] rounded-2xl p-6 border border-slate-200 dark:border-[#434655]/20 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#1f70e3]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#1f70e3]/10 transition-colors" />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-[#8d90a1] mb-6 flex items-center gap-2 relative z-10">
                        <User size={14} className="text-[#1f70e3]" />
                        Client Identity
                    </h3>
                    <div className="flex items-center gap-4 mb-8 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-[#1f70e3] to-[#004395] flex items-center justify-center text-white font-black text-xl shadow-inner uppercase">
                            {(order.user_name || order.user_email || 'C')[0]}
                        </div>
                        <div>
                            <p className="text-lg font-bold text-slate-900 dark:text-[#dae2fd] tracking-tight">{order.user_name || 'Anonymous Client'}</p>
                            <p className="text-[10px] text-[#1f70e3] font-bold tracking-widest uppercase mt-0.5">Verified Account</p>
                        </div>
                    </div>
                    <div className="space-y-4 relative z-10">
                        <div className="flex items-center gap-3 text-[13px] font-medium text-slate-600 dark:text-[#c3c5d8] bg-slate-50 dark:bg-[#0b1326]/50 p-3 rounded-lg border border-slate-200 dark:border-[#434655]/10">
                            <Mail size={16} className="text-slate-500 dark:text-[#8d90a1]" />
                            <span className="truncate">{order.user_email || 'No email registered'}</span>
                        </div>
                        {order.user?.phone && (
                            <div className="flex items-center gap-3 text-[13px] font-medium text-slate-600 dark:text-[#c3c5d8] bg-slate-50 dark:bg-[#0b1326]/50 p-3 rounded-lg border border-slate-200 dark:border-[#434655]/10">
                                <Phone size={16} className="text-slate-500 dark:text-[#8d90a1]" />
                                {order.user.phone}
                            </div>
                        )}
                        {order.user?.created_at && (
                            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 dark:text-[#8d90a1] uppercase tracking-wider px-1">
                                <Calendar size={14} className="text-[#1f70e3]" />
                                Partner Since {new Date(order.user.created_at).toLocaleDateString()}
                            </div>
                        )}
                        <div className="pt-6 border-t border-slate-200 dark:border-[#434655]/20 mt-6 group">
                            <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-[#8d90a1] tracking-[0.2em] mb-3">Linked Resource</p>
                            <Link to={order.inquiry_id ? `/inquiries/${order.inquiry_id}` : '#'} className="inline-flex items-center gap-2 text-[#1f70e3] hover:text-blue-600 dark:hover:text-[#adc6ff] text-xs font-bold transition-colors">
                                {linkedInquiry ? `Inquiry Group ${linkedInquiry.display_id || order.inquiry_id.slice(0, 8).toUpperCase()}` : 'Standalone Order'}
                                <ExternalLink size={14} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Financials Summary Card */}
                <div className="col-span-12 lg:col-span-8 bg-white dark:bg-[#131b2e] rounded-2xl p-8 border border-slate-200 dark:border-[#434655]/20 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#1f70e3]/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-[#1f70e3]/10 transition-colors" />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-[#8d90a1] mb-8 flex items-center gap-2 relative z-10">
                        <Wallet size={14} className="text-[#1f70e3]" />
                        Ledger Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10 mb-auto">
                        <div className="space-y-2">
                            <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#8d90a1] tracking-widest">Gross Value</p>
                            <p className="text-3xl font-black tracking-tighter text-slate-900 dark:text-[#dae2fd]">₹{order.total_amount.toLocaleString()}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] uppercase font-bold text-[#1f70e3] tracking-widest">Collected</p>
                            <p className="text-3xl font-black tracking-tighter text-blue-600 dark:text-[#adc6ff]">₹{amountPaid.toLocaleString()}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-[10px] uppercase font-bold text-rose-500 tracking-widest">Receivable</p>
                            <p className="text-3xl font-black tracking-tighter text-rose-400">₹{balance.toLocaleString()}</p>
                        </div>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="mt-12 relative z-10 bg-slate-50 dark:bg-[#0b1326] p-6 rounded-2xl border border-slate-200 dark:border-[#434655]/20">
                        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest mb-3">
                            <span className="text-slate-500 dark:text-[#8d90a1]">Cashflow Saturation</span>
                            <span className={progress === 100 ? 'text-emerald-400' : 'text-[#1f70e3]'}>{progress}% Verified</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-50 dark:bg-[#171f33] rounded-full overflow-hidden border border-slate-200 dark:border-[#434655]/20">
                            <div className={`h-full transition-all duration-1000 ease-out rounded-full ${progress === 100 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-[#1f70e3] shadow-[0_0_15px_rgba(31,112,227,0.3)]'}`} style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Manifest / Line Items Section */}
            <div className="bg-white dark:bg-[#131b2e] rounded-2xl shadow-sm border border-slate-200 dark:border-[#434655]/20 mb-8 overflow-hidden">
                <div className="px-8 py-6 bg-slate-50 dark:bg-[#0b1326]/30 border-b border-slate-200 dark:border-[#434655]/20">
                    <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-[#dae2fd]">Line Item Manifest</h3>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-[#8d90a1] uppercase tracking-wider mt-1">Confirmed products and service configurations</p>
                </div>
                {!linkedInquiry ? (
                    <div className="p-12 text-center">
                        <Loader2 className="animate-spin text-[#1f70e3] mx-auto mb-4" size={24} />
                        <p className="text-xs font-bold text-slate-500 dark:text-[#8d90a1] uppercase tracking-widest">Hydrating manifest data...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-8">
                        {linkedInquiry.items?.map((item: any) => (
                            <div key={item.id} className="p-5 border border-slate-200 dark:border-[#434655]/20 bg-slate-50 dark:bg-[#0b1326]/40 rounded-2xl flex flex-col group hover:border-[#1f70e3]/30 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${item.service_id ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-[#1f70e3]/10 border-[#1f70e3]/20 text-[#1f70e3]'}`}>
                                            {item.service_id ? <Layers size={18} /> : <Package size={18} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-[#dae2fd]">{item.template_name || item.service_name || 'Standard Item'}</p>
                                            <p className="text-[10px] text-slate-500 dark:text-[#8d90a1] font-bold uppercase tracking-widest mt-0.5">Quantity: <span className="text-blue-600 dark:text-[#adc6ff] font-mono">{item.quantity} units</span></p>
                                        </div>
                                    </div>
                                </div>
                                
                                {item.selected_options && Object.keys(item.selected_options).length > 0 && (
                                    <div className="space-y-1.5 mb-4 bg-slate-50 dark:bg-[#0b1326] p-3 rounded-xl border border-slate-200 dark:border-[#434655]/10">
                                        {Object.entries(item.selected_options).map(([k, v]) => (
                                            <div key={k} className="flex justify-between items-center text-[10px] py-1 border-b border-slate-200 dark:border-[#434655]/5 last:border-0">
                                                <span className="font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1]">{k.replace(/_/g, ' ')}</span>
                                                <span className="font-bold text-slate-900 dark:text-[#dae2fd] underline decoration-[#1f70e3]/30 decoration-2 underline-offset-2">{String(v)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {item.notes && (
                                    <div className="mt-auto pt-4 border-t border-slate-200 dark:border-[#434655]/10 flex items-start gap-2">
                                        <Info size={14} className="text-[#1f70e3] shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-slate-600 dark:text-[#c3c5d8] italic leading-relaxed">"{item.notes}"</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Milestones Section */}
            <div className="bg-white dark:bg-[#131b2e] rounded-2xl shadow-sm border border-slate-200 dark:border-[#434655]/20 mb-8">
                
                {order.is_custom_milestone_requested && (
                    <div className="px-8 py-3 bg-amber-500/10 border-b border-amber-500/20 text-amber-500 font-bold text-[11px] uppercase tracking-widest flex flex-col md:flex-row gap-2 justify-between items-start md:items-center">
                        <span className="flex items-center gap-2">
                            <Info size={14} className="animate-pulse" />
                            Client requested a custom payment schedule.
                        </span>
                    </div>
                )}
                
                <div className="px-8 py-6 flex flex-col md:flex-row items-start md:items-center justify-between bg-slate-50 dark:bg-[#0b1326]/30 border-b border-slate-200 dark:border-[#434655]/20 gap-4">
                    <div>
                        <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-[#dae2fd]">Payment Trajectories</h3>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-[#8d90a1] uppercase tracking-wider mt-1">Scheduled transaction release points</p>
                    </div>
                    <button 
                        onClick={() => {
                            setSplitType(order.split_type === 'FULL' || order.split_type === 'CUSTOM' ? order.split_type : 'HALF');
                            setShowReschedule(true);
                        }}
                        disabled={amountPaid > 0} 
                        title={amountPaid > 0 ? "Cannot reschedule schedule when payments are present." : ""}
                        className="bg-slate-50 dark:bg-[#171f33] text-slate-500 dark:text-[#8d90a1] border border-slate-200 dark:border-[#434655]/40 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:text-blue-600 dark:hover:text-[#adc6ff] hover:border-blue-400 dark:hover:border-[#adc6ff]/50 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 shadow-sm"
                    >
                        <RotateCw size={14} />
                        Reschedule Protocol
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-[#0b1326]/50 border-b border-slate-200 dark:border-[#434655]/10">
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-[#8d90a1]">Phase Identifier</th>
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-[#8d90a1]">Weight</th>
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-[#8d90a1]">Value</th>
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-[#8d90a1]">Verification</th>
                                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-[#8d90a1]">Settlement Date</th>
                                <th className="px-8 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#434655]/10">
                            {order.milestones?.filter((m: any) => !order.split_type || m.split_type === order.split_type).sort((a: any, b: any) => a.order_index - b.order_index).map((m: any, idx: number) => (
                                <tr key={m.id || idx} className="hover:bg-slate-50 dark:hover:bg-[#171f33]/40 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <span className="w-7 h-7 flex items-center justify-center bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/40 rounded-lg text-[10px] font-bold text-[#1f70e3] shadow-inner">{idx + 1}</span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-[#dae2fd]">{m.label}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-[11px] font-bold text-blue-600 dark:text-[#adc6ff] bg-[#1f70e3]/10 px-2 py-0.5 rounded border border-[#1f70e3]/20">{m.percentage}%</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-sm font-black text-slate-900 dark:text-[#dae2fd]">₹{m.amount.toLocaleString()}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <LocalStatusPill status={m.status} />
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-[11px] font-medium text-slate-500 dark:text-[#8d90a1]">
                                            {m.paid_at ? new Date(m.paid_at).toLocaleDateString() : '—'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                                        {m.status === 'UNPAID' && (
                                            <button 
                                                onClick={() => navigate(`/offline-payment?orderId=${order.id}&milestoneId=${m.id}`)}
                                                className="text-[10px] font-black uppercase tracking-widest text-[#1f70e3] hover:text-blue-600 dark:hover:text-[#adc6ff] transition-colors border border-transparent hover:border-[#1f70e3]/20 px-3 py-1.5 rounded-lg bg-[#1f70e3]/5"
                                            >
                                                Record Payment
                                            </button>
                                        )}
                                        <button className="text-[10px] font-black uppercase tracking-widest text-[#1f70e3] hover:text-blue-600 dark:hover:text-[#adc6ff] transition-colors border border-transparent hover:border-[#1f70e3]/20 px-3 py-1.5 rounded-lg bg-[#1f70e3]/5">
                                            Logs
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {(!order.milestones || order.milestones.length === 0) && (
                                <tr>
                                    <td colSpan={6} className="px-8 py-12 text-center text-slate-500 dark:text-[#8d90a1] italic text-sm font-medium">No verified milestones found in system register.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Row: Status Control & Transaction History */}
            <div className="grid grid-cols-12 gap-8 items-start">
                {/* Order Status Management */}
                <div className="col-span-12 lg:col-span-5 bg-white dark:bg-[#131b2e] rounded-2xl p-8 border border-slate-200 dark:border-[#434655]/20 shadow-sm">
                    <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-[#dae2fd] mb-8 border-b border-slate-200 dark:border-[#434655]/20 pb-4">Operational State</h3>
                    <div className="space-y-8">
                        <div className="bg-slate-50 dark:bg-[#0b1326] p-5 rounded-2xl border border-slate-200 dark:border-[#434655]/20 flex justify-between items-center shadow-inner">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-[#8d90a1] uppercase tracking-[0.2em]">Active Status</span>
                            <LocalStatusPill status={order.status} />
                        </div>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-[#8d90a1] uppercase tracking-[0.2em]">Manual State Override</label>
                                <select 
                                    className="w-full bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/30 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-[#dae2fd] outline-none focus:border-[#1f70e3] transition-colors appearance-none"
                                    onChange={(e) => {
                                        if(window.confirm(`Are you sure you want to change status to ${e.target.value}?`)) {
                                            setUpdating(true);
                                            api(`/admin/orders/${order.id}/status`, {
                                                method: 'PATCH',
                                                body: JSON.stringify({ status: e.target.value, admin_notes: "Manual override from dashboard." })
                                            }).then((res: any) => {
                                                if (res && res.id) window.location.reload();
                                            }).catch((err) => {
                                                console.error(err);
                                                alert("Failed to update status. Please check console.");
                                            }).finally(() => {
                                                setUpdating(false);
                                            });
                                        }
                                    }}
                                    value={order.status}
                                    disabled={updating}
                                >
                                    <option value={order.status} disabled>Current: {order.status}</option>
                                    <option value="PROCESSING">PROCESSING</option>
                                    <option value="READY">READY</option>
                                    <option value="SHIPPED">SHIPPED</option>
                                    <option value="DELIVERED">DELIVERED</option>
                                    <option value="CANCELLED">CANCELLED</option>
                                </select>
                            </div>
                            {updating && <Loader2 className="animate-spin text-[#1f70e3] mx-auto" size={20} />}
                            <p className="text-[10px] text-[#1f70e3] font-bold text-center uppercase tracking-widest opacity-60">System validation required for status shifts</p>
                        </div>
                        <div className="pt-8 border-t border-slate-200 dark:border-[#434655]/20 space-y-4">
                            <button className="w-full h-12 bg-rose-500/5 text-rose-400 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-500/10 transition-all flex items-center justify-center gap-2">
                                <XCircle size={16} />
                                Terminate Protocol
                            </button>
                        </div>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="col-span-12 lg:col-span-7 bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 shadow-sm overflow-hidden flex flex-col min-h-[460px]">
                    <div className="px-8 py-6 border-b border-slate-200 dark:border-[#434655]/20 bg-slate-50 dark:bg-[#0b1326]/30">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-[#dae2fd]">Transaction Ledger</h3>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-[#8d90a1] uppercase tracking-wider mt-1">Immutable financial event history</p>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-[#0b1326]/20 border-b border-slate-200 dark:border-[#434655]/10">
                                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1]">Timestamp</th>
                                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1]">Quantum</th>
                                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1]">Medium</th>
                                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1]">Reference Hash</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#434655]/10">
                                {order.transactions?.map((t: any) => (
                                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-[#171f33]/40 transition-colors">
                                        <td className="px-8 py-5 text-xs text-slate-500 dark:text-[#8d90a1] font-medium">{new Date(t.created_at).toLocaleDateString()}</td>
                                        <td className="px-8 py-5 text-sm font-black text-blue-600 dark:text-[#adc6ff]">₹{t.amount.toLocaleString()}</td>
                                        <td className="px-8 py-5">
                                            <span className="text-[10px] px-2.5 py-1 bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 rounded-full text-slate-900 dark:text-[#dae2fd] font-bold uppercase tracking-widest">
                                                {t.payment_mode}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-[11px] font-mono text-slate-600 dark:text-[#c3c5d8] opacity-80">{t.utr_number || t.gateway_payment_id || 'INTERNAL_TRANS'}</td>
                                    </tr>
                                ))}
                                {(!order.transactions || order.transactions.length === 0) && (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-32 text-center text-slate-500 dark:text-[#8d90a1] text-sm font-medium italic opacity-40">Empty Ledger — Proceed to Payment Verification</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Payment Declarations Ledger */}
            {order.declarations && order.declarations.length > 0 && (
                <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 shadow-sm overflow-hidden flex flex-col mb-8 mt-8">
                    <div className="px-8 py-6 border-b border-slate-200 dark:border-[#434655]/20 bg-slate-50 dark:bg-[#0b1326]/30">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-[#dae2fd]">Payment Declarations</h3>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-[#8d90a1] uppercase tracking-wider mt-1">Offline payments pending verification</p>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-[#0b1326]/20 border-b border-slate-200 dark:border-[#434655]/10">
                                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1]">Timestamp</th>
                                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1]">Status</th>
                                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1]">Mode</th>
                                    <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1]">Proof / UTR</th>
                                    <th className="px-8 py-4 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#434655]/10">
                                {order.declarations.map((d: any) => (
                                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-[#171f33]/40 transition-colors">
                                        <td className="px-8 py-5 text-xs text-slate-500 dark:text-[#8d90a1] font-medium">{new Date(d.created_at).toLocaleDateString()}</td>
                                        <td className="px-8 py-5">
                                            <LocalStatusPill status={d.status} />
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-[10px] px-2.5 py-1 bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 rounded-full text-slate-900 dark:text-[#dae2fd] font-bold uppercase tracking-widest">
                                                {d.payment_mode}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-[11px] font-mono text-slate-600 dark:text-[#c3c5d8] opacity-80">
                                            {d.utr_number || (d.screenshot_url ? 'SCREENSHOT' : '—')}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <Link to={`/declarations/${d.id}`} className="text-[10px] font-black uppercase tracking-widest text-[#1f70e3] hover:text-blue-600 dark:hover:text-[#adc6ff] transition-colors border border-transparent hover:border-[#1f70e3]/20 px-3 py-1.5 rounded-lg bg-[#1f70e3]/5">
                                                Review
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Invoice Data Editor */}
            <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 shadow-sm overflow-hidden mb-8 mt-8">
                <div className="px-8 py-6 border-b border-slate-200 dark:border-[#434655]/20 bg-slate-50 dark:bg-[#0b1326]/30 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-[#dae2fd] flex items-center gap-2">
                            <FileText size={20} className="text-[#1f70e3]" />
                            Invoice Configuration
                        </h3>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-[#8d90a1] uppercase tracking-wider mt-1">
                            {invoiceConfigured ? '✓ Configured' : '⚠ Not configured — fill in line items'}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setShowInvoiceEditor(!showInvoiceEditor);
                            if (!showInvoiceEditor && !invoiceData) fetchInvoiceData();
                        }}
                        className="text-[10px] font-bold uppercase tracking-widest text-[#1f70e3] hover:text-blue-700 dark:hover:text-[#adc6ff] transition-colors border border-[#1f70e3]/20 px-4 py-2 rounded-xl bg-[#1f70e3]/5 hover:bg-[#1f70e3]/10"
                    >
                        {showInvoiceEditor ? 'Collapse' : 'Configure'}
                    </button>
                </div>

                {showInvoiceEditor && (
                    <div className="p-6">
                        {invoiceLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 size={24} className="animate-spin text-[#1f70e3]" />
                            </div>
                        ) : invoiceData ? (
                            <div className="space-y-6">
                                {/* Warning Banner */}
                                {invoiceWarning && (
                                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                                        <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
                                        <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">{invoiceWarning}</p>
                                    </div>
                                )}

                                {/* Line Items Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-100 dark:bg-[#0b1326]/40 border-b border-slate-200 dark:border-[#434655]/20">
                                                <th className="px-3 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1] w-[200px]">Description</th>
                                                <th className="px-3 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1] w-16">Qty</th>
                                                <th className="px-3 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1] w-24">Unit Price</th>
                                                <th className="px-3 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1] w-20">HSN/SAC</th>
                                                <th className="px-3 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1] w-16">CGST%</th>
                                                <th className="px-3 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1] w-16">SGST%</th>
                                                <th className="px-3 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1] w-16">IGST%</th>
                                                <th className="px-3 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1] w-16">CESS%</th>
                                                <th className="px-3 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1] w-24 text-right">Total</th>
                                                <th className="px-3 py-3 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-[#434655]/10">
                                            {invoiceData.items?.map((item: any, idx: number) => {
                                                const lineTotal = (item.unit_price || 0) * (item.quantity || 1);
                                                return (
                                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-[#171f33]/30 transition-colors">
                                                        <td className="px-3 py-2">
                                                            <input type="text" value={item.description || ''}
                                                                onChange={e => updateInvoiceItem(idx, 'description', e.target.value)}
                                                                className="w-full bg-transparent border border-slate-200 dark:border-[#434655]/30 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-[#dae2fd] focus:border-[#1f70e3] outline-none"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input type="number" value={item.quantity || ''}
                                                                onChange={e => updateInvoiceItem(idx, 'quantity', Number(e.target.value))}
                                                                className="w-full bg-transparent border border-slate-200 dark:border-[#434655]/30 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-[#dae2fd] focus:border-[#1f70e3] outline-none text-center"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input type="number" step="0.01" value={item.unit_price ?? ''}
                                                                onChange={e => updateInvoiceItem(idx, 'unit_price', Number(e.target.value))}
                                                                className="w-full bg-transparent border border-slate-200 dark:border-[#434655]/30 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-[#dae2fd] focus:border-[#1f70e3] outline-none text-right"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input type="text" value={item.hsn_sac || ''}
                                                                onChange={e => updateInvoiceItem(idx, 'hsn_sac', e.target.value)}
                                                                className="w-full bg-transparent border border-slate-200 dark:border-[#434655]/30 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-[#dae2fd] focus:border-[#1f70e3] outline-none text-center"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input type="number" step="0.01" value={item.cgst_rate ?? ''}
                                                                onChange={e => updateInvoiceItem(idx, 'cgst_rate', Number(e.target.value))}
                                                                className="w-full bg-transparent border border-slate-200 dark:border-[#434655]/30 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-[#dae2fd] focus:border-[#1f70e3] outline-none text-center"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input type="number" step="0.01" value={item.sgst_rate ?? ''}
                                                                onChange={e => updateInvoiceItem(idx, 'sgst_rate', Number(e.target.value))}
                                                                className="w-full bg-transparent border border-slate-200 dark:border-[#434655]/30 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-[#dae2fd] focus:border-[#1f70e3] outline-none text-center"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input type="number" step="0.01" value={item.igst_rate ?? ''}
                                                                onChange={e => updateInvoiceItem(idx, 'igst_rate', Number(e.target.value))}
                                                                className="w-full bg-transparent border border-slate-200 dark:border-[#434655]/30 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-[#dae2fd] focus:border-[#1f70e3] outline-none text-center"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input type="number" step="0.01" value={item.cess_rate ?? ''}
                                                                onChange={e => updateInvoiceItem(idx, 'cess_rate', Number(e.target.value))}
                                                                className="w-full bg-transparent border border-slate-200 dark:border-[#434655]/30 rounded-lg px-2 py-1.5 text-xs text-slate-900 dark:text-[#dae2fd] focus:border-[#1f70e3] outline-none text-center"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            <span className="text-xs font-bold text-slate-900 dark:text-[#dae2fd]">₹{lineTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                                                        </td>
                                                        <td className="px-2 py-2">
                                                            <button onClick={() => removeInvoiceItem(idx)} disabled={invoiceData.items.length <= 1}
                                                                className="text-rose-400 hover:text-rose-600 disabled:opacity-20 transition-colors">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    <button onClick={addInvoiceItem}
                                        className="w-full mt-2 py-2.5 border border-dashed border-slate-300 dark:border-[#434655]/40 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1] hover:text-[#1f70e3] hover:border-[#1f70e3]/40 hover:bg-[#1f70e3]/5 transition-colors flex items-center justify-center gap-2">
                                        <Plus size={12} /> Add Line Item
                                    </button>
                                </div>

                                {/* Order-level fields */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-[#0b1326]/30 rounded-xl p-4">
                                    <div>
                                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1] mb-1 block">Shipping ₹</label>
                                        <input type="number" step="0.01" value={invoiceData.shipping_amount ?? ''}
                                            onChange={e => setInvoiceData({...invoiceData, shipping_amount: Number(e.target.value)})}
                                            className="w-full bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/30 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-[#dae2fd] focus:border-[#1f70e3] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1] mb-1 block">Shipping GST%</label>
                                        <input type="number" step="0.01" value={invoiceData.shipping_gst_rate ?? ''}
                                            onChange={e => setInvoiceData({...invoiceData, shipping_gst_rate: Number(e.target.value)})}
                                            className="w-full bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/30 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-[#dae2fd] focus:border-[#1f70e3] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1] mb-1 block">Place of Supply</label>
                                        <input type="text" value={invoiceData.place_of_supply ?? ''}
                                            onChange={e => setInvoiceData({...invoiceData, place_of_supply: e.target.value})}
                                            className="w-full bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/30 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-[#dae2fd] focus:border-[#1f70e3] outline-none"
                                            placeholder="e.g. Delhi"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={invoiceData.reverse_charge || false}
                                                onChange={e => setInvoiceData({...invoiceData, reverse_charge: e.target.checked})}
                                                className="w-4 h-4 rounded border-slate-300 text-[#1f70e3] focus:ring-[#1f70e3]"
                                            />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-[#c3c5d8]">Reverse Charge</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Running Total */}
                                <div className="bg-slate-100 dark:bg-[#0b1326]/50 rounded-xl p-4 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1]">Items Subtotal: <span className="text-slate-900 dark:text-[#dae2fd]">₹{calcItemsTotal().toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1]">Tax Total: <span className="text-slate-900 dark:text-[#dae2fd]">₹{calcTaxTotal().toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></div>
                                        <div className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-[#dae2fd]">Computed Grand Total: ₹{calcGrandTotal().toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1]">Order Total (Source)</div>
                                        <div className={`text-xl font-black ${Math.abs(calcGrandTotal() - orderTotal) > 2 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                            ₹{orderTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                                        </div>
                                        {Math.abs(calcGrandTotal() - orderTotal) > 2 && (
                                            <p className="text-[9px] text-amber-500 font-bold mt-1">⚠ Mismatch: ₹{Math.abs(calcGrandTotal() - orderTotal).toFixed(2)}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-3">
                                    <button onClick={handleSaveInvoiceData} disabled={invoiceSaving}
                                        className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-slate-200 dark:border-[#434655]/30 text-slate-600 dark:text-[#c3c5d8] hover:bg-slate-50 dark:hover:bg-[#171f33] transition-colors flex items-center gap-2 disabled:opacity-50">
                                        {invoiceSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                        Save Invoice Data
                                    </button>
                                    <button onClick={handlePreviewInvoice} disabled={previewLoading}
                                        className="bg-linear-to-br from-[#1f70e3] to-[#004395] text-white px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-[#1f70e3]/20 hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50">
                                        {previewLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                                        Save & Preview
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500 dark:text-[#8d90a1] text-sm">
                                No invoice data available. Click configure to load.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Reschedule Modal */}
            {showReschedule && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-[#131b2e] rounded-2xl w-full max-w-lg shadow-[0_0_40px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-[#434655]/30 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-200 dark:border-[#434655]/20 flex justify-between items-center bg-slate-50 dark:bg-[#0b1326]/40">
                            <div>
                                <h3 className="text-lg font-extrabold text-slate-900 dark:text-[#dae2fd]">Reschedule Protocol</h3>
                                <p className="text-[10px] text-slate-500 dark:text-[#8d90a1] font-bold uppercase tracking-widest mt-1">Configure Payment Architecture</p>
                            </div>
                            <button onClick={() => setShowReschedule(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-[#dae2fd] transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-[#8d90a1]">Configuration Blueprint</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['HALF', 'FULL', 'CUSTOM'] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setSplitType(type)}
                                            className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${splitType === type ? 'bg-[#1f70e3]/10 border-[#1f70e3] text-[#1f70e3] shadow-[0_0_20px_rgba(31,112,227,0.15)]' : 'bg-white dark:bg-[#0b1326] border-slate-200 dark:border-[#434655]/30 text-slate-500 dark:text-[#8d90a1] hover:border-[#1f70e3]/50 hover:bg-[#1f70e3]/5'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {splitType === 'CUSTOM' && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-[#434655]/20">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-[#8d90a1]">Custom Milestones Array</span>
                                        <span className={`text-[11px] font-black uppercase tracking-widest ${customMilestones.reduce((acc, c) => acc + Number(c.percentage), 0) === 100 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            Balance: {customMilestones.reduce((acc, c) => acc + Number(c.percentage || 0), 0)}%
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                        {customMilestones.map((m, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={m.label}
                                                    onChange={e => {
                                                        const newM = [...customMilestones];
                                                        newM[idx].label = e.target.value;
                                                        setCustomMilestones(newM);
                                                    }}
                                                    placeholder={`Phase ${idx + 1} identifier`}
                                                    className="flex-1 bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 dark:text-[#dae2fd] focus:border-[#1f70e3] outline-none"
                                                />
                                                <div className="relative w-24 shrink-0">
                                                    <input
                                                        type="number"
                                                        value={m.percentage || ''}
                                                        onChange={e => {
                                                            const newM = [...customMilestones];
                                                            newM[idx].percentage = Number(e.target.value);
                                                            setCustomMilestones(newM);
                                                        }}
                                                        placeholder="0"
                                                        min="0"
                                                        max="100"
                                                        className="w-full bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 dark:text-[#dae2fd] focus:border-[#1f70e3] outline-none text-right pr-6"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -transform-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">%</span>
                                                </div>
                                                <button 
                                                    onClick={() => setCustomMilestones(customMilestones.filter((_, i) => i !== idx))}
                                                    disabled={customMilestones.length <= 2}
                                                    className="w-10 h-10 shrink-0 bg-slate-50 dark:bg-[#0b1326] flex items-center justify-center rounded-lg border border-slate-200 dark:border-[#434655]/30 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <button
                                        onClick={() => setCustomMilestones([...customMilestones, {label: '', percentage: 0}])}
                                        disabled={customMilestones.length >= 5}
                                        className="w-full py-3 border border-dashed border-slate-300 dark:border-[#434655]/50 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-[#8d90a1] hover:text-[#1f70e3] hover:border-[#1f70e3]/40 hover:bg-[#1f70e3]/5 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                                    >
                                        + Inject Schema Phase
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-6 border-t border-slate-200 dark:border-[#434655]/20 bg-slate-50 dark:bg-[#0b1326]/40 flex justify-end gap-3">
                            <button onClick={() => setShowReschedule(false)} className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1] hover:text-slate-700 dark:hover:text-[#dae2fd] transition-colors">
                                Abort
                            </button>
                            <button
                                onClick={handleReschedule}
                                disabled={rescheduling}
                                className="bg-linear-to-br from-[#1f70e3] to-[#004395] text-white px-6 py-2.5 flex items-center gap-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-[#1f70e3]/20 hover:opacity-90 disabled:opacity-50 transition-all"
                            >
                                {rescheduling ? <Loader2 className="animate-spin" size={16} /> : <RotateCw size={16} />}
                                Execute Rewrite
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
