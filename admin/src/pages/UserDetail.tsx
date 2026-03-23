import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { AuthUser, InquiryGroup, Order } from "@/types";
import { 
    User, Mail, Phone, Globe, Edit, ShieldAlert, 
    ShoppingCart, CreditCard, Activity, TrendingUp, 
    MessageSquare, Clock, ChevronRight, AlertTriangle,
    Loader2, ArrowLeft, MoreHorizontal, CheckCircle2,
    Calendar, MapPin, Hash
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, ComposedChart, Bar } from "recharts";


export default function UserDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [inquiries, setInquiries] = useState<InquiryGroup[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"inquiries" | "orders" | "activity">("inquiries");

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        Promise.all([
            api<AuthUser>(`/admin/users/${id}`),
            api<InquiryGroup[]>(`/admin/inquiries?user_id=${id}`).catch(() => []),
            api<Order[]>(`/admin/orders/all?user_id=${id}`).catch(() => [])
        ]).then(([userData, inquiryData, orderData]) => {
            setUser(userData);
            setInquiries(inquiryData);
            setOrders(orderData);
        }).catch(console.error).finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#0b1326]">
                <Loader2 className="w-8 h-8 text-blue-600 dark:text-[#adc6ff] animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd]">
                <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
                <h2 className="text-xl font-bold">User Not Found</h2>
                <Link to="/users" className="mt-4 text-blue-600 dark:text-[#adc6ff] hover:underline flex items-center gap-2">
                    <ArrowLeft size={16} /> Back to Directory
                </Link>
            </div>
        );
    }

    const lifetimeSpend = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] font-['Inter'] selection:bg-[#adc6ff]/30">
            {/* Top Navigation */}
            <div className="pt-8 px-10 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate("/users")}
                        className="p-2 rounded-lg bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/30 text-slate-600 dark:text-[#c3c5d8] hover:bg-slate-50 dark:hover:bg-[#171f33] transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-blue-600 dark:text-[#adc6ff]">User Profile</h1>
                        <p className="text-xs text-slate-600 dark:text-[#c3c5d8]/50">Global Identity Node: {id?.slice(0, 16)}...</p>
                    </div>
                </div>
            </div>

            {/* Warning Banner */}
            {user.email_bounced && (
                <div className="mx-10 mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-4 animate-pulse">
                    <div className="bg-red-500/20 p-2 rounded-lg">
                        <Mail className="text-red-400" size={20} />
                    </div>
                    <div className="flex-1">
                        <p className="text-red-300 text-sm font-semibold">Delivery Failure Detected</p>
                        <p className="text-red-300/70 text-xs">Recent system notifications for this user have bounced. Email: {user.email}</p>
                    </div>
                    <button className="px-4 py-1.5 bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-lg text-xs font-bold transition-colors">
                        Verify Email
                    </button>
                </div>
            )}

            <main className="p-10 grid grid-cols-12 gap-8">
                {/* Left Column: Profile Card */}
                <aside className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-[#131b2e] rounded-2xl p-8 border border-slate-200 dark:border-[#434655]/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#adc6ff]/5 rounded-full -mr-10 -mt-10 blur-3xl group-hover:bg-[#adc6ff]/10 transition-colors"></div>
                        
                        <div className="flex flex-col items-center text-center relative z-10">
                            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-[#adc6ff] to-[#1f70e3] mb-4 shadow-2xl overflow-hidden">
                                {user.avatar_url || user.profile_picture ? (
                                    <img src={user.avatar_url || user.profile_picture} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-slate-50 dark:bg-[#0b1326] flex items-center justify-center text-3xl font-black text-blue-600 dark:text-[#adc6ff]">
                                        {(user.name || user.email || "U")[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">{user.name || "Anonymous Node"}</h2>
                            <p className="text-blue-600 dark:text-[#adc6ff] font-medium text-sm mb-6">{user.admin ? "System Admin" : "Customer Asset"}</p>
                            
                            <div className="flex gap-2 w-full">
                                <button className="flex-1 py-2.5 bg-[#2d3449] hover:bg-[#31394d] text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-[#434655]/30">
                                    <Edit size={16} /> Edit
                                </button>
                                <button className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-500/20">
                                    <ShieldAlert size={16} /> Block
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-[#434655]/10 space-y-4 relative z-10">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-[#c3c5d8]">Customer ID</span>
                                <span className="text-white font-mono text-xs">#{id?.slice(0, 8).toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-[#c3c5d8]">Member Since</span>
                                <span className="text-white">
                                    {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : "N/A"}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600 dark:text-[#c3c5d8]">Type</span>
                                <span className="text-white uppercase text-[10px] font-bold tracking-widest">{user.admin ? "Internal" : "External"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Contact Details */}
                    <div className="bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/20 rounded-2xl p-6">
                        <h3 className="text-[10px] uppercase tracking-widest text-slate-600 dark:text-[#c3c5d8] font-bold mb-6">Contact Vector Details</h3>
                        <div className="space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#adc6ff]/5 rounded-lg border border-blue-400 dark:border-[#adc6ff]/10">
                                    <Mail size={18} className="text-blue-600 dark:text-[#adc6ff]" />
                                </div>
                                <span className="text-sm text-slate-900 dark:text-[#dae2fd] font-medium">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#adc6ff]/5 rounded-lg border border-blue-400 dark:border-[#adc6ff]/10">
                                    <Phone size={18} className="text-blue-600 dark:text-[#adc6ff]" />
                                </div>
                                <span className="text-sm text-slate-900 dark:text-[#dae2fd] font-medium">{user.phone || "No phone registered"}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#adc6ff]/5 rounded-lg border border-blue-400 dark:border-[#adc6ff]/10">
                                    <Globe size={18} className="text-blue-600 dark:text-[#adc6ff]" />
                                </div>
                                <span className="text-sm text-slate-900 dark:text-[#dae2fd] font-medium">Global Network Node</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Right Column: Metrics & Content */}
                <div className="col-span-12 lg:col-span-8 space-y-8">
                    {/* Stats Bento */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-50 dark:bg-[#171f33] p-6 rounded-2xl border border-slate-200 dark:border-[#434655]/10 hover:border-blue-400 dark:hover:border-[#adc6ff]/20 transition-all flex flex-col justify-between group">
                            <ShoppingCart size={32} className="text-blue-600 dark:text-[#adc6ff] mb-4 group-hover:scale-110 transition-transform" />
                            <div>
                                <p className="text-3xl font-extrabold text-white tracking-tighter">{orders.length}</p>
                                <p className="text-[10px] text-slate-600 dark:text-[#c3c5d8] font-bold uppercase tracking-widest mt-1">Total Orders</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-[#171f33] p-6 rounded-2xl border border-slate-200 dark:border-[#434655]/10 hover:border-blue-400 dark:hover:border-[#adc6ff]/20 transition-all flex flex-col justify-between group">
                            <CreditCard size={32} className="text-[#ffb597] mb-4 group-hover:scale-110 transition-transform" />
                            <div>
                                <p className="text-3xl font-extrabold text-white tracking-tighter">₹{(lifetimeSpend / 1000).toFixed(1)}k</p>
                                <p className="text-[10px] text-slate-600 dark:text-[#c3c5d8] font-bold uppercase tracking-widest mt-1">Lifetime Spend</p>
                            </div>
                        </div>
                        <div className="bg-slate-100 dark:bg-[#0b1326] p-6 rounded-2xl border border-slate-200 dark:border-[#434655]/10 hover:border-blue-400 dark:hover:border-[#adc6ff]/20 transition-all flex flex-col justify-between group">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Calculated</span>
                            </div>
                            <div>
                                <p className="text-3xl font-extrabold text-white tracking-tighter">
                                    {((orders.length * 2 + inquiries.length) / 5).toFixed(1)}
                                </p>
                                <p className="text-[10px] text-slate-600 dark:text-[#c3c5d8] font-bold uppercase tracking-widest mt-1">Health Score</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabbed Content */}
                    <section className="bg-white dark:bg-[#131b2e] rounded-3xl border border-slate-200 dark:border-[#434655]/10 overflow-hidden shadow-2xl">
                        <div className="flex px-8 border-b border-slate-200 dark:border-[#434655]/20 bg-slate-50 dark:bg-[#171f33]/30">
                            {[
                                { id: "inquiries", label: "Inquiry History", icon: MessageSquare },
                                { id: "orders", label: "Transaction Logs", icon: ShoppingCart },
                                { id: "activity", label: "System Events", icon: Activity },
                            ].map((tab) => (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`py-6 px-6 text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all ${
                                        activeTab === tab.id 
                                            ? 'text-blue-600 dark:text-[#adc6ff] border-blue-400 dark:border-[#adc6ff] bg-[#adc6ff]/5' 
                                            : 'text-slate-600 dark:text-[#c3c5d8]/50 border-transparent hover:text-slate-600 dark:hover:text-[#c3c5d8] hover:bg-white/5'
                                    }`}
                                >
                                    <tab.icon size={14} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-8">
                            {activeTab === "inquiries" && (
                                <div className="space-y-4">
                                    {inquiries.length === 0 ? (
                                        <p className="text-center py-12 text-slate-600 dark:text-[#c3c5d8]/30 font-bold uppercase tracking-widest text-[10px]">No inquiry nodes found for this identity.</p>
                                    ) : (
                                        inquiries.map((inq) => (
                                            <Link 
                                                key={inq.id} 
                                                to={`/inquiries/${inq.id}`}
                                                className="block bg-slate-50 dark:bg-[#171f33] p-6 rounded-2xl border border-slate-200 dark:border-[#434655]/10 hover:border-blue-400 dark:hover:border-[#adc6ff]/30 hover:bg-[#1a243b] transition-all group"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#0b1326] flex items-center justify-center text-blue-600 dark:text-[#adc6ff] border border-slate-200 dark:border-[#434655]/30">
                                                            <MessageSquare size={18} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-white text-sm">
                                                                {inq.items?.[0]?.template_name || inq.items?.[0]?.service_name || "Custom Project"}
                                                            </h4>
                                                            <p className="text-[10px] text-slate-600 dark:text-[#c3c5d8]/50 uppercase tracking-widest font-bold mt-1">
                                                                #{inq.id.slice(0, 8).toUpperCase()} • Opened {new Date(inq.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter ${
                                                        inq.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#adc6ff]/10 text-blue-600 dark:text-[#adc6ff]'
                                                    }`}>
                                                        {inq.status.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-[#c3c5d8] line-clamp-1 opacity-70 italic font-medium">
                                                    "{inq.messages?.[inq.messages.length - 1]?.content || "No message logged."}"
                                                </p>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === "orders" && (
                                <div className="space-y-4">
                                    {orders.length === 0 ? (
                                        <p className="text-center py-12 text-slate-600 dark:text-[#c3c5d8]/30 font-bold uppercase tracking-widest text-[10px]">No transaction shards detected.</p>
                                    ) : (
                                        orders.map((order) => (
                                            <Link 
                                                key={order.id} 
                                                to={`/orders/${order.id}`}
                                                className="block bg-slate-50 dark:bg-[#171f33] p-6 rounded-2xl border border-slate-200 dark:border-[#434655]/10 hover:border-[#ffb597]/30 hover:bg-[#1a243b] transition-all"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#0b1326] flex items-center justify-center text-[#ffb597] border border-slate-200 dark:border-[#434655]/30">
                                                            <ShoppingCart size={18} />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-white text-sm">₹{order.total_amount.toLocaleString()} Order</h4>
                                                            <p className="text-[10px] text-slate-600 dark:text-[#c3c5d8]/50 uppercase tracking-widest font-bold mt-1">
                                                                ORD-{order.id.slice(0, 8).toUpperCase()} • {new Date(order.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-xs font-bold text-white">
                                                            {((order.amount_paid / order.total_amount) * 100).toFixed(0)}% Paid
                                                        </span>
                                                        <div className="w-24 h-1.5 bg-slate-50 dark:bg-[#0b1326] rounded-full mt-2 overflow-hidden border border-white/5">
                                                            <div 
                                                                className="h-full bg-[#ffb597] rounded-full transition-all duration-1000" 
                                                                style={{ width: `${(order.amount_paid / order.total_amount) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeTab === "activity" && (
                                <div className="space-y-6 flex flex-col items-center py-12">
                                    <div className="w-16 h-16 bg-[#adc6ff]/5 rounded-full flex items-center justify-center text-blue-600 dark:text-[#adc6ff]/20">
                                        <Activity size={32} />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600 dark:text-[#c3c5d8]/40">System Architecture Logs</p>
                                        <p className="text-xs text-slate-600 dark:text-[#c3c5d8]/70 max-w-[280px] leading-relaxed">Identity event logs for node {id?.slice(0, 8)} are being indexed for real-time visualization.</p>
                                    </div>
                                    <button className="px-6 py-2 border border-blue-400 dark:border-[#adc6ff]/20 text-blue-600 dark:text-[#adc6ff] text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-[#adc6ff]/10 transition-all mt-4">
                                        Re-Index Audit Trail
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-20 py-10 border-t border-slate-200 dark:border-[#434655]/10 text-center opacity-30">
                <p className="text-[10px] text-slate-600 dark:text-[#c3c5d8] font-mono tracking-[0.2em] uppercase">Identity Resolution Protocol v4.0.2 // Arkham Management Core</p>
            </footer>
        </div>
    );
}
