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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', fontFamily: "'Inter', system-ui", height: '100%' }}>

            {/* Top bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.025em', color: '#18181b', margin: 0 }}>
                        Order Management
                    </h1>
                    <p style={{ fontSize: '13px', color: '#71717a', marginTop: '3px' }}>{orders.length} orders total</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Search */}
                    <div style={{ position: 'relative' }}>
                        <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
                        <input
                            type="text" placeholder="Search by order ID..." value={search}
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

            {/* Split view */}
            <div className="flex flex-col xl:flex-row flex-1 min-h-[500px] xl:min-h-0">
                {/* Left: Orders Table */}
                <div className="flex-1 bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden flex flex-col" style={{ minHeight: '400px' }}>
                    {/* Status tabs */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '12px 16px', borderBottom: '1px solid #f4f4f5' }}>
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
                        <div style={{ padding: '48px', textAlign: 'center', color: '#a1a1aa' }}>
                            <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', color: '#3b82f6', margin: '0 auto' }} />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding: '64px', textAlign: 'center', color: '#a1a1aa' }}>
                            <p style={{ fontSize: '14px', fontWeight: 500 }}>No orders found</p>
                        </div>
                    ) : (
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {/* Table header */}
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #f4f4f5' }}>
                                        {['ORDER ID', 'CUSTOMER', 'DATE', 'STATUS'].map(h => (
                                            <th key={h} style={{
                                                padding: '10px 18px', fontSize: '10px', fontWeight: 600,
                                                color: '#a1a1aa', textAlign: 'left', letterSpacing: '0.06em',
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(order => (
                                        <tr key={order.id}
                                            onClick={() => handleSelectOrder(order)}
                                            style={{
                                                borderBottom: '1px solid #f9f9f9',
                                                cursor: 'pointer', transition: 'background 0.1s',
                                                background: selected?.id === order.id ? '#eff6ff' : 'transparent',
                                            }}
                                            onMouseEnter={e => { if (selected?.id !== order.id) e.currentTarget.style.background = '#f9f9f9'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = selected?.id === order.id ? '#eff6ff' : 'transparent'; }}
                                        >
                                            <td style={{ padding: '13px 18px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6' }}>
                                                    #{order.id.toString().padStart(4, '0')}
                                                </span>
                                            </td>
                                            <td style={{ padding: '13px 18px' }}>
                                                <p style={{ fontSize: '13px', fontWeight: 500, color: '#18181b', margin: 0 }}>
                                                    {(order as any).user_name || 'Customer'}
                                                </p>
                                                <p style={{ fontSize: '11px', color: '#a1a1aa', margin: 0 }}>
                                                    {(order as any).user_email || ''}
                                                </p>
                                            </td>
                                            <td style={{ padding: '13px 18px' }}>
                                                <span style={{ fontSize: '12px', color: '#52525b' }}>
                                                    {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </td>
                                            <td style={{ padding: '13px 18px' }}>
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

                        <div className="w-full shrink-0 bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden flex flex-col" style={{ width: window.innerWidth >= 1280 ? `${rightWidth}px` : '100%', minHeight: '400px' }}>
                        {/* Detail header */}
                        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#18181b', margin: 0 }}>Order Details</h2>
                                <p style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600, margin: '2px 0 0' }}>#{selected.id.toString().padStart(4, '0')}</p>
                            </div>
                            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa', padding: '4px' }}>
                                <X size={16} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
                            {/* Total Amount */}
                            <div style={{ marginBottom: '20px' }}>
                                <p style={{ fontSize: '11px', fontWeight: 500, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>TOTAL AMOUNT</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', color: '#18181b' }}>
                                        ₹{selected.total_amount.toLocaleString()}
                                    </span>
                                    <StatusPill status={selected.status} />
                                </div>
                            </div>

                            {/* Quick info */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', padding: '14px', background: '#f9f9f9', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Calendar size={13} style={{ color: '#a1a1aa' }} />
                                    <span style={{ fontSize: '12px', color: '#52525b' }}>
                                        {new Date(selected.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CreditCard size={13} style={{ color: '#a1a1aa' }} />
                                    <span style={{ fontSize: '12px', color: '#52525b' }}>
                                        {(selected as any).payment_method || 'Visa ending in 4242'}
                                    </span>
                                </div>
                            </div>

                            {/* Linked Quotation */}
                            {linkedInquiry?.active_quote && (
                                <div style={{ marginBottom: '20px', padding: '14px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #2563eb30' }}>
                                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>APPROVED QUOTE (v{linkedInquiry.active_quote.version_number})</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '18px', fontWeight: 800, color: '#1e40af', letterSpacing: '-0.03em' }}>₹{linkedInquiry.active_quote.total_price.toLocaleString()}</span>
                                        <a href={`/inquiries/${selected.inquiry_id}`} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            View Inquiry ↗
                                        </a>
                                    </div>
                                    <p style={{ fontSize: '11px', color: '#60a5fa', margin: '6px 0 0', fontWeight: 500 }}>Generated on {new Date(linkedInquiry.active_quote.created_at).toLocaleDateString()}</p>
                                </div>
                            )}

                            {/* Payment Schedule */}
                            {fullOrder && (
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <p style={{ fontSize: '11px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>PAYMENT SCHEDULE</p>
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
                                                style={{ fontSize: '11px', fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', padding: 0 }}
                                            >
                                                {editingSchedule ? 'Cancel Edit' : 'Edit Schedule'}
                                            </button>
                                        )}
                                    </div>
                                    
                                    {!editingSchedule ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {fullOrder.milestones?.slice().sort((a: any, b: any) => a.order_index - b.order_index).map((m: any, idx: number) => (
                                                <div key={m.id || idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f9f9f9', borderRadius: '8px', alignItems: 'center' }}>
                                                    <div>
                                                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#18181b', margin: 0 }}>{idx + 1}. {m.label} ({m.percentage}%)</p>
                                                        <p style={{ fontSize: '12px', color: '#71717a', margin: '2px 0 0' }}>₹{m.amount.toLocaleString()}</p>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {m.status === 'UNPAID' && (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setRecordingPayment({ milestone_id: m.id, amount: m.amount, label: m.label }); setConfirmText(""); }}
                                                                style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 600, color: '#fff', background: '#3b82f6', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'background 0.2s' }}
                                                                onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
                                                                onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}
                                                            >
                                                                Record Payment
                                                            </button>
                                                        )}
                                                        <StatusPill status={m.status} />
                                                    </div>
                                                </div>
                                            ))}
                                            {(!fullOrder.milestones || fullOrder.milestones.length === 0) && (
                                                <p style={{ fontSize: '12px', color: '#a1a1aa', margin: 0 }}>No milestones found.</p>
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
                            <div style={{ marginBottom: '20px' }}>
                                <p style={{ fontSize: '11px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>CUSTOMER INFORMATION</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#f9f9f9', borderRadius: '10px' }}>
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '50%',
                                        background: '#3b82f6', color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '14px', fontWeight: 700, flexShrink: 0,
                                    }}>
                                        {((selected as any).user_name || 'C')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#18181b', margin: 0 }}>
                                            {(selected as any).user_name || 'Customer'}
                                        </p>
                                        <p style={{ fontSize: '12px', color: '#71717a', margin: 0 }}>
                                            {(selected as any).user_email || ''}
                                        </p>
                                    </div>
                                </div>
                                {(selected as any).address && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '8px', padding: '10px 12px', background: '#f9f9f9', borderRadius: '10px' }}>
                                        <MapPin size={13} style={{ color: '#a1a1aa', marginTop: '2px', flexShrink: 0 }} />
                                        <span style={{ fontSize: '12px', color: '#52525b', lineHeight: 1.5 }}>{(selected as any).address}</span>
                                    </div>
                                )}
                            </div>

                            {/* Update Status */}
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>UPDATE STATUS</p>
                                <Select value={newStatus} onValueChange={(val) => setNewStatus(val as OrderStatus)}>
                                    <SelectTrigger style={{ height: '38px', borderRadius: '9px', fontSize: '13px', fontFamily: "'Inter', system-ui" }}>
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
                                    style={{
                                        width: '100%', height: '38px', marginTop: '8px',
                                        background: (updating || newStatus === selected.status) ? '#e4e4e7' : '#18181b',
                                        color: (updating || newStatus === selected.status) ? '#a1a1aa' : 'white',
                                        border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 600,
                                        cursor: (updating || newStatus === selected.status) ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                        fontFamily: "'Inter', system-ui", transition: 'all 0.12s',
                                    }}
                                >
                                    {updating ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : null}
                                    {updating ? 'Updating…' : 'Update Status'}
                                </button>
                            </div>
                        </div>

                        {/* Footer actions */}
                        <div style={{ padding: '14px 20px', borderTop: '1px solid #f4f4f5', display: 'flex', gap: '8px' }}>
                            {selected.amount_paid >= selected.total_amount && (
                                <button style={{
                                    flex: 1, height: '36px', border: '1px solid #e4e4e7', borderRadius: '9px',
                                    background: 'white', fontSize: '12px', fontWeight: 500, color: '#52525b',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                    fontFamily: "'Inter', system-ui",
                                }}>
                                    <Download size={13} /> Download Invoice
                                </button>
                            )}
                            <button style={{
                                flex: 1, height: '36px', border: '1px solid #e4e4e7', borderRadius: '9px',
                                background: 'white', fontSize: '12px', fontWeight: 500, color: '#52525b',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                fontFamily: "'Inter', system-ui",
                            }}>
                                <Printer size={13} /> Packing Slip
                            </button>
                        </div>

                        {/* Delete */}
                        <div style={{ padding: '0 20px 16px' }}>
                            <button style={{
                                width: '100%', height: '34px', border: 'none', background: 'none',
                                color: '#ef4444', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                                fontFamily: "'Inter', system-ui", borderRadius: '9px',
                            }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                            >
                                <Trash2 size={13} /> Delete Order
                            </button>
                        </div>
                    </div>
                    </>
                ) : (
                    <div style={{
                        width: '300px', flexShrink: 0, background: 'white', borderRadius: '16px',
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexDirection: 'column', color: '#d4d4d8', gap: '10px',
                    }}>
                        <Search size={28} style={{ opacity: 0.4 }} />
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#71717a', margin: 0 }}>No order selected</p>
                            <p style={{ fontSize: '12px', color: '#a1a1aa', margin: '4px 0 0' }}>Click a row to view details</p>
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