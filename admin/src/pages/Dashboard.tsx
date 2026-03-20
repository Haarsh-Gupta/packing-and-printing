import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import type { DashboardOverview, Review } from "@/types";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from "recharts";
import {
    TrendingUp, TrendingDown, Users, ShoppingBag, MessageSquare,
    IndianRupee, ArrowUpRight, ShoppingCart
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_COLORS: Record<string, string> = {
    PENDING: '#f59e0b',
    PROCESSING: '#3b82f6',
    SHIPPED: '#8b5cf6',
    DELIVERED: '#10b981',
    CANCELLED: '#ef4444',
};

const CustomTooltip = ({ active, payload, label, chartType }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white shadow-lg">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-0.5 m-0">{label}</p>
                <p className="font-semibold m-0">
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

// Stat Card Component
const StatCard = ({ label, value, change, trend, icon: Icon, accent, path, onClick, active }: any) => (
    <div
        onClick={onClick}
        className={`flex-1 relative rounded-[14px] p-5 cursor-pointer transition-all dark:bg-slate-900
            ${active 
                ? 'bg-white shadow-xl dark:shadow-none' 
                : 'bg-white border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md'
            }`}
        style={{
            border: active ? `2px solid ${accent}` : '1px solid var(--color-border)',
            boxShadow: active ? `0 0 0 1px ${accent}20, 0 8px 24px ${accent}15` : undefined,
        }}
    >
        <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: accent + '18' }}>
                <Icon size={16} style={{ color: accent }} />
            </div>
        </div>
        <p className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white m-0 leading-tight">
            {value}
        </p>
        <div className="flex items-center gap-1.5 mt-2">
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${trend === 'up' ? 'text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400' : 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400'}`}>
                {trend === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {change}
            </span>
            <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">vs last period</span>
        </div>
        <Link to={path} className="absolute top-2.5 right-2.5 opacity-40 hover:opacity-100 transition-opacity text-slate-500 dark:text-slate-400">
            <ArrowUpRight size={14} />
        </Link>
    </div>
);

export default function Dashboard() {
    const [data, setData] = useState<DashboardOverview | null>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("month");
    const [chartType, setChartType] = useState<"revenue" | "orders" | "inquiries" | "users">("revenue");

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
        { id: 'revenue', label: "Total Revenue", value: formatValue(data.revenue.total_collected, 'revenue'), change: data.revenue.change, trend: data.revenue.trend, icon: IndianRupee, accent: "#10b981", path: "/orders" },
        { id: 'orders', label: "Total Orders", value: data.orders.total.toLocaleString(), change: data.orders.change, trend: data.orders.trend, icon: ShoppingCart, accent: "#3b82f6", path: "/orders" },
        { id: 'inquiries', label: "Inquiries", value: data.inquiries.total.toLocaleString(), change: data.inquiries.change, trend: data.inquiries.trend, icon: MessageSquare, accent: "#ef4444", path: "/inquiries" },
        { id: 'users', label: "New Users", value: data.users.total.toLocaleString(), change: data.users.change, trend: data.users.trend, icon: Users, accent: "#8b5cf6", path: "/users" },
    ] : [];

    const getChartData = () => {
        if (!data) return [];
        switch (chartType) {
            case "revenue": return data.orders.daily_trend.map(d => ({ date: d.date, value: d.value }));
            case "orders": return data.orders.daily_trend.map(d => ({ date: d.date, value: d.count }));
            case "inquiries": return data.inquiries.daily_trend.map(d => ({ date: d.date, value: d.count }));
            case "users": return data.users.daily_trend.map(d => ({ date: d.date, value: d.count }));
            default: return [];
        }
    };

    const chartData = getChartData();
    const activeStat = stats.find(s => s.id === chartType);
    const pipelineData = Object.entries(data?.orders.by_status || {}).map(([name, value]) => ({ name, value }));
    const totalOrders = pipelineData.reduce((s, d) => s + (d.value as number), 0);

    return (
        <div className="animate-fade-in flex flex-col gap-5 font-sans">

            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white m-0">
                        Dashboard Overview
                    </h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 m-0">
                        Welcome back! Here's what's happening today.
                    </p>
                </div>
                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-36 h-9 rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[13px] text-slate-900 dark:text-white">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="week">Last 7 days</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="quarter">Last quarter</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s) => (
                    <StatCard
                        key={s.id}
                        {...s}
                        active={chartType === s.id}
                        onClick={() => setChartType(s.id as any)}
                    />
                ))}
            </div>

            {/* Revenue chart */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white m-0">
                            {activeStat?.label} Trend
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 m-0">Current View: {chartType.charAt(0).toUpperCase() + chartType.slice(1)}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${activeStat?.trend === 'up' ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
                        {activeStat?.trend === 'up' ? <TrendingUp size={11} className="text-green-600 dark:text-green-400" /> : <TrendingDown size={11} className="text-red-600 dark:text-red-400" />}
                        <span className={`text-[11px] font-semibold ${activeStat?.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {activeStat?.change} vs last period
                        </span>
                    </div>
                </div>
                <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={activeStat?.accent || "#3b82f6"} stopOpacity={0.15} />
                                    <stop offset="100%" stopColor={activeStat?.accent || "#3b82f6"} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                            <XAxis dataKey="date" fontSize={11} fontFamily="'Inter',system-ui" fontWeight={500}
                                axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                            <YAxis fontSize={11} fontFamily="'Inter',system-ui" fontWeight={500}
                                axisLine={false} tickLine={false}
                                tickFormatter={v => chartType === 'revenue' ? `₹${(v / 1000).toFixed(0)}k` : v}
                                tick={{ fill: '#94a3b8' }} />
                            <Tooltip content={<CustomTooltip chartType={chartType} />} />
                            <Area type="monotone" dataKey="value"
                                stroke={activeStat?.accent || "#3b82f6"} strokeWidth={2} fill="url(#revenueGrad)"
                                dot={false} activeDot={{ r: 4, fill: activeStat?.accent || '#3b82f6', strokeWidth: 0 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom grid: Recent Activity + Order Pipeline */}
            <div className="flex flex-col xl:flex-row gap-4">

                {/* Recent Activity */}
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white m-0">Recent Activity</h2>
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.2)] animate-pulse" />
                    </div>

                    {recentActivity.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                            <ShoppingBag size={28} className="opacity-30 mx-auto mb-2" />
                            <p className="text-[13px] font-medium m-0">No recent activity</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {recentActivity.slice(0, 6).map((act, i) => (
                                <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${i === 0 ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-medium text-slate-900 dark:text-white m-0 truncate">
                                            {act.description}
                                        </p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5 m-0">
                                            {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <ArrowUpRight size={12} className="text-slate-300 dark:text-slate-600 shrink-0 mt-1" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Order Pipeline */}
                <div className="w-full xl:w-[300px] xl:shrink-0 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col">
                    <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white m-0 mb-4">Order Pipeline</h2>
                    <div className="h-40 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pipelineData.length > 0 ? pipelineData : [{ name: 'empty', value: 1 }]}
                                    innerRadius={50} outerRadius={72}
                                    paddingAngle={3} dataKey="value"
                                    startAngle={90} endAngle={-270}
                                    stroke="none"
                                >
                                    {pipelineData.length > 0
                                        ? pipelineData.map((item, i) => (
                                            <Cell key={`cell-${i}`} fill={STATUS_COLORS[item.name] || '#e4e4e7'} />
                                        ))
                                        : <Cell fill="var(--color-border)" fillOpacity={0.5} />
                                    }
                                </Pie>
                                <Tooltip formatter={(value, name) => [value, name]} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[22px] font-bold text-slate-900 dark:text-white leading-none">{totalOrders}</span>
                            <span className="text-[10px] text-slate-500 font-medium mt-1">Total Orders</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5 mt-3">
                        {pipelineData.map(item => (
                            <div key={item.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[item.name] || '#e4e4e7' }} />
                                    <span className="text-[12px] text-slate-600 dark:text-slate-300 font-medium">
                                        {item.name.charAt(0) + item.name.slice(1).toLowerCase()}
                                    </span>
                                </div>
                                <span className="text-[12px] font-bold text-slate-900 dark:text-white">{item.value as number}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Latest Reviews */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white m-0">Latest Customer Reviews</h2>
                    <Link to="/reviews" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View All</Link>
                </div>

                {!data?.recent_reviews || data.recent_reviews.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-[13px]">
                        No reviews yet
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {data.recent_reviews.map((rev) => (
                            <div key={rev.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[13px] font-semibold text-slate-900 dark:text-white">{rev.user_name}</span>
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <div key={star} className={`w-2.5 h-2.5 rounded-full ${star <= rev.rating ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 mb-2 leading-relaxed italic">
                                    "{rev.comment}"
                                </p>
                                <div className="flex items-center justify-between mt-auto pt-2 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                    <span>{rev.product_name || 'General Product'}</span>
                                    <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="flex flex-col gap-5 animate-pulse">
            <div className="flex justify-between items-center">
                <div>
                    <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded-md mb-2" />
                    <div className="h-3.5 w-64 bg-slate-100 dark:bg-slate-800/50 rounded-md" />
                </div>
                <div className="h-9 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex-1 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/50">
                        <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded mb-3" />
                        <div className="h-7 w-24 bg-slate-200 dark:bg-slate-700 rounded-md mb-2.5" />
                        <div className="h-5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
                    </div>
                ))}
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 h-[300px] border border-slate-200/50 dark:border-slate-800/50" />
            <div className="flex flex-col xl:flex-row gap-4">
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl p-5 h-[300px] border border-slate-200/50 dark:border-slate-800/50" />
                <div className="w-full xl:w-[300px] bg-white dark:bg-slate-900 rounded-2xl p-5 h-[300px] border border-slate-200/50 dark:border-slate-800/50" />
            </div>
        </div>
    );
}