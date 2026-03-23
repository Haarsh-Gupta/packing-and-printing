import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Edit2, Trash2, PlusCircle, Loader2, Save, Info, Plus, X, GripVertical, Settings2, UploadCloud } from "lucide-react";
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
        base_price: "0", minimum_quantity: "1", images: [] as string[],
        is_active: true, hsn_code: "", cgst_rate: "0", sgst_rate: "0"
    });
    const [newImageUrl, setNewImageUrl] = useState("");

    const addImage = () => {
        if (!newImageUrl.trim()) return;
        setFormState({ ...formState, images: [...formState.images, newImageUrl.trim()] });
        setNewImageUrl("");
    };

    const removeImage = (index: number) => {
        setFormState({ ...formState, images: formState.images.filter((_, i) => i !== index) });
    };
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
            base_price: "0", minimum_quantity: "1", images: [],
            is_active: true, hsn_code: "", cgst_rate: "0", sgst_rate: "0"
        });
        setConfigSections([]);
        setShowForm(true);
    };

    const openEdit = (sp: SubProduct) => {
        setEditingSubProduct(sp);
        setFormState({
            name: sp.name, slug: sp.slug, description: sp.description || "", type: sp.type || "product",
            base_price: String(sp.base_price), minimum_quantity: String(sp.minimum_quantity),
            images: sp.images || [],
            is_active: sp.is_active, hsn_code: sp.hsn_code || "", cgst_rate: String(sp.cgst_rate || 0), sgst_rate: String(sp.sgst_rate || 0)
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
                images: formState.images,
                is_active: formState.is_active,
                hsn_code: formState.hsn_code || undefined,
                cgst_rate: parseFloat(formState.cgst_rate) || 0,
                sgst_rate: parseFloat(formState.sgst_rate) || 0,
                config_schema: { sections: configSections }
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

    const typeColors = [
        "bg-[#1f70e3]/10 text-blue-600 dark:text-[#adc6ff] border-[#1f70e3]/20",
        "bg-[#34d399]/10 text-[#34d399] border-[#34d399]/20",
        "bg-[#8b5cf6]/10 text-[#c4b5fd] border-[#8b5cf6]/20",
        "bg-[#f59e0b]/10 text-[#fcd34d] border-[#f59e0b]/20"
    ];

    return (
        <div className="flex flex-col h-full font-['Inter'] bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] px-2">
            
            {/* Header */}
            <div className="flex items-end justify-between mb-8">
                <div>
                    <nav className="flex items-center gap-2 text-[10px] font-bold text-blue-600 dark:text-[#adc6ff] mb-2 tracking-widest uppercase">
                        <button onClick={() => navigate('/products')} className="hover:text-white transition-colors">Catalog</button>
                        <ChevronRight size={10} className="text-[#434655]" />
                        <span className="text-slate-600 dark:text-[#c3c5d8]/60">{product ? product.name : "Loading..."}</span>
                        <ChevronRight size={10} className="text-[#434655]" />
                        <span className="text-slate-600 dark:text-[#c3c5d8]/60">Variants</span>
                    </nav>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/products')} className="p-2 -ml-2 hover:bg-white dark:hover:bg-[#131b2e] rounded-lg transition-colors text-slate-600 dark:text-[#c3c5d8] hover:text-blue-600 dark:hover:text-[#adc6ff]">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-[#dae2fd] m-0">
                            {product ? product.name : "Variant Configurator"}
                        </h1>
                        <span className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/30 text-blue-600 dark:text-[#adc6ff] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm mt-1">
                            {subProducts.length} Variants
                        </span>
                    </div>
                </div>
                <button onClick={openCreate} className="h-10 px-5 bg-[#adc6ff] hover:bg-white text-[#001a42] font-extrabold text-[11px] uppercase tracking-widest rounded-lg flex items-center gap-2 transition-colors shadow-[0_4px_12px_rgba(173,198,255,0.2)]">
                    <PlusCircle size={16} />
                    <span>Create Variant</span>
                </button>
            </div>

            {/* Main Table */}
            <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100 dark:bg-[#0b1326]/50 text-slate-600 dark:text-[#c3c5d8] uppercase text-[10px] tracking-[0.2em] font-bold border-b border-slate-200 dark:border-[#434655]/20">
                                <th className="px-6 py-4 w-[35%]">Specific Variant</th>
                                <th className="px-6 py-4">Base Rate (₹)</th>
                                <th className="px-6 py-4">MOQ</th>
                                <th className="px-6 py-4">Classification</th>
                                <th className="px-6 py-4">Live Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#434655]/10">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-16 text-slate-600 dark:text-[#c3c5d8] font-bold tracking-widest text-[10px] uppercase"><Loader2 className="animate-spin inline mr-2" size={16} /> Syncing...</td></tr>
                            ) : subProducts.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-16 text-slate-600 dark:text-[#c3c5d8]/50 font-bold tracking-widest text-[10px] uppercase">No variant nodes deployed.</td></tr>
                            ) : subProducts.map((p, idx) => {
                                const typeColor = typeColors[idx % typeColors.length];
                                return (
                                    <tr key={p.id} className="group hover:bg-slate-50 dark:hover:bg-[#171f33]/80 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="flex -space-x-3 overflow-hidden rounded-lg relative">
                                                    {p.images && p.images.length > 0 ? p.images.slice(0, 3).map((img, i) => (
                                                        <img key={i} src={img} className="inline-block h-10 w-10 rounded-lg ring-2 ring-[#131b2e] object-cover bg-slate-50 dark:bg-[#0b1326]" />
                                                    )) : (
                                                        <div className="inline-block h-10 w-10 rounded-lg ring-2 ring-[#131b2e] bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 flex items-center justify-center font-bold text-[#434655] text-[9px]">IMG</div>
                                                    )}
                                                    {p.images && p.images.length > 3 && (
                                                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 ring-2 ring-[#131b2e] text-[9px] font-bold text-blue-600 dark:text-[#adc6ff] relative z-10">
                                                            +{p.images.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-extrabold text-slate-900 dark:text-[#dae2fd] text-sm leading-tight mb-1">{p.name}</div>
                                                    <div className="text-[11px] text-slate-600 dark:text-[#c3c5d8]/70 w-52 truncate" title={p.description || p.slug}>{p.description || p.slug}</div>
                                                    <div className="text-[9px] uppercase tracking-widest font-bold text-blue-600 dark:text-[#adc6ff] mt-1.5 flex items-center gap-1.5">
                                                        <Settings2 size={10} className="text-[#34d399]" /> {p.config_schema?.sections?.length || 0} Parametric Nodes
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 font-black text-slate-900 dark:text-[#dae2fd] font-mono text-sm">₹{p.base_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-5 font-mono text-blue-600 dark:text-[#adc6ff] text-xs font-bold">{p.minimum_quantity} U</td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2 py-1 text-[9px] font-bold rounded-sm uppercase tracking-widest border border-current/20 ${typeColor}`}>
                                                {p.type || "Product"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <Switch checked={p.is_active} onCheckedChange={(c) => handleToggleStatus(p, c)} className="data-[state=checked]:bg-[#34d399] scale-90" />
                                                <span className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-wider">{p.is_active ? 'Live' : 'Hidden'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(p)} className="text-slate-600 dark:text-[#c3c5d8] hover:text-blue-600 dark:hover:text-[#adc6ff] hover:bg-[#1f70e3]/20">
                                                    <Edit2 size={16} />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-slate-600 dark:text-[#c3c5d8] hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10">
                                                    <Trash2 size={16} />
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

            {/* Modal */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent showCloseButton={false} className="sm:max-w-[1200px] w-[95vw] h-[90vh] p-0 bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 shadow-2xl overflow-hidden font-['Inter'] flex flex-col">
                    
                    {/* Header Pinned */}
                    <div className="px-8 py-5 border-b border-slate-200 dark:border-[#434655]/20 bg-white dark:bg-[#131b2e] shrink-0 flex items-center justify-between z-20">
                        <div>
                            <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-[#dae2fd]">{editingSubProduct ? "Reconfigure Node" : "Deploy Variant Node"}</DialogTitle>
                            <DialogDescription className="text-xs mt-1 text-slate-600 dark:text-[#c3c5d8]">
                                Instance branch of <strong className="text-blue-600 dark:text-[#adc6ff]">{product?.name}</strong> containing pricing rules and I/O parameters.
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={() => setShowForm(false)} className="h-10 font-bold border-[#434655] hover:bg-[#434655]/20 text-xs uppercase tracking-widest text-slate-600 dark:text-[#c3c5d8]">Abort</Button>
                            <Button className="h-10 px-6 font-bold text-xs uppercase tracking-widest bg-[#adc6ff] hover:bg-white text-[#001a42]" onClick={handleSave} disabled={saving || !formState.name.trim() || !formState.base_price}>
                                {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                                {editingSubProduct ? "Synchronize" : "Deploy Live"}
                            </Button>
                        </div>
                    </div>

                    {/* Scrollable Editor */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50 dark:bg-[#0b1326]">
                        <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
                            
                            {/* CORE SETTINGS BLOCK */}
                            <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/20 rounded-2xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-[#1f70e3]"></div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="bg-[#1f70e3]/10 p-2 rounded-lg"><Settings2 size={20} className="text-blue-600 dark:text-[#adc6ff]" /></div>
                                    <h3 className="text-sm font-bold tracking-widest uppercase text-slate-900 dark:text-[#dae2fd]">Core Architecture</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest flex justify-between">
                                            <span>Variant Master Title <span className="text-[#ffb4ab] ml-0.5">*</span></span>
                                        </label>
                                        <Input className="h-10 bg-slate-50 dark:bg-[#0b1326] border-slate-200 dark:border-[#434655]/40 text-slate-900 dark:text-[#dae2fd] focus:border-blue-400 dark:border-[#adc6ff] text-sm font-bold placeholder:text-[#434655]" value={formState.name} onChange={e => setFormState({ ...formState, name: e.target.value })} placeholder="e.g. Leather Cover" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest flex items-center justify-between">
                                            <span>System Path (Slug)</span>
                                            <span className="text-[9px] bg-[#434655]/30 text-slate-500 dark:text-[#8d90a1] px-1.5 py-0.5 rounded">OPT</span>
                                        </label>
                                        <Input className="h-10 text-sm font-mono bg-slate-50 dark:bg-[#0b1326] border-slate-200 dark:border-[#434655]/40 text-blue-600 dark:text-[#adc6ff] focus:border-blue-400 dark:border-[#adc6ff] placeholder:text-[#434655]" value={formState.slug} onChange={e => setFormState({ ...formState, slug: e.target.value })} placeholder="leather-cover" />
                                    </div>
                                </div>

                                <div className="h-px bg-[#434655]/20 mb-6" />

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">
                                            Base Quote Rate (₹) <span className="text-[#ffb4ab]">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-[#434655] font-bold text-sm">₹</span>
                                            <Input type="number" step="0.01" className="h-10 pl-8 font-black text-slate-900 dark:text-[#dae2fd] bg-slate-50 dark:bg-[#0b1326] border-slate-200 dark:border-[#434655]/40 focus:border-blue-400 dark:border-[#adc6ff]" value={formState.base_price} onChange={e => setFormState({ ...formState, base_price: e.target.value })} placeholder="0.00" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">MOQ Gate</label>
                                        <Input type="number" className="h-10 text-sm font-mono bg-slate-50 dark:bg-[#0b1326] border-slate-200 dark:border-[#434655]/40 text-blue-600 dark:text-[#adc6ff]" value={formState.minimum_quantity} onChange={e => setFormState({ ...formState, minimum_quantity: e.target.value })} placeholder="100" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Node Tag</label>
                                        <Input className="h-10 text-sm font-bold tracking-widest uppercase bg-slate-50 dark:bg-[#0b1326] border-slate-200 dark:border-[#434655]/40 text-slate-600 dark:text-[#c3c5d8]" value={formState.type} onChange={e => setFormState({ ...formState, type: e.target.value })} placeholder="PRODUCT" />
                                    </div>
                                </div>
                                
                                {/* TAXATION BLOCK */}
                                <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/20 rounded-2xl p-6 relative overflow-hidden mb-6">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-[#8b5cf6]"></div>
                                    <h3 className="text-sm font-bold tracking-widest uppercase text-slate-900 dark:text-[#dae2fd] mb-6 flex items-center gap-2">Taxation & Compliance</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">HSN/SAC Code</label>
                                            <input type="text" className="h-10 w-full px-3 rounded-md text-sm font-mono bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/40 text-slate-900 dark:text-[#dae2fd] focus:border-blue-400 dark:border-[#adc6ff] outline-none" value={formState.hsn_code} onChange={e => setFormState({ ...formState, hsn_code: e.target.value })} placeholder="e.g. 4820" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">CGST Rate (%)</label>
                                            <input type="number" step="0.1" className="h-10 w-full px-3 rounded-md text-sm font-mono bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/40 text-slate-900 dark:text-[#dae2fd] focus:border-blue-400 dark:border-[#adc6ff] outline-none" value={formState.cgst_rate} onChange={e => setFormState({ ...formState, cgst_rate: e.target.value })} placeholder="9" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">SGST Rate (%)</label>
                                            <input type="number" step="0.1" className="h-10 w-full px-3 rounded-md text-sm font-mono bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/40 text-slate-900 dark:text-[#dae2fd] focus:border-blue-400 dark:border-[#adc6ff] outline-none" value={formState.sgst_rate} onChange={e => setFormState({ ...formState, sgst_rate: e.target.value })} placeholder="9" />
                                        </div>
                                    </div>
                                </div>

                                {/* IMAGES BLOCK */}
                                <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/20 rounded-2xl p-6 relative overflow-hidden mb-6">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-[#f59e0b]"></div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="bg-[#f59e0b]/10 p-2 rounded-lg"><UploadCloud size={20} className="text-[#fcd34d]" /></div>
                                        <div>
                                            <h3 className="text-sm font-bold tracking-widest uppercase text-slate-900 dark:text-[#dae2fd]">Images</h3>
                                            <p className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] mt-1 uppercase tracking-widest">{formState.images.length} images added</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            <Input className="h-10 text-sm font-mono bg-slate-50 dark:bg-[#0b1326] border-slate-200 dark:border-[#434655]/40 text-slate-500 dark:text-[#8d90a1] focus:border-blue-400 dark:border-[#adc6ff] placeholder:text-[#434655]" placeholder="Paste secure image URL (https://...)" value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImage() } }} />
                                            <Button type="button" onClick={addImage} className="h-10 px-6 font-bold text-[10px] uppercase tracking-widest bg-[#434655]/30 text-slate-600 dark:text-[#c3c5d8] hover:bg-[#434655]/50 hover:text-white border border-slate-200 dark:border-[#434655]/50 flex items-center gap-1.5"><Plus size={12}/>Add Image</Button>
                                        </div>
                                        {formState.images.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                                {formState.images.map((img, idx) => (
                                                    <div key={idx} className="group relative aspect-square rounded-xl bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 overflow-hidden shadow-sm hover:border-blue-400 dark:hover:border-[#adc6ff]/50 transition-colors">
                                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-slate-100 dark:bg-[#0b1326]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                            <Button type="button" variant="ghost" size="sm" onClick={() => removeImage(idx)} className="h-8 text-[10px] font-bold uppercase tracking-widest text-[#ffb4ab] hover:bg-[#ffb4ab]/20 hover:text-[#ffb4ab] border border-[#ffb4ab]/30">
                                                                <Trash2 size={12} className="mr-1.5" /> Remove
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-12 border border-dashed border-slate-200 dark:border-[#434655]/50 rounded-xl bg-slate-50 dark:bg-[#0b1326] flex flex-col items-center justify-center text-[#434655] mt-6">
                                                <UploadCloud size={32} className="mb-3" />
                                                <p className="font-bold text-[10px] uppercase tracking-widest">No images added</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2 mb-6">
                                    <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest flex items-center justify-between">
                                        <span>Full Description Narrative</span>
                                        <span className="text-[9px] bg-[#434655]/30 text-slate-500 dark:text-[#8d90a1] px-1.5 py-0.5 rounded">OPT</span>
                                    </label>
                                    <Textarea className="h-24 text-sm bg-slate-50 dark:bg-[#0b1326] border-slate-200 dark:border-[#434655]/40 text-slate-900 dark:text-[#dae2fd] focus:border-blue-400 dark:border-[#adc6ff] placeholder:text-[#434655]" value={formState.description} onChange={e => setFormState({ ...formState, description: e.target.value })} placeholder="Summary configuration text..." />
                                </div>

                                <div className="flex items-center justify-between border border-slate-200 dark:border-[#434655]/30 bg-slate-50 dark:bg-[#0b1326] p-4 rounded-xl">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-[#dae2fd] text-sm tracking-tight text-white mb-0.5">Authorize Transmission</p>
                                        <p className="text-[11px] text-slate-600 dark:text-[#c3c5d8]">Enable client rendering for this node configuration.</p>
                                    </div>
                                    <Switch checked={formState.is_active} onCheckedChange={c => setFormState({ ...formState, is_active: c })} className="data-[state=checked]:bg-[#34d399]" />
                                </div>
                            </div>

                            {/* DYNAMIC FORM BUILDER BLOCK */}
                            <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/20 rounded-2xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-[#f59e0b]"></div>
                                
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-sm font-bold tracking-widest uppercase text-slate-900 dark:text-[#dae2fd] flex items-center gap-3">
                                            Interactive UI Vector
                                            <span className="bg-[#f59e0b]/10 tracking-widest border border-[#f59e0b]/20 text-[#fcd34d] text-[9px] px-2 py-0.5 rounded-sm">{configSections.length} Nodes</span>
                                        </h3>
                                        <p className="text-xs text-slate-600 dark:text-[#c3c5d8] mt-1.5 font-medium">Inject form variables to dynamically mutate quote logic.</p>
                                    </div>
                                    <Button onClick={addSection} className="h-9 px-4 text-[10px] font-bold uppercase tracking-widest bg-transparent border border-blue-400 dark:border-[#adc6ff]/30 text-blue-600 dark:text-[#adc6ff] hover:bg-[#adc6ff] hover:text-[#001a42] transition-colors rounded-lg">
                                        <Plus size={14} className="mr-1.5" /> Attach Vector
                                    </Button>
                                </div>

                                {configSections.length === 0 ? (
                                    <div className="border border-dashed border-slate-200 dark:border-[#434655]/50 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-[#0b1326]">
                                        <GripVertical size={24} className="text-[#434655] mb-3" />
                                        <h4 className="text-sm font-bold tracking-widest uppercase text-slate-600 dark:text-[#c3c5d8]">Empty Vector Schema</h4>
                                        <p className="text-xs text-slate-500 dark:text-[#8d90a1] mt-2 max-w-sm">Attach selection objects like color arrays or string prompts to enable dynamic pricing variables.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {configSections.map((sec, secIdx) => (
                                            <div key={secIdx} className="border border-slate-200 dark:border-[#434655]/30 rounded-xl bg-slate-50 dark:bg-[#0b1326] overflow-hidden focus-within:border-[#fcd34d]/50 transition-colors">
                                                
                                                <div className="bg-slate-50 dark:bg-[#171f33] px-5 py-3 border-b border-slate-200 dark:border-[#434655]/30 flex items-center justify-between">
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <GripVertical size={16} className="text-[#434655] cursor-move" />
                                                        <Input
                                                            className="h-8 text-sm font-bold w-full max-w-sm bg-slate-50 dark:bg-[#0b1326] border-slate-200 dark:border-[#434655]/40 text-slate-900 dark:text-[#dae2fd] focus:border-blue-400 dark:border-[#adc6ff] placeholder:text-[#434655]"
                                                            value={sec.label}
                                                            onChange={e => {
                                                                const val = e.target.value;
                                                                updateSectionInfo(secIdx, { 
                                                                    label: val, 
                                                                    key: val.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "") 
                                                                });
                                                            }}
                                                            placeholder="Display Name (e.g. Size)"
                                                        />
                                                        <select
                                                            className="h-8 rounded-md border border-slate-200 dark:border-[#434655]/40 bg-slate-50 dark:bg-[#0b1326] px-3 text-xs font-bold text-slate-600 dark:text-[#c3c5d8] cursor-pointer outline-none focus:border-blue-400 dark:border-[#adc6ff] w-40"
                                                            value={sec.type}
                                                            onChange={e => updateSectionInfo(secIdx, { type: e.target.value as FormSection["type"] })}
                                                        >
                                                            <option value="dropdown">Dropdown [Array]</option>
                                                            <option value="radio">Radio [Bool/Enum]</option>
                                                            <option value="text_input">Text/String [Str]</option>
                                                            <option value="number_input">Numeric [Int]</option>
                                                        </select>
                                                    </div>
                                                    <Button variant="ghost" size="icon" onClick={() => removeSection(secIdx)} className="text-[#434655] hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 h-8 w-8 ml-2">
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>

                                                <div className="p-5">
                                                    <div className="flex items-center gap-4 mb-5">
                                                        <div className="flex-1 space-y-1.5">
                                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-[#c3c5d8]">Payload Key <span className="text-[#ffb4ab]">*</span></label>
                                                            <Input
                                                                className="h-8 text-[11px] font-mono bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/30 text-[#34d399] tracking-widest focus:border-blue-400 dark:border-[#adc6ff]"
                                                                value={sec.key}
                                                                onChange={e => updateSectionInfo(secIdx, { key: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                                                                placeholder="property_key"
                                                            />
                                                        </div>

                                                        {sec.type === "number_input" && (
                                                            <>
                                                                <div className="w-24 space-y-1.5">
                                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-[#c3c5d8]">Lower Bound</label>
                                                                    <Input type="number" className="h-8 bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/30 text-slate-900 dark:text-[#dae2fd] text-xs" placeholder="0" value={sec.min_val ?? ""} onChange={e => updateSectionInfo(secIdx, { min_val: parseInt(e.target.value) || undefined })} />
                                                                </div>
                                                                <div className="w-24 space-y-1.5">
                                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-[#c3c5d8]">Upper Bound</label>
                                                                    <Input type="number" className="h-8 bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/30 text-slate-900 dark:text-[#dae2fd] text-xs" placeholder="∞" value={sec.max_val ?? ""} onChange={e => updateSectionInfo(secIdx, { max_val: parseInt(e.target.value) || undefined })} />
                                                                </div>
                                                                <div className="w-32 space-y-1.5 border-l border-slate-200 dark:border-[#434655]/30 pl-4 ml-1">
                                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-[#adc6ff]">Unit Multiplier</label>
                                                                    <div className="relative">
                                                                        <span className="absolute left-2.5 top-2 text-[#434655] font-bold text-xs">₹</span>
                                                                        <Input type="number" step="0.01" className="h-8 pl-6 bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/30 text-[#fcd34d] text-xs font-bold" placeholder="0.0" value={sec.price_per_unit ?? ""} onChange={e => updateSectionInfo(secIdx, { price_per_unit: parseFloat(e.target.value) || undefined })} />
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                    {(sec.type === "dropdown" || sec.type === "radio") && (
                                                        <div className="bg-white dark:bg-[#131b2e] rounded-xl border border-slate-200 dark:border-[#434655]/20 p-4">
                                                            <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-[#434655]/20 pb-2">
                                                                <label className="text-[10px] uppercase tracking-widest font-bold text-[#fcd34d] flex items-center gap-2">Array Nodes ({(sec.options || []).length})</label>
                                                                <Button onClick={() => addOption(secIdx)} size="sm" variant="ghost" className="h-6 text-[9px] font-bold uppercase tracking-widest text-blue-600 dark:text-[#adc6ff] hover:bg-[#adc6ff]/10 border border-blue-400 dark:border-[#adc6ff]/20">
                                                                    <Plus size={10} className="mr-1" /> push node
                                                                </Button>
                                                            </div>

                                                            <div className="space-y-2">
                                                                {(sec.options || []).map((opt, optIdx) => (
                                                                    <div key={optIdx} className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 focus-within:border-blue-400 dark:border-[#adc6ff]/50">
                                                                        <div className="flex-1 min-w-[150px]">
                                                                            <Input
                                                                                className="h-7 text-xs font-bold bg-white dark:bg-[#131b2e] border-transparent text-slate-900 dark:text-[#dae2fd] focus:border-[#434655] placeholder:text-[#434655]"
                                                                                placeholder="Label String"
                                                                                value={opt.label}
                                                                                onChange={e => {
                                                                                    const val = e.target.value;
                                                                                    updateOption(secIdx, optIdx, { 
                                                                                        label: val, 
                                                                                        value: val.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "") 
                                                                                    });
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <div className="w-32 shrink-0">
                                                                            <Input
                                                                                className="h-7 text-[10px] font-mono bg-white dark:bg-[#131b2e] border-transparent text-slate-500 dark:text-[#8d90a1] focus:text-blue-600 dark:text-[#adc6ff] focus:border-[#434655] placeholder:text-[#434655]"
                                                                                placeholder="value_key"
                                                                                value={opt.value}
                                                                                onChange={e => updateOption(secIdx, optIdx, { value: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                                                                            />
                                                                        </div>
                                                                        <div className="w-28 shrink-0 relative">
                                                                            <span className="absolute left-2.5 top-1.5 text-[#34d399]/50 font-bold text-[10px]">+₹</span>
                                                                            <Input
                                                                                type="number" step="0.01"
                                                                                className="h-7 pl-7 text-xs font-bold bg-[#34d399]/5 border-transparent text-[#34d399] placeholder:text-[#34d399]/30 focus:border-[#34d399]/30"
                                                                                placeholder="0.00"
                                                                                value={opt.price_mod}
                                                                                onChange={e => updateOption(secIdx, optIdx, { price_mod: parseFloat(e.target.value) || 0 })}
                                                                            />
                                                                        </div>
                                                                        <button onClick={() => removeOption(secIdx, optIdx)} className="w-7 h-7 flex items-center justify-center shrink-0 rounded text-[#434655] hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-colors">
                                                                            <X size={14} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                {(sec.options || []).length === 0 && (
                                                                    <div className="text-center py-2 bg-[#ffb4ab]/5 rounded-lg border border-dashed border-[#ffb4ab]/20 text-[#ffb4ab] text-[10px] font-bold uppercase tracking-widest mt-2">
                                                                        System constraint: Array must contain &gt; 0 nodes.
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
                </DialogContent>
            </Dialog>
        </div>
    );
}
