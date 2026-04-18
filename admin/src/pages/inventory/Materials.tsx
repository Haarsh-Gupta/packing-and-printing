import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Loader2, Save, Package } from "lucide-react";
import { api } from "@/lib/api";
import type { MaterialDefinition, MaterialCategory, UnitType } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CATEGORIES: MaterialCategory[] = ["PAPER", "INK", "BOARD", "LAMINATE", "GLUE", "CONSUMABLE"];
const UNITS: UnitType[] = ["SHEET", "KG", "SQ_INCH", "PCS"];
const catColor: Record<string, string> = {
    PAPER: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    INK: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    BOARD: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    LAMINATE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    GLUE: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    CONSUMABLE: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

export default function Materials() {
    const [materials, setMaterials] = useState<MaterialDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<MaterialDefinition | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: "", category: "PAPER" as MaterialCategory, uom: "SHEET" as UnitType });
    const [deleteTarget, setDeleteTarget] = useState<MaterialDefinition | null>(null);

    const fetch_ = async () => {
        setLoading(true);
        try { setMaterials(await api<MaterialDefinition[]>("/admin/inventory/materials/?limit=200")); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetch_(); }, []);

    const openCreate = () => { setEditing(null); setForm({ name: "", category: "PAPER", uom: "SHEET" }); setShowForm(true); };
    const openEdit = (m: MaterialDefinition) => { setEditing(m); setForm({ name: m.name, category: m.category, uom: m.uom }); setShowForm(true); };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editing) {
                const payload: any = {};
                if (form.name !== editing.name) payload.name = form.name;
                if (form.category !== editing.category) payload.category = form.category;
                if (form.uom !== editing.uom) payload.uom = form.uom;
                if (Object.keys(payload).length > 0) await api(`/admin/inventory/materials/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
            } else {
                await api("/admin/inventory/materials/", { method: "POST", body: JSON.stringify(form) });
            }
            setShowForm(false); fetch_();
        } catch (e: any) { alert(e.message || "Failed"); }
        finally { setSaving(false); }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try { await api(`/admin/inventory/materials/${deleteTarget.id}`, { method: "DELETE" }); fetch_(); setDeleteTarget(null); }
        catch (e: any) { alert(e.message || "Cannot delete"); }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-[#dae2fd]">Material Definitions</h2>
                    <p className="text-xs text-slate-500 dark:text-[#c3c5d8]">{materials.length} materials registered</p>
                </div>
                <button onClick={openCreate} className="h-9 px-4 bg-[#adc6ff] hover:bg-white text-[#001a42] font-extrabold text-[10px] uppercase tracking-widest rounded-lg flex items-center gap-2 transition-colors shadow-[0_4px_12px_rgba(173,198,255,0.15)]">
                    <Plus size={14} /> Add Material
                </button>
            </div>

            <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-100 dark:bg-[#0b1326]/50 text-slate-600 dark:text-[#c3c5d8] uppercase text-[10px] tracking-[0.2em] font-bold border-b border-slate-200 dark:border-[#434655]/20">
                            <th className="px-6 py-3.5">Name</th>
                            <th className="px-6 py-3.5">Category</th>
                            <th className="px-6 py-3.5">Unit</th>
                            <th className="px-6 py-3.5">Attributes</th>
                            <th className="px-6 py-3.5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#434655]/10">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-12 text-slate-500 dark:text-[#c3c5d8] text-xs"><Loader2 className="animate-spin inline mr-2" size={14} />Loading…</td></tr>
                        ) : materials.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-12 text-slate-400 dark:text-[#c3c5d8]/50 text-xs">No materials defined yet.</td></tr>
                        ) : materials.map(m => (
                            <tr key={m.id} className="group hover:bg-slate-50 dark:hover:bg-[#171f33]/80 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#0b1326] flex items-center justify-center"><Package size={14} className="text-slate-400 dark:text-[#c3c5d8]" /></div>
                                        <span className="font-bold text-sm text-slate-900 dark:text-[#dae2fd]">{m.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${catColor[m.category] || ""}`}>{m.category}</span></td>
                                <td className="px-6 py-4"><code className="text-[11px] font-mono font-bold text-blue-600 dark:text-[#adc6ff] bg-[#adc6ff]/10 px-2 py-0.5 rounded border border-blue-400/20 dark:border-[#adc6ff]/20">{m.uom}</code></td>
                                <td className="px-6 py-4 text-xs text-slate-500 dark:text-[#c3c5d8]">
                                    {Object.entries(m.attributes || {}).filter(([, v]) => v != null).map(([k, v]) => (
                                        <span key={k} className="mr-2 bg-slate-100 dark:bg-[#0b1326] px-2 py-0.5 rounded text-[10px]">{k}: {String(v)}</span>
                                    ))}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="inline-flex gap-1">
                                        <button onClick={() => openEdit(m)} className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-blue-500/10 rounded-lg transition-all text-slate-500 dark:text-[#c3c5d8] hover:text-blue-500"><Edit2 size={14} /></button>
                                        <button onClick={() => setDeleteTarget(m)} className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg transition-all text-slate-500 dark:text-[#c3c5d8] hover:text-red-400"><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create / Edit Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-md bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 text-slate-900 dark:text-[#dae2fd] shadow-2xl p-0 overflow-hidden font-['Inter']">
                    <DialogHeader className="px-6 py-5 border-b border-slate-200 dark:border-[#434655]/20 bg-white dark:bg-[#131b2e]">
                        <DialogTitle className="text-lg font-extrabold">{editing ? "Edit Material" : "New Material"}</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-[#c3c5d8] mt-1">Define a raw material used in production.</DialogDescription>
                    </DialogHeader>
                    <div className="px-6 py-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Material Name <span className="text-red-400">*</span></label>
                            <Input className="h-9 text-sm bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. 100 GSM Art Paper" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Category</label>
                                <select className="w-full h-9 text-sm rounded-md border border-slate-200 dark:border-[#434655]/40 bg-white dark:bg-[#131b2e] px-3 text-slate-900 dark:text-[#dae2fd]" value={form.category} onChange={e => setForm({ ...form, category: e.target.value as MaterialCategory })}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Unit of Measure</label>
                                <select className="w-full h-9 text-sm rounded-md border border-slate-200 dark:border-[#434655]/40 bg-white dark:bg-[#131b2e] px-3 text-slate-900 dark:text-[#dae2fd]" value={form.uom} onChange={e => setForm({ ...form, uom: e.target.value as UnitType })}>
                                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 border-t border-slate-200 dark:border-[#434655]/20 bg-white dark:bg-[#131b2e]">
                        <DialogClose asChild><Button variant="outline" className="h-9 text-xs font-bold uppercase tracking-widest">Cancel</Button></DialogClose>
                        <Button className="h-9 px-6 text-xs font-bold uppercase tracking-widest bg-[#adc6ff] hover:bg-white text-[#001a42]" onClick={handleSave} disabled={saving || !form.name.trim()}>
                            {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />} Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-sm bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 text-slate-900 dark:text-[#dae2fd] shadow-2xl font-['Inter']">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-extrabold text-red-500 dark:text-[#ffb4ab]">Delete Material</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-[#c3c5d8] mt-1">
                            Delete <strong className="text-slate-900 dark:text-white">{deleteTarget?.name}</strong>? This will fail if batches exist.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-between pt-4">
                        <Button variant="outline" className="h-9 text-xs font-bold uppercase tracking-widest" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                        <Button className="h-9 text-xs font-bold uppercase tracking-widest bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
