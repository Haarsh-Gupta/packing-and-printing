import { useEffect, useState } from "react";
import { Loader2, Package, History } from "lucide-react";
import { api } from "@/lib/api";
import type { CustomerStockItem } from "@/types";

export default function CustomerStock() {
    const [stock, setStock] = useState<CustomerStockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                // In a real admin view, we'd want to select WHICH customer. 
                // But for now, let's just show an overview or all customer-owned stock.
                // The backend get_stock_summary(owner_type='CUSTOMER') handles this.
                const data = await api<any[]>("/admin/inventory/stock/summary?owner_type=CUSTOMER");
                setStock(data.map(item => ({
                    material_id: item.material_id,
                    material_name: item.material_name,
                    category: item.category,
                    uom: item.uom,
                    total_received: item.total_initial_quantity,
                    total_consumed: 0, // Summary doesn't provide this yet
                    total_wasted: 0,
                    total_returned: 0,
                    current_stock: item.total_current_quantity
                })));
            } catch (e: any) {
                console.error(e);
                setError("Failed to load customer stock.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center py-24 text-slate-500 text-xs">
            <Loader2 className="animate-spin mr-2" size={14} /> Loading Customer Inventory...
        </div>
    );

    if (error) return (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 p-6 rounded-xl text-center">
            <p className="text-red-600 dark:text-red-400 text-sm font-semibold">{error}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-[#434655]/20 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-[#dae2fd]">Customer-Owned Inventory</h3>
                        <p className="text-[11px] text-slate-500 dark:text-[#c3c5d8]">Materials supplied by customers for their specific jobs</p>
                    </div>
                    <div className="flex items-center gap-2">
                         <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                            {stock.length} Materials
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-[#0b1326]/50 text-slate-600 dark:text-[#c3c5d8] uppercase text-[10px] tracking-[0.15em] font-bold border-b border-slate-200 dark:border-[#434655]/20">
                                <th className="px-6 py-3">Material</th>
                                <th className="px-6 py-3">Category</th>
                                <th className="px-6 py-3 text-right">Received</th>
                                <th className="px-6 py-3 text-right">Remaining</th>
                                <th className="px-6 py-3 text-right">Unit</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#434655]/10">
                            {stock.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-xs text-slate-400 dark:text-[#c3c5d8]/50">
                                        No customer materials in stock.
                                    </td>
                                </tr>
                            ) : stock.map((s, i) => (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-[#171f33]/80 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 dark:bg-[#0b1326] rounded-lg">
                                                <Package size={14} className="text-slate-500" />
                                            </div>
                                            <span className="text-sm font-semibold text-slate-900 dark:text-[#dae2fd]">{s.material_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-bold text-slate-500 dark:text-[#c3c5d8] uppercase tracking-wider">{s.category}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-mono text-slate-600 dark:text-[#c3c5d8]">{s.total_received.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right text-sm font-mono font-bold text-blue-600 dark:text-blue-400">{s.current_stock.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right text-xs text-slate-500">{s.uom}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                                            <History size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
