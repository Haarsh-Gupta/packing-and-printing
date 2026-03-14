import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import type { DashboardOverview } from "@/types";
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
            <div style={{
                background: 'white', border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: '10px', padding: '8px 12px',
                fontFamily: "'Inter', system-ui", fontSize: '12px', color: '#18181b',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            }}>
                <p style={{ color: '#71717a', marginBottom: '2px', fontSize: '11px' }}>{label}</p>
                <p style={{ fontWeight: 600 }}>
                    {chartType === 'revenue' ? `₹${payload[0]?.value?.toLocaleString()}` : payload[0]?.value?.toLocaleString()}
                </p>
            </div>
        );
    }
    return null;
};

interface DashboardOverviewWithTrend extends DashboardOverview {
    users: DashboardOverview['users'] & { daily_trend: { date: string; count: number }[]; change: string; trend: 'up' | 'down' };
    orders: DashboardOverview['orders'] & { daily_trend: { date: string; value: number; count: number }[]; change: string; trend: 'up' | 'down' };
    inquiries: DashboardOverview['inquiries'] & { daily_trend: { date: string; count: number }[]; change: string; trend: 'up' | 'down' };
    revenue: DashboardOverview['revenue'] & { change: string; trend: 'up' | 'down' };
}

// Stat Card Component
const StatCard = ({ label, value, change, trend, icon: Icon, accent, path, onClick, active }: any) => (
    <div
        onClick={onClick}
        style={{
            background: 'white', borderRadius: '14px', padding: '20px 22px',
            border: active ? `2px solid ${accent}` : '1px solid rgba(0,0,0,0.06)',
            boxShadow: active ? `0 0 0 1px ${accent}20, 0 8px 24px ${accent}15` : '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
            flex: 1,
            textDecoration: 'none',
            transition: 'all 0.2s',
            cursor: 'pointer',
            position: 'relative',
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#71717a' }}>{label}</span>
            <div style={{
                width: '34px', height: '34px', borderRadius: '10px',
                background: accent + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon size={16} style={{ color: accent }} />
            </div>
        </div>
        <p style={{
            fontSize: '28px', fontWeight: 700, letterSpacing: '-0.03em',
            color: '#18181b', margin: 0, lineHeight: 1.1,
        }}>{value}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                fontSize: '11px', fontWeight: 600,
                color: trend === 'up' ? '#16a34a' : '#dc2626',
                background: trend === 'up' ? '#f0fdf4' : '#fef2f2',
                padding: '2px 7px', borderRadius: '999px',
            }}>
                {trend === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {change}
            </span>
            <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 400 }}>vs last period</span>
        </div>
        <Link to={path} style={{ position: 'absolute', top: 10, right: 10, opacity: 0.4 }}>
            <ArrowUpRight size={14} />
        </Link>
    </div>
);

export default function Dashboard() {
    const [data, setData] = useState<DashboardOverviewWithTrend | null>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("month");
    const [chartType, setChartType] = useState<"revenue" | "orders" | "inquiries" | "users">("revenue");

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api<DashboardOverviewWithTrend>(`/admin/dashboard/overview?period=${period}`),
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
        { id: 'revenue', label: "Total Revenue", value: `₹${(data.revenue.total_collected / 100000).toFixed(1)}L`, change: data.revenue.change, trend: data.revenue.trend, icon: IndianRupee, accent: "#10b981", path: "/orders" },
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
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: "'Inter', system-ui" }}>

            {/* Page header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.025em', color: '#18181b', margin: 0 }}>
                        Dashboard Overview
                    </h1>
                    <p style={{ fontSize: '13px', color: '#71717a', marginTop: '3px' }}>
                        Welcome back! Here's what's happening today.
                    </p>
                </div>
                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger style={{
                        height: '34px', fontSize: '13px', width: '140px',
                        borderRadius: '9px', border: '1px solid #e4e4e7',
                        fontFamily: "'Inter', system-ui",
                    }}>
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
            <div style={{ display: 'flex', gap: '14px' }}>
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
            <div style={{
                background: 'white', borderRadius: '16px', padding: '22px',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div>
                        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#18181b', margin: 0 }}>
                            {activeStat?.label} Trend
                        </h2>
                        <p style={{ fontSize: '12px', color: '#71717a', marginTop: '3px' }}>Current View: {chartType.charAt(0).toUpperCase() + chartType.slice(1)}</p>
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        background: '#f0fdf4', borderRadius: '999px', padding: '4px 10px',
                    }}>
                        <TrendingUp size={11} style={{ color: '#16a34a' }} />
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#16a34a' }}>+12.5% vs last month</span>
                    </div>
                </div>
                <div style={{ height: '240px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={activeStat?.accent || "#3b82f6"} stopOpacity={0.15} />
                                    <stop offset="100%" stopColor={activeStat?.accent || "#3b82f6"} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis dataKey="date" fontSize={11} fontFamily="'Inter',system-ui" fontWeight={500}
                                axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa' }} />
                            <YAxis fontSize={11} fontFamily="'Inter',system-ui" fontWeight={500}
                                axisLine={false} tickLine={false}
                                tickFormatter={v => chartType === 'revenue' ? `₹${(v / 1000).toFixed(0)}k` : v}
                                tick={{ fill: '#a1a1aa' }} />
                            <Tooltip content={<CustomTooltip chartType={chartType} />} />
                            <Area type="monotone" dataKey="value"
                stroke={activeStat?.accent || "#3b82f6"} strokeWidth={2} fill="url(#revenueGrad)"
                                dot={false} activeDot={{ r: 4, fill: activeStat?.accent || '#3b82f6', strokeWidth: 0 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom grid: Recent Activity + Order Pipeline */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '14px' }}>

                {/* Recent Activity */}
                <div style={{
                    background: 'white', borderRadius: '16px', padding: '22px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#18181b', margin: 0 }}>Recent Activity</h2>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 3px rgba(16,185,129,0.2)', animation: 'pulse 2s infinite' }} />
                    </div>

                    {recentActivity.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#a1a1aa' }}>
                            <ShoppingBag size={28} style={{ opacity: 0.3, marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                            <p style={{ fontSize: '13px', fontWeight: 500 }}>No recent activity</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {recentActivity.slice(0, 6).map((act, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                                    padding: '10px 8px', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.1s',
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#f9f9f9')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <div style={{
                                        width: '8px', height: '8px', borderRadius: '50%',
                                        background: i === 0 ? '#10b981' : '#e4e4e7',
                                        marginTop: '5px', flexShrink: 0,
                                    }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{
                                            fontSize: '13px', fontWeight: 500, color: '#18181b',
                                            margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>
                                            {act.description}
                                        </p>
                                        <p style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 400, marginTop: '2px' }}>
                                            {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <ArrowUpRight size={12} style={{ color: '#d4d4d8', flexShrink: 0, marginTop: '4px' }} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Order Pipeline */}
                <div style={{
                    background: 'white', borderRadius: '16px', padding: '22px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
                }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#18181b', margin: '0 0 16px' }}>Order Pipeline</h2>
                    <div style={{ height: '160px', position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pipelineData.length > 0 ? pipelineData : [{ name: 'empty', value: 1 }]}
                                    innerRadius={50} outerRadius={72}
                                    paddingAngle={3} dataKey="value"
                                    startAngle={90} endAngle={-270}
                                >
                                    {pipelineData.length > 0
                                        ? pipelineData.map((item, i) => (
                                            <Cell key={`cell-${i}`} fill={STATUS_COLORS[item.name] || '#e4e4e7'} strokeWidth={0} />
                                        ))
                                        : <Cell fill="#f4f4f5" strokeWidth={0} />
                                    }
                                </Pie>
                                <Tooltip formatter={(value, name) => [value, name]} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{
                            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexDirection: 'column', pointerEvents: 'none',
                        }}>
                            <span style={{ fontSize: '22px', fontWeight: 700, color: '#18181b' }}>{totalOrders}</span>
                            <span style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: 500 }}>Total Orders</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
                        {pipelineData.map(item => (
                            <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                    <div style={{
                                        width: '8px', height: '8px', borderRadius: '50%',
                                        background: STATUS_COLORS[item.name] || '#e4e4e7', flexShrink: 0,
                                    }} />
                                    <span style={{ fontSize: '12px', color: '#52525b', fontWeight: 500 }}>
                                        {item.name.charAt(0) + item.name.slice(1).toLowerCase()}
                                    </span>
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#18181b' }}>{item.value as number}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-pulse">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ height: '20px', width: '200px', background: '#e4e4e7', borderRadius: '6px', marginBottom: '8px' }} />
                    <div style={{ height: '14px', width: '280px', background: '#f4f4f5', borderRadius: '6px' }} />
                </div>
                <div style={{ height: '34px', width: '140px', background: '#e4e4e7', borderRadius: '9px' }} />
            </div>
            <div style={{ display: 'flex', gap: '14px' }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ flex: 1, background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid rgba(0,0,0,0.06)' }}>
                        <div style={{ height: '12px', width: '80px', background: '#f4f4f5', borderRadius: '4px', marginBottom: '12px' }} />
                        <div style={{ height: '28px', width: '100px', background: '#e4e4e7', borderRadius: '6px', marginBottom: '10px' }} />
                        <div style={{ height: '20px', width: '60px', background: '#f4f4f5', borderRadius: '999px' }} />
                    </div>
                ))}
            </div>
            <div style={{ background: 'white', borderRadius: '16px', padding: '22px', height: '300px', border: '1px solid rgba(0,0,0,0.06)' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '14px' }}>
                <div style={{ background: 'white', borderRadius: '16px', padding: '22px', height: '300px', border: '1px solid rgba(0,0,0,0.06)' }} />
                <div style={{ background: 'white', borderRadius: '16px', padding: '22px', height: '300px', border: '1px solid rgba(0,0,0,0.06)' }} />
            </div>
        </div>
    );
}