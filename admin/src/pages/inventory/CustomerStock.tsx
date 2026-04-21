import { useEffect, useState } from "react";
import { Loader2, Package, ArrowDownToLine, Minus, Trash, RotateCcw, Save, Users, ClipboardCheck } from "lucide-react";
import { api } from "@/lib/api";
import type { InventoryBatch, MaterialDefinition, User } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type TxAction = "consume" | "wastage" | "return" | "reconcile" | null;

export default function CustomerStock() {
    const [batches, setBatches] = useState<InventoryBatch[]>([]);
    const [materials, setMaterials] = useState<MaterialDefinition[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterCustomerId, setFilterCustomerId] = useState("");

    // Receive dialog
    const [showReceive, setShowReceive] = useState(false);
    const [saving, setSaving] = useState(false);
    const [receiveForm, setReceiveForm] = useState({ material_id: "", customer_id: "", initial_quantity: "" });
    const [customerSearch, setCustomerSearch] = useState("");
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    
    // Filter dialog
    const [filterCustomerSearch, setFilterCustomerSearch] = useState("");
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    // Transaction dialog
    const [txAction, setTxAction] = useState<TxAction>(null);
    const [txBatch, setTxBatch] = useState<InventoryBatch | null>(null);
    const [txForm, setTxForm] = useState({ quantity: "", reason: "", job_id: "", new_quantity: "" });
    const [txSaving, setTxSaving] = useState(false);

    const matMap = Object.fromEntries(materials.map(m => [m.id, m]));

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [m, b, u] = await Promise.all([
                api<MaterialDefinition[]>("/admin/inventory/materials/?limit=200"),
                api<InventoryBatch[]>(`/admin/inventory/stock/batches?limit=200&show_empty=true&owner_type=CUSTOMER${filterCustomerId ? `&customer_id=${filterCustomerId}` : ""}`),
                api<User[]>("/admin/users/all?limit=200"),
            ]);
            setMaterials(m); setBatches(b); setUsers(u);
        } catch (e: any) {
            console.error(e);
            setError("Failed to load customer stock.");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchAll(); }, [filterCustomerId]);

    const handleReceive = async () => {
        if (!receiveForm.material_id || !receiveForm.customer_id || !receiveForm.initial_quantity) return;
        setSaving(true);
        try {
            await api("/admin/inventory/stock/batches/receive-customer", {
                method: "POST",
                body: JSON.stringify({
                    material_id: receiveForm.material_id,
                    customer_id: receiveForm.customer_id,
                    initial_quantity: parseFloat(receiveForm.initial_quantity),
                }),
            });
            setShowReceive(false);
            setReceiveForm({ material_id: "", customer_id: "", initial_quantity: "" });
            fetchAll();
        } catch (e: any) { alert(e.message || "Failed"); }
        finally { setSaving(false); }
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
            const endpoint = txAction === "consume" ? "/admin/inventory/transactions/consume"
                : txAction === "wastage" ? "/admin/inventory/transactions/wastage"
                    : txAction === "return" ? "/admin/inventory/transactions/return"
                    : "/admin/inventory/transactions/reconcile";
            
            const body: any = txAction === "reconcile" 
                ? { batch_id: txBatch.id, new_quantity: parseFloat(txForm.new_quantity), reason: txForm.reason }
                : { batch_id: txBatch.id, quantity: parseFloat(txForm.quantity), reason: txForm.reason || null };

            if (txAction === "consume") body.job_id = txForm.job_id || null;
            await api(endpoint, { method: "POST", body: JSON.stringify(body) });
            setTxAction(null); setTxBatch(null); fetchAll();
        } catch (e: any) { alert(e.message || "Transaction failed"); }
        finally { setTxSaving(false); }
    };

    const txTitle: Record<string, string> = { consume: "Consume Material", wastage: "Record Wastage", return: "Return to Customer", reconcile: "Reconcile Stock" };
    const txColorBtn: Record<string, string> = { consume: "bg-blue-600 hover:bg-blue-700", wastage: "bg-red-600 hover:bg-red-700", return: "bg-amber-600 hover:bg-amber-700", reconcile: "bg-purple-600 hover:bg-purple-700" };

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
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <Users size={16} className="text-amber-400" />
                    <div className="relative">
                        <Input 
                            className="h-8 text-xs w-[250px] bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40" 
                            placeholder="Filter by customer..." 
                            value={filterCustomerSearch}
                            onChange={e => {
                                setFilterCustomerSearch(e.target.value);
                                setShowFilterDropdown(true);
                                if (!e.target.value) setFilterCustomerId("");
                            }}
                            onFocus={() => setShowFilterDropdown(true)}
                            onBlur={() => setTimeout(() => setShowFilterDropdown(false), 200)}
                        />
                        {showFilterDropdown && filterCustomerSearch && (
                            <div className="absolute top-9 left-0 w-[250px] bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655] rounded-lg shadow-xl z-50 max-h-[200px] overflow-y-auto">
                                <div className="p-2 text-xs hover:bg-slate-50 dark:hover:bg-[#171f33] cursor-pointer text-slate-700 dark:text-[#c3c5d8] border-b border-slate-100 dark:border-[#434655]/20" onMouseDown={() => {
                                    setFilterCustomerId("");
                                    setFilterCustomerSearch("");
                                    setShowFilterDropdown(false);
                                }}>
                                    <div className="font-bold text-slate-500">Clear Filter</div>
                                </div>
                                {users.filter(u => !u.admin && (u.name.toLowerCase().includes(filterCustomerSearch.toLowerCase()) || u.email.toLowerCase().includes(filterCustomerSearch.toLowerCase()))).map(u => (
                                    <div key={u.id} className="p-2 text-xs hover:bg-slate-50 dark:hover:bg-[#171f33] cursor-pointer text-slate-700 dark:text-[#c3c5d8]" onMouseDown={() => {
                                        setFilterCustomerId(u.id);
                                        setFilterCustomerSearch(`${u.name} (${u.email})`);
                                        setShowFilterDropdown(false);
                                    }}>
                                        <div className="font-bold">{u.name}</div>
                                        <div className="text-slate-500 text-[10px]">{u.email}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                        {batches.length} Batches
                    </span>
                </div>
                <button onClick={() => { setReceiveForm({ material_id: materials[0]?.id || "", customer_id: users.filter(u => !u.admin)[0]?.id || "", initial_quantity: "" }); setShowReceive(true); }} className="h-9 px-4 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-lg flex items-center gap-2 transition-colors">
                    <ArrowDownToLine size={14} /> Receive Customer Material
                </button>
            </div>

            {/* Batches Table */}
            <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-[#0b1326]/50 text-slate-600 dark:text-[#c3c5d8] uppercase text-[10px] tracking-[0.15em] font-bold border-b border-slate-200 dark:border-[#434655]/20">
                            <th className="px-5 py-3">Batch</th>
                            <th className="px-5 py-3">Material</th>
                            <th className="px-5 py-3">Customer</th>
                            <th className="px-5 py-3 text-right">Initial</th>
                            <th className="px-5 py-3 text-right">Remaining</th>
                            <th className="px-5 py-3">Received</th>
                            <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#434655]/10">
                        {batches.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-12 text-xs text-slate-400 dark:text-[#c3c5d8]/50">No customer materials in stock.</td></tr>
                        ) : batches.map(b => {
                            const mat = matMap[b.material_id];
                            const pct = b.initial_quantity > 0 ? (b.current_quantity / b.initial_quantity) * 100 : 0;
                            const customer = users.find(u => u.id === b.customer_id);
                            return (
                                <tr key={b.id} className="group hover:bg-slate-50 dark:hover:bg-[#171f33]/80 transition-colors">
                                    <td className="px-5 py-3.5"><code className="text-[11px] font-mono font-bold text-blue-600 dark:text-[#adc6ff]">{b.display_id}</code></td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-slate-100 dark:bg-[#0b1326] rounded-lg"><Package size={12} className="text-slate-500" /></div>
                                            <span className="text-sm font-semibold text-slate-900 dark:text-[#dae2fd]">{mat?.name || "—"}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-[#c3c5d8]">{customer?.name || b.customer_id?.slice(0, 8) || "—"}</td>
                                    <td className="px-5 py-3.5 text-right text-sm font-mono text-slate-600 dark:text-[#c3c5d8]">{Number(b.initial_quantity).toLocaleString()}</td>
                                    <td className="px-5 py-3.5 text-right">
                                        <span className={`text-sm font-bold font-mono ${pct < 10 ? "text-red-500" : pct < 30 ? "text-amber-500" : "text-blue-500"}`}>{Number(b.current_quantity).toLocaleString()}</span>
                                    </td>
                                    <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-[#c3c5d8]">{new Date(b.received_date).toLocaleDateString()}</td>
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="inline-flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openTxDialog("consume", b)} title="Consume" className="p-1.5 hover:bg-blue-500/10 rounded-lg text-slate-500 hover:text-blue-500"><Minus size={13} /></button>
                                            <button onClick={() => openTxDialog("wastage", b)} title="Wastage" className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400"><Trash size={13} /></button>
                                            <button onClick={() => openTxDialog("return", b)} title="Return" className="p-1.5 hover:bg-amber-500/10 rounded-lg text-slate-500 hover:text-amber-400"><RotateCcw size={13} /></button>
                                            <button onClick={() => openTxDialog("reconcile", b)} title="Reconcile" className="p-1.5 hover:bg-purple-500/10 rounded-lg text-slate-500 dark:text-[#c3c5d8] hover:text-purple-400 transition-colors"><ClipboardCheck size={13} /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Receive Customer Material Dialog */}
            <Dialog open={showReceive} onOpenChange={setShowReceive}>
                <DialogContent className="sm:max-w-md bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 text-slate-900 dark:text-[#dae2fd] shadow-2xl p-0 overflow-hidden font-['Inter']">
                    <DialogHeader className="px-6 py-5 border-b border-slate-200 dark:border-[#434655]/20 bg-white dark:bg-[#131b2e]">
                        <DialogTitle className="text-lg font-extrabold">Receive Customer Material</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-[#c3c5d8] mt-1">Log material provided by a customer for their job.</DialogDescription>
                    </DialogHeader>
                    <div className="px-6 py-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Customer <span className="text-red-400">*</span></label>
                            <div className="relative">
                                <Input 
                                    className="h-9 text-sm w-full bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40" 
                                    placeholder="Search by name or email..." 
                                    value={customerSearch}
                                    onChange={e => {
                                        setCustomerSearch(e.target.value);
                                        setShowCustomerDropdown(true);
                                        setReceiveForm(p => ({ ...p, customer_id: "" }));
                                    }}
                                    onFocus={() => setShowCustomerDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                                />
                                {showCustomerDropdown && (
                                    <div className="absolute top-10 left-0 w-full bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655] rounded-lg shadow-xl z-50 max-h-[200px] overflow-y-auto">
                                        {users.filter(u => !u.admin && (u.name.toLowerCase().includes(customerSearch.toLowerCase()) || u.email.toLowerCase().includes(customerSearch.toLowerCase()))).map(u => (
                                            <div key={u.id} className="p-2 text-xs hover:bg-slate-50 dark:hover:bg-[#171f33] cursor-pointer text-slate-700 dark:text-[#c3c5d8] border-b border-slate-100 dark:border-[#434655]/20 last:border-0" onMouseDown={() => {
                                                setReceiveForm(p => ({ ...p, customer_id: u.id }));
                                                setCustomerSearch(`${u.name} (${u.email})`);
                                                setShowCustomerDropdown(false);
                                            }}>
                                                <div className="font-bold">{u.name}</div>
                                                <div className="text-slate-500 text-[10px]">{u.email}</div>
                                            </div>
                                        ))}
                                        {users.filter(u => !u.admin && (u.name.toLowerCase().includes(customerSearch.toLowerCase()) || u.email.toLowerCase().includes(customerSearch.toLowerCase()))).length === 0 && (
                                            <div className="p-3 text-xs text-slate-500 text-center">No customers found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Material <span className="text-red-400">*</span></label>
                            <select className="w-full h-9 text-sm rounded-md border border-slate-200 dark:border-[#434655]/40 bg-white dark:bg-[#131b2e] px-3" value={receiveForm.material_id} onChange={e => setReceiveForm({ ...receiveForm, material_id: e.target.value })}>
                                {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.category})</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Quantity <span className="text-red-400">*</span></label>
                            <Input type="number" className="h-9 text-sm bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40" value={receiveForm.initial_quantity} onChange={e => setReceiveForm({ ...receiveForm, initial_quantity: e.target.value })} placeholder="0" />
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 border-t border-slate-200 dark:border-[#434655]/20 bg-white dark:bg-[#131b2e]">
                        <DialogClose asChild><Button variant="outline" className="h-9 text-xs font-bold uppercase tracking-widest">Cancel</Button></DialogClose>
                        <Button className="h-9 px-6 text-xs font-bold uppercase tracking-widest bg-amber-500 hover:bg-amber-600 text-white" onClick={handleReceive} disabled={saving || !receiveForm.material_id || !receiveForm.customer_id || !receiveForm.initial_quantity}>
                            {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />} Receive
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Transaction Dialog (Consume / Wastage / Return) */}
            <Dialog open={!!txAction} onOpenChange={o => !o && setTxAction(null)}>
                <DialogContent className="sm:max-w-md bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 text-slate-900 dark:text-[#dae2fd] shadow-2xl p-0 overflow-hidden font-['Inter']">
                    <DialogHeader className="px-6 py-5 border-b border-slate-200 dark:border-[#434655]/20 bg-white dark:bg-[#131b2e]">
                        <DialogTitle className="text-lg font-extrabold">{txAction ? txTitle[txAction] : ""}</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-[#c3c5d8] mt-1">
                            Batch: <code className="font-mono font-bold text-blue-500">{txBatch?.display_id}</code> — Available: <strong>{Number(txBatch?.current_quantity || 0).toLocaleString()}</strong>
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
                            <Input className="h-9 text-sm bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40" value={txForm.reason} onChange={e => setTxForm({ ...txForm, reason: e.target.value })} placeholder={(txAction === "wastage" || txAction === "reconcile") ? "Required reason" : "Optional note"} />
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 border-t border-slate-200 dark:border-[#434655]/20 bg-white dark:bg-[#131b2e]">
                        <DialogClose asChild><Button variant="outline" className="h-9 text-xs font-bold uppercase tracking-widest">Cancel</Button></DialogClose>
                        <Button
                            className={`h-9 px-6 text-xs font-bold uppercase tracking-widest text-white ${txAction ? txColorBtn[txAction] : ""}`}
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
