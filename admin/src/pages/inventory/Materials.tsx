import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Loader2, Save, Package, Scroll, Droplet, Layers, Shield, Beaker, Zap, Sparkles, LayoutTemplate, Wrench } from "lucide-react";
import { api } from "@/lib/api";
import type { MaterialDefinition, MaterialCategory, UnitType } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CATEGORIES: MaterialCategory[] = ["PAPER", "INK", "BOARD", "LAMINATE", "GLUE", "CONSUMABLE", "FOIL", "PLATE", "HARDWARE"];
const UNITS: UnitType[] = ["SHEET", "KG", "SQ_INCH", "PCS", "METER", "SQ_METER", "LITER"];
const catColor: Record<string, string> = {
    PAPER: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    INK: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    BOARD: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    LAMINATE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    GLUE: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    CONSUMABLE: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    FOIL: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    PLATE: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    HARDWARE: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

const getIcon = (category: string) => {
    switch (category) {
        case "PAPER": return Scroll;
        case "INK": return Droplet;
        case "BOARD": return Layers;
        case "LAMINATE": return Shield;
        case "GLUE": return Beaker;
        case "CONSUMABLE": return Zap;
        case "FOIL": return Sparkles;
        case "PLATE": return LayoutTemplate;
        case "HARDWARE": return Wrench;
        default: return Package;
    }
};

// ── Schema-driven attribute fields per category ──────────────────────────────
type FieldDef = { key: string; label: string; type: "text" | "number" | "select" | "bool"; options?: string[]; required?: boolean; placeholder?: string };

const BASE_FIELDS: FieldDef[] = [
    { key: "display_unit", label: "Display Unit", type: "text", placeholder: "e.g. Reams, Rolls" },
    { key: "units_per_display", label: "Units per Display", type: "number", placeholder: "e.g. 500" },
    { key: "brand", label: "Brand", type: "text", placeholder: "Manufacturer" },
    { key: "density_kg_l", label: "Density (Kg/L)", type: "number", placeholder: "For liquid→weight" },
];

const CATEGORY_FIELDS: Record<string, FieldDef[]> = {
    PAPER: [
        { key: "gsm", label: "GSM", type: "number", required: true, placeholder: "e.g. 100" },
        { key: "brightness_pct", label: "Brightness %", type: "number", placeholder: "0-100" },
        { key: "finish", label: "Finish", type: "select", options: ["Uncoated", "Gloss", "Matte", "Silk"] },
        { key: "shade", label: "Shade", type: "text", placeholder: "e.g. Natural White" },
        { key: "bulk_cm3_g", label: "Bulk (cm³/g)", type: "number" },
    ],
    BOARD: [
        { key: "gsm", label: "GSM", type: "number", required: true },
        { key: "ply", label: "Ply", type: "number", placeholder: "e.g. 3" },
        { key: "burst_factor_bf", label: "Burst Factor (BF)", type: "number" },
        { key: "flute_type", label: "Flute Type", type: "select", options: ["A", "B", "C", "E", "F"] },
        { key: "coating", label: "Coating", type: "select", options: ["White Back", "Grey Back", "Kraft Back"] },
        { key: "thickness_mm", label: "Thickness (mm)", type: "number" },
    ],
    INK: [
        { key: "color_code", label: "Color Code", type: "text", required: true, placeholder: "Cyan, Pantone 032C" },
        { key: "drying_type", label: "Drying Type", type: "select", options: ["UV", "Conventional", "Aqueous", "Solvent"] },
        { key: "viscosity", label: "Viscosity", type: "text", placeholder: "High / Medium / Low" },
        { key: "particle_size", label: "Particle Size", type: "text" },
    ],
    LAMINATE: [
        { key: "micron", label: "Micron", type: "number", required: true },
        { key: "finish", label: "Finish", type: "select", options: ["Gloss", "Matte", "Velvet", "Holographic"] },
        { key: "roll_width_inches", label: "Roll Width (inches)", type: "number" },
        { key: "gsm", label: "GSM", type: "number" },
        { key: "shrink_ratio", label: "Shrink Ratio", type: "text", placeholder: "High / Low" },
        { key: "is_thermal", label: "Is Thermal", type: "bool" },
    ],
    GLUE: [
        { key: "glue_type", label: "Glue Type", type: "select", required: true, options: ["Hot Melt", "PVA", "PUR", "Starch", "Chemical"] },
        { key: "solid_content_pct", label: "Solid Content %", type: "number" },
        { key: "bond_strength", label: "Bond Strength", type: "select", options: ["Low", "Medium", "High"] },
        { key: "viscosity_cps", label: "Viscosity (cps)", type: "number" },
    ],
    CONSUMABLE: [
        { key: "consumable_type", label: "Consumable Type", type: "text", required: true, placeholder: "e.g. Fountain Solution, UV Coating" },
        { key: "gauge", label: "Gauge", type: "number" },
        { key: "thickness_mm", label: "Thickness (mm)", type: "number" },
        { key: "concentration_pct", label: "Concentration %", type: "number" },
        { key: "life_expectancy", label: "Life Expectancy", type: "text", placeholder: "e.g. 500,000 impressions" },
    ],
    FOIL: [
        { key: "color", label: "Color", type: "text", required: true, placeholder: "Gold, Silver" },
        { key: "width_mm", label: "Width (mm)", type: "number", required: true },
        { key: "core_size_inches", label: "Core Size (inches)", type: "number" },
        { key: "is_holographic", label: "Holographic", type: "bool" },
        { key: "micron", label: "Micron", type: "number" },
    ],
    PLATE: [
        { key: "plate_type", label: "Plate Type", type: "select", required: true, options: ["Thermal CTP", "UV CTP", "Violet CTP", "Analog"] },
        { key: "thickness_mm", label: "Thickness (mm)", type: "number", required: true },
        { key: "length_mm", label: "Length (mm)", type: "number", required: true },
        { key: "width_mm", label: "Width (mm)", type: "number", required: true },
        { key: "max_impressions", label: "Max Impressions", type: "number" },
    ],
    HARDWARE: [
        { key: "hardware_type", label: "Hardware Type", type: "text", required: true, placeholder: "Stitching Wire, Spiral Comb" },
        { key: "material", label: "Material", type: "text", placeholder: "Plastic, Aluminum" },
        { key: "diameter_mm", label: "Diameter (mm)", type: "number" },
        { key: "color", label: "Color", type: "text" },
    ],
};

export default function Materials() {
    const [materials, setMaterials] = useState<MaterialDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<MaterialDefinition | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: "", category: "PAPER" as MaterialCategory, uom: "SHEET" as UnitType, minimum_threshold: 0 });
    const [attrs, setAttrs] = useState<Record<string, any>>({});
    const [deleteTarget, setDeleteTarget] = useState<MaterialDefinition | null>(null);
    const [fifoTarget, setFifoTarget] = useState<MaterialDefinition | null>(null);
    const [fifoForm, setFifoForm] = useState({ quantity: "", job_id: "", reason: "" });
    const [filterCat, setFilterCat] = useState("");

    const fetch_ = async () => {
        setLoading(true);
        try { setMaterials(await api<MaterialDefinition[]>("/admin/inventory/materials/?limit=200")); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetch_(); }, []);

    const openCreate = () => {
        setEditing(null);
        setForm({ name: "", category: "PAPER", uom: "SHEET", minimum_threshold: 0 });
        setAttrs({});
        setShowForm(true);
    };
    const openEdit = (m: MaterialDefinition) => {
        setEditing(m);
        setForm({ name: m.name, category: m.category, uom: m.uom, minimum_threshold: m.minimum_threshold || 0 });
        setAttrs({ ...(m.attributes || {}) });
        setShowForm(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Clean attrs: remove empty strings
            const cleanAttrs: Record<string, any> = {};
            for (const [k, v] of Object.entries(attrs)) {
                if (v === "" || v === null || v === undefined) continue;
                cleanAttrs[k] = v;
            }
            if (editing) {
                const payload: any = { attributes: cleanAttrs };
                if (form.name !== editing.name) payload.name = form.name;
                if (form.category !== editing.category) payload.category = form.category;
                if (form.uom !== editing.uom) payload.uom = form.uom;
                if (form.minimum_threshold !== editing.minimum_threshold) payload.minimum_threshold = form.minimum_threshold;
                await api(`/admin/inventory/materials/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
            } else {
                await api("/admin/inventory/materials/", { method: "POST", body: JSON.stringify({ ...form, attributes: cleanAttrs }) });
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

    const handleFifoConsume = async () => {
        if (!fifoTarget || !fifoForm.quantity) return;
        setSaving(true);
        try {
            await api("/admin/inventory/transactions/consume-fifo", {
                method: "POST",
                body: JSON.stringify({
                    material_id: fifoTarget.id,
                    quantity: Number(fifoForm.quantity),
                    job_id: fifoForm.job_id || null,
                    reason: fifoForm.reason || "FIFO Auto Consume"
                })
            });
            setFifoTarget(null);
            // Optionally could trigger a global refresh or toast
        } catch (e: any) { alert(e.message || "Failed to consume"); }
        finally { setSaving(false); }
    };

    const allFields = [...BASE_FIELDS, ...(CATEGORY_FIELDS[form.category] || [])];
    const filtered = filterCat ? materials.filter(m => m.category === filterCat) : materials;

    const renderField = (f: FieldDef) => {
        const val = attrs[f.key] ?? "";
        if (f.type === "select") {
            return (
                <select className="w-full h-8 text-xs rounded-md border border-slate-200 dark:border-[#434655]/40 bg-white dark:bg-[#131b2e] px-2 text-slate-900 dark:text-[#dae2fd]" value={val} onChange={e => setAttrs({ ...attrs, [f.key]: e.target.value || undefined })}>
                    <option value="">—</option>
                    {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
            );
        }
        if (f.type === "bool") {
            return (
                <select className="w-full h-8 text-xs rounded-md border border-slate-200 dark:border-[#434655]/40 bg-white dark:bg-[#131b2e] px-2 text-slate-900 dark:text-[#dae2fd]" value={val === true ? "true" : val === false ? "false" : ""} onChange={e => setAttrs({ ...attrs, [f.key]: e.target.value === "true" ? true : e.target.value === "false" ? false : undefined })}>
                    <option value="">—</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>
            );
        }
        return (
            <Input type={f.type === "number" ? "number" : "text"} className="h-8 text-xs bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40" value={val} onChange={e => setAttrs({ ...attrs, [f.key]: f.type === "number" ? (e.target.value ? Number(e.target.value) : "") : e.target.value })} placeholder={f.placeholder || ""} />
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-[#dae2fd]">Material Definitions</h2>
                        <p className="text-xs text-slate-500 dark:text-[#c3c5d8]">{filtered.length} of {materials.length} materials</p>
                    </div>
                    <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="h-8 text-xs rounded-lg border border-slate-200 dark:border-[#434655]/40 bg-white dark:bg-[#131b2e] px-2 text-slate-700 dark:text-[#dae2fd]">
                        <option value="">All Categories</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
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
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-12 text-slate-400 dark:text-[#c3c5d8]/50 text-xs">No materials found.</td></tr>
                        ) : filtered.map(m => {
                            const Icon = getIcon(m.category);
                            return (
                            <tr key={m.id} className="group hover:bg-slate-50 dark:hover:bg-[#171f33]/80 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#0b1326] flex items-center justify-center"><Icon size={14} className="text-slate-400 dark:text-[#c3c5d8]" /></div>
                                        <span className="font-bold text-sm text-slate-900 dark:text-[#dae2fd]">{m.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${catColor[m.category] || ""}`}>{m.category}</span></td>
                                <td className="px-6 py-4"><code className="text-[11px] font-mono font-bold text-blue-600 dark:text-[#adc6ff] bg-[#adc6ff]/10 px-2 py-0.5 rounded border border-blue-400/20 dark:border-[#adc6ff]/20">{m.uom}</code></td>
                                <td className="px-6 py-4 text-xs text-slate-500 dark:text-[#c3c5d8]">
                                    <div className="flex flex-wrap gap-1">
                                        {Object.entries(m.attributes || {}).filter(([, v]) => v != null && v !== "").map(([k, v]) => (
                                            <span key={k} className="bg-slate-100 dark:bg-[#0b1326] px-2 py-0.5 rounded text-[10px]">{k}: {String(v)}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="inline-flex gap-1">
                                        <button onClick={() => { setFifoTarget(m); setFifoForm({ quantity: "", job_id: "", reason: "" }); }} title="Smart Consume (FIFO)" className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-emerald-500/10 rounded-lg transition-all text-slate-500 dark:text-[#c3c5d8] hover:text-emerald-500"><Package size={14} /></button>
                                        <button onClick={() => openEdit(m)} className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-blue-500/10 rounded-lg transition-all text-slate-500 dark:text-[#c3c5d8] hover:text-blue-500"><Edit2 size={14} /></button>
                                        <button onClick={() => setDeleteTarget(m)} className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg transition-all text-slate-500 dark:text-[#c3c5d8] hover:text-red-400"><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Create / Edit Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-lg bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 text-slate-900 dark:text-[#dae2fd] shadow-2xl p-0 overflow-hidden font-['Inter'] max-h-[90vh] flex flex-col">
                    <DialogHeader className="px-6 py-5 border-b border-slate-200 dark:border-[#434655]/20 bg-white dark:bg-[#131b2e] shrink-0">
                        <DialogTitle className="text-lg font-extrabold">{editing ? "Edit Material" : "New Material"}</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-[#c3c5d8] mt-1">Define a raw material used in production.</DialogDescription>
                    </DialogHeader>
                    <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                        {/* Core fields */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Material Name <span className="text-red-400">*</span></label>
                            <Input className="h-9 text-sm bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. 100 GSM Art Paper" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Category</label>
                                <select className="w-full h-9 text-sm rounded-md border border-slate-200 dark:border-[#434655]/40 bg-white dark:bg-[#131b2e] px-3 text-slate-900 dark:text-[#dae2fd]" value={form.category} onChange={e => { setForm({ ...form, category: e.target.value as MaterialCategory }); setAttrs({}); }}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Unit of Measure</label>
                                <select className="w-full h-9 text-sm rounded-md border border-slate-200 dark:border-[#434655]/40 bg-white dark:bg-[#131b2e] px-3 text-slate-900 dark:text-[#dae2fd]" value={form.uom} onChange={e => setForm({ ...form, uom: e.target.value as UnitType })}>
                                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5 col-span-2">
                                <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Minimum Threshold Alert</label>
                                <Input type="number" className="h-9 text-sm bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40" value={form.minimum_threshold} onChange={e => setForm({ ...form, minimum_threshold: Number(e.target.value) })} placeholder="0" />
                            </div>
                        </div>

                        {/* Category-specific attributes */}
                        <div className="border-t border-slate-200 dark:border-[#434655]/20 pt-4">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-[#c3c5d8] uppercase tracking-widest mb-3">{form.category} Attributes</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                {(CATEGORY_FIELDS[form.category] || []).map(f => (
                                    <div key={f.key} className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">
                                            {f.label} {f.required && <span className="text-red-400">*</span>}
                                        </label>
                                        {renderField(f)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Base/common attributes */}
                        <div className="border-t border-slate-200 dark:border-[#434655]/20 pt-4">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-[#c3c5d8] uppercase tracking-widest mb-3">Common Attributes</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                {BASE_FIELDS.map(f => (
                                    <div key={f.key} className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">{f.label}</label>
                                        {renderField(f)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 border-t border-slate-200 dark:border-[#434655]/20 bg-white dark:bg-[#131b2e] shrink-0">
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

            {/* Smart FIFO Consume Dialog */}
            <Dialog open={!!fifoTarget} onOpenChange={o => !o && setFifoTarget(null)}>
                <DialogContent className="sm:max-w-md bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 text-slate-900 dark:text-[#dae2fd] shadow-2xl font-['Inter']">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-extrabold text-emerald-500 dark:text-emerald-400">Smart Consume (FIFO)</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 dark:text-[#c3c5d8] mt-1">
                            Automatically consume {fifoTarget?.name} from the oldest active factory batches.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Quantity Needed ({fifoTarget?.uom}) *</label>
                            <Input type="number" className="h-9 text-sm bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40" value={fifoForm.quantity} onChange={e => setFifoForm({ ...fifoForm, quantity: e.target.value })} placeholder="e.g. 500" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Job ID (Optional)</label>
                            <Input className="h-9 text-sm bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40" value={fifoForm.job_id} onChange={e => setFifoForm({ ...fifoForm, job_id: e.target.value })} placeholder="Paste order UUID..." />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Reason</label>
                            <Input className="h-9 text-sm bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40" value={fifoForm.reason} onChange={e => setFifoForm({ ...fifoForm, reason: e.target.value })} placeholder="e.g. For Order 123" />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-end pt-4">
                        <Button variant="outline" className="h-9 text-xs font-bold uppercase tracking-widest" onClick={() => setFifoTarget(null)}>Cancel</Button>
                        <Button className="h-9 text-xs font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white" disabled={saving || !fifoForm.quantity} onClick={handleFifoConsume}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />} Consume
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
