import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Order } from "@/types";
import {
    Download, Trash2, IndianRupee, CreditCard,
    Calendar, Package, Clock, CheckCircle2,
    ChevronRight, Search, Loader2, Receipt, Hash,
    TrendingUp, AlertCircle, ShoppingCart
} from "lucide-react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter, SheetClose
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };

const STATUS_OPTIONS = ["ALL", "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
    PENDING: { color: '#dc2626', bg: '#fef2f2', dot: '#dc2626' },
    PROCESSING: { color: '#2563eb', bg: '#eff6ff', dot: '#2563eb' },
    SHIPPED: { color: '#d97706', bg: '#fffbeb', dot: '#d97706' },
    DELIVERED: { color: '#16a34a', bg: '#f0fdf4', dot: '#16a34a' },
    CANCELLED: { color: '#737373', bg: '#f5f5f5', dot: '#737373' },
};

const StatusPill = ({ status }: { status: string }) => {
    const cfg = STATUS_CONFIG[status] || { color: '#737373', bg: '#f5f5f5', dot: '#737373' };
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px', background: cfg.bg, borderRadius: '4px', fontSize: '10px', fontWeight: 700, color: cfg.color, letterSpacing: '0.06em', textTransform: 'uppercase', ...mono }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
            {status}
        </span>
    );
};

export default function Orders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("ALL");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Order | null>(null);
    const [updating, setUpdating] = useState(false);
    const [newStatus, setNewStatus] = useState("");

    const fetchOrders = () => {
        setLoading(true);
        let url = "/orders/admin/all?skip=0&limit=100";
        if (status !== "ALL") url += `&status_filter=${status}`;
        api<Order[]>(url).then(setOrders).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { fetchOrders(); }, [status]);

    const updateStatus = async () => {
        if (!selected || !newStatus) return;
        setUpdating(true);
        try {
            await api(`/orders/admin/${selected.id}/status`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
            fetchOrders(); setSelected(null);
        } catch (e) { console.error(e); } finally { setUpdating(false); }
    };

    const recordPayment = async () => {
        if (!selected) return;
        if (!confirm("Confirm cash payment receipt?")) return;
        setUpdating(true);
        try {
            await api(`/orders/admin/${selected.id}/cash-payment`, { method: "POST" });
            fetchOrders(); setSelected(null);
        } catch (e) { console.error(e); } finally { setUpdating(false); }
    };

    const deleteOrder = async (id: number) => {
        if (!confirm("Permanently delete this order?")) return;
        try { await api(`/orders/admin/${id}`, { method: "DELETE" }); fetchOrders(); setSelected(null); } catch (e) { console.error(e); }
    };

    const downloadInvoice = async (id: number) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/orders/${id}/invoice`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
            });
            if (!res.ok) throw new Error();
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = `invoice-${id}.pdf`; a.click();
        } catch { alert("Failed to download invoice"); }
    };

    const filtered = orders.filter(o => !search || String(o.id).includes(search) || o.user_id.toString().includes(search));

    const totalRevenue = orders.filter(o => o.status === 'DELIVERED').reduce((s, o) => s + o.total_amount, 0);
    const pending = orders.filter(o => o.status === 'PENDING').length;
    const pending_payment = orders.filter(o => o.amount_paid < o.total_amount && o.status !== 'CANCELLED').length;

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: "'DM Sans', system-ui" }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                <div>
                    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted-foreground)', ...mono, marginBottom: '4px' }}>Order Management</p>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>All Orders</h1>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                        <Input placeholder="Search by ID or user..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '32px', height: '36px', width: '210px', fontSize: '13px' }} />
                    </div>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger style={{ height: '36px', width: '140px', fontSize: '12px', ...mono, fontWeight: 600 }}><SelectValue /></SelectTrigger>
                        <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                {[
                    { label: 'Total Orders', value: orders.length, icon: ShoppingCart, color: '#2563eb' },
                    { label: 'Pending', value: pending, icon: Clock, color: '#dc2626' },
                    { label: 'Revenue', value: `₹${(totalRevenue / 100000).toFixed(1)}L`, icon: IndianRupee, color: '#16a34a' },
                    { label: 'Pending Payment', value: pending_payment, icon: AlertCircle, color: '#d97706' },
                ].map((s, i) => (
                    <div key={i} style={{ padding: '16px 20px', borderRight: i < 3 ? '1px solid var(--border)' : 'none', background: 'var(--card)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', ...mono }}>{s.label}</p>
                            <div style={{ width: '24px', height: '24px', borderRadius: '5px', background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <s.icon size={12} style={{ color: s.color }} />
                            </div>
                        </div>
                        <p style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--foreground)' }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--card)' }}>
                {loading ? (
                    <div style={{ padding: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <Loader2 size={24} style={{ color: 'var(--muted-foreground)', animation: 'spin 0.8s linear infinite' }} />
                        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)', ...mono }}>Fetching orders...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <Package size={40} style={{ color: 'var(--border)' }} />
                        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted-foreground)' }}>No orders found</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow style={{ background: 'var(--secondary)', borderBottom: '1px solid var(--border)' }}>
                                {['Order ID', 'Status', 'Amount', 'Payment', 'Customer', 'Date', ''].map((h, i) => (
                                    <TableHead key={i} style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', ...mono, height: '36px', textAlign: i === 6 ? 'right' : 'left' }}>{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((order) => {
                                const paid = order.amount_paid >= order.total_amount;
                                return (
                                    <TableRow key={order.id} style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                                        onClick={() => { setSelected(order); setNewStatus(order.status); }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--secondary)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                        <TableCell style={{ ...mono, fontSize: '12px', fontWeight: 700, color: 'var(--muted-foreground)' }}>ORD-{order.id}</TableCell>
                                        <TableCell><StatusPill status={order.status} /></TableCell>
                                        <TableCell style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '-0.02em' }}>₹{order.total_amount.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 700, ...mono, color: paid ? '#16a34a' : '#d97706' }}>
                                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: paid ? '#16a34a' : '#d97706' }} />
                                                {paid ? 'PAID' : 'PARTIAL'}
                                            </span>
                                        </TableCell>
                                        <TableCell style={{ fontSize: '12px', color: 'var(--muted-foreground)', ...mono }}>#{order.user_id}</TableCell>
                                        <TableCell style={{ fontSize: '12px', color: 'var(--muted-foreground)', ...mono }}>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell style={{ textAlign: 'right' }}><ChevronRight size={16} style={{ color: 'var(--muted-foreground)', display: 'inline' }} /></TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Order Detail Sheet */}
            <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <SheetContent className="sm:max-w-md flex flex-col p-0">
                    {selected && (
                        <>
                            <SheetHeader style={{ padding: '24px', borderBottom: '1px solid var(--border)', background: 'var(--secondary)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ ...mono, fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)', letterSpacing: '0.1em' }}>ORD-{selected.id}</span>
                                    <StatusPill status={selected.status} />
                                </div>
                                <SheetTitle style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.03em' }}>Order Details</SheetTitle>
                                <SheetDescription>Customer #{selected.user_id} · {new Date(selected.created_at).toLocaleDateString()}</SheetDescription>
                            </SheetHeader>

                            <ScrollArea className="flex-1">
                                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {/* Financials */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        {[
                                            { label: 'Total Amount', value: `₹${selected.total_amount.toLocaleString()}`, color: 'var(--foreground)' },
                                            { label: 'Amount Paid', value: `₹${selected.amount_paid.toLocaleString()}`, color: selected.amount_paid >= selected.total_amount ? '#16a34a' : '#d97706' },
                                        ].map(item => (
                                            <div key={item.label} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--secondary)' }}>
                                                <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', ...mono, marginBottom: '6px' }}>{item.label}</p>
                                                <p style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.04em', color: item.color }}>{item.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Balance due */}
                                    {selected.total_amount > selected.amount_paid && (
                                        <div style={{ padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#92400e' }}>Balance Due</span>
                                            <span style={{ fontSize: '16px', fontWeight: 900, color: '#d97706', ...mono }}>₹{(selected.total_amount - selected.amount_paid).toLocaleString()}</span>
                                        </div>
                                    )}

                                    <Separator />

                                    {/* Status Update */}
                                    <div>
                                        <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', ...mono, marginBottom: '8px' }}>Update Status</p>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <Select value={newStatus} onValueChange={setNewStatus}>
                                                <SelectTrigger style={{ flex: 1, fontSize: '12px' }}><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {STATUS_OPTIONS.filter(s => s !== "ALL").map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <Button onClick={updateStatus} disabled={updating || newStatus === selected.status} style={{ fontWeight: 700, fontSize: '13px' }}>
                                                {updating ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : "Update"}
                                            </Button>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Actions */}
                                    <div>
                                        <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', ...mono, marginBottom: '8px' }}>Actions</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            <Button variant="outline" onClick={() => downloadInvoice(selected.id)} style={{ fontWeight: 600, fontSize: '12px', gap: '6px' }}>
                                                <Download size={14} /> Invoice PDF
                                            </Button>
                                            <Button variant="outline" onClick={recordPayment} disabled={selected.amount_paid >= selected.total_amount} style={{ fontWeight: 600, fontSize: '12px', gap: '6px' }}>
                                                <CreditCard size={14} /> Mark Paid
                                            </Button>
                                            <Button variant="outline" onClick={() => deleteOrder(selected.id)} style={{ fontWeight: 600, fontSize: '12px', gap: '6px', color: '#dc2626', borderColor: '#fecaca', gridColumn: '1 / -1' }}>
                                                <Trash2 size={14} /> Delete Order
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Transactions */}
                                    {selected.transactions && selected.transactions.length > 0 && (
                                        <>
                                            <Separator />
                                            <div>
                                                <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', ...mono, marginBottom: '12px' }}>Transaction History</p>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {selected.transactions.map(tx => (
                                                        <div key={tx.id} style={{ padding: '12px', background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <div>
                                                                <p style={{ fontSize: '12px', fontWeight: 700, marginBottom: '2px' }}>₹{tx.amount.toLocaleString()}</p>
                                                                <p style={{ fontSize: '10px', color: 'var(--muted-foreground)', ...mono, fontWeight: 600 }}>{tx.payment_mode} · {new Date(tx.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                            <CheckCircle2 size={16} style={{ color: '#16a34a' }} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Payment reference */}
                                    <div>
                                        <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', ...mono, marginBottom: '8px' }}>Transaction Reference</p>
                                        <div style={{ padding: '10px 12px', background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: '6px', ...mono, fontSize: '12px', color: 'var(--muted-foreground)' }}>
                                            {selected.payment_id || "No transaction reference available"}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>

                            <SheetFooter style={{ padding: '16px', borderTop: '1px solid var(--border)', background: 'var(--secondary)' }}>
                                <SheetClose asChild><Button variant="outline" style={{ width: '100%', fontWeight: 600 }}>Close</Button></SheetClose>
                            </SheetFooter>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
