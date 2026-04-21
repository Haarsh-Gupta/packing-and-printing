import { useEffect, useState, useMemo } from "react";
import { Loader2, TrendingUp, BarChart3, AlertTriangle, Filter } from "lucide-react";
import { api } from "@/lib/api";
import type { InventoryBatch, MaterialDefinition, StockSummaryItem, LedgerEntryResponse } from "@/types";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Legend, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line
} from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
    PAPER: "#3b82f6",
    INK: "#8b5cf6",
    BOARD: "#f59e0b",
    LAMINATE: "#10b981",
    GLUE: "#ef4444",
    CONSUMABLE: "#06b6d4",
    FOIL: "#f97316",
    PLATE: "#ec4899",
    HARDWARE: "#6366f1",
};

const ALL_CATEGORIES = Object.keys(CATEGORY_COLORS);

type TimeRange = "weekly" | "monthly" | "yearly";

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white dark:bg-[#171f33] border border-slate-200 dark:border-[#434655]/30 rounded-xl px-4 py-3 text-xs shadow-xl backdrop-blur-sm">
            <p className="text-slate-500 dark:text-[#c3c5d8] mb-2 font-semibold text-[11px]">{label}</p>
            {payload.map((p: any) => (
                <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-slate-600 dark:text-[#c3c5d8]">{p.dataKey}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">₹{Number(p.value).toLocaleString()}</span>
                </div>
            ))}
        </div>
    );
};

const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
        <div className="bg-white dark:bg-[#171f33] border border-slate-200 dark:border-[#434655]/30 rounded-xl px-4 py-3 text-xs shadow-xl">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.payload.fill }} />
                <span className="font-bold text-slate-900 dark:text-white">{d.name}</span>
            </div>
            <p className="text-slate-500 dark:text-[#c3c5d8]">₹{Number(d.value).toLocaleString()}</p>
        </div>
    );
};

function aggregatePurchases(batches: InventoryBatch[], materials: MaterialDefinition[], range: TimeRange, filterCat: string) {
    const matMap = Object.fromEntries(materials.map(m => [m.id, m]));
    const buckets: Record<string, Record<string, number>> = {};
    const categories = new Set<string>();

    for (const b of batches) {
        if (b.owner_type !== "FACTORY") continue;
        const mat = matMap[b.material_id];
        if (!mat) continue;
        const cat = mat.category;
        if (filterCat && filterCat !== cat) continue;
        categories.add(cat);

        const d = new Date(b.received_date);
        let key: string;
        if (range === "weekly") {
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(d);
            monday.setDate(diff);
            key = monday.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
        } else if (range === "monthly") {
            key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        } else {
            key = d.getFullYear().toString();
        }

        if (!buckets[key]) buckets[key] = {};
        buckets[key][cat] = (buckets[key][cat] || 0) + Number(b.initial_quantity) * Number(b.unit_cost || 0);
    }

    const allCats = Array.from(categories).sort();
    const data = Object.entries(buckets)
        .map(([period, cats]) => {
            const row: any = { period };
            for (const c of allCats) row[c] = Math.round(cats[c] || 0);
            return row;
        })
        .sort((a, b) => {
            if (range === "yearly") return Number(a.period) - Number(b.period);
            return 0;
        });

    return { data, categories: allCats };
}

export default function PurchaseAnalytics() {
    const [batches, setBatches] = useState<InventoryBatch[]>([]);
    const [materials, setMaterials] = useState<MaterialDefinition[]>([]);
    const [summary, setSummary] = useState<StockSummaryItem[]>([]);
    const [wastage, setWastage] = useState<LedgerEntryResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState<TimeRange>("monthly");
    const [chartMode, setChartMode] = useState<"area" | "bar">("area");
    const [filterCat, setFilterCat] = useState("");

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const [m, b, s, w] = await Promise.all([
                    api<MaterialDefinition[]>("/admin/inventory/materials/?limit=200"),
                    api<InventoryBatch[]>("/admin/inventory/stock/batches?limit=200&show_empty=true"),
                    api<StockSummaryItem[]>("/admin/inventory/stock/summary"),
                    api<LedgerEntryResponse[]>("/admin/inventory/transactions/?transaction_type=WASTAGE&limit=1000")
                ]);
                setMaterials(m); setBatches(b); setSummary(s); setWastage(w);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        })();
    }, []);

    const { data: chartData, categories } = useMemo(
        () => aggregatePurchases(batches, materials, range, filterCat),
        [batches, materials, range, filterCat]
    );

    const totalSpend = useMemo(() => batches.reduce((s, b) => b.owner_type === "FACTORY" ? s + Number(b.initial_quantity) * Number(b.unit_cost || 0) : s, 0), [batches]);
    const totalCurrentValue = summary.reduce((s, i) => s + i.total_value, 0);
    const lowStockCount = summary.filter(s => s.total_current_quantity <= s.minimum_threshold && s.minimum_threshold > 0).length;

    // Wastage trend aggregation
    const wastageData = useMemo(() => {
        const buckets: Record<string, number> = {};
        for (const w of wastage) {
            const d = new Date(w.timestamp);
            let key: string;
            if (range === "weekly") {
                const day = d.getDay();
                const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(d);
                monday.setDate(diff);
                key = monday.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
            } else if (range === "monthly") {
                key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
            } else {
                key = d.getFullYear().toString();
            }
            buckets[key] = (buckets[key] || 0) + Number(w.total_cost_impact || 0);
        }
        return Object.entries(buckets)
            .map(([period, value]) => ({ period, value: Math.round(value) }))
            .sort((a, b) => range === "yearly" ? Number(a.period) - Number(b.period) : 0);
    }, [wastage, range]);

    // Donut chart: value by category
    const categoryValueData = useMemo(() => {
        const catMap: Record<string, number> = {};
        for (const s of summary) {
            catMap[s.category] = (catMap[s.category] || 0) + s.total_value;
        }
        return Object.entries(catMap)
            .map(([name, value]) => ({ name, value: Math.round(value), fill: CATEGORY_COLORS[name] || "#888" }))
            .sort((a, b) => b.value - a.value);
    }, [summary]);

    const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    const gridColor = isDark ? "#434655" : "#e2e8f0";
    const tickColor = isDark ? "#c3c5d8" : "#64748b";

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24 text-slate-500 dark:text-[#c3c5d8] text-xs">
                <Loader2 className="animate-spin mr-2" size={14} /> Loading analytics…
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Purchase Spend", value: `₹${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: "#3b82f6" },
                    { label: "Current Stock Value", value: `₹${totalCurrentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: BarChart3, color: "#10b981" },
                    { label: "Material Types", value: materials.length, icon: BarChart3, color: "#8b5cf6" },
                    { label: "Low Stock Alerts", value: lowStockCount, icon: AlertTriangle, color: lowStockCount > 0 ? "#ef4444" : "#f59e0b" },
                ].map(c => (
                    <div key={c.label} className="p-5 bg-white dark:bg-[#131b2e] rounded-xl border border-slate-200 dark:border-[#434655]/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" style={{ backgroundColor: `${c.color}15` }} />
                        <p className="text-[10px] font-bold text-slate-500 dark:text-[#c3c5d8] uppercase tracking-widest mb-1">{c.label}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-[#dae2fd] relative z-10">{c.value}</p>
                    </div>
                ))}
            </div>

            {/* Chart Controls */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-[#dae2fd]">Material Purchase Trends</h2>
                    <p className="text-xs text-slate-500 dark:text-[#c3c5d8] mt-1">Layered view of purchase costs by material category</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Category Filter */}
                    <div className="flex items-center gap-1.5">
                        <Filter size={12} className="text-slate-400" />
                        <select
                            value={filterCat}
                            onChange={e => setFilterCat(e.target.value)}
                            className="h-8 text-xs rounded-lg border border-slate-200 dark:border-[#434655]/40 bg-white dark:bg-[#131b2e] px-2 text-slate-700 dark:text-[#dae2fd]"
                        >
                            <option value="">All Categories</option>
                            {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="flex bg-slate-100 dark:bg-[#0b1326] rounded-lg p-0.5">
                        {(["weekly", "monthly", "yearly"] as TimeRange[]).map(r => (
                            <button key={r} onClick={() => setRange(r)} className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${range === r ? "bg-white dark:bg-[#131b2e] text-slate-900 dark:text-[#dae2fd] shadow-sm" : "text-slate-500 dark:text-[#c3c5d8] hover:text-slate-700"}`}>
                                {r}
                            </button>
                        ))}
                    </div>
                    <div className="flex bg-slate-100 dark:bg-[#0b1326] rounded-lg p-0.5">
                        <button onClick={() => setChartMode("area")} className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${chartMode === "area" ? "bg-white dark:bg-[#131b2e] text-slate-900 dark:text-[#dae2fd] shadow-sm" : "text-slate-500 dark:text-[#c3c5d8]"}`}>Area</button>
                        <button onClick={() => setChartMode("bar")} className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${chartMode === "bar" ? "bg-white dark:bg-[#131b2e] text-slate-900 dark:text-[#dae2fd] shadow-sm" : "text-slate-500 dark:text-[#c3c5d8]"}`}>Bar</button>
                    </div>
                </div>
            </div>

            {/* Main Layered Chart — Full Width */}
            <div className="bg-white dark:bg-[#131b2e] p-6 rounded-xl border border-slate-200 dark:border-[#434655]/10 transition-colors" style={{ height: 420 }}>
                {chartData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-xs text-slate-400 dark:text-[#c3c5d8]/50">
                        No purchase data available for the selected period.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        {chartMode === "area" ? (
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                                <defs>
                                    {categories.map(cat => (
                                        <linearGradient key={cat} id={`grad-${cat}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={CATEGORY_COLORS[cat] || "#888"} stopOpacity={0.3} />
                                            <stop offset="100%" stopColor={CATEGORY_COLORS[cat] || "#888"} stopOpacity={0.02} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={gridColor} opacity={0.4} />
                                <XAxis dataKey="period" fontSize={11} fontFamily="'Inter',system-ui" fontWeight={500} axisLine={false} tickLine={false} tick={{ fill: tickColor }} />
                                <YAxis fontSize={11} fontFamily="'Inter',system-ui" fontWeight={500} axisLine={false} tickLine={false} tick={{ fill: tickColor }} tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontFamily: "'Inter',system-ui", fontWeight: 600 }} />
                                {categories.map(cat => (
                                    <Area key={cat} type="monotone" dataKey={cat} stackId="1" stroke={CATEGORY_COLORS[cat] || "#888"} strokeWidth={2} fill={`url(#grad-${cat})`} animationDuration={800} />
                                ))}
                            </AreaChart>
                        ) : (
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={gridColor} opacity={0.4} />
                                <XAxis dataKey="period" fontSize={11} fontFamily="'Inter',system-ui" fontWeight={500} axisLine={false} tickLine={false} tick={{ fill: tickColor }} />
                                <YAxis fontSize={11} fontFamily="'Inter',system-ui" fontWeight={500} axisLine={false} tickLine={false} tick={{ fill: tickColor }} tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontFamily: "'Inter',system-ui", fontWeight: 600 }} />
                                {categories.map(cat => (
                                    <Bar key={cat} dataKey={cat} stackId="1" fill={CATEGORY_COLORS[cat] || "#888"} radius={categories.indexOf(cat) === categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} animationDuration={800} />
                                ))}
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                )}
            </div>

            {/* Wastage Trends Line Chart */}
            <div className="bg-white dark:bg-[#131b2e] p-6 rounded-xl border border-slate-200 dark:border-[#434655]/10" style={{ height: 340 }}>
                <h3 className="text-sm font-bold text-slate-800 dark:text-[#dae2fd] mb-4">Wastage Cost Trends (₹)</h3>
                {wastageData.length === 0 ? (
                    <div className="flex items-center justify-center h-[260px] text-xs text-slate-400 dark:text-[#c3c5d8]/50">No wastage data available.</div>
                ) : (
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={wastageData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={gridColor} opacity={0.4} />
                            <XAxis dataKey="period" fontSize={11} fontFamily="'Inter',system-ui" fontWeight={500} axisLine={false} tickLine={false} tick={{ fill: tickColor }} />
                            <YAxis fontSize={11} fontFamily="'Inter',system-ui" fontWeight={500} axisLine={false} tickLine={false} tick={{ fill: tickColor }} tickFormatter={v => `₹${v}`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: "#ef4444", strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} animationDuration={800} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Donut Chart: Value by Category */}
            <div className="bg-white dark:bg-[#131b2e] p-6 rounded-xl border border-slate-200 dark:border-[#434655]/10" style={{ height: 340 }}>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-[#dae2fd] mb-4">Stock Value by Category</h3>
                    {categoryValueData.length === 0 ? (
                        <div className="flex items-center justify-center h-[300px] text-xs text-slate-400 dark:text-[#c3c5d8]/50">No data</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={categoryValueData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" animationDuration={800}>
                                    {categoryValueData.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} stroke="transparent" />
                                    ))}
                                </Pie>
                                <Tooltip content={<PieTooltip />} />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, fontFamily: "'Inter',system-ui", fontWeight: 600 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

            {/* Category Breakdown Table */}
            <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-[#434655]/20 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-[#dae2fd]">Stock Summary by Material</h3>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-[#c3c5d8]/50 uppercase tracking-widest">{summary.length} items</span>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-[#0b1326]/50 text-slate-600 dark:text-[#c3c5d8] uppercase text-[10px] tracking-[0.15em] font-bold border-b border-slate-200 dark:border-[#434655]/20">
                            <th className="px-6 py-3">Material</th>
                            <th className="px-6 py-3">Category</th>
                            <th className="px-6 py-3 text-right">Batches</th>
                            <th className="px-6 py-3 text-right">Total Qty</th>
                            <th className="px-6 py-3 text-right">Current Qty</th>
                            <th className="px-6 py-3 text-right">Usage %</th>
                            <th className="px-6 py-3 text-right">Value</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#434655]/10">
                        {summary.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-8 text-xs text-slate-400 dark:text-[#c3c5d8]/50">No stock data.</td></tr>
                        ) : summary.map((s, i) => {
                            const usagePct = s.total_initial_quantity > 0 ? ((s.total_initial_quantity - s.total_current_quantity) / s.total_initial_quantity * 100) : 0;
                            return (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-[#171f33]/80 transition-colors">
                                    <td className="px-6 py-3.5 text-sm font-semibold text-slate-900 dark:text-[#dae2fd]">{s.material_name}</td>
                                    <td className="px-6 py-3.5"><span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ color: CATEGORY_COLORS[s.category] || "#888", backgroundColor: `${CATEGORY_COLORS[s.category] || "#888"}15` }}>{s.category}</span></td>
                                    <td className="px-6 py-3.5 text-right text-sm text-slate-600 dark:text-[#c3c5d8]">{s.total_batches}</td>
                                    <td className="px-6 py-3.5 text-right text-sm font-mono text-slate-600 dark:text-[#c3c5d8]">{s.total_initial_quantity.toLocaleString()}</td>
                                    <td className="px-6 py-3.5 text-right text-sm font-mono font-bold text-slate-900 dark:text-[#dae2fd]">
                                        <div className="flex items-center justify-end gap-2">
                                            {s.minimum_threshold > 0 && s.total_current_quantity <= s.minimum_threshold && (
                                                <AlertTriangle size={14} className="text-red-500" title={`Low Stock! Threshold: ${s.minimum_threshold}`} />
                                            )}
                                            {s.total_current_quantity.toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3.5 text-right">
                                        <div className="inline-flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-slate-100 dark:bg-[#0b1326] rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(usagePct, 100)}%`, backgroundColor: usagePct > 80 ? "#ef4444" : usagePct > 50 ? "#f59e0b" : "#10b981" }} />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-[#c3c5d8]">{usagePct.toFixed(0)}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3.5 text-right text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{s.total_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
