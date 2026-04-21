import { useEffect, useState } from "react";
import { Loader2, Plus, Save, ArrowDownToLine, Minus, Trash, RotateCcw, ClipboardCheck, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import type { InventoryBatch, MaterialDefinition, StockSummaryItem } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface StockBatchesProps {
    ownerType?: "FACTORY" | "CUSTOMER";
}

type TxAction = "consume" | "wastage" | "return" | "reconcile" | null;

export default function StockBatches({ ownerType }: StockBatchesProps) {
    const [batches, setBatches] = useState<InventoryBatch[]>([]);
    const [materials, setMaterials] = useState<MaterialDefinition[]>([]);
    const [summary, setSummary] = useState<StockSummaryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showReceive, setShowReceive] = useState(false);
    const [saving, setSaving] = useState(false);
    const [filterOwner, setFilterOwner] = useState<string>(ownerType || "");
    const [showEmpty, setShowEmpty] = useState(false);
    const [form, setForm] = useState({ material_id: "", initial_quantity: "", unit_cost: "", supplier_name: "", invoice_no: "" });

    // Edit Batch dialog
    const [editBatchId, setEditBatchId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ unit_cost: "", supplier_name: "", invoice_no: "" });
    const [editSaving, setEditSaving] = useState(false);

    // Transaction dialog state
    const [txAction, setTxAction] = useState<TxAction>(null);
    const [txBatch, setTxBatch] = useState<InventoryBatch | null>(null);
    const [txForm, setTxForm] = useState({ quantity: "", reason: "", job_id: "", new_quantity: "" });
    const [txSaving, setTxSaving] = useState(false);

    const matMap = Object.fromEntries(materials.map(m => [m.id, m]));

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [m, b, s] = await Promise.all([
                api<MaterialDefinition[]>("/admin/inventory/materials/?limit=200"),
                api<InventoryBatch[]>(`/admin/inventory/stock/batches?limit=200&show_empty=${showEmpty}${filterOwner ? `&owner_type=${filterOwner}` : ""}`),
                api<StockSummaryItem[]>("/admin/inventory/stock/summary"),
            ]);
            setMaterials(m); setBatches(b); setSummary(s);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };
    useEffect(() => { 
        setFilterOwner(ownerType || "");
    }, [ownerType]);

    useEffect(() => { fetchAll(); }, [filterOwner, showEmpty]);

    const handleReceive = async () => {
        if (!form.material_id || !form.initial_quantity) return;
        setSaving(true);
        try {
            await api("/admin/inventory/stock/batches/receive", {
                method: "POST",
                body: JSON.stringify({
                    material_id: form.material_id,
                    initial_quantity: parseFloat(form.initial_quantity),
                    unit_cost: parseFloat(form.unit_cost) || 0,
                    batch_metadata: { supplier_name: form.supplier_name || null, invoice_no: form.invoice_no || null },
                }),
            });
            setShowReceive(false);
            setForm({ material_id: "", initial_quantity: "", unit_cost: "", supplier_name: "", invoice_no: "" });
            fetchAll();
        } catch (e: any) { alert(e.message || "Failed"); }
        finally { setSaving(false); }
    };

    const handleEditSubmit = async () => {
        if (!editBatchId) return;
        setEditSaving(true);
        try {
            await api(`/admin/inventory/stock/batches/${editBatchId}`, {
                method: "PATCH",
                body: JSON.stringify({
                    unit_cost: parseFloat(editForm.unit_cost) || 0,
                    batch_metadata: { supplier_name: editForm.supplier_name || null, invoice_no: editForm.invoice_no || null },
                }),
            });
            setEditBatchId(null);
            fetchAll();
        } catch (e: any) { alert(e.message || "Edit failed"); }
        finally { setEditSaving(false); }
    };

    const openTxDialog = (action: TxAction, batch: InventoryBatch) => {
        setTxAction(action);
        setTxBatch(batch);
        setTxForm({ quantity: "", reason: "", job_id: "", new_quantity: action === "reconcile" ? String(batch.current_quantity) : "" });
    };

    const handleTxSubmit = async () => {
        if (!txBatch || !txAction) return;
        setTxSaving(true);
        try {
            if (txAction === "consume") {
                await api("/admin/inventory/transactions/consume", {
                    method: "POST",
                    body: JSON.stringify({
                        batch_id: txBatch.id,
                        quantity: parseFloat(txForm.quantity),
                        job_id: txForm.job_id || null,
                        reason: txForm.reason || null,
                    }),
                });
            } else if (txAction === "wastage") {
                await api("/admin/inventory/transactions/wastage", {
                    method: "POST",
                    body: JSON.stringify({
                        batch_id: txBatch.id,
                        quantity: parseFloat(txForm.quantity),
                        job_id: txForm.job_id || null,
                        reason: txForm.reason,
                    }),
                });
            } else if (txAction === "return") {
                await api("/admin/inventory/transactions/return", {
                    method: "POST",
                    body: JSON.stringify({
                        batch_id: txBatch.id,
                        quantity: parseFloat(txForm.quantity),
                        reason: txForm.reason || null,
                    }),
                });
            } else if (txAction === "reconcile") {
                await api("/admin/inventory/transactions/reconcile", {
                    method: "POST",
                    body: JSON.stringify({
                        batch_id: txBatch.id,
                        new_quantity: parseFloat(txForm.new_quantity),
                        reason: txForm.reason,
                    }),
                });
            }
            setTxAction(null);
            setTxBatch(null);
            fetchAll();
        } catch (e: any) { alert(e.message || "Transaction failed"); }
        finally { setTxSaving(false); }
    };

    const totalValue = summary.reduce((s, i) => s + i.total_value, 0);
    const totalBatches = summary.reduce((s, i) => s + i.total_batches, 0);

    const txTitle: Record<string, string> = { consume: "Consume Material", wastage: "Record Wastage", return: "Return to Customer", reconcile: "Reconcile Stock" };
    const txColor: Record<string, string> = { consume: "bg-blue-600 hover:bg-blue-700", wastage: "bg-red-600 hover:bg-red-700", return: "bg-amber-600 hover:bg-amber-700", reconcile: "bg-purple-600 hover:bg-purple-700" };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Materials", value: materials.length, color: "#3b82f6" },
                    { label: "Active Batches", value: totalBatches, color: "#8b5cf6" },
                    { label: "Stock Value", value: `₹${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: "#10b981" },
                    { label: "Low Stock", value: summary.filter(s => s.total_current_quantity < s.total_initial_quantity * 0.1).length, color: "#f59e0b" },
                ].map(c => (
                    <div key={c.label} className="p-5 bg-white dark:bg-[#131b2e] rounded-xl border border-slate-200 dark:border-[#434655]/20">
                        <p className="text-[10px] font-bold text-slate-500 dark:text-[#c3c5d8] uppercase tracking-widest mb-1">{c.label}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-[#dae2fd]">{c.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters + Receive */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <select value={filterOwner} onChange={e => setFilterOwner(e.target.value)} className="h-8 text-xs rounded-lg border border-slate-200 dark:border-[#434655]/40 bg-white dark:bg-[#131b2e] px-3 text-slate-700 dark:text-[#dae2fd]">
                        <option value="">All Owners</option>
                        <option value="FACTORY">Factory</option>
                        <option value="CUSTOMER">Customer</option>
                    </select>
                    <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#c3c5d8] cursor-pointer">
                        <input type="checkbox" checked={showEmpty} onChange={e => setShowEmpty(e.target.checked)} className="rounded" /> Show empty
                    </label>
                </div>
                <button onClick={() => { setForm({ material_id: materials[0]?.id || "", initial_quantity: "", unit_cost: "", supplier_name: "", invoice_no: "" }); setShowReceive(true); }} className="h-9 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-lg flex items-center gap-2 transition-colors">
                    <ArrowDownToLine size={14} /> Receive Material
                </button>
            </div>

            {/* Batches Table */}
            <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-100 dark:bg-[#0b1326]/50 text-slate-600 dark:text-[#c3c5d8] uppercase text-[10px] tracking-[0.2em] font-bold border-b border-slate-200 dark:border-[#434655]/20">
                            <th className="px-5 py-3.5">Batch ID</th>
                            <th className="px-5 py-3.5">Material</th>
                            <th className="px-5 py-3.5">Owner</th>
                            <th className="px-5 py-3.5 text-right">Initial</th>
                            <th className="px-5 py-3.5 text-right">Current</th>
                            <th className="px-5 py-3.5 text-right">Unit Cost</th>
                            <th className="px-5 py-3.5">Supplier</th>
                            <th className="px-5 py-3.5">Received</th>
                            <th className="px-5 py-3.5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#434655]/10">
                        {loading ? (
                            <tr><td colSpan={9} className="text-center py-12 text-xs text-slate-500 dark:text-[#c3c5d8]"><Loader2 className="animate-spin inline mr-2" size={14} />Loading…</td></tr>
                        ) : batches.length === 0 ? (
                            <tr><td colSpan={9} className="text-center py-12 text-xs text-slate-400 dark:text-[#c3c5d8]/50">No batches found.</td></tr>
                        ) : batches.map(b => {
                            const mat = matMap[b.material_id];
                            const pct = b.initial_quantity > 0 ? (b.current_quantity / b.initial_quantity) * 100 : 0;
                            const meta = b.batch_metadata || {};
                            const isCustomer = b.owner_type === "CUSTOMER";
                            return (
                                <tr key={b.id} className="group hover:bg-slate-50 dark:hover:bg-[#171f33]/80 transition-colors">
                                    <td className="px-5 py-3.5"><code className="text-[11px] font-mono font-bold text-blue-600 dark:text-[#adc6ff]">{b.display_id}</code></td>
                                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-900 dark:text-[#dae2fd]">{mat?.name || "—"}</td>
                                    <td className="px-5 py-3.5"><span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${b.owner_type === "FACTORY" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>{b.owner_type}</span></td>
                                    <td className="px-5 py-3.5 text-right text-sm font-bold text-slate-700 dark:text-[#c3c5d8]">{Number(b.initial_quantity).toLocaleString()}</td>
                                    <td className="px-5 py-3.5 text-right">
                                        <span className={`text-sm font-bold ${pct < 10 ? "text-red-500" : pct < 30 ? "text-amber-500" : "text-emerald-500"}`}>{Number(b.current_quantity).toLocaleString()}</span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right text-sm font-mono text-slate-600 dark:text-[#c3c5d8]">{b.unit_cost != null ? `₹${Number(b.unit_cost).toFixed(2)}` : "—"}</td>
                                    <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-[#c3c5d8]">{(meta as any).supplier_name || "—"}</td>
                                    <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-[#c3c5d8]">{new Date(b.received_date).toLocaleDateString()}</td>
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="inline-flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openTxDialog("consume", b)} title="Consume" className="p-1.5 hover:bg-blue-500/10 rounded-lg text-slate-500 dark:text-[#c3c5d8] hover:text-blue-500 transition-colors"><Minus size={13} /></button>
                                            <button onClick={() => openTxDialog("wastage", b)} title="Wastage" className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-500 dark:text-[#c3c5d8] hover:text-red-400 transition-colors"><Trash size={13} /></button>
                                            {isCustomer && <button onClick={() => openTxDialog("return", b)} title="Return" className="p-1.5 hover:bg-amber-500/10 rounded-lg text-slate-500 dark:text-[#c3c5d8] hover:text-amber-400 transition-colors"><RotateCcw size={13} /></button>}
                                            <button onClick={() => openTxDialog("reconcile", b)} title="Reconcile" className="p-1.5 hover:bg-purple-500/10 rounded-lg text-slate-500 dark:text-[#c3c5d8] hover:text-purple-400 transition-colors"><ClipboardCheck size={13} /></button>
                                            {!isCustomer && <button onClick={() => {
                                                setEditBatchId(b.id);
                                                const meta = b.batch_metadata as any || {};
                                                setEditForm({ unit_cost: String(b.unit_cost || 0), supplier_name: meta.supplier_name || "", invoice_no: meta.invoice_no || "" });
                                            }} title="Edit Batch" className="p-1.5 hover:bg-emerald-500/10 rounded-lg text-slate-500 dark:text-[#c3c5d8] hover:text-emerald-500 transition-colors"><Pencil size={13} /></button>}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Receive Dialog */}
            <Dialog open={showReceive} onOpenChange={setShowReceive}>
                <DialogContent className="sm:max-w-lg bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 text-slate-900 dark:text-[#dae2fd] shadow-2xl p-0 overflow-hidden font-['Inter']">
                    <DialogHeader className="px-6 py-5 border-b border-slate-200 dark:border-[#434655]/20 bg-white dark:bg-[#131b2e]">
                        <DialogTitle className="text-lg font-extrabold">Receive Factory Material</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-[#c3c5d8] mt-1">Log incoming material shipment into inventory.</DialogDescription>
                    </DialogHeader>
                    <div className="px-6 py-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Material <span className="text-red-400">*</span></label>
                            <select className="w-full h-9 text-sm rounded-md border border-slate-200 dark:border-[#434655]/40 bg-white dark:bg-[#131b2e] px-3" value={form.material_id} onChange={e => setForm({ ...form, material_id: e.target.value })}>
                                {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.category})</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Quantity <span className="text-red-400">*</span></label>
                                <Input type="number" className="h-9 text-sm bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40" value={form.initial_quantity} onChange={e => setForm({ ...form, initial_quantity: e.target.value })} placeholder="0" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Unit Cost (₹)</label>
                                <Input type="number" className="h-9 text-sm bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40" value={form.unit_cost} onChange={e => setForm({ ...form, unit_cost: e.target.value })} placeholder="0.00" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Supplier Name</label>
                                <Input className="h-9 text-sm bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40" value={form.supplier_name} onChange={e => setForm({ ...form, supplier_name: e.target.value })} placeholder="ITC Paper" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Invoice No.</label>
                                <Input className="h-9 text-sm bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40" value={form.invoice_no} onChange={e => setForm({ ...form, invoice_no: e.target.value })} placeholder="INV-882" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 border-t border-slate-200 dark:border-[#434655]/20 bg-white dark:bg-[#131b2e]">
                        <DialogClose asChild><Button variant="outline" className="h-9 text-xs font-bold uppercase tracking-widest">Cancel</Button></DialogClose>
                        <Button className="h-9 px-6 text-xs font-bold uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleReceive} disabled={saving || !form.material_id || !form.initial_quantity}>
                            {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />} Receive
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Batch Dialog */}
            <Dialog open={!!editBatchId} onOpenChange={o => !o && setEditBatchId(null)}>
                <DialogContent className="sm:max-w-md bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 text-slate-900 dark:text-[#dae2fd] shadow-2xl p-0 overflow-hidden font-['Inter']">
                    <DialogHeader className="px-6 py-5 border-b border-slate-200 dark:border-[#434655]/20 bg-white dark:bg-[#131b2e]">
                        <DialogTitle className="text-lg font-extrabold">Edit Batch Metadata</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-[#c3c5d8] mt-1">Update supplier or invoice details for this factory batch.</DialogDescription>
                    </DialogHeader>
                    <div className="px-6 py-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Unit Cost (₹)</label>
                            <Input type="number" className="h-9 text-sm bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40" value={editForm.unit_cost} onChange={e => setEditForm({ ...editForm, unit_cost: e.target.value })} placeholder="0.00" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Supplier Name</label>
                                <Input className="h-9 text-sm bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40" value={editForm.supplier_name} onChange={e => setEditForm({ ...editForm, supplier_name: e.target.value })} placeholder="ITC Paper" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Invoice No.</label>
                                <Input className="h-9 text-sm bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40" value={editForm.invoice_no} onChange={e => setEditForm({ ...editForm, invoice_no: e.target.value })} placeholder="INV-882" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 border-t border-slate-200 dark:border-[#434655]/20 bg-white dark:bg-[#131b2e]">
                        <DialogClose asChild><Button variant="outline" className="h-9 text-xs font-bold uppercase tracking-widest">Cancel</Button></DialogClose>
                        <Button className="h-9 px-6 text-xs font-bold uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleEditSubmit} disabled={editSaving}>
                            {editSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />} Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Transaction Dialog (Consume / Wastage / Return / Reconcile) */}
            <Dialog open={!!txAction} onOpenChange={o => !o && setTxAction(null)}>
                <DialogContent className="sm:max-w-md bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 text-slate-900 dark:text-[#dae2fd] shadow-2xl p-0 overflow-hidden font-['Inter']">
                    <DialogHeader className="px-6 py-5 border-b border-slate-200 dark:border-[#434655]/20 bg-white dark:bg-[#131b2e]">
                        <DialogTitle className="text-lg font-extrabold">{txAction ? txTitle[txAction] : ""}</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-[#c3c5d8] mt-1">
                            Batch: <code className="font-mono font-bold text-blue-500">{txBatch?.display_id}</code> — {matMap[txBatch?.material_id || ""]?.name || "—"} — Available: <strong>{Number(txBatch?.current_quantity || 0).toLocaleString()}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="px-6 py-5 space-y-4">
                        {txAction === "reconcile" ? (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">New Quantity (after physical count) <span className="text-red-400">*</span></label>
                                <Input type="number" className="h-9 text-sm bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40" value={txForm.new_quantity} onChange={e => setTxForm({ ...txForm, new_quantity: e.target.value })} placeholder="0" />
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Quantity <span className="text-red-400">*</span></label>
                                <Input type="number" className="h-9 text-sm bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40" value={txForm.quantity} onChange={e => setTxForm({ ...txForm, quantity: e.target.value })} placeholder="0" />
                            </div>
                        )}
                        {txAction === "consume" && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Order / Job ID</label>
                                <Input className="h-9 text-sm bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40" value={txForm.job_id} onChange={e => setTxForm({ ...txForm, job_id: e.target.value })} placeholder="Optional order UUID" />
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">
                                Reason {(txAction === "wastage" || txAction === "reconcile") && <span className="text-red-400">*</span>}
                            </label>
                            <Input className="h-9 text-sm bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40" value={txForm.reason} onChange={e => setTxForm({ ...txForm, reason: e.target.value })} placeholder={txAction === "wastage" ? "e.g. Paper jam, Expired" : "Optional note"} />
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 border-t border-slate-200 dark:border-[#434655]/20 bg-white dark:bg-[#131b2e]">
                        <DialogClose asChild><Button variant="outline" className="h-9 text-xs font-bold uppercase tracking-widest">Cancel</Button></DialogClose>
                        <Button
                            className={`h-9 px-6 text-xs font-bold uppercase tracking-widest text-white ${txAction ? txColor[txAction] : ""}`}
                            onClick={handleTxSubmit}
                            disabled={txSaving || (txAction === "reconcile" ? !txForm.new_quantity || !txForm.reason : !txForm.quantity) || ((txAction === "wastage") && !txForm.reason)}
                        >
                            {txSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />} Submit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
