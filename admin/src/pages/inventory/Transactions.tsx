import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { LedgerEntry, InventoryBatch, MaterialDefinition } from "@/types";

const txColor: Record<string, string> = {
    RECEIVE: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    CONSUMPTION: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    WASTAGE: "bg-red-500/10 text-red-400 border-red-500/20",
    RETURN_TO_CUSTOMER: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    MANUAL_RECONCILIATION: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

interface TransactionsProps {
    ownerType?: "FACTORY" | "CUSTOMER";
}

export default function Transactions({ ownerType }: TransactionsProps) {
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [batches, setBatches] = useState<InventoryBatch[]>([]);
    const [materials, setMaterials] = useState<MaterialDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>("");

    const matMap = Object.fromEntries(materials.map(m => [m.id, m]));
    const batchMap = Object.fromEntries(batches.map(b => [b.id, b]));

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [e, b, m] = await Promise.all([
                api<LedgerEntry[]>(`/admin/inventory/transactions/?limit=200${filterType ? `&transaction_type=${filterType}` : ""}${ownerType ? `&owner_type=${ownerType}` : ""}`),
                api<InventoryBatch[]>("/admin/inventory/stock/batches?limit=500&show_empty=true"),
                api<MaterialDefinition[]>("/admin/inventory/materials/?limit=200"),
            ]);
            setEntries(e); setBatches(b); setMaterials(m);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchAll(); }, [filterType]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-[#dae2fd]">Transaction Ledger</h2>
                    <p className="text-xs text-slate-500 dark:text-[#c3c5d8]">{entries.length} entries</p>
                </div>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="h-8 text-xs rounded-lg border border-slate-200 dark:border-[#434655]/40 bg-white dark:bg-[#131b2e] px-3 text-slate-700 dark:text-[#dae2fd]">
                    <option value="">All Types</option>
                    <option value="RECEIVE">Receive</option>
                    <option value="CONSUMPTION">Consumption</option>
                    <option value="WASTAGE">Wastage</option>
                    <option value="RETURN_TO_CUSTOMER">Return</option>
                    <option value="MANUAL_RECONCILIATION">Reconciliation</option>
                </select>
            </div>

            <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-100 dark:bg-[#0b1326]/50 text-slate-600 dark:text-[#c3c5d8] uppercase text-[10px] tracking-[0.2em] font-bold border-b border-slate-200 dark:border-[#434655]/20">
                            <th className="px-5 py-3.5">Type</th>
                            <th className="px-5 py-3.5">Material</th>
                            <th className="px-5 py-3.5">Batch</th>
                            <th className="px-5 py-3.5 text-right">Qty Change</th>
                            <th className="px-5 py-3.5 text-right">Cost Impact</th>
                            <th className="px-5 py-3.5">Reason</th>
                            <th className="px-5 py-3.5">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#434655]/10">
                        {loading ? (
                            <tr><td colSpan={7} className="text-center py-12 text-xs text-slate-500 dark:text-[#c3c5d8]"><Loader2 className="animate-spin inline mr-2" size={14} />Loading…</td></tr>
                        ) : entries.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-12 text-xs text-slate-400 dark:text-[#c3c5d8]/50">No transactions found.</td></tr>
                        ) : entries.map(e => {
                            const batch = batchMap[e.batch_id];
                            const mat = batch ? matMap[batch.material_id] : null;
                            return (
                                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-[#171f33]/80 transition-colors">
                                    <td className="px-5 py-3.5"><span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${txColor[e.transaction_type] || ""}`}>{e.transaction_type.replace(/_/g, " ")}</span></td>
                                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-900 dark:text-[#dae2fd]">{mat?.name || "—"}</td>
                                    <td className="px-5 py-3.5"><code className="text-[11px] font-mono font-bold text-blue-600 dark:text-[#adc6ff]">{batch?.display_id || "—"}</code></td>
                                    <td className={`px-5 py-3.5 text-right text-sm font-bold font-mono ${e.quantity_change >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                                        {e.quantity_change >= 0 ? "+" : ""}{Number(e.quantity_change).toLocaleString()}
                                    </td>
                                    <td className="px-5 py-3.5 text-right text-sm font-mono text-slate-600 dark:text-[#c3c5d8]">₹{Number(e.total_cost_impact).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                    <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-[#c3c5d8] max-w-[180px] truncate">{e.reason || "—"}</td>
                                    <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-[#c3c5d8]">{new Date(e.timestamp).toLocaleString()}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
