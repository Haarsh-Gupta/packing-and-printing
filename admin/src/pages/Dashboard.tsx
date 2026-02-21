import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DashboardOverview } from "@/types";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import {
    TrendingUp, TrendingDown, Users, ShoppingBag, MessageSquare,
    Activity, IndianRupee, Clock, ArrowUpRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const CHART_COLORS = ["#1a1a1a", "#525252", "#a3a3a3", "#d4d4d4", "#e5e5e5", "#f5f5f5"];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: '#0a0a0a',
                border: '1px solid #262626',
                borderRadius: '4px',
                padding: '8px 12px',
                fontFamily: "'DM Mono', monospace",
                fontSize: '11px',
                color: '#fafafa',
            }}>
                <p style={{ color: '#737373', marginBottom: '2px' }}>{label}</p>
                <p style={{ fontWeight: 700 }}>{payload[0]?.name === 'amount' ? '₹' : ''}{payload[0]?.value?.toLocaleString()}</p>
            </div>
        );
    }
    return null;
};

export default function Dashboard() {
    const [data, setData] = useState<DashboardOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("month");

    useEffect(() => {
        setLoading(true);
        api<any>(`/admin/dashboard/overview?period=${period}`)
            .then((raw) => {
                // Normalize nested backend response to flat UI shape
                const normalized: DashboardOverview = {
                    total_users: raw.users?.total ?? raw.total_users ?? 0,
                    total_orders: raw.orders?.total ?? raw.total_orders ?? 0,
                    total_revenue: raw.revenue?.total_collected ?? raw.total_revenue ?? 0,
                    total_inquiries: raw.inquiries?.total ?? raw.total_inquiries ?? 0,
                    total_products: raw.products?.total ?? raw.total_products ?? 0,
                    total_services: raw.services?.total ?? raw.total_services ?? 0,
                    daily_orders: raw.daily_orders ?? [],
                    order_pipeline: raw.orders?.by_status ?? raw.order_pipeline ?? {},
                    recent_activity: raw.recent_activity ?? [],
                };
                setData(normalized);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [period]);

    const stats = data ? [
        {
            label: "Revenue",
            value: `₹${((data.total_revenue || 0) / 100000).toFixed(1)}L`,
            sub: `₹${(data.total_revenue || 0).toLocaleString()} total`,
            change: "+12.5%",
            trend: "up",
            icon: IndianRupee,
            accent: "#16a34a",
        },
        {
            label: "Orders",
            value: (data.total_orders || 0).toLocaleString(),
            sub: "total processed",
            change: "+8.2%",
            trend: "up",
            icon: ShoppingBag,
            accent: "#2563eb",
        },
        {
            label: "Inquiries",
            value: (data.total_inquiries || 0).toLocaleString(),
            sub: "customer requests",
            change: "-3.1%",
            trend: "down",
            icon: MessageSquare,
            accent: "#dc2626",
        },
        {
            label: "Customers",
            value: (data.total_users || 0).toLocaleString(),
            sub: "registered users",
            change: "+24.5%",
            trend: "up",
            icon: Users,
            accent: "#9333ea",
        },
    ] : [];

    if (loading && !data) return <DashboardSkeleton />;

    const chartData = (data?.daily_orders || []).map(d => ({
        date: d.date.split('-').slice(2).join('/'),
        amount: d.count * 1200,
        count: d.count,
    }));

    const pipelineData = Object.entries(data?.order_pipeline || {}).map(([name, value]) => ({ name, value }));


    return (
        <div className="space-y-0 animate-fade-in" style={{ fontFamily: "'DM Sans', 'DM Mono', system-ui" }}>

            {/* Page Header */}
            <div style={{
                borderBottom: '1px solid var(--border)',
                paddingBottom: '24px',
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
            }}>
                <div>
                    <p style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.15em',
                        color: 'var(--muted-foreground)',
                        textTransform: 'uppercase',
                        marginBottom: '6px',
                        fontFamily: "'DM Mono', monospace",
                    }}>
                        BookBind · Admin Console
                    </p>
                    <h1 style={{
                        fontSize: '32px',
                        fontWeight: 900,
                        letterSpacing: '-0.04em',
                        lineHeight: 1,
                        color: 'var(--foreground)',
                    }}>
                        Performance Overview
                    </h1>
                </div>
                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger style={{
                        height: '36px',
                        fontFamily: "'DM Mono', monospace",
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        width: '160px',
                    }}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="week">Last 7 days</SelectItem>
                        <SelectItem value="month">Last 30 days</SelectItem>
                        <SelectItem value="quarter">Last quarter</SelectItem>
                        <SelectItem value="year">Last year</SelectItem>
                        <SelectItem value="all">All time</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* KPI Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '24px',
            }}>
                {stats.map((s, i) => (
                    <div key={i} style={{
                        padding: '28px 24px',
                        borderRight: i < 3 ? '1px solid var(--border)' : 'none',
                        position: 'relative',
                        background: 'var(--card)',
                        transition: 'background 0.15s',
                    }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'var(--card)')}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '16px',
                        }}>
                            <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                color: 'var(--muted-foreground)',
                                fontFamily: "'DM Mono', monospace",
                            }}>
                                {s.label}
                            </span>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                background: s.accent + '15',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <s.icon size={15} style={{ color: s.accent }} />
                            </div>
                        </div>
                        <div style={{
                            fontSize: '36px',
                            fontWeight: 900,
                            letterSpacing: '-0.05em',
                            lineHeight: 1,
                            color: 'var(--foreground)',
                            marginBottom: '8px',
                        }}>
                            {s.value}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: s.trend === 'up' ? '#16a34a' : '#dc2626',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px',
                                fontFamily: "'DM Mono', monospace",
                            }}>
                                {s.trend === 'up' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                {s.change}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontWeight: 500 }}>
                                {s.sub}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Charts Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 340px',
                gap: '16px',
                marginBottom: '16px',
            }}>
                {/* Revenue Area Chart */}
                <div style={{
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'var(--card)',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        padding: '20px 24px 16px',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                        <div>
                            <p style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                color: 'var(--muted-foreground)',
                                fontFamily: "'DM Mono', monospace",
                                marginBottom: '4px',
                            }}>Revenue Trend</p>
                            <p style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em' }}>
                                Daily Performance
                            </p>
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            background: '#16a34a15',
                            borderRadius: '4px',
                            border: '1px solid #16a34a30',
                        }}>
                            <TrendingUp size={12} style={{ color: '#16a34a' }} />
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', fontFamily: "'DM Mono', monospace" }}>+12.5%</span>
                        </div>
                    </div>
                    <div style={{ padding: '16px 8px 8px 8px', height: '260px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRevBold" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--foreground)" stopOpacity={0.08} />
                                        <stop offset="95%" stopColor="var(--foreground)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis
                                    dataKey="date"
                                    fontSize={10}
                                    fontFamily="'DM Mono', monospace"
                                    fontWeight={600}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--muted-foreground)' }}
                                />
                                <YAxis
                                    fontSize={10}
                                    fontFamily="'DM Mono', monospace"
                                    fontWeight={600}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                                    tick={{ fill: 'var(--muted-foreground)' }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="var(--foreground)"
                                    fill="url(#colorRevBold)"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4, fill: 'var(--foreground)', strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Order Pipeline */}
                <div style={{
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'var(--card)',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        padding: '20px 24px 16px',
                        borderBottom: '1px solid var(--border)',
                    }}>
                        <p style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: 'var(--muted-foreground)',
                            fontFamily: "'DM Mono', monospace",
                            marginBottom: '4px',
                        }}>Order Status</p>
                        <p style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em' }}>Pipeline View</p>
                    </div>
                    <div style={{ padding: '16px', height: '180px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pipelineData}
                                    innerRadius={52}
                                    outerRadius={72}
                                    paddingAngle={3}
                                    dataKey="value"
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                    {pipelineData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {pipelineData.slice(0, 4).map((item, i) => (
                            <div key={item.name} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 8px',
                                borderRadius: '4px',
                                background: 'var(--secondary)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '2px',
                                        background: CHART_COLORS[i % CHART_COLORS.length],
                                        flexShrink: 0,
                                    }} />
                                    <span style={{
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        color: 'var(--muted-foreground)',
                                        fontFamily: "'DM Mono', monospace",
                                    }}>{item.name.replace('_', ' ')}</span>
                                </div>
                                <span style={{
                                    fontSize: '12px',
                                    fontWeight: 800,
                                    fontFamily: "'DM Mono', monospace",
                                    color: 'var(--foreground)',
                                }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '340px 1fr',
                gap: '16px',
            }}>
                {/* Recent Activity Feed */}
                <div style={{
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'var(--card)',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        padding: '20px 24px 16px',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                        <div>
                            <p style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                color: 'var(--muted-foreground)',
                                fontFamily: "'DM Mono', monospace",
                                marginBottom: '4px',
                            }}>Live Feed</p>
                            <p style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em' }}>Activity</p>
                        </div>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#16a34a',
                            boxShadow: '0 0 0 3px #16a34a30',
                            animation: 'pulse 2s infinite',
                        }} />
                    </div>
                    <div style={{ padding: '8px' }}>
                        {(data?.recent_activity || []).slice(0, 6).map((act, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '10px',
                                padding: '10px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'background 0.1s',
                            }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <div style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: i === 0 ? '#16a34a' : 'var(--border)',
                                    marginTop: '5px',
                                    flexShrink: 0,
                                }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: 'var(--foreground)',
                                        lineHeight: 1.4,
                                        marginBottom: '2px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>{act.description}</p>
                                    <p style={{
                                        fontSize: '10px',
                                        color: 'var(--muted-foreground)',
                                        fontFamily: "'DM Mono', monospace",
                                        fontWeight: 600,
                                    }}>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <ArrowUpRight size={12} style={{ color: 'var(--muted-foreground)', flexShrink: 0, marginTop: '4px' }} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Volume Bar Chart */}
                <div style={{
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'var(--card)',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        padding: '20px 24px 16px',
                        borderBottom: '1px solid var(--border)',
                    }}>
                        <p style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: 'var(--muted-foreground)',
                            fontFamily: "'DM Mono', monospace",
                            marginBottom: '4px',
                        }}>Volume Analysis</p>
                        <p style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em' }}>Daily Order Count</p>
                    </div>
                    <div style={{ padding: '16px 8px 8px', height: '240px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} barCategoryGap="35%">
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis
                                    dataKey="date"
                                    fontSize={10}
                                    fontFamily="'DM Mono', monospace"
                                    fontWeight={600}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--muted-foreground)' }}
                                />
                                <YAxis
                                    fontSize={10}
                                    fontFamily="'DM Mono', monospace"
                                    fontWeight={600}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--muted-foreground)' }}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--accent)', opacity: 0.5 }} />
                                <Bar dataKey="count" fill="var(--foreground)" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                <div>
                    <Skeleton className="h-3 w-40 mb-3" />
                    <Skeleton className="h-8 w-64" />
                </div>
                <Skeleton className="h-9 w-40" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ padding: '28px 24px', borderRight: i < 4 ? '1px solid var(--border)' : 'none' }}>
                        <Skeleton className="h-3 w-20 mb-4" />
                        <Skeleton className="h-10 w-28 mb-3" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px' }}>
                <Skeleton className="h-[320px] rounded-lg" />
                <Skeleton className="h-[320px] rounded-lg" />
            </div>
        </div>
    );
}