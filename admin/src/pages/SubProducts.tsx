import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Filter, ArrowDownUp, Edit2, Trash2, PlusCircle, Loader2, Save, Info, Plus, X, GripVertical, Settings2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Product, SubProduct, FormSection, ProductOption } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function SubProducts() {
    const navigate = useNavigate();
    const { slug } = useParams();

    const [product, setProduct] = useState<Product | null>(null);
    const [subProducts, setSubProducts] = useState<SubProduct[]>([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [editingSubProduct, setEditingSubProduct] = useState<SubProduct | null>(null);
    const [saving, setSaving] = useState(false);

    const [formState, setFormState] = useState({
        name: "", slug: "", description: "", type: "product",
        base_price: "0", minimum_quantity: "1", images: "",
        is_active: true
    });

    const [configSections, setConfigSections] = useState<FormSection[]>([]);

    const fetchProduct = async () => {
        setLoading(true);
        try {
            const data = await api<Product>(`/products/${slug}`);
            setProduct(data);
            setSubProducts(data.sub_products || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (slug) fetchProduct();
    }, [slug]);

    const openCreate = () => {
        setEditingSubProduct(null);
        setFormState({
            name: "", slug: "", description: "", type: "product",
            base_price: "0", minimum_quantity: "1", images: "",
            is_active: true
        });
        setConfigSections([]);
        setShowForm(true);
    };

    const openEdit = (sp: SubProduct) => {
        setEditingSubProduct(sp);
        setFormState({
            name: sp.name, slug: sp.slug, description: sp.description || "", type: sp.type || "product",
            base_price: String(sp.base_price), minimum_quantity: String(sp.minimum_quantity),
            images: sp.images ? sp.images.join(", ") : "",
            is_active: sp.is_active
        });
        setConfigSections(sp.config_schema?.sections || []);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this sub-product permanently?")) return;
        try {
            await api(`/admin/products/sub-products/${id}`, { method: "DELETE" });
            fetchProduct();
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggleStatus = async (sp: SubProduct, active: boolean) => {
        try {
            await api(`/admin/products/sub-products/${sp.id}`, {
                method: "PATCH",
                body: JSON.stringify({ is_active: active })
            });
            fetchProduct();
        } catch (e) { console.error(e); }
    };

    const handleSave = async () => {
        if (!product) return;
        setSaving(true);

        try {
            const payload: any = {
                name: formState.name,
                description: formState.description || undefined,
                type: formState.type,
                base_price: parseFloat(formState.base_price) || 0,
                minimum_quantity: parseInt(formState.minimum_quantity, 10) || 1,
                images: formState.images ? formState.images.split(",").map(i => i.trim()).filter(Boolean) : [],
                is_active: formState.is_active,
                config_schema: { sections: configSections } // Built from the interactive UI
            };

            if (formState.slug) payload.slug = formState.slug;

            if (editingSubProduct) {
                await api(`/admin/products/sub-products/${editingSubProduct.id}`, {
                    method: "PATCH",
                    body: JSON.stringify(payload)
                });
            } else {
                await api(`/admin/products/${product.id}/sub-products`, {
                    method: "POST",
                    body: JSON.stringify(payload)
                });
            }
            setShowForm(false);
            fetchProduct();
        } catch (e: any) {
            console.error(e);
            alert(e.message || "Failed to save variant setup.");
        } finally {
            setSaving(false);
        }
    };

    // --- Config Builder Handlers ---
    const addSection = () => {
        setConfigSections([
            ...configSections,
            { key: `section_${Date.now()}`, label: "New Option", type: "dropdown", options: [{ label: "Choice A", value: "choice_a", price_mod: 0 }] }
        ]);
    };

    const removeSection = (idx: number) => {
        const copy = [...configSections];
        copy.splice(idx, 1);
        setConfigSections(copy);
    };

    const updateSectionInfo = (idx: number, updates: Partial<FormSection>) => {
        const copy = [...configSections];
        copy[idx] = { ...copy[idx], ...updates };

        // Ensure options array exists when toggling to drop/radio
        if ((updates.type === "dropdown" || updates.type === "radio") && !copy[idx].options) {
            copy[idx].options = [{ label: "Choice A", value: "choice_a", price_mod: 0 }];
        }

        setConfigSections(copy);
    };

    const addOption = (secIdx: number) => {
        const copy = [...configSections];
        const opts = copy[secIdx].options || [];
        copy[secIdx].options = [...opts, { label: "New Choice", value: `val_${Date.now()}`, price_mod: 0 }];
        setConfigSections(copy);
    };

    const removeOption = (secIdx: number, optIdx: number) => {
        const copy = [...configSections];
        const opts = copy[secIdx].options || [];
        opts.splice(optIdx, 1);
        copy[secIdx].options = opts;
        setConfigSections(copy);
    };

    const updateOption = (secIdx: number, optIdx: number, updates: Partial<ProductOption>) => {
        const copy = [...configSections];
        if (!copy[secIdx].options) return;
        copy[secIdx].options![optIdx] = { ...copy[secIdx].options![optIdx], ...updates };
        setConfigSections(copy);
    };

    const typeColors = ['bg-indigo-50 text-indigo-600', 'bg-emerald-50 text-emerald-600', 'bg-amber-50 text-amber-600', 'bg-pink-50 text-pink-600'];

    return (
        <div className="max-w-[1400px] mx-auto w-full animate-fade-in font-['Inter',sans-serif]">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 mb-6 text-sm">
                <button onClick={() => navigate('/products')} className="text-slate-500 hover:text-[#136dec] transition-colors font-medium">Core Products</button>
                <ChevronRight size={14} className="text-slate-400" />
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">{product ? product.name : "Loading..."}</span>
            </div>

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-5">
                    <button onClick={() => navigate('/products')} className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all text-slate-700 dark:text-slate-300">
                        <ArrowLeft size={22} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                            {product ? product.name : "Variant Configurator"}
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2.5 py-1 rounded-md font-mono mt-1">
                                {subProducts.length} Variants
                            </span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 flex items-center gap-2">
                            Manage the specific physical sub-products and custom form configurations for this category.
                        </p>
                    </div>
                </div>
                <button onClick={openCreate} className="flex items-center justify-center gap-2 bg-[#136dec] hover:bg-[#136dec]/90 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-[#136dec]/20 active:scale-95 whitespace-nowrap">
                    <PlusCircle size={20} />
                    <span>Create Specific Variant</span>
                </button>
            </div>

            {/* Management Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 w-[40%]">Specific Variant</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Base Rate (₹)</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">MOQ</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Classification</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Live Status</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-20 text-slate-500 font-medium"><Loader2 className="animate-spin inline mr-3" /> Syncing from server...</td></tr>
                            ) : subProducts.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-20 text-slate-500 font-medium">No specialized sub-products available under {product?.name} currently.</td></tr>
                            ) : subProducts.map((p, idx) => {
                                const typeColor = typeColors[idx % typeColors.length];

                                return (
                                    <tr key={p.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-5">
                                                <div className="flex -space-x-4 overflow-hidden shadow-sm rounded-lg relative">
                                                    {p.images && p.images.length > 0 ? p.images.slice(0, 3).map((img, i) => (
                                                        <img key={i} src={img} className="inline-block h-12 w-12 rounded-lg ring-2 ring-white dark:ring-slate-900 object-cover bg-slate-100" />
                                                    )) : (
                                                        <div className="inline-block h-12 w-12 rounded-lg ring-2 ring-white dark:ring-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400 text-xs">IMG</div>
                                                    )}
                                                    {p.images && p.images.length > 3 && (
                                                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 relative z-10 shadow-inner">
                                                            +{p.images.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white text-base leading-tight">{p.name}</div>
                                                    <div className={`text-xs text-slate-500 w-56 truncate mt-1`} title={p.description || p.slug}>{p.description || p.slug}</div>
                                                    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-1.5 flex items-center gap-1.5"><Settings2 size={10} className="text-[#136dec]" /> {p.config_schema?.sections?.length || 0} Dynamic Options</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 font-bold text-slate-700 dark:text-slate-300 text-base">₹{p.base_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-5 font-mono text-slate-600 dark:text-slate-400 text-sm font-medium">{p.minimum_quantity} Units</td>
                                        <td className="px-6 py-5">
                                            <span className={`px-3 py-1.5 text-[10px] font-bold rounded-md uppercase tracking-wide border border-current/20 shadow-sm ${typeColor} dark:bg-transparent`}>
                                                {p.type || "Product"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <Switch checked={p.is_active} onCheckedChange={(c) => handleToggleStatus(p, c)} className="data-[state=checked]:bg-emerald-500 scale-90" />
                                                <span className="text-xs font-semibold text-slate-500 uppercase">{p.is_active ? 'Live' : 'Hidden'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(p)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                                                    <Edit2 size={18} />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50">
                                                    <Trash2 size={18} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* ── SubProduct Dialog (Massive Form Layout) ── */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent showCloseButton={false} className="sm:max-w-[85vw] w-[95vw] h-[90vh] p-0 bg-transparent border-none shadow-none outline-none overflow-hidden font-['Inter',sans-serif]">
                    <div className="flex flex-col w-full h-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden relative">

                        {/* Header Pinned */}
                        <div className="px-6 md:px-8 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between z-20 gap-4">
                            <div className="flex-1 pr-4">
                                <DialogTitle className="text-2xl font-black">{editingSubProduct ? "Edit Sub-Product" : "Launch Sub-Product Variant"}</DialogTitle>
                                <DialogDescription className="text-sm mt-1.5 font-medium text-slate-500">
                                    This creates the localized variant of the <strong className="text-slate-700">{product?.name}</strong> family, including pricing structures and checkout custom inputs.
                                </DialogDescription>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <Button variant="outline" onClick={() => setShowForm(false)} className="h-11 font-bold">Discard Changes</Button>
                                <Button className="h-11 px-8 font-bold bg-[#136dec] hover:bg-[#136dec]/90 text-white shadow-lg shadow-[#136dec]/20" onClick={handleSave} disabled={saving || !formState.name.trim() || !formState.base_price}>
                                    {saving ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Save className="mr-2 h-5 w-5" />}
                                    {editingSubProduct ? "Synchronize Updates" : "Deploy Live Now"}
                                </Button>
                            </div>
                        </div>

                        {/* Scrollable Editor */}
                        <div className="flex-1 overflow-y-auto w-full p-4 md:p-8 bg-slate-50 dark:bg-slate-900/50">
                            <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto pb-16">

                                {/* CORE SETTINGS BLOCK */}
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-8 space-y-8 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-[#136dec]"></div>

                                    <div className="flex items-center gap-3">
                                        <div className="bg-[#136dec]/10 p-2.5 rounded-lg"><Settings2 size={24} className="text-[#136dec]" /></div>
                                        <h3 className="text-xl font-bold tracking-tight">Essential Architecture</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2.5">
                                            <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                                                <span>Variant Master Title <span className="text-red-500 font-normal ml-0.5">*</span></span>
                                            </label>
                                            <Input className="h-12 text-base font-medium shadow-sm bg-slate-50 dark:bg-slate-800/50" value={formState.name} onChange={e => setFormState({ ...formState, name: e.target.value })} placeholder="e.g. Leather Cover Softback Diary" />
                                            <p className="text-xs text-slate-500 flex items-start gap-1.5"><Info size={14} className="mt-0.5 text-blue-500 shrink-0" /> The absolute identifier title globally shown to the buyer at checkout.</p>
                                        </div>
                                        <div className="space-y-2.5">
                                            <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                                                <span>System Path (Slug)</span>
                                                <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-0.5 rounded-sm">Optional</span>
                                            </label>
                                            <Input className="h-12 text-base font-mono bg-slate-50 dark:bg-slate-800/50 placeholder:opacity-50" value={formState.slug} onChange={e => setFormState({ ...formState, slug: e.target.value })} placeholder="leather-cover-softback" />
                                            <p className="text-xs text-slate-500 flex items-start gap-1.5"><Info size={14} className="mt-0.5 shrink-0" /> Overrules standard URL formatting generation. Useful for SEO links.</p>
                                        </div>
                                    </div>

                                    <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2.5">
                                            <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                                                <span>Base Quote Rate (₹) <span className="text-red-500 font-normal ml-0.5">*</span></span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-3 text-slate-400 font-medium font-mono text-base">₹</span>
                                                <Input type="number" step="0.01" className="h-12 pl-10 text-base font-bold shadow-sm bg-slate-50 border-slate-300 focus-visible:ring-[#136dec]" value={formState.base_price} onChange={e => setFormState({ ...formState, base_price: e.target.value })} placeholder="0.00" />
                                            </div>
                                            <p className="text-xs text-slate-500">Starting mathematical metric before custom options multiply costs.</p>
                                        </div>
                                        <div className="space-y-2.5">
                                            <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                                Minimum Order Quantity (MOQ)
                                            </label>
                                            <Input type="number" className="h-12 text-base shadow-sm bg-slate-50 font-mono" value={formState.minimum_quantity} onChange={e => setFormState({ ...formState, minimum_quantity: e.target.value })} placeholder="100" />
                                            <p className="text-xs text-slate-500">The hard limit base block to authorize a printed checkout quote.</p>
                                        </div>
                                        <div className="space-y-2.5">
                                            <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Classification Tag</label>
                                            <Input className="h-12 text-base shadow-sm bg-slate-50 uppercase tracking-wide font-semibold text-slate-600 placeholder:text-slate-300" value={formState.type} onChange={e => setFormState({ ...formState, type: e.target.value })} placeholder="PRODUCT / FINISHING" />
                                            <p className="text-xs text-slate-500">Organizational grouping category across backend sorting tools.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                                            <span>Image Fleet Nodes</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-0.5 rounded-sm">Optional</span>
                                        </label>
                                        <Textarea className="h-24 text-sm font-mono leading-relaxed bg-slate-50 placeholder:opacity-40" value={formState.images} onChange={e => setFormState({ ...formState, images: e.target.value })} placeholder={"https://cloud.com/view/1.jpg,\nhttps://cloud.com/view/back.png"} />
                                        <p className="text-xs text-slate-500 flex items-start gap-1.5"><Info size={14} className="mt-0.5 shrink-0 text-[#136dec]" /> Comma separated array links parsing into the item carousel gallery.</p>
                                    </div>

                                    <div className="space-y-2.5">
                                        <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                                            <span>Full Description Narrative</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-0.5 rounded-sm">Optional</span>
                                        </label>
                                        <Textarea className="h-28 text-base bg-slate-50" value={formState.description} onChange={e => setFormState({ ...formState, description: e.target.value })} placeholder="The definitive summary text..." />
                                    </div>

                                    <div className="flex items-center justify-between border border-slate-200 dark:border-slate-800 bg-slate-50 p-5 rounded-2xl">
                                        <div>
                                            <p className="font-extrabold text-[#136dec] tracking-tight text-base">Authorize Global Visibility</p>
                                            <p className="text-sm text-slate-600 mt-1">Customers can locate and initiate queries using this product interface.</p>
                                        </div>
                                        <Switch checked={formState.is_active} onCheckedChange={c => setFormState({ ...formState, is_active: c })} className="data-[state=checked]:bg-[#136dec] scale-125 mx-2" />
                                    </div>

                                </div>

                                {/* DYNAMIC FORM BUILDER BLOCK */}
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-8 space-y-8 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                                                Interactive UI Form Builder
                                                <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 uppercase tracking-widest rounded-md mt-0.5 font-bold">{configSections.length} Elements Built</span>
                                            </h3>
                                            <p className="text-sm text-slate-500 mt-2 font-medium">Design the exact custom inputs, size dropdowns, and text fields required for buyers to quote accurately.</p>
                                        </div>

                                        <Button onClick={addSection} className="h-11 px-5 border-2 border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50 text-slate-800 hover:text-amber-800 font-bold transition-all gap-2 rounded-xl shadow-sm">
                                            <Plus size={18} strokeWidth={3} /> Add New Form Field Element
                                        </Button>
                                    </div>

                                    {configSections.length === 0 ? (
                                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-16 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900/50">
                                            <div className="bg-white p-4 rounded-full shadow-sm mb-4 border border-slate-200"><GripVertical size={32} className="text-slate-300" /></div>
                                            <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Interactive Blocks Built Yet</h4>
                                            <p className="text-slate-500 mt-2 font-medium max-w-sm">Use the builder interface above to layout dropdown selectors, color radios, or free-text print requirements.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {configSections.map((sec, secIdx) => (
                                                <div key={secIdx} className="border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-white shadow-sm overflow-hidden focus-within:border-amber-300 focus-within:ring-4 ring-amber-50 transition-all">

                                                    <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                        <div className="flex items-center gap-4 flex-1">
                                                            <GripVertical size={20} className="text-slate-400 shrink-0 cursor-move" />
                                                            <div className="flex flex-col flex-1 gap-1">
                                                                <Input
                                                                    className="h-10 text-[15px] font-black w-full max-w-md bg-white shadow-sm border-slate-300"
                                                                    value={sec.label}
                                                                    onChange={e => updateSectionInfo(secIdx, { label: e.target.value })}
                                                                    placeholder="e.g. Choose Cover Material"
                                                                />
                                                            </div>
                                                            <select
                                                                className="h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold shadow-sm cursor-pointer outline-none focus:border-amber-500 w-48 shrink-0"
                                                                value={sec.type}
                                                                onChange={e => updateSectionInfo(secIdx, { type: e.target.value as FormSection["type"] })}
                                                            >
                                                                <option value="dropdown">Dropdown Selection</option>
                                                                <option value="radio">Radio Buttons</option>
                                                                <option value="text_input">Text/String Input</option>
                                                                <option value="number_input">Numeric Integer Box</option>
                                                            </select>
                                                        </div>
                                                        <Button variant="ghost" size="icon" onClick={() => removeSection(secIdx)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 ml-4 h-10 w-10 shrink-0">
                                                            <Trash2 size={20} />
                                                        </Button>
                                                    </div>

                                                    <div className="p-6 bg-white dark:bg-slate-900">
                                                        <div className="flex items-center gap-4 mb-6">
                                                            <div className="flex-1 space-y-1.5">
                                                                <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Info size={12} /> Developer JSON Key Mapping <span className="text-red-500 font-normal ml-0.5">*</span></label>
                                                                <Input
                                                                    className="h-10 text-sm font-mono bg-slate-50 text-blue-700 dark:text-blue-400 tracking-tight"
                                                                    value={sec.key}
                                                                    onChange={e => updateSectionInfo(secIdx, { key: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                                                                    placeholder="cover_material_type"
                                                                />
                                                            </div>

                                                            {sec.type === "number_input" && (
                                                                <>
                                                                    <div className="w-32 space-y-1.5">
                                                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Min Bounds</label>
                                                                        <Input type="number" className="h-10" placeholder="0" value={sec.min_val ?? ""} onChange={e => updateSectionInfo(secIdx, { min_val: parseInt(e.target.value) || undefined })} />
                                                                    </div>
                                                                    <div className="w-32 space-y-1.5">
                                                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Max Bounds</label>
                                                                        <Input type="number" className="h-10" placeholder="∞" value={sec.max_val ?? ""} onChange={e => updateSectionInfo(secIdx, { max_val: parseInt(e.target.value) || undefined })} />
                                                                    </div>
                                                                    <div className="w-32 space-y-1.5 border-l border-slate-200 pl-4 ml-2">
                                                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Math: Multiplier</label>
                                                                        <Input type="number" step="0.01" className="h-10 font-bold text-[#136dec]" placeholder="₹0.0" value={sec.price_per_unit ?? ""} onChange={e => updateSectionInfo(secIdx, { price_per_unit: parseFloat(e.target.value) || undefined })} />
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>

                                                        {(sec.type === "dropdown" || sec.type === "radio") && (
                                                            <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                                                                <div className="flex items-center justify-between mb-4">
                                                                    <label className="text-sm font-bold text-slate-800 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> User Interactive Choice Nodes ({(sec.options || []).length})</label>
                                                                    <Button onClick={() => addOption(secIdx)} size="sm" variant="outline" className="h-8 text-xs font-bold bg-white shadow-sm border-slate-300">
                                                                        <Plus size={14} className="mr-1" /> Add Route Option
                                                                    </Button>
                                                                </div>

                                                                <div className="space-y-3">
                                                                    {(sec.options || []).map((opt, optIdx) => (
                                                                        <div key={optIdx} className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-sm focus-within:ring-2 ring-[#136dec]/20">
                                                                            <div className="flex-1 min-w-[200px]">
                                                                                <Input
                                                                                    className="h-9 text-sm font-semibold border-transparent hover:border-slate-200 bg-slate-50 focus:bg-white"
                                                                                    placeholder="Visual Label String"
                                                                                    value={opt.label}
                                                                                    onChange={e => updateOption(secIdx, optIdx, { label: e.target.value })}
                                                                                />
                                                                            </div>
                                                                            <div className="w-40 shrink-0">
                                                                                <Input
                                                                                    className="h-9 text-xs font-mono bg-slate-100 border-transparent hover:border-slate-200 text-slate-600 focus:bg-white focus:text-slate-900"
                                                                                    placeholder="node_value"
                                                                                    value={opt.value}
                                                                                    onChange={e => updateOption(secIdx, optIdx, { value: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                                                                                />
                                                                            </div>
                                                                            <div className="w-40 shrink-0 relative">
                                                                                <span className="absolute left-3 top-2 text-slate-400 font-bold text-sm">+₹</span>
                                                                                <Input
                                                                                    type="number"
                                                                                    step="0.01"
                                                                                    className="h-9 pl-9 text-sm font-bold bg-emerald-50 text-emerald-700 border-transparent hover:border-emerald-200 placeholder:text-emerald-300/50"
                                                                                    placeholder="0.00"
                                                                                    value={opt.price_mod}
                                                                                    onChange={e => updateOption(secIdx, optIdx, { price_mod: parseFloat(e.target.value) || 0 })}
                                                                                />
                                                                            </div>
                                                                            <button onClick={() => removeOption(secIdx, optIdx)} className="w-9 h-9 flex items-center justify-center shrink-0 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                                                <X size={16} strokeWidth={3} />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                    {(sec.options || []).length === 0 && (
                                                                        <div className="text-center py-4 bg-white rounded-lg border border-dashed border-red-300 text-red-500 text-xs font-semibold">
                                                                            Validation Error: System choices (Dropdown/Radio) block requires at least one Option node.
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
