import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { Order, OrderStatus } from "@/types";
import {
    Download, Trash2, Search, X, Loader2, CreditCard, Printer, Plus, Minus, ArrowUpRight, Plus as Add, SlidersHorizontal, ChevronLeft, ChevronRight
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import OfflineOrderModal from "@/components/OfflineOrderModal";

const STATUS_TABS = ["All", "Waiting_payment", "Partially_paid", "Paid", "Processing", "Ready", "Completed", "Cancelled"];

const STATUS_CONFIG: Record<string, { color: string; bg: string; borderColor: string }> = {
    WAITING_PAYMENT: { color: 'text-amber-400', bg: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
    PARTIALLY_PAID: { color: 'text-blue-400', bg: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
    PAID: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
    PROCESSING: { color: 'text-purple-400', bg: 'bg-purple-500/10', borderColor: 'border-purple-500/20' },
    READY: { color: 'text-sky-400', bg: 'bg-sky-500/10', borderColor: 'border-sky-500/20' },
    COMPLETED: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
    CANCELLED: { color: 'text-rose-400', bg: 'bg-rose-500/10', borderColor: 'border-rose-500/20' },
};

export const StatusPill = ({ status }: { status: string }) => {
    const cfg = STATUS_CONFIG[status] || { color: 'text-slate-600 dark:text-[#c3c5d8]', bg: 'bg-[#434655]/20', borderColor: 'border-slate-200 dark:border-[#434655]/30' };
    const label = status.replace(/_/g, ' ');
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color} border ${cfg.borderColor}`}>
            {label}
        </span>
    );
};

export default function Orders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Pagination basics
    const itemsPerPage = 10;
    const [currentPage, setCurrentPage] = useState(1);

    const fetchOrders = () => {
        setLoading(true);
        let url = "/admin/orders/all?skip=0&limit=200";
        if (statusFilter !== "All") url += `&status_filter=${statusFilter.toUpperCase().replace(/ /g, "_")}`;
        api<Order[]>(url).then(setOrders).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { fetchOrders(); }, [statusFilter]);

    const filtered = orders.filter(o =>
        !search || 
        (o.order_number && o.order_number.toLowerCase().includes(search.toLowerCase())) ||
        o.id.toString().includes(search) ||
        (o as any).user_name?.toLowerCase().includes(search.toLowerCase()) ||
        (o as any).user_email?.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const paginatedOrders = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const computeTotalReceivables = () => {
        return orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    };

    const computePendingBalance = () => {
        return orders.reduce((sum, o) => sum + (Number(o.total_amount || 0) - Number((o as any).amount_paid || 0)), 0);
    };

    return (
        <div className="flex flex-col h-full font-['Inter'] bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] p-8 animate-fade-in relative min-h-screen">
            
            {/* Main Content Area */}
            <div className="transition-all duration-300">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-[#dae2fd] mb-1">Orders</h2>
                        <p className="text-slate-500 dark:text-[#8d90a1] text-sm">Manage and track customer financial transactions.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="bg-white dark:bg-[#131b2e] hover:bg-slate-50 dark:hover:bg-[#171f33] border border-slate-200 dark:border-[#434655]/30 text-blue-600 dark:text-[#adc6ff] px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-colors flex items-center gap-2">
                            <Download size={18} />
                            Export CSV
                        </button>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-linear-to-br from-[#1f70e3] to-[#004395] text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-[#1f70e3]/20 hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                            <Add size={18} />
                            Create Order
                        </button>
                    </div>
                </header>

                {/* Stats Overview */}
                <div className="grid grid-cols-12 gap-6 mb-8">
                    <div className="col-span-12 md:col-span-8 bg-white dark:bg-[#131b2e] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-[#434655]/20 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-600 dark:text-[#c3c5d8]">Active Orders Volume</span>
                            <span className="text-xs text-primary font-bold bg-primary/10 px-2.5 py-1 rounded">Live Data</span>
                        </div>
                        <div className="flex items-baseline gap-4 relative z-10">
                            <h3 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-[#dae2fd]">{orders.length.toLocaleString()}</h3>
                            <p className="text-slate-500 dark:text-[#8d90a1] text-sm font-medium">active orders this cycle</p>
                        </div>
                    </div>
                    
                    <div className="col-span-12 md:col-span-4 space-y-6">
                        <div className="bg-white dark:bg-[#131b2e] p-6 rounded-2xl border border-slate-200 dark:border-[#434655]/20 flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-600 dark:text-[#c3c5d8] mb-2 relative z-10">Total Receivables</span>
                            <h4 className="text-2xl font-bold text-slate-900 dark:text-[#dae2fd] relative z-10">₹{computeTotalReceivables().toLocaleString()}</h4>
                        </div>
                        <div className="bg-white dark:bg-[#131b2e] p-6 rounded-2xl border border-slate-200 dark:border-[#434655]/20 flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-600 dark:text-[#c3c5d8] mb-2 relative z-10">Pending Balance</span>
                            <h4 className="text-2xl font-bold text-slate-900 dark:text-[#dae2fd] relative z-10">₹{computePendingBalance().toLocaleString()}</h4>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <section className="sticky top-4 z-40 p-4 rounded-xl shadow-lg border border-slate-200 dark:border-[#434655]/30 flex flex-wrap items-center gap-4 bg-white dark:bg-[#131b2e]/80 backdrop-blur-md mb-6">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-[#8d90a1]" size={18} />
                        <input 
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/40 rounded-lg focus:border-[#1f70e3] focus:ring-1 focus:ring-[#1f70e3] text-sm text-slate-900 dark:text-[#dae2fd] placeholder:text-slate-500 dark:text-[#8d90a1] outline-none transition-all" 
                            placeholder="Search by order number or user email..." 
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-48 bg-slate-50 dark:bg-[#0b1326] border-slate-200 dark:border-[#434655]/40 h-11 text-sm text-slate-900 dark:text-[#dae2fd] rounded-lg">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-50 dark:bg-[#171f33] border-slate-200 dark:border-[#434655]/40">
                                {STATUS_TABS.map(tab => (
                                    <SelectItem key={tab} value={tab} className="text-sm text-slate-600 dark:text-[#c3c5d8] focus:bg-slate-200 dark:bg-[#222a3d] focus:text-slate-900 dark:text-[#dae2fd]">
                                        {tab.replace(/_/g, ' ')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <button className="p-3.5 bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/40 text-slate-600 dark:text-[#c3c5d8] rounded-lg hover:border-blue-400 dark:hover:border-[#adc6ff] hover:text-blue-600 dark:hover:text-[#adc6ff] transition-colors">
                            <SlidersHorizontal size={18} />
                        </button>
                    </div>
                </section>

                {/* Orders Table */}
                <section className="bg-white dark:bg-[#131b2e] rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-[#434655]/20">
                    <div className="overflow-x-auto min-h-[400px]">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 size={32} className="animate-spin text-primary" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex items-center justify-center h-64 text-slate-500 dark:text-[#8d90a1] flex-col gap-2">
                                <Search size={32} className="opacity-20" />
                                <p className="text-sm font-semibold tracking-wide">No orders found.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-[#0b1326]/50 border-b border-slate-200 dark:border-[#434655]/20">
                                        <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 dark:text-[#8d90a1]">Order ID</th>
                                        <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 dark:text-[#8d90a1]">Customer</th>
                                        <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 dark:text-[#8d90a1]">Total</th>
                                        <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 dark:text-[#8d90a1]">Paid</th>
                                        <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 dark:text-[#8d90a1]">Balance</th>
                                        <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 dark:text-[#8d90a1]">Status</th>
                                        <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 dark:text-[#8d90a1]">Date</th>
                                        <th className="px-6 py-4 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#434655]/10">
                                    {paginatedOrders.map(order => {
                                        const amountPaid = (order as any).amount_paid || 0;
                                        const balance = Number(order.total_amount) - amountPaid;
                                        return (
                                            <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-[#171f33]/80 transition-colors group cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                                                <td className="px-6 py-5 min-w-[150px]" title={order.order_number || `BB-${new Date(order.created_at).getFullYear()}-${order.id}`}>
                                                    <div className="font-mono text-[13px] font-semibold text-blue-600 dark:text-[#adc6ff]">
                                                        {order.order_number || `BB-${new Date(order.created_at).getFullYear()}-${order.id.toString().padStart(5, '0')}`}
                                                    </div>
                                                    <div className="font-mono text-[9px] text-slate-500 dark:text-[#8d90a1] mt-1 select-all" title="Original UUID">
                                                        {order.id}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-sm text-slate-900 dark:text-[#dae2fd] font-medium max-w-[200px] truncate" title={(order as any).user_email || ''}>
                                                    {(order as any).user_email || 'No email provided'}
                                                </td>
                                                <td className="px-6 py-5 text-sm text-slate-900 dark:text-[#dae2fd] font-bold">
                                                    ₹{order.total_amount.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-5 text-sm text-slate-600 dark:text-[#c3c5d8]">
                                                    ₹{amountPaid.toLocaleString()}
                                                </td>
                                                <td className={`px-6 py-5 text-sm font-bold ${balance > 0 ? 'text-rose-400' : 'text-slate-500 dark:text-[#8d90a1]'}`}>
                                                    {balance > 0 ? `₹${balance.toLocaleString()}` : "—"}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <StatusPill status={order.status} />
                                                </td>
                                                <td className="px-6 py-5 text-xs text-slate-500 dark:text-[#8d90a1] font-medium">
                                                    {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                        Details
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {filtered.length > 0 && (
                        <div className="px-6 py-4 bg-slate-50 dark:bg-[#0b1326]/30 flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 dark:border-[#434655]/20 gap-4">
                            <p className="text-xs text-slate-500 dark:text-[#8d90a1] font-medium">
                                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} orders
                            </p>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/30 text-slate-600 dark:text-[#c3c5d8] hover:bg-slate-50 dark:hover:bg-[#171f33] hover:text-slate-900 dark:hover:text-[#dae2fd] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <div className="text-sm font-bold text-slate-900 dark:text-[#dae2fd] px-3">{currentPage} / {totalPages}</div>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/30 text-slate-600 dark:text-[#c3c5d8] hover:bg-slate-50 dark:hover:bg-[#171f33] hover:text-slate-900 dark:hover:text-[#dae2fd] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            <OfflineOrderModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={() => {
                    fetchOrders();
                }} 
            />
        </div>
    );
}