import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronRight, Edit2, Trash2, Loader2, Save, Info } from "lucide-react";
import { api } from "@/lib/api";
import type { Product } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function Products() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formState, setFormState] = useState({ name: "", description: "", cover_image: "", is_active: true, slug: "" });
    const [saving, setSaving] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await api<Product[]>("/admin/products/");
            setProducts(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const openCreate = () => {
        setEditingProduct(null);
        setFormState({ name: "", description: "", cover_image: "", is_active: true, slug: "" });
        setShowForm(true);
    };

    const openEdit = (e: React.MouseEvent, p: Product) => {
        e.stopPropagation();
        setEditingProduct(p);
        setFormState({
            name: p.name,
            description: p.description || "",
            cover_image: p.cover_image || "",
            is_active: p.is_active,
            slug: p.slug
        });
        setShowForm(true);
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm("Permanently delete this product category and all its sub-products?")) return;
        try {
            await api(`/admin/products/${id}`, { method: "DELETE" });
            fetchProducts();
        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const payload = { ...formState };
        if (!payload.slug) delete (payload as any).slug;
        if (!payload.description) delete (payload as any).description;
        if (!payload.cover_image) delete (payload as any).cover_image;

        try {
            if (editingProduct) {
                await api(`/admin/products/${editingProduct.id}`, {
                    method: "PATCH",
                    body: JSON.stringify(payload)
                });
            } else {
                await api("/admin/products/", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });
            }
            setShowForm(false);
            fetchProducts();
        } catch (e: any) {
            console.error(e);
            alert(e.message || "Failed to save product.");
        } finally {
            setSaving(false);
        }
    };

    const activeSubProductsCount = products.reduce((acc, p) => acc + (p.sub_products?.filter(sp => sp.is_active)?.length || 0), 0);
    const catColors = [
        "bg-[#1f70e3]/10 text-[#adc6ff] border-[#1f70e3]/20",
        "bg-[#34d399]/10 text-[#34d399] border-[#34d399]/20",
        "bg-[#8b5cf6]/10 text-[#c4b5fd] border-[#8b5cf6]/20",
        "bg-[#f59e0b]/10 text-[#fcd34d] border-[#f59e0b]/20",
        "bg-[#06b6d4]/10 text-[#67e8f9] border-[#06b6d4]/20"
    ];

    return (
        <div className="flex flex-col h-full font-['Inter'] bg-[#0b1326] text-[#dae2fd] px-2">
            
            {/* Header */}
            <div className="flex items-end justify-between mb-8">
                <div>
                    <nav className="flex items-center gap-2 text-[10px] font-bold text-[#adc6ff] mb-2 tracking-widest uppercase">
                        <span>Catalog</span>
                        <span>/</span>
                        <span className="text-[#c3c5d8]/60">Taxonomy</span>
                    </nav>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#dae2fd] m-0">
                        Top Hierarchy
                    </h1>
                    <p className="text-xs text-[#c3c5d8] mt-1 m-0">
                        {products.length} parent classes governing active catalog
                    </p>
                </div>
                <button onClick={openCreate} className="h-10 px-5 bg-[#adc6ff] hover:bg-white text-[#001a42] font-extrabold text-[11px] uppercase tracking-widest rounded-lg flex items-center gap-2 transition-colors shadow-[0_4px_12px_rgba(173,198,255,0.2)]">
                    <Plus size={16} />
                    Define Class
                </button>
            </div>

            {/* Stats Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 bg-[#131b2e] rounded-2xl border border-[#434655]/20 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-[#c3c5d8] uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#434655] rounded-full"></span> Root Taxonomy
                    </p>
                    <p className="text-3xl font-black text-[#dae2fd]">{products.length}</p>
                </div>
                <div className="p-6 bg-[#131b2e] rounded-2xl border border-[#434655]/20 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-[#c3c5d8] uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#434655] rounded-full"></span> Active Leaves
                    </p>
                    <p className="text-3xl font-black text-[#dae2fd]">{activeSubProductsCount}</p>
                </div>
                <div className="p-6 bg-[#131b2e] rounded-2xl border border-[#434655]/20 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#34d399]/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <p className="text-[10px] font-bold text-[#c3c5d8] uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#434655] rounded-full"></span> Matrix Status
                    </p>
                    <p className="text-2xl font-bold text-[#34d399] flex items-center gap-2 relative z-10">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34d399] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34d399]"></span>
                        </span>
                        Synchronized
                    </p>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-[#131b2e] rounded-2xl border border-[#434655]/20 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#060e20]/50 text-[#c3c5d8] uppercase text-[10px] tracking-[0.2em] font-bold border-b border-[#434655]/20">
                                <th className="px-6 py-4 w-24">Cover</th>
                                <th className="px-6 py-4">Hierarchy Name</th>
                                <th className="px-6 py-4">Slug Index</th>
                                <th className="px-6 py-4">Lifecycle</th>
                                <th className="px-6 py-4">Descendants</th>
                                <th className="px-6 py-4 text-right">Mutate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#434655]/10">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-16 text-[#c3c5d8] font-bold tracking-widest text-[10px] uppercase"><Loader2 className="animate-spin inline mr-2" size={16} /> Connecting...</td></tr>
                            ) : products.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-16 text-[#c3c5d8]/50 font-bold tracking-widest text-[10px] uppercase">Catalog empty.</td></tr>
                            ) : products.map((product, idx) => (
                                <tr key={product.id} onClick={() => navigate(`/products/${product.slug}`)} className="group cursor-pointer hover:bg-[#171f33]/80 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="size-14 rounded-xl bg-[#0b1326] border border-[#434655]/30 flex items-center justify-center overflow-hidden relative">
                                            {product.cover_image ? (
                                                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${product.cover_image}')` }}></div>
                                            ) : (
                                                <span className="text-[10px] text-[#434655] font-bold uppercase tracking-wider">NULL</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="font-extrabold text-[#dae2fd] text-base mb-1">{product.name}</div>
                                        {product.description && <div className="text-xs text-[#c3c5d8]/70 truncate max-w-[250px]">{product.description}</div>}
                                    </td>
                                    <td className="px-6 py-5">
                                        <code className="text-[11px] font-mono font-bold text-[#adc6ff] bg-[#adc6ff]/10 px-2 py-1 rounded border border-[#adc6ff]/20">{product.slug}</code>
                                    </td>
                                    <td className="px-6 py-5 text-sm">
                                        <span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest border ${product.is_active ? catColors[idx % catColors.length] : 'bg-[#434655]/10 text-[#8d90a1] border-[#434655]/20'}`}>
                                            {product.is_active ? "Live" : "Archived"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-[13px] font-bold text-[#c3c5d8]">
                                        <span className="text-[#dae2fd] bg-[#434655]/20 px-2.5 py-1 text-xs rounded-md shadow-inner">{product.sub_products?.length || 0}</span> attached
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="inline-flex items-center gap-1.5">
                                            <button onClick={(e) => openEdit(e, product)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-[#1f70e3]/20 rounded-lg transition-all text-[#c3c5d8] hover:text-[#adc6ff]">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={(e) => handleDelete(e, product.id)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-[#ffb4ab]/10 rounded-lg transition-all text-[#c3c5d8] hover:text-[#ffb4ab]">
                                                <Trash2 size={16} />
                                            </button>
                                            <button className="p-2 text-[#434655] group-hover:text-[#c3c5d8] transition-colors">
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-2xl bg-[#0b1326] border border-[#434655]/30 text-[#dae2fd] shadow-2xl p-0 overflow-hidden font-['Inter']">
                    <DialogHeader className="px-8 py-6 border-b border-[#434655]/20 bg-[#131b2e]">
                        <DialogTitle className="text-xl font-extrabold tracking-tight text-[#dae2fd]">
                            {editingProduct ? "Reconfigure Class" : "Initialize Class"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[#c3c5d8] mt-1 font-medium">
                            Set up the structural container capable of hosting multi-variant product leaves.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-8 py-6 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-[#c3c5d8] uppercase tracking-widest flex items-center gap-1.5">
                                    Nomenclature <span className="text-[#ffb4ab] text-sm leading-none">*</span>
                                </label>
                                <Input className="h-10 text-sm font-bold bg-[#131b2e] border-[#434655]/40 text-[#dae2fd] focus:border-[#adc6ff] placeholder:text-[#434655]" value={formState.name} onChange={e => setFormState({ ...formState, name: e.target.value })} placeholder="e.g. Rigid Boxes" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-[#c3c5d8] uppercase tracking-widest flex items-center justify-between">
                                    <span>Routing Slug</span>
                                    <span className="text-[9px] bg-[#434655]/30 text-[#8d90a1] px-1.5 py-0.5 rounded">AUTO</span>
                                </label>
                                <Input className="h-10 text-sm font-mono text-[#adc6ff] bg-[#131b2e] border-[#434655]/40 focus:border-[#adc6ff] placeholder:text-[#434655]" value={formState.slug} onChange={e => setFormState({ ...formState, slug: e.target.value })} placeholder="rigid-boxes" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[#c3c5d8] uppercase tracking-widest flex items-center justify-between">
                                <span>Topology Description</span>
                                <span className="text-[9px] bg-[#434655]/30 text-[#8d90a1] px-1.5 py-0.5 rounded">OPT</span>
                            </label>
                            <Textarea className="resize-none min-h-[80px] text-sm bg-[#131b2e] border-[#434655]/40 text-[#dae2fd] focus:border-[#adc6ff] placeholder:text-[#434655]" value={formState.description} onChange={e => setFormState({ ...formState, description: e.target.value })} placeholder="Short paragraph summarizing the family..." />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[#c3c5d8] uppercase tracking-widest flex items-center justify-between">
                                <span>Hero Graphic URL</span>
                                <span className="text-[9px] bg-[#434655]/30 text-[#8d90a1] px-1.5 py-0.5 rounded">OPT</span>
                            </label>
                            <Input className="h-10 text-sm font-mono text-[#c3c5d8] bg-[#131b2e] border-[#434655]/40 focus:border-[#adc6ff] placeholder:text-[#434655]" value={formState.cover_image} onChange={e => setFormState({ ...formState, cover_image: e.target.value })} placeholder="https://..." />
                        </div>

                        <div className="flex items-center justify-between border border-[#434655]/30 p-4 rounded-xl bg-[#131b2e]">
                            <div>
                                <p className="font-bold text-[#dae2fd] text-sm">Operational State</p>
                                <p className="text-xs text-[#c3c5d8]/70 mt-0.5">Toggle visibility on the external gateway.</p>
                            </div>
                            <Switch checked={formState.is_active} onCheckedChange={c => setFormState({ ...formState, is_active: c })} className="data-[state=checked]:bg-[#34d399]" />
                        </div>
                    </div>

                    <DialogFooter className="px-8 py-5 border-t border-[#434655]/20 bg-[#131b2e]">
                        <DialogClose asChild>
                            <Button variant="outline" className="h-10 px-6 font-bold text-xs uppercase tracking-widest bg-transparent border-[#434655] hover:bg-[#434655]/20 text-[#c3c5d8]">Abort</Button>
                        </DialogClose>
                        <Button className="h-10 px-8 font-bold text-xs uppercase tracking-widest bg-[#adc6ff] hover:bg-white text-[#001a42]" onClick={handleSave} disabled={saving || !formState.name.trim()}>
                            {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                            Write
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
