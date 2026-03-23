import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
    Loader2, CheckCircle, MessageSquare, CreditCard,
    BarChart3, ChevronRight, CheckCheck, RefreshCcw
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Notifications() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    const fetchNotifications = () => {
        setLoading(true);
        api<any[]>('/admin/notifications')
            .then(data => {
                setNotifications(data || []);
                setTotal(data?.length || 0);
                setUnread(data?.filter(n => !n.is_read).length || 0);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAllRead = () => {
        api('/admin/notifications/mark-all-read', { method: 'PATCH' })
            .then(() => fetchNotifications())
            .catch(console.error);
    };

    const markRead = (id: number) => {
        api(`/admin/notifications/${id}/read`, { method: 'PATCH' })
            .then(() => {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
                setUnread(prev => Math.max(0, prev - 1));
            })
            .catch(console.error);
    };

    const deleteNotification = (id: number) => {
        api(`/admin/notifications/${id}`, { method: 'DELETE' })
            .then(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
                setTotal(prev => Math.max(0, prev - 1));
            })
            .catch(console.error);
    };

    const getIcon = (type?: string, title?: string) => {
        const text = (type || title || "").toLowerCase();
        if (text.includes("payment") || text.includes("invoice")) return <CreditCard size={20} />;
        if (text.includes("inquiry") || text.includes("message")) return <MessageSquare size={20} />;
        return <CheckCircle size={20} />;
    };

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) {
            if (Math.floor(interval) === 1) return "Yesterday";
            return Math.floor(interval) + " days ago";
        }
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " mins ago";
        return Math.floor(seconds) + " seconds ago";
    };

    // Filter logic
    const displayedNotifications = notifications.filter(n => {
        if (filter === "all") return true;
        const text = (n.title || "").toLowerCase();
        if (filter === "inquiries" && text.includes("inquiry")) return true;
        if (filter === "payments" && text.includes("payment")) return true;
        if (filter === "quotes" && text.includes("quote")) return true;
        return false;
    });

    return (
        <div className="font-['Inter'] animate-fade-in bg-slate-50 dark:bg-[#0b1326] -m-8 p-8 min-h-screen transition-colors">
            {/* Header Section */}
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <span className="text-[0.75rem] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1]">System Activity</span>
                    <h2 className="text-[2.25rem] font-black tracking-tight text-slate-900 dark:text-[#dae2fd]">Notifications</h2>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <select 
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="appearance-none bg-white dark:bg-[#131b2e] border-none px-5 py-2.5 pr-10 rounded-lg shadow-sm text-sm font-bold text-slate-700 dark:text-[#dae2fd] focus:ring-2 focus:ring-blue-500/20 cursor-pointer outline-none transition-colors"
                        >
                            <option value="all">All Notification Types</option>
                            <option value="inquiries">New Inquiries</option>
                            <option value="payments">Payments Received</option>
                            <option value="quotes">Quotes Accepted</option>
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-[#c3c5d8] rotate-90" size={16} />
                    </div>
                    <button 
                        onClick={markAllRead}
                        className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-[#1f70e3] dark:to-[#004395] text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:shadow-lg transition-all active:scale-[0.98]"
                    >
                        <CheckCheck size={18} />
                        Mark all read
                    </button>
                </div>
            </header>

            {/* Layout for Content */}
            <div className="grid grid-cols-12 gap-8 items-start">
                
                {/* Main Notifications Feed (2/3 Width) */}
                <section className="col-span-12 xl:col-span-8 space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#131b2e] rounded-xl border border-slate-200 dark:border-[#434655]/30">
                            <Loader2 size={32} className="animate-spin text-blue-500 dark:text-[#1f70e3] mb-4" />
                            <p className="text-sm font-bold text-slate-500 dark:text-[#8d90a1] uppercase tracking-widest">Loading Activity...</p>
                        </div>
                    ) : displayedNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#131b2e] rounded-xl border border-slate-200 dark:border-[#434655]/30 text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-[#171f33] flex items-center justify-center mb-6">
                                <CheckCircle size={32} className="text-emerald-500 dark:text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-[#dae2fd]">No notifications</h3>
                            <p className="text-sm text-slate-500 dark:text-[#c3c5d8] mt-2">You're all up to date. Check back later for new activity.</p>
                        </div>
                    ) : (
                        displayedNotifications.map(notif => {
                            const isUnread = !notif.is_read;
                            const t = (notif.title || "").toLowerCase();
                            const isPayment = t.includes("payment");
                            
                            return (
                                <div 
                                    key={notif.id}
                                    className={`group p-6 rounded-xl flex gap-5 transition-colors relative overflow-hidden border border-slate-200 dark:border-[#434655]/30
                                        ${isUnread 
                                            ? 'bg-white dark:bg-[#131b2e] shadow-sm hover:bg-slate-50 dark:hover:bg-slate-50 dark:hover:bg-[#171f33]' 
                                            : 'bg-slate-50/60 dark:bg-[#131b2e]/60 opacity-80 hover:bg-slate-50 dark:hover:bg-slate-50 dark:hover:bg-[#171f33]'
                                        }`}
                                >
                                    {isUnread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 dark:bg-[#1f70e3]"></div>}
                                    
                                    <div className="shrink-0">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                            isUnread && isPayment ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' :
                                            isUnread ? 'bg-blue-100 dark:bg-[#1f70e3]/20 text-blue-600 dark:text-[#adc6ff]' :
                                            'bg-slate-200 dark:bg-[#171f33] text-slate-500 dark:text-[#8d90a1]'
                                        }`}>
                                            {getIcon(notif.metadata_?.type, notif.title)}
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 w-full min-w-0">
                                        <div className="flex items-center justify-between mb-1 gap-2">
                                            <span className={`truncate text-[0.65rem] font-bold uppercase tracking-wider ${
                                                isUnread && isPayment ? 'text-indigo-600 dark:text-indigo-400' :
                                                isUnread ? 'text-blue-600 dark:text-[#1f70e3]' :
                                                'text-slate-500 dark:text-[#c3c5d8]'
                                            }`}>
                                                {notif.title.replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-xs text-slate-500 dark:text-[#8d90a1] whitespace-nowrap">{getTimeAgo(notif.created_at)}</span>
                                        </div>
                                        <h4 className="text-slate-900 dark:text-[#dae2fd] font-bold text-base mb-2 truncate">{notif.title}</h4>
                                        <p className="text-slate-600 dark:text-[#c3c5d8] text-sm leading-relaxed max-w-2xl">{notif.message}</p>
                                        
                                        <div className="mt-4 flex gap-4">
                                            {isUnread && (
                                                <button onClick={() => markRead(notif.id)} className="text-xs font-bold text-blue-600 dark:text-[#1f70e3] hover:underline uppercase tracking-tight">Mark as Read</button>
                                            )}
                                            <button onClick={() => deleteNotification(notif.id)} className="text-xs font-bold text-slate-400 hover:text-rose-500 dark:hover:text-[#8d90a1] dark:hover:text-rose-400 uppercase tracking-tight transition-colors">Dismiss</button>
                                        </div>
                                    </div>
                                    
                                    {isUnread && (
                                        <div className="shrink-0 self-start">
                                            <div className="w-2.5 h-2.5 bg-blue-500 dark:bg-[#1f70e3] rounded-full shadow-[0_0_8px_rgba(31,112,227,0.5)]"></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                    
                    {!loading && displayedNotifications.length > 0 && (
                        <div className="pt-6 flex items-center justify-center">
                            <button onClick={fetchNotifications} className="flex items-center gap-2 text-slate-500 dark:text-[#8d90a1] hover:text-blue-500 dark:hover:text-[#1f70e3] transition-colors font-bold text-xs uppercase tracking-widest">
                                <RefreshCcw size={14} />
                                Refresh feed
                            </button>
                        </div>
                    )}
                </section>

                {/* Secondary Analytics/Summary (1/3 Width) */}
                <aside className="col-span-12 xl:col-span-4 space-y-8">
                    
                    {/* Notification Stats Card */}
                    <div className="bg-white dark:bg-[#131b2e] p-8 rounded-xl shadow-sm border border-slate-200 dark:border-[#434655]/30 transition-colors">
                        <h3 className="uppercase text-[0.75rem] font-black text-slate-500 dark:text-[#c3c5d8] mb-6 flex items-center gap-2 tracking-widest">
                            <BarChart3 size={18} />
                            Insight Summary
                        </h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-600 dark:text-[#8d90a1]">Unread Alerts</span>
                                <span className="text-2xl font-black text-blue-600 dark:text-[#1f70e3]">{unread.toString().padStart(2, '0')}</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-[#171f33] rounded-full h-1.5 overflow-hidden border border-slate-200 dark:border-[#434655]/10">
                                <div className="bg-blue-500 dark:bg-[#1f70e3] h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(31,112,227,0.6)]" style={{ width: `${Math.min(100, (unread/Math.max(1, total))*100)}%` }}></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <div className="p-4 bg-slate-50 dark:bg-[#0b1326] rounded-xl border border-slate-200 dark:border-[#434655]/20">
                                    <span className="block text-[0.65rem] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1] mb-1">Total</span>
                                    <span className="text-lg font-black text-slate-900 dark:text-[#dae2fd]">{total}</span>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-[#0b1326] rounded-xl border border-slate-200 dark:border-[#434655]/20">
                                    <span className="block text-[0.65rem] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1] mb-1">Responded</span>
                                    <span className="text-lg font-black text-slate-900 dark:text-[#dae2fd]">
                                        {total > 0 ? Math.round(((total - unread) / total) * 100) : 100}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Contacts/Activity */}
                    <div className="bg-slate-100 dark:bg-[#131b2e] p-8 rounded-xl border border-slate-200 dark:border-[#434655]/30">
                        <h3 className="uppercase text-[0.75rem] font-black text-slate-500 dark:text-[#c3c5d8] mb-6 tracking-widest">Pending Action Log</h3>
                        <div className="space-y-4">
                            {/* Dummy Data for demonstration similar to HTML */}
                            <div className="bg-white dark:bg-[#0b1326] p-4 rounded-xl border border-slate-200 dark:border-[#434655]/20 flex items-center justify-between group hover:border-blue-500/30 dark:hover:border-[#1f70e3]/30 transition-colors cursor-pointer">
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-[#dae2fd]">Unprocessed Order Payments</p>
                                    <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-[#c3c5d8] mt-1 tracking-wider">Awaiting Verification</p>
                                </div>
                                <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-500 dark:hover:text-[#8d90a1] dark:group-hover:text-[#1f70e3] transition-colors" />
                            </div>
                            <div className="bg-white dark:bg-[#0b1326] p-4 rounded-xl border border-slate-200 dark:border-[#434655]/20 flex items-center justify-between group hover:border-blue-500/30 dark:hover:border-[#1f70e3]/30 transition-colors cursor-pointer">
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-[#dae2fd]">Draft Quotes Expiring Soon</p>
                                    <p className="text-[10px] font-bold uppercase text-rose-500 dark:text-rose-400 mt-1 tracking-wider">3 Quotes (Within 24h)</p>
                                </div>
                                <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-500 dark:hover:text-[#8d90a1] dark:group-hover:text-[#1f70e3] transition-colors" />
                            </div>
                        </div>
                        <Link to="/orders" className="block text-center w-full mt-8 py-3.5 text-[10px] bg-slate-200 dark:bg-[#171f33] font-black uppercase tracking-[0.2em] border border-slate-300 dark:border-[#434655]/40 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-200 dark:hover:bg-[#222a3d] text-slate-700 dark:text-[#dae2fd] transition-colors shadow-sm">
                            View Workflow Dashboard
                        </Link>
                    </div>

                    {/* System Status Glass Card */}
                    <div className="relative overflow-hidden rounded-xl p-8 text-white bg-slate-900 dark:bg-[#0b1326] border border-slate-800 dark:border-[#434655]/40 shadow-xl group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse"></span>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">System Status</span>
                            </div>
                            <h4 className="text-lg font-bold tracking-tight mb-2 text-white group-hover:text-blue-300 transition-colors">Notification Services Operational</h4>
                            <p className="text-xs text-white/60 leading-relaxed font-medium">Real-time sockets are active. Activity indices updated live.</p>
                        </div>
                        {/* Decorative background element */}
                        <div className="absolute -right-12 -bottom-16 w-48 h-48 bg-blue-500/20 rounded-full blur-[60px] pointer-events-none transition-transform group-hover:scale-110"></div>
                        <div className="absolute -left-12 -top-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none"></div>
                    </div>

                </aside>
            </div>
        </div>
    );
}