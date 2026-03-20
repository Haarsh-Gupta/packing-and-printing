import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Order, OrderStatus } from "@/types";
import {
    Download, Trash2, Search, X, Loader2, MapPin, CreditCard, Calendar, Printer, Plus, Minus
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_TABS = ["All", "Waiting_payment", "Partially_paid", "Paid", "Processing", "Ready", "Completed", "Cancelled"];

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
    WAITING_PAYMENT: { color: '#d97706', bg: '#fffbeb' },
    PARTIALLY_PAID: { color: '#2563eb', bg: '#eff6ff' },
    PAID: { color: '#16a34a', bg: '#f0fdf4' },
    PROCESSING: { color: '#8b5cf6', bg: '#f5f3ff' },
    READY: { color: '#0ea5e9', bg: '#e0f2fe' },
    COMPLETED: { color: '#059669', bg: '#d1fae5' },
    CANCELLED: { color: '#dc2626', bg: '#fef2f2' },
};

const StatusPill = ({ status }: { status: string }) => {
    const cfg = STATUS_CONFIG[status] || { color: '#71717a', bg: '#f4f4f5' };
    const label = status.charAt(0) + status.slice(1).toLowerCase();
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px',
            background: cfg.bg, borderRadius: '999px', fontSize: '11px', fontWeight: 600,
            color: cfg.color, fontFamily: "'Inter', system-ui",
        }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
            {label}
        </span>
    );
};

export default function Orders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Order | null>(null);
    const [updating, setUpdating] = useState(false);
    const [newStatus, setNewStatus] = useState<OrderStatus | "">("");
    const [fullOrder, setFullOrder] = useState<any | null>(null);
    const [editingSchedule, setEditingSchedule] = useState(false);
    const [customMilestones, setCustomMilestones] = useState<{label: string; percentage: number}[]>([]);
    const [linkedInquiry, setLinkedInquiry] = useState<any | null>(null);
    const [rightWidth, setRightWidth] = useState<number>(350);

    const [recordingPayment, setRecordingPayment] = useState<{ milestone_id: string; amount: number; label: string } | null>(null);
    const [paymentMode, setPaymentMode] = useState<string>("BANK_TRANSFER");
    const [paymentNotes, setPaymentNotes] = useState("");
    const [confirmText, setConfirmText] = useState("");
    const [submittingPayment, setSubmittingPayment] = useState(false);

    const handleRecordPayment = async () => {
        if (!selected || !recordingPayment || confirmText !== "CONFIRM") return;
        setSubmittingPayment(true);
        try {
            await api(`/admin/orders/${selected.id}/payments`, {
                method: "POST",
                body: JSON.stringify({
                    milestone_id: recordingPayment.milestone_id,
                    amount: recordingPayment.amount,
                    payment_mode: paymentMode,
                    notes: paymentNotes || undefined
                })
            });
            const data = await api(`/admin/orders/${selected.id}`);
            setFullOrder(data);
            fetchOrders();
            setRecordingPayment(null);
            setPaymentNotes("");
            setConfirmText("");
            setPaymentMode("BANK_TRANSFER");
        } catch (e: any) {
            alert(e.message || "Failed to record offline payment");
        } finally {
            setSubmittingPayment(false);
        }
    };

    const fetchOrders = () => {
        setLoading(true);
        let url = "/admin/orders/all?skip=0&limit=100";
        if (statusFilter !== "All") url += `&status_filter=${statusFilter.toUpperCase().replace(/ /g, "_")}`;
        api<Order[]>(url).then(setOrders).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { fetchOrders(); }, [statusFilter]);

    const updateStatus = async () => {
        if (!selected || !newStatus) return;
        setUpdating(true);
        try {
            await api(`/admin/orders/${selected.id}/status`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
            fetchOrders();
            setSelected(prev => prev ? { ...prev, status: newStatus } : null);
        } catch (e) { console.error(e); }
        finally { setUpdating(false); }
    };

    const handleSelectOrder = async (order: Order) => {
        setSelected(order);
        setNewStatus(order.status);
        setFullOrder(null);
        setEditingSchedule(false);
        setLinkedInquiry(null);
        try {
            const data = await api(`/admin/orders/${order.id}`);
            setFullOrder(data);
            if (order.inquiry_id) {
                api(`/admin/inquiries/${order.inquiry_id}`).then(setLinkedInquiry).catch(console.error);
            }
        } catch (e) {
            console.error("Failed to load order details", e);
        }
    };

    const updateCustomMilestones = async () => {
        if (!selected) return;
        setUpdating(true);
        try {
            // Server expects POST /admin/orders/{order_id}/milestones
            await api(`/admin/orders/${selected.id}/milestones`, {
                method: "POST",
                body: JSON.stringify({
                    split_type: "CUSTOM",
                    milestones: customMilestones
                })
            });
            // refresh data
            const data = await api(`/admin/orders/${selected.id}`);
            setFullOrder(data);
            setEditingSchedule(false);
        } catch (e: any) {
            alert(e.message || "Failed to update custom milestones.");
        } finally {
            setUpdating(false);
        }
    };

    const filtered = orders.filter(o =>
        !search || o.id.toString().includes(search) ||
        (o as any).user_name?.toLowerCase().includes(search.toLowerCase()) ||
        (o as any).user_email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full font-sans">

            {/* Top bar */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white m-0">
                        Order Management
                    </h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                        {orders.length} orders total
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    {/* Search */}
                    <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input
                            type="text" placeholder="Search by order ID..." value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="h-9 pl-8 pr-3 w-56 border border-slate-200 dark:border-slate-800 rounded-lg text-[13px] text-slate-900 dark:text-white bg-white dark:bg-slate-900 font-sans outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Split view */}
            <div className="flex flex-col xl:flex-row flex-1 min-h-[500px] xl:min-h-0 gap-4">
                {/* Left: Orders Table */}
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                    {/* Status tabs */}
                    <div className="flex items-center gap-0.5 px-4 py-3 border-b border-slate-100 dark:border-slate-800/60 overflow-x-auto">
                        {STATUS_TABS.map(tab => (
                            <button key={tab} onClick={() => setStatusFilter(tab)}
                                style={{
                                    padding: '5px 12px', border: 'none', borderRadius: '7px',
                                    fontSize: '12.5px', fontWeight: statusFilter === tab ? 600 : 400,
                                    color: statusFilter === tab ? '#18181b' : '#71717a',
                                    background: statusFilter === tab ? '#f4f4f5' : 'transparent',
                                    cursor: 'pointer', transition: 'all 0.12s',
                                    fontFamily: "'Inter', system-ui",
                                }}>
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="p-12 text-center text-slate-400 dark:text-slate-500">
                            <Loader2 size={24} className="animate-spin text-blue-500 mx-auto" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-16 text-center text-slate-400 dark:text-slate-500">
                            <p className="text-sm font-medium">No orders found</p>
                        </div>
                    ) : (
                        <div className="overflow-y-auto flex-1">
                            {/* Table header */}
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800/60">
                                        {['ORDER ID', 'CUSTOMER', 'DATE', 'STATUS'].map(h => (
                                            <th key={h} className="px-4 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 text-left tracking-wider">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(order => (
                                        <tr key={order.id}
                                            onClick={() => handleSelectOrder(order)}
                                            className={`border-b cursor-pointer transition-colors ${
                                                selected?.id === order.id 
                                                    ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-900/30' 
                                                    : 'border-slate-50 dark:border-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                            }`}
                                        >
                                            <td className="px-4 py-3.5">
                                                <span className="text-[13px] font-semibold text-blue-500 dark:text-blue-400">
                                                    #{order.id.toString().padStart(4, '0')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <p className="text-[13px] font-medium text-slate-900 dark:text-slate-100 m-0">
                                                    {(order as any).user_name || 'Customer'}
                                                </p>
                                                <p className="text-[11px] text-slate-400 dark:text-slate-500 m-0">
                                                    {(order as any).user_email || ''}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="text-xs text-slate-600 dark:text-slate-400">
                                                    {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <StatusPill status={order.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Right: Detail Panel */}
                {selected ? (
                    <>
                        {/* Resizer Handle */}
                        <div className="hidden xl:flex"
                            style={{ 
                                width: '20px', cursor: 'col-resize', position: 'relative', 
                                alignItems: 'center', justifyContent: 'center', zIndex: 10, flexShrink: 0 
                            }}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                const startX = e.clientX;
                                const startWidth = rightWidth;
                                const onMouseMove = (me: MouseEvent) => {
                                    setRightWidth(Math.max(300, Math.min(800, startWidth - (me.clientX - startX))));
                                };
                                const onMouseUp = () => {
                                    window.removeEventListener('mousemove', onMouseMove);
                                    window.removeEventListener('mouseup', onMouseUp);
                                };
                                window.addEventListener('mousemove', onMouseMove);
                                window.addEventListener('mouseup', onMouseUp);
                            }}
                        >
                            <div style={{ width: '4px', height: '32px', background: '#d4d4d8', borderRadius: '4px', transition: 'background 0.2s' }} 
                                 onMouseEnter={e => e.currentTarget.style.background = '#a1a1aa'}
                                 onMouseLeave={e => e.currentTarget.style.background = '#d4d4d8'} />
                        </div>

                        <div className="w-full shrink-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden flex flex-col min-h-[400px]" style={{ width: window.innerWidth >= 1280 ? `${rightWidth}px` : '100%' }}>
                        {/* Detail header */}
                        <div className="px-5 pt-4 pb-3.5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                            <div>
                                <h2 className="text-[15px] font-bold text-slate-900 dark:text-white m-0">Order Details</h2>
                                <p className="text-xs text-blue-500 dark:text-blue-400 font-semibold mt-0.5 mb-0">#{selected.id.toString().padStart(4, '0')}</p>
                            </div>
                            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5">
                            {/* Total Amount */}
                            <div className="mb-5">
                                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.06em] mb-1.5 m-0">TOTAL AMOUNT</p>
                                <div className="flex items-center gap-2.5">
                                    <span className="text-[26px] font-bold tracking-tight text-slate-900 dark:text-white">
                                        ₹{selected.total_amount.toLocaleString()}
                                    </span>
                                    <StatusPill status={selected.status} />
                                </div>
                            </div>

                            {/* Quick info */}
                            <div className="flex flex-col gap-2 mb-5 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <Calendar size={13} className="text-slate-400 dark:text-slate-500" />
                                    <span className="text-xs text-slate-600 dark:text-slate-300">
                                        {new Date(selected.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CreditCard size={13} className="text-slate-400 dark:text-slate-500" />
                                    <span className="text-xs text-slate-600 dark:text-slate-300">
                                        {(selected as any).payment_method || 'Visa ending in 4242'}
                                    </span>
                                </div>
                            </div>

                            {/* Linked Quotation */}
                            {linkedInquiry?.active_quote && (
                                <div className="mb-5 p-3.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20">
                                    <p className="text-[11px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-1.5 m-0 text-left">APPROVED QUOTE (v{linkedInquiry.active_quote.version_number})</p>
                                    <div className="flex justify-between items-center text-left">
                                        <span className="text-lg font-extrabold text-blue-800 dark:text-blue-300 tracking-tight">₹{linkedInquiry.active_quote.total_price.toLocaleString()}</span>
                                        <a href={`/inquiries/${selected.inquiry_id}`} target="_blank" rel="noreferrer" className="text-xs text-blue-500 dark:text-blue-400 font-semibold flex items-center gap-1 hover:underline">
                                            View Inquiry ↗
                                        </a>
                                    </div>
                                    <p className="text-[11px] text-blue-400 dark:text-blue-500/70 font-medium mt-1.5 m-0 text-left">Generated on {new Date(linkedInquiry.active_quote.created_at).toLocaleDateString()}</p>
                                </div>
                            )}

                            {/* Payment Schedule */}
                            {fullOrder && (
                                <div className="mb-5">
                                    <div className="flex items-center justify-between mb-2.5">
                                        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider m-0">PAYMENT SCHEDULE</p>
                                        {fullOrder.amount_paid === 0 && (
                                            <button 
                                                onClick={() => {
                                                    if (!editingSchedule) {
                                                        if (fullOrder.milestones?.length >= 2) {
                                                            setCustomMilestones(fullOrder.milestones.map((m: any) => ({ label: m.label, percentage: m.percentage })));
                                                        } else {
                                                            setCustomMilestones([{ label: "Advance", percentage: 50 }, { label: "Balance", percentage: 50 }]);
                                                        }
                                                    }
                                                    setEditingSchedule(!editingSchedule);
                                                }}
                                                className="text-[11px] font-semibold text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 bg-transparent border-none p-0 cursor-pointer"
                                            >
                                                {editingSchedule ? 'Cancel Edit' : 'Edit Schedule'}
                                            </button>
                                        )}
                                    </div>
                                    
                                    {!editingSchedule ? (
                                        <div className="flex flex-col gap-2">
                                            {fullOrder.milestones?.slice().sort((a: any, b: any) => a.order_index - b.order_index).map((m: any, idx: number) => (
                                                <div key={m.id || idx} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                                    <div>
                                                        <p className="text-[13px] font-semibold text-slate-900 dark:text-white m-0 text-left">{idx + 1}. {m.label} ({m.percentage}%)</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0 text-left">₹{m.amount.toLocaleString()}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-left">
                                                        {m.status === 'UNPAID' && (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setRecordingPayment({ milestone_id: m.id, amount: m.amount, label: m.label }); setConfirmText(""); }}
                                                                className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
                                                            >
                                                                Record Payment
                                                            </button>
                                                        )}
                                                        <StatusPill status={m.status} />
                                                    </div>
                                                </div>
                                            ))}
                                            {(!fullOrder.milestones || fullOrder.milestones.length === 0) && (
                                                <p className="text-xs text-slate-400 dark:text-slate-500 m-0 text-left">No milestones found.</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ padding: '12px', border: '1px solid #e4e4e7', borderRadius: '10px', background: 'white' }}>
                                            {customMilestones.map((cm, idx) => (
                                                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                                    <input 
                                                        value={cm.label} 
                                                        onChange={(e) => {
                                                            const newM = [...customMilestones];
                                                            newM[idx].label = e.target.value;
                                                            setCustomMilestones(newM);
                                                        }}
                                                        placeholder="Label"
                                                        style={{ flex: 1, height: '32px', border: '1px solid #e4e4e7', borderRadius: '6px', padding: '0 8px', fontSize: '12px' }}
                                                    />
                                                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e4e4e7', borderRadius: '6px', background: '#f9f9f9' }}>
                                                        <input 
                                                            type="number" value={cm.percentage === 0 ? '' : cm.percentage} 
                                                            onChange={(e) => {
                                                                const newM = [...customMilestones];
                                                                newM[idx].percentage = Number(e.target.value);
                                                                setCustomMilestones(newM);
                                                            }}
                                                            placeholder="%"
                                                            style={{ width: '45px', height: '30px', border: 'none', background: 'transparent', padding: '0 8px', fontSize: '12px', textAlign: 'right' }}
                                                        />
                                                        <span style={{ fontSize: '12px', color: '#a1a1aa', paddingRight: '8px', fontWeight: 600 }}>%</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => setCustomMilestones(customMilestones.filter((_, i) => i !== idx))}
                                                        disabled={customMilestones.length <= 2}
                                                        style={{ padding: '6px', color: customMilestones.length <= 2 ? '#d4d4d8' : '#ef4444', background: 'none', border: 'none', cursor: customMilestones.length <= 2 ? 'not-allowed' : 'pointer' }}
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                                <button 
                                                    onClick={() => setCustomMilestones([...customMilestones, { label: "New Milestone", percentage: 0 }])}
                                                    disabled={customMilestones.length >= 5}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: customMilestones.length >= 5 ? '#a1a1aa' : '#18181b', background: 'none', border: 'none', cursor: customMilestones.length >= 5 ? 'not-allowed' : 'pointer', padding: 0 }}
                                                >
                                                    <Plus size={14} /> Add Stage
                                                </button>
                                                <div style={{ fontSize: '12px', fontWeight: 600, color: customMilestones.reduce((s, m) => s + m.percentage, 0) === 100 ? '#16a34a' : '#ef4444' }}>
                                                    Total: {customMilestones.reduce((s, m) => s + m.percentage, 0)}%
                                                </div>
                                            </div>
                                            
                                            <button 
                                                onClick={updateCustomMilestones}
                                                disabled={updating || customMilestones.some(m => !m.label) || customMilestones.reduce((s, m) => s + m.percentage, 0) !== 100}
                                                style={{ width: '100%', height: '32px', marginTop: '12px', background: '#18181b', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: (updating || customMilestones.some(m => !m.label) || customMilestones.reduce((s, m) => s + m.percentage, 0) !== 100) ? 'not-allowed' : 'pointer', opacity: (updating || customMilestones.some(m => !m.label) || customMilestones.reduce((s, m) => s + m.percentage, 0) !== 100) ? 0.5 : 1 }}
                                            >
                                                {updating ? 'Saving...' : 'Save Schedule'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Customer Info */}
                            <div className="mb-5">
                                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5 m-0">CUSTOMER INFORMATION</p>
                                <div className="flex items-center gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                                        {((selected as any).user_name || 'C')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-semibold text-slate-900 dark:text-white m-0 text-left">
                                            {(selected as any).user_name || 'Customer'}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 m-0 text-left">
                                            {(selected as any).user_email || ''}
                                        </p>
                                    </div>
                                </div>
                                {(selected as any).address && (
                                    <div className="flex items-start gap-2 mt-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-left">
                                        <MapPin size={13} className="text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
                                        <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{(selected as any).address}</span>
                                    </div>
                                )}
                            </div>

                            {/* Update Status */}
                            <div>
                                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5 m-0">UPDATE STATUS</p>
                                <Select value={newStatus} onValueChange={(val) => setNewStatus(val as OrderStatus)}>
                                    <SelectTrigger className="h-[38px] rounded-lg text-[13px] font-sans border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-blue-500">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['PROCESSING', 'READY', 'COMPLETED', 'CANCELLED'].map(s => (
                                            <SelectItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <button
                                    onClick={updateStatus}
                                    disabled={updating || newStatus === selected.status}
                                    className={`w-full h-[38px] mt-2 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                                        (updating || newStatus === selected.status)
                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                            : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 cursor-pointer'
                                    }`}
                                >
                                    {updating ? <Loader2 size={13} className="animate-spin" /> : null}
                                    {updating ? 'Updating…' : 'Update Status'}
                                </button>
                            </div>
                        </div>

                        {/* Footer actions */}
                        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/60 flex gap-2">
                            {selected.amount_paid >= selected.total_amount && (
                                <button className="flex-1 h-9 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <Download size={13} /> Download Invoice
                                </button>
                            )}
                            <button className="flex-1 h-9 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <Printer size={13} /> Packing Slip
                            </button>
                        </div>

                        {/* Delete */}
                        <div className="px-5 pb-4">
                            <button className="w-full h-8.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                <Trash2 size={13} /> Delete Order
                            </button>
                        </div>
                    </div>
                    </>
                ) : (
                    <div className="w-[300px] shrink-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex items-center justify-center flex-col text-slate-300 dark:text-slate-600 gap-2.5">
                        <Search size={28} className="opacity-40" />
                        <div className="text-center">
                            <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 m-0">No order selected</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 m-0">Click a row to view details</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Offline Payment Modal */}
            {recordingPayment && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '360px', background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#18181b' }}>Record Offline Payment</h3>
                        
                        <div style={{ marginBottom: '16px' }}>
                            <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px' }}>Milestone</p>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#18181b', margin: 0 }}>{recordingPayment.label}</p>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px' }}>Amount</p>
                            <p style={{ fontSize: '18px', fontWeight: 700, color: '#3b82f6', margin: 0 }}>₹{recordingPayment.amount.toLocaleString()}</p>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Payment Mode</label>
                            <Select value={paymentMode} onValueChange={setPaymentMode}>
                                <SelectTrigger style={{ width: '100%', height: '36px', borderRadius: '8px' }}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASH">Cash</SelectItem>
                                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Notes {paymentMode === 'CHEQUE' && "(Required for Cheque)"}</label>
                            <input 
                                type="text"
                                placeholder={paymentMode === 'CHEQUE' ? "Enter Cheque Number" : "Optional notes"}
                                value={paymentNotes}
                                onChange={e => setPaymentNotes(e.target.value)}
                                style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid #e4e4e7', padding: '0 10px', fontSize: '13px' }}
                            />
                        </div>

                        <div style={{ marginBottom: '24px', padding: '12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: '#b91c1c', fontWeight: 600, marginBottom: '6px' }}>Type 'CONFIRM' to finalize this offline payment.</label>
                            <input 
                                type="text"
                                placeholder="CONFIRM"
                                value={confirmText}
                                onChange={e => setConfirmText(e.target.value.toUpperCase())}
                                style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #fecaca', background: 'white', padding: '0 10px', fontSize: '13px', fontWeight: 600, color: '#ef4444', outline: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                                onClick={() => { setRecordingPayment(null); setConfirmText(""); }}
                                style={{ flex: 1, height: '36px', background: '#f4f4f5', color: '#18181b', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                                Cancel
                            </button>
                            <button 
                                onClick={handleRecordPayment}
                                disabled={submittingPayment || confirmText !== 'CONFIRM' || (paymentMode === 'CHEQUE' && !paymentNotes.trim())}
                                style={{ flex: 1, height: '36px', background: '#18181b', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: (submittingPayment || confirmText !== 'CONFIRM' || (paymentMode === 'CHEQUE' && !paymentNotes.trim())) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: (submittingPayment || confirmText !== 'CONFIRM' || (paymentMode === 'CHEQUE' && !paymentNotes.trim())) ? 0.5 : 1 }}>
                                {submittingPayment ? <Loader2 size={14} className="animate-spin" /> : "Verify & Pay"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}