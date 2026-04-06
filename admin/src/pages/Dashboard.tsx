import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import type { DashboardOverview, TrafficStats } from "@/types";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Brush, ComposedChart, Bar
} from "recharts";
import {
    TrendingUp, TrendingDown, Users, MessageSquare,
    IndianRupee, ShoppingCart, Sun, Moon, Filter, AlertCircle,
    Monitor, Smartphone, Tablet
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
    PENDING: '#f59e0b',
    PROCESSING: '#3b82f6',
    SHIPPED: '#8b5cf6',
    DELIVERED: '#10b981',
    CANCELLED: '#ef4444',
};

/* ── Theme helper ── */
const useTheme = () => {
    const [dark, setDark] = useState(() =>
        typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
    );
    const toggle = () => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
    };
    // On mount, sync with stored preference
    useEffect(() => {
        const stored = localStorage.getItem('theme');
        if (stored === 'dark' && !dark) { setDark(true); document.documentElement.classList.add('dark'); }
        else if (stored === 'light' && dark) { setDark(false); document.documentElement.classList.remove('dark'); }
    }, []);
    return { dark, toggle };
};

/* ── Interactive tooltip ── */
const CustomTooltip = ({ active, payload, label, chartType }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-[#171f33] border border-slate-200 dark:border-[#434655]/30 rounded-xl px-4 py-3 text-xs shadow-xl backdrop-blur-sm">
                <p className="text-slate-500 dark:text-[#c3c5d8] mb-1 m-0 text-[11px] font-medium">{label}</p>
                <p className="font-bold m-0 text-slate-900 dark:text-white text-sm">
                    {chartType === 'revenue'
                        ? `₹${payload[0]?.value?.toLocaleString()}`
                        : payload[0]?.value?.toLocaleString()}
                </p>
            </div>
        );
    }
    return null;
};

const formatValue = (val: number, type: string) => {
    if (type !== 'revenue') return val.toLocaleString();
    if (val === 0) return "₹0";
    if (val < 1000) return `₹${val.toFixed(0)}`;
    if (val < 100000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${(val / 100000).toFixed(1)}L`;
};

/* ── StatCard ── */
const getCardColor = (id: string, dark: boolean) => {
    switch (id) {
        case 'revenue': return dark ? '#adc6ff' : '#2563eb'; // blue
        case 'orders': return dark ? '#b7eb8f' : '#16a34a'; // green
        case 'inquiries': return dark ? '#d8b4fe' : '#9333ea'; // purple
        case 'conversion': return dark ? '#ffd666' : '#d97706'; // amber
        case 'unpaid': return dark ? '#ffa39e' : '#dc2626'; // red
        case 'users': return dark ? '#87e8de' : '#0d9488'; // teal
        default: return dark ? '#adc6ff' : '#2563eb';
    }
};

const StatCard = ({ label, value, change, trend, icon: Icon, active, onClick, color, dark }: any) => (
    <div
        onClick={onClick}
        className={`p-6 rounded-xl border group cursor-pointer relative overflow-hidden transition-all duration-200 ${
            !active ? 'bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/20 hover:bg-slate-50 dark:hover:bg-slate-50 dark:hover:bg-[#171f33]' : 'bg-white dark:bg-[#171f33]'
        }`}
        style={active ? {
            borderColor: `${color}40`,
            boxShadow: `0 0 0 1px ${color}20`,
            backgroundColor: dark ? `${color}15` : `${color}0D`
        } : {}}
    >
        {active && <div className="absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" style={{ backgroundColor: `${color}25` }} />}
        <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-xs font-bold tracking-widest uppercase transition-colors" style={{ color: active ? color : (dark ? '#c3c5d8' : '#64748b') }}>{label}</span>
            <Icon size={20} className="transition-colors" style={{ color: active ? color : (dark ? '#c3c5d8' : '#94a3b8') }} />
        </div>
        <h2 className={`text-3xl font-bold tracking-tight relative z-10 transition-colors ${active ? (dark ? 'text-white' : 'text-slate-900') : (dark ? '#dae2fd' : 'text-slate-800')}`}>
            {value}
        </h2>
        <p className="text-[10px] mt-2 flex items-center gap-1 relative z-10 transition-colors" style={{ color: active ? color : (dark ? '#c3c5d8' : '#64748b') }}>
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {change} from last period
        </p>
    </div>
);

export default function Dashboard() {
    const [data, setData] = useState<DashboardOverview | null>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("month");
    const [chartType, setChartType] = useState<"revenue" | "orders" | "inquiries" | "users" | "unpaid" | "conversion">("revenue");
    const { dark, toggle } = useTheme();

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api<DashboardOverview>(`/admin/dashboard/overview?period=${period}`),
            api<{ activities: any[] }>(`/admin/dashboard/recent-activity?limit=6`)
        ])
            .then(([overviewData, activityData]) => {
                setData(overviewData);
                setRecentActivity(activityData.activities || []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [period]);

    if (loading && !data) return <DashboardSkeleton />;

    const stats = data ? [
        { id: 'inquiries', label: "Total Inquiries", value: data.inquiries.total.toLocaleString(), change: data.inquiries.change, trend: data.inquiries.trend, icon: MessageSquare, path: "/inquiries" },
        { id: 'orders', label: "Total Orders", value: data.orders.total.toLocaleString(), change: data.orders.change, trend: data.orders.trend, icon: ShoppingCart, path: "/orders" },
        { id: 'revenue', label: "Total Revenue", value: formatValue(data.revenue.total_collected, 'revenue'), change: data.revenue.change, trend: data.revenue.trend, icon: IndianRupee, path: "/orders" },
        { id: 'users', label: "New Users", value: data.users.total.toLocaleString(), change: data.users.change, trend: data.users.trend, icon: Users, path: "/users" },
        { id: 'unpaid', label: "Unpaid Pending", value: formatValue(data.revenue.total_pending, 'revenue'), change: "Total Due", trend: 'up', icon: AlertCircle, path: "/orders" },
        { id: 'conversion', label: "Inquiry Conv.", value: `${data.inquiries.conversion_rate}%`, change: "Conv Rate", trend: 'up', icon: Filter, path: "/inquiries" }
    ] : [];

    const getChartData = () => {
        if (!data) return [];
        switch (chartType) {
            case "revenue": return data.orders.daily_trend.map(d => ({ date: d.date, value: d.value }));
            case "unpaid": return data.orders.daily_trend.map(d => ({ date: d.date, value: d.value }));
            case "orders": return data.orders.daily_trend.map(d => ({ date: d.date, value: d.count }));
            case "inquiries": return data.inquiries.daily_trend.map(d => ({ date: d.date, value: d.count }));
            case "conversion": return data.inquiries.daily_trend.map(d => ({ date: d.date, value: d.count }));
            case "users": return data.users.daily_trend.map(d => ({ date: d.date, value: d.count }));
            default: return [];
        }
    };

    const chartData = getChartData();
    const activeStat = stats.find(s => s.id === chartType);

    // Colors that adapt to theme and selected stat
    const accentColor = getCardColor(chartType, dark);
    const gridColor = dark ? '#434655' : '#e2e8f0';
    const tickColor = dark ? '#c3c5d8' : '#64748b';
    const brushBg = dark ? '#131b2e' : '#f1f5f9';

    const pipelineData = Object.entries(data?.orders.by_status || {}).map(([name, value]) => ({ name, value }));
    const totalOrders = pipelineData.reduce((s, d) => s + (d.value as number), 0);



    return (
        <div className="animate-fade-in font-['Inter'] min-h-screen bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] transition-colors">
            {/* Header */}
            <div className="pt-8 px-10 pb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-blue-600 dark:text-[#adc6ff]">Dashboard Overview</h1>
                    <p className="text-sm text-slate-500 dark:text-[#c3c5d8]/70 mt-1">Welcome back! Here's what's happening today.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggle}
                        className="p-2 rounded-lg border border-slate-200 dark:border-[#434655]/30 bg-white dark:bg-[#131b2e] text-slate-500 dark:text-[#c3c5d8] hover:bg-slate-100 dark:hover:bg-slate-50 dark:hover:bg-[#171f33] transition-colors"
                        title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {dark ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/30 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-[#adc6ff] text-slate-700 dark:text-[#dae2fd] transition-colors"
                    >
                        <option value="week">Last 7 days</option>
                        <option value="month">This Month</option>
                        <option value="quarter">Last quarter</option>
                    </select>
                </div>
            </div>

            {/* Content */}
            <div className="px-10 pb-12 space-y-8 mt-4">

                {/* Stat Cards */}
                <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {stats.map((s) => (
                        <StatCard
                            key={s.id}
                            {...s}
                            active={chartType === s.id}
                            onClick={() => setChartType(s.id as any)}
                            color={getCardColor(s.id, dark)}
                            dark={dark}
                        />
                    ))}
                </section>

                {/* ─── FULL-WIDTH INTERACTIVE GRAPH ─── */}
                <section className="w-full">
                    <div className="flex justify-between items-end mb-5">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-[#dae2fd]">{activeStat?.label} Trend</h3>
                            <p className="text-xs text-slate-500 dark:text-[#c3c5d8] mt-1">Click and drag the handles below to zoom into a date range</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#131b2e] p-6 rounded-xl border border-slate-200 dark:border-[#434655]/10 w-full transition-colors" style={{ height: 420 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                                <defs>
                                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={accentColor} stopOpacity={0.25} />
                                        <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={gridColor} opacity={0.4} />
                                <XAxis
                                    dataKey="date" fontSize={11} fontFamily="'Inter',system-ui" fontWeight={500}
                                    axisLine={false} tickLine={false} tick={{ fill: tickColor }}
                                    minTickGap={30}
                                />
                                <YAxis
                                    fontSize={11} fontFamily="'Inter',system-ui" fontWeight={500}
                                    axisLine={false} tickLine={false}
                                    tickFormatter={v => chartType === 'revenue' ? `₹${(v / 1000).toFixed(0)}k` : v}
                                    tick={{ fill: tickColor }}
                                />
                                <Tooltip content={<CustomTooltip chartType={chartType} />} cursor={{ stroke: accentColor, strokeDasharray: '4 4', strokeOpacity: 0.4 }} />
                                <Area
                                    type="monotone" dataKey="value"
                                    stroke={accentColor} strokeWidth={2.5} fill="url(#chartGrad)"
                                    dot={false}
                                    activeDot={{ r: 6, fill: accentColor, strokeWidth: 3, stroke: dark ? '#131b2e' : '#ffffff' }}
                                    animationDuration={800}
                                />
                                <Bar
                                    dataKey="value"
                                    maxBarSize={20}
                                    fill={accentColor}
                                    fillOpacity={0.15}
                                    radius={[4, 4, 0, 0]}
                                    animationDuration={1000}
                                />
                                {/* Interactive brush for zooming */}
                                <Brush
                                    dataKey="date" height={28} stroke={accentColor}
                                    fill={brushBg}
                                    travellerWidth={10}
                                    tickFormatter={() => ''}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* ─── Bottom Row 1: Pipelines + Funnel ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Order Pipeline */}
                    <div className="bg-white dark:bg-[#171f33] rounded-xl p-8 border border-slate-200 dark:border-[#434655]/10 transition-colors">
                        <div className="flex items-center gap-2 mb-8">
                            <ShoppingCart size={18} style={{ color: accentColor }} />
                            <h3 className="text-lg font-bold text-slate-800 dark:text-[#dae2fd]">Order Pipeline</h3>
                        </div>
                        <div className="h-[200px] relative mb-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pipelineData.length > 0 ? pipelineData : [{ name: 'empty', value: 1 }]}
                                        innerRadius={60} outerRadius={85}
                                        paddingAngle={4} dataKey="value"
                                        startAngle={90} endAngle={-270}
                                        stroke="none"
                                    >
                                        {pipelineData.length > 0
                                            ? pipelineData.map((item, i) => (
                                                <Cell key={`cell-${i}`} fill={accentColor} fillOpacity={1 - (i * 0.15)} className="transition-all duration-300" />
                                            ))
                                            : <Cell fill={dark ? '#434655' : '#e2e8f0'} fillOpacity={0.5} />
                                        }
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name) => [value, name]}
                                        contentStyle={{
                                            backgroundColor: dark ? '#131b2e' : '#ffffff',
                                            borderColor: dark ? '#434655' : '#e2e8f0',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                        }}
                                        itemStyle={{ color: dark ? '#dae2fd' : '#1e293b' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[28px] font-bold text-slate-800 dark:text-[#dae2fd] leading-none">{totalOrders}</span>
                                <span className="text-[10px] text-slate-500 dark:text-[#c3c5d8] font-medium mt-1 uppercase tracking-widest">Orders</span>
                            </div>
                        </div>
                        <div
                            className="mb-5 flex justify-between px-5 py-3 rounded-xl text-xs font-semibold border transition-colors"
                            style={{
                                backgroundColor: dark ? `${accentColor}1A` : `${accentColor}15`,
                                borderColor: dark ? `${accentColor}33` : `${accentColor}25`,
                                color: dark ? accentColor : '#1e3a8a'
                            }}
                        >
                            <span className="flex items-center gap-1.5 text-sm tracking-wide">📱 Online: {data?.orders.online_vs_offline?.online || 0}</span>
                            <span className="flex items-center gap-1.5 text-sm tracking-wide">🏢 Offline: {data?.orders.online_vs_offline?.offline || 0}</span>
                        </div>

                        <div className="space-y-3">
                            {pipelineData.map((item, i) => (
                                <div key={item.name} className="flex justify-between text-xs items-center p-2 rounded-lg bg-slate-50 dark:bg-[#0b1326]/50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full transition-colors duration-300" style={{ backgroundColor: accentColor, opacity: 1 - (i * 0.15) }} />
                                        <span className="text-slate-600 dark:text-[#c3c5d8] font-medium tracking-wide uppercase">{item.name}</span>
                                    </div>
                                    <span className="font-bold text-slate-800 dark:text-[#dae2fd]">{item.value as number}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Inquiry Funnel */}
                    <div className="bg-white dark:bg-[#171f33] rounded-xl p-8 border border-slate-200 dark:border-[#434655]/10 transition-colors">
                        <div className="flex items-center gap-2 mb-8">
                            <Filter size={18} style={{ color: accentColor }} />
                            <h3 className="text-lg font-bold text-slate-800 dark:text-[#dae2fd]">Inquiry Funnel</h3>
                        </div>
                        <div className="space-y-6 mt-4">
                            {[
                                { stage: 'Drafts', value: data?.inquiries.funnel?.draft || 0, color: dark ? '#475569' : '#94a3b8' },
                                { stage: 'Submitted', value: data?.inquiries.funnel?.submitted || 0, color: dark ? '#3b82f6' : '#60a5fa' },
                                { stage: 'Quoted', value: data?.inquiries.funnel?.quoted || 0, color: dark ? '#f59e0b' : '#fbbf24' },
                                { stage: 'Accepted', value: data?.inquiries.funnel?.accepted || 0, color: dark ? '#10b981' : '#34d399' },
                            ].map((f) => {
                                const max = Math.max(data?.inquiries.funnel?.draft || 1, 1);
                                const width = Math.max((f.value / max) * 100, 4); // min width for visibility
                                return (
                                    <div key={f.stage} className="relative">
                                        <div className="flex justify-between text-xs mb-1.5 text-slate-600 dark:text-[#c3c5d8] font-medium">
                                            <span>{f.stage}</span>
                                            <span className="font-bold text-slate-800 dark:text-[#dae2fd]">{f.value}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-[#0b1326]/60 rounded-full h-2.5 overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${width}%`, backgroundColor: f.color }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ─── Bottom Row 2: Reviews + Activity ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">

                    {/* Recent Reviews */}
                    <div className="bg-white dark:bg-[#171f33] rounded-xl border border-slate-200 dark:border-[#434655]/10 overflow-hidden transition-colors">
                        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 dark:border-[#434655]/20">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-[#dae2fd]">Latest Reviews</h3>
                            <Link to="/reviews" className="text-xs font-semibold text-blue-500 dark:text-[#adc6ff] hover:underline underline-offset-4">View All</Link>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-[#434655]/10">
                            {!data?.recent_reviews || data.recent_reviews.length === 0 ? (
                                <p className="px-6 py-8 text-center text-slate-400 dark:text-[#c3c5d8] text-xs">No recent reviews.</p>
                            ) : (
                                data.recent_reviews.slice(0, 4).map((rev) => (
                                    <div key={rev.id} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-200 dark:hover:bg-[#222a3d]/50 transition-colors flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-[#314587] flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-[#a2b5ff] shrink-0">
                                            {rev.user_name?.substring(0, 2).toUpperCase() || 'US'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 dark:text-[#dae2fd] m-0 truncate">{rev.user_name || 'Anonymous'}</p>
                                            <p className="text-xs text-slate-400 dark:text-[#c3c5d8] m-0 truncate">"{rev.comment}"</p>
                                        </div>
                                        <div className="flex items-center gap-0.5 shrink-0">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <span key={s} className={`w-1.5 h-1.5 rounded-full ${s <= rev.rating ? 'bg-amber-400 dark:bg-[#ffb597]' : 'bg-slate-200 dark:bg-[#434655]/40'}`} />
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* System Activity */}
                    <div className="bg-white dark:bg-[#171f33] rounded-xl p-8 border border-slate-200 dark:border-[#434655]/10 transition-colors">
                        <div className="flex items-center gap-2 mb-8">
                            <MessageSquare size={18} className="text-amber-500 dark:text-[#ffb597]" />
                            <h3 className="text-lg font-bold text-slate-800 dark:text-[#dae2fd]">System Activity</h3>
                        </div>
                        <div className="space-y-6">
                            {recentActivity.length === 0 ? (
                                <p className="text-xs text-slate-400 dark:text-[#c3c5d8]">No recent activity.</p>
                            ) : (
                                recentActivity.slice(0, 4).map((act, i) => (
                                    <div key={i} className="group cursor-pointer">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-[10px] font-bold text-blue-500 dark:text-[#adc6ff] uppercase tracking-tighter m-0">Event</p>
                                            <p className="text-[10px] text-slate-400 dark:text-[#c3c5d8] m-0">
                                                {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <p className="text-xs text-slate-700 dark:text-[#dae2fd] font-medium group-hover:text-blue-600 dark:group-hover:text-blue-600 dark:hover:text-[#adc6ff] transition-colors leading-relaxed m-0">
                                            {act.description}
                                        </p>
                                        {i !== recentActivity.length - 1 && <div className="mt-6 h-px bg-slate-100 dark:bg-[#434655]/20" />}
                                    </div>
                                ))
                            )}
                            <Link to="/activity" className="block mt-4 w-full py-2.5 text-center bg-slate-100 dark:bg-[#222a3d] text-slate-700 dark:text-[#dae2fd] text-[10px] font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-[#31394d] transition-all uppercase tracking-widest">
                                View All Logs
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ─── Bottom Row 3: Traffic (Removed to use Google / Vercel Analytics) ─── */}
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="animate-pulse bg-slate-50 dark:bg-[#0b1326] min-h-screen pt-8 px-10 pb-12 transition-colors">
            <div className="h-8 w-64 bg-slate-200 dark:bg-[#171f33] rounded mt-2 mb-1" />
            <div className="h-4 w-48 bg-slate-100 dark:bg-[#131b2e] rounded mb-8" />
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white dark:bg-[#131b2e] p-6 rounded-xl border border-slate-200 dark:border-[#434655]/10 h-32" />
                ))}
            </section>
            <div className="bg-white dark:bg-[#131b2e] rounded-xl border border-slate-200 dark:border-[#434655]/10 w-full" style={{ height: 420 }} />
        </div>
    );
}
