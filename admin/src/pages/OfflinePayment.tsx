import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, History, ShieldAlert, Loader2, CheckCircle, MoreVertical } from 'lucide-react';
import { api } from '@/lib/api';

export default function OfflinePayment() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
    const defaultMilestoneId = searchParams.get('milestoneId');
    
    const [searchInput, setSearchInput] = useState(orderId);
    
    const [order, setOrder] = useState<any>(null);
    const [loadingOrder, setLoadingOrder] = useState(false);
    
    // Form state
    const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>(defaultMilestoneId || '');
    const [amount, setAmount] = useState<string>('');
    const [paymentMode, setPaymentMode] = useState<'CASH' | 'CHEQUE' | 'BANK_TRANSFER'>('CASH');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    
    useEffect(() => {
        if (orderId) {
            fetchOrder(orderId);
        }
    }, [orderId]);

    const fetchOrder = async (id: string) => {
        setLoadingOrder(true);
        try {
            const data = await api<any>(`/admin/orders/${id}`);
            setOrder(data);
            
            // Auto-select milestone if not provided but only one unpaid exists
            const unpaid = data.milestones?.filter((m: any) => m.status === 'UNPAID') || [];
            if (!defaultMilestoneId && unpaid.length === 1) {
                setSelectedMilestoneId(unpaid[0].id);
            }
            // Auto-fill amount based on selected milestone
            const toSelect = defaultMilestoneId || (unpaid.length === 1 ? unpaid[0].id : null);
            if (toSelect) {
                const m = unpaid.find((x: any) => x.id === toSelect);
                if (m) setAmount(m.amount.toString());
            }
        } catch (e) {
            console.error(e);
            setOrder(null);
        } finally {
            setLoadingOrder(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchInput.trim()) {
            setSearchParams({ orderId: searchInput.trim() });
            setOrderId(searchInput.trim());
        }
    };

    const handleMilestoneSelect = (mId: string, mAmount: number) => {
        setSelectedMilestoneId(mId);
        setAmount(mAmount.toString());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!order || !selectedMilestoneId || !amount) return;

        setSubmitting(true);
        try {
            await api(`/admin/orders/${order.id}/payments`, {
                method: 'POST',
                body: JSON.stringify({
                    milestone_id: selectedMilestoneId,
                    amount: parseFloat(amount),
                    payment_mode: paymentMode,
                    notes: notes || undefined
                })
            });
            // Success, navigate back to order details or clear form
            navigate(`/orders/${order.id}`);
        } catch (error) {
            console.error("Failed to record payment", error);
            alert("Failed to record payment. Please check the console.");
        } finally {
            setSubmitting(false);
        }
    };

    const amountPaid = order?.amount_paid || 0;
    const balance = order ? Number(order.total_amount) - amountPaid : 0;
    const unpaidMilestones = order?.milestones?.filter((m: any) => m.status === 'UNPAID') || [];
    const transactions = order?.transactions || [];

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in font-['Inter']">
            {/* Header Section */}
            <header className="mb-10">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Finance Portal</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Offline Transactions</span>
                </div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Record Offline Payment</h2>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Search and Form */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Order Search */}
                    <section className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-[0.75rem] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Identify Order</label>
                            <span className="text-[0.7rem] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded font-medium">Lookup</span>
                        </div>
                        <form onSubmit={handleSearch} className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm font-medium transition-all" 
                                placeholder="Enter Order ID (UUID)..." 
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            <button type="submit" className="hidden">Search</button>
                        </form>
                    </section>

                    {loadingOrder ? (
                        <div className="flex items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                            <Loader2 className="animate-spin text-blue-500" size={32} />
                        </div>
                    ) : order ? (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Summary & Milestones */}
                            <section className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex flex-col md:flex-row justify-between mb-4">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">Order {order.order_number || order.id.split('-')[0].toUpperCase()}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{order.user_name} • {order.user_email}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Total</p>
                                            <p className="text-xl font-semibold text-slate-900 dark:text-white">₹{order.total_amount.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Paid</p>
                                            <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">₹{amountPaid.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Due</p>
                                            <p className="text-xl font-semibold text-red-600 dark:text-red-400">₹{balance.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50">
                                    <span className="text-[0.75rem] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-4">Select Milestone for Allocation</span>
                                    {unpaidMilestones.length === 0 ? (
                                        <p className="text-sm text-slate-500 italic p-4 text-center">No unpaid milestones available for this order.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {unpaidMilestones.map((m: any) => (
                                                <label key={m.id} className="flex items-center p-4 rounded-xl bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer border-2 border-slate-200 dark:border-slate-800 has-checked:border-blue-500 has-checked:bg-blue-50/50 dark:has-checked:border-blue-500 dark:has-checked:bg-blue-900/10 group">
                                                    <input 
                                                        className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-full" 
                                                        name="milestone" 
                                                        type="radio" 
                                                        checked={selectedMilestoneId === m.id}
                                                        onChange={() => handleMilestoneSelect(m.id, m.amount)}
                                                    />
                                                    <div className="ml-4 flex-1">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{m.label}</span>
                                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">₹{m.amount.toLocaleString()}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{m.percentage}% of total</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Payment Details */}
                            <section className={`bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 ${unpaidMilestones.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                                <span className="text-[0.75rem] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-6">Transaction Particulars</span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Payment Amount (₹)</label>
                                        <input 
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white font-semibold text-lg transition-all" 
                                            type="number" 
                                            step="0.01" 
                                            required 
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Payment Method</label>
                                        <select 
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white font-medium transition-all appearance-none cursor-pointer"
                                            value={paymentMode}
                                            onChange={(e) => setPaymentMode(e.target.value as any)}
                                        >
                                            <option value="CASH">Cash</option>
                                            <option value="CHEQUE">Cheque</option>
                                            <option value="BANK_TRANSFER">Bank Transfer (IMPS/NEFT)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-8">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                        Internal Notes / Reference Number {paymentMode === 'CHEQUE' && <span className="text-red-500">*</span>}
                                    </label>
                                    <textarea 
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white transition-all placeholder:text-slate-400" 
                                        placeholder={paymentMode === 'CHEQUE' ? "Enter cheque number..." : paymentMode === 'BANK_TRANSFER' ? "Enter UTR number..." : "Add details about who handed over the payment..."}
                                        rows={3}
                                        required={paymentMode === 'CHEQUE'}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    ></textarea>
                                </div>

                                <div className="flex items-center justify-end gap-3 md:gap-4">
                                    <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
                                    <button 
                                        type="submit" 
                                        disabled={!selectedMilestoneId || !amount || submitting}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all flex items-center gap-2"
                                    >
                                        {submitting && <Loader2 size={16} className="animate-spin" />}
                                        Record Payment
                                    </button>
                                </div>
                            </section>
                        </form>
                    ) : orderId ? (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400">Order not found.</div>
                    ) : (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400">Search for an order to record offline payment.</div>
                    )}
                </div>

                {/* Right Column */}
                <div className="lg:col-span-4 space-y-6 md:space-y-8">
                    {/* Compliance Box */}
                    <section className="p-5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/50">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex flex-col items-center justify-center shrink-0">
                                <ShieldAlert size={20} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-amber-900 dark:text-amber-300 mb-1.5">Compliance Notice</p>
                                <p className="text-[0.75rem] leading-relaxed text-amber-800/80 dark:text-amber-400/80 font-medium">Verify actual funds received before logging offline payments. This action cannot be reversed without an admin override.</p>
                            </div>
                        </div>
                    </section>

                    {/* Order History */}
                    {order && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Recent Order Transactions</h4>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {transactions.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-slate-500">No previous transactions for this order.</div>
                                ) : (
                                    transactions.map((t: any) => (
                                        <div key={t.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">₹{t.amount?.toLocaleString()}</p>
                                                <span className="text-[0.65rem] px-2 py-0.5 font-bold uppercase tracking-tighter bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded">Success</span>
                                            </div>
                                            <p className="text-[0.7rem] text-slate-500 dark:text-slate-400 font-medium">{t.payment_mode} • {new Date(t.created_at).toLocaleDateString()}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
