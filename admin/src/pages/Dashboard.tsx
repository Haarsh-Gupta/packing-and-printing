import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DashboardOverview } from "@/types";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell
} from "recharts";
import {
    TrendingUp, TrendingDown, Users, ShoppingBag, MessageSquare,
    Activity, ArrowUpRight, ArrowDownRight, IndianRupee, Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#000000", "#3f3f46", "#71717a", "#a1a1aa", "#d4d4d8", "#f4f4f5"];

export default function Dashboard() {
    const [data, setData] = useState<DashboardOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState("30");

    useEffect(() => {
        setLoading(true);
        api<DashboardOverview>(`/admin-dashboard/overview?days=${period}`)
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [period]);

    const stats = data ? [
        { label: "Total Revenue", value: `₹${data.total_revenue.toLocaleString()}`, change: "+12.5%", trend: "up", icon: IndianRupee },
        { label: "Total Orders", value: data.total_orders, change: "+8.2%", trend: "up", icon: ShoppingBag },
        { label: "Total Inquiries", value: data.total_inquiries, change: "-3.1%", trend: "down", icon: MessageSquare },
        { label: "Total Users", value: data.total_users, change: "+24.5%", trend: "up", icon: Users },
    ] : [];

    if (loading && !data) return <DashboardSkeleton />;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Dashboard Overview</h1>
                    <p className="text-muted-foreground font-medium mt-1">Real-time business performance metrics</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <Card key={i} className="border-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">{s.label}</CardTitle>
                            <s.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black">{s.value}</div>
                            <p className="text-[10px] font-bold mt-1 flex items-center gap-1">
                                {s.trend === "up" ? (
                                    <span className="text-green-500 flex items-center"><TrendingUp size={10} className="mr-1" />{s.change}</span>
                                ) : (
                                    <span className="text-red-500 flex items-center"><TrendingDown size={10} className="mr-1" />{s.change}</span>
                                )}
                                <span className="text-muted-foreground">vs previous period</span>
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Revenue Chart */}
                <Card className="lg:col-span-2 border-border">
                    <CardHeader>
                        <CardTitle className="text-lg font-black tracking-tight">Revenue Forecast</CardTitle>
                        <CardDescription className="font-medium text-xs">Daily revenue performance across selected period</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.daily_orders.map(d => ({ date: d.date.split('-').slice(2).join('/'), amount: d.count * 1200 }))}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#000000" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                                <XAxis dataKey="date" fontSize={10} fontWeight={700} axisLine={false} tickLine={false} />
                                <YAxis fontSize={10} fontWeight={700} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', fontWeight: 700, fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="amount" stroke="#000000" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} dot={{ r: 4, fill: "#000000" }} activeDot={{ r: 6 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Order Pipelines */}
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle className="text-lg font-black tracking-tight">Order Status</CardTitle>
                        <CardDescription className="font-medium text-xs">Current order distribution</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={Object.entries(data?.order_pipeline || {}).map(([name, value]) => ({ name, value }))}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {Object.entries(data?.order_pipeline || {}).map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', fontWeight: 700, fontSize: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                    <CardFooter className="flex flex-wrap gap-2 justify-center pb-6">
                        {Object.entries(data?.order_pipeline || {}).map(([status, count], i) => (
                            <div key={status} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary border border-border">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{status.replace('_', ' ')}</span>
                                <span className="text-[10px] font-black">{count}</span>
                            </div>
                        ))}
                    </CardFooter>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Inquiries */}
                <Card className="border-border flex flex-col">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-black tracking-tight">Recent Inquiries</CardTitle>
                                <CardDescription className="font-medium text-xs">Awaiting quotation or follow-up</CardDescription>
                            </div>
                            <Badge variant="outline" className="font-bold border-2 tracking-widest uppercase text-[10px]">Action Required</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                        {data?.recent_activity?.slice(0, 5).map((act, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary border border-transparent hover:border-border transition-all group">
                                <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                                    <Activity size={14} className="text-zinc-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold truncate">{act.type.replace('_', ' ')}</p>
                                        <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1"><Clock size={10} />{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{act.description}</p>
                                </div>
                                <ArrowUpRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Sales by Service Type */}
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle className="text-lg font-black tracking-tight">Daily Volume</CardTitle>
                        <CardDescription className="font-medium text-xs">Order frequency across the timeline</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.daily_orders.map(d => ({ date: d.date.split('-').slice(2).join('/'), count: d.count }))}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                                <XAxis dataKey="date" fontSize={10} fontWeight={700} axisLine={false} tickLine={false} />
                                <YAxis fontSize={10} fontWeight={700} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', fontWeight: 700, fontSize: '12px' }} />
                                <Bar dataKey="count" fill="#000000" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-10 w-44" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full border border-border" />)}
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
                <Skeleton className="lg:col-span-2 h-[380px] border border-border" />
                <Skeleton className="h-[380px] border border-border" />
            </div>
        </div>
    );
}
