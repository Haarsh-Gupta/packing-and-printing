import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, PlusCircle, Loader2, Save, Trash2, Edit2, Package, Info, UploadCloud } from "lucide-react";
import { api } from "@/lib/api";
import type { Service, SubService } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function SubServices() {
    const navigate = useNavigate();
    const { slug } = useParams();

    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [editingSubService, setEditingSubService] = useState<SubService | null>(null);
    const [saving, setSaving] = useState(false);

    const [formState, setFormState] = useState({
        name: "",
        slug: "",
        minimum_quantity: 10,
        price_per_unit: 100,
        description: "",
        images: [] as string[],
        is_active: true
    });
    const [newImageUrl, setNewImageUrl] = useState("");

    const fetchService = async () => {
        setLoading(true);
        try {
            // Using the public endpoint which cleanly loads the parent Service + all its nested variants
            const data = await api<Service>(`/services/${slug}`);
            setService(data);
        } catch (error) {
            console.error(error);
            navigate("/services");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchService();
    }, [slug]);

    const handleCreateNew = () => {
        setEditingSubService(null);
        setFormState({
            name: "",
            slug: "",
            minimum_quantity: 1,
            price_per_unit: 50,
            description: "",
            images: [],
            is_active: true
        });
        setShowForm(true);
    };

    const handleEdit = (sub: SubService) => {
        setEditingSubService(sub);
        setFormState({
            name: sub.name,
            slug: sub.slug,
            minimum_quantity: sub.minimum_quantity,
            price_per_unit: sub.price_per_unit,
            description: sub.description || "",
            images: sub.images || [],
            is_active: sub.is_active
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you totally sure you want to permanently delete this sub-service and its specific configurations?")) return;
        try {
            await api(`/admin/services/subservices/${id}`, { method: "DELETE" });
            fetchService();
        } catch (e: any) {
            alert("Failed to delete variant: " + e.message);
        }
    };

    const handleSave = async () => {
        if (!service) return;
        setSaving(true);
        const payload: any = {
            service_id: service.id,
            name: formState.name,
            minimum_quantity: Number(formState.minimum_quantity) || 1,
            price_per_unit: Number(formState.price_per_unit) || 0,
            is_active: formState.is_active,
            images: formState.images,
        };

        if (formState.slug) payload.slug = formState.slug;
        if (formState.description) payload.description = formState.description;

        try {
            if (editingSubService) {
                await api(`/admin/services/subservices/${editingSubService.id}`, {
                    method: "PATCH",
                    body: JSON.stringify(payload)
                });
            } else {
                await api(`/admin/services/${service.id}/subservices`, {
                    method: "POST",
                    body: JSON.stringify(payload)
                });
            }
            setShowForm(false);
            fetchService();
        } catch (e: any) {
            console.error("Save error:", e);
            alert("Failed to save: " + e.message);
        } finally {
            setSaving(false);
        }
    };

    const addImage = () => {
        if (!newImageUrl) return;
        setFormState(prev => ({ ...prev, images: [...prev.images, newImageUrl] }));
        setNewImageUrl("");
    };

    const removeImage = (index: number) => {
        setFormState(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    if (loading) {
        return <div className="p-12 text-center text-slate-500 font-medium font-['Inter',sans-serif] animate-pulse">Loading service configurations...</div>;
    }

    if (!service) return null;

    const variants = service.sub_services || [];
    const activeVariants = variants.filter(v => v.is_active).length;

    return (
        <div className="max-w-7xl mx-auto w-full animate-fade-in font-['Inter',sans-serif] pb-24">

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 mb-6 text-sm font-medium">
                <button onClick={() => navigate('/services')} className="text-slate-500 hover:text-[#136dec] transition-colors">Services Directory</button>
                <ChevronRight size={14} className="text-slate-400" />
                <span className="text-slate-900 dark:text-white font-bold tracking-tight">{service.name}</span>
            </div>

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-5">
                    <button onClick={() => navigate('/services')} className="p-3 bg-slate-50 hover:bg-[#136dec]/10 dark:bg-slate-800 rounded-xl transition-all text-slate-500 dark:text-slate-400 hover:text-[#136dec] border border-slate-200 dark:border-slate-700">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">{service.name} Variants</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 font-medium flex items-center gap-2">
                            <span className="bg-[#136dec]/10 text-[#136dec] px-2 py-0.5 rounded-md font-bold text-xs">ID: {service.id}</span>
                            Manage all localized sub-services connected to this parent category.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{variants.length} Built Variants</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{activeVariants} currently active online</p>
                    </div>
                    <button onClick={handleCreateNew} className="flex items-center justify-center gap-2 bg-[#136dec] hover:bg-[#136dec]/90 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-[#136dec]/20 active:scale-95 shrink-0">
                        <PlusCircle size={20} />
                        <span>Launch Variant</span>
                    </button>
                </div>
            </div>

            {/* Management Grid Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {variants.map((sub, i) => (
                    <div key={sub.id} className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 transition-all duration-300">
                        {/* Upper Info Box */}
                        <div className="p-6 pb-5 flex-1 relative z-10">
                            <div className="absolute top-4 right-4 flex gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-lg border border-slate-100 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(sub)} className="p-1.5 text-slate-400 hover:text-[#136dec] hover:bg-[#136dec]/10 rounded-md transition-all">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(sub.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="flex gap-4">
                                <div className="shrink-0">
                                    {sub.images && sub.images.length > 0 ? (
                                        <div className="size-16 rounded-xl bg-cover bg-center border border-slate-200 shadow-inner" style={{ backgroundImage: `url('${sub.images[0]}')` }} />
                                    ) : (
                                        <div className="size-16 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                                            <Package size={28} strokeWidth={1.5} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 pr-12">
                                    <h3 className="font-bold text-slate-900 dark:text-white truncate text-lg">{sub.name}</h3>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5 truncate bg-slate-50 dark:bg-slate-800/50 inline-block px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800">{sub.slug}</p>
                                </div>
                            </div>

                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 line-clamp-2 min-h-[40px] leading-relaxed">
                                {sub.description || <span className="italic text-slate-400">No descriptive brief provided.</span>}
                            </p>
                        </div>

                        {/* Status/Metrics Footer */}
                        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-4 px-6 flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="font-black text-slate-900 dark:text-white">₹{sub.price_per_unit.toLocaleString()} <span className="text-xs font-semibold text-slate-500">/unit</span></div>
                            </div>
                            <div className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${sub.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-200 text-slate-500 border-slate-300'} border`}>
                                {sub.is_active ? 'Live Sync' : 'Offline'}
                            </div>
                        </div>
                    </div>
                ))}

                {variants.length === 0 && (
                    <div className="col-span-full py-20 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center px-4">
                        <div className="size-16 bg-[#136dec]/10 text-[#136dec] rounded-2xl flex items-center justify-center mb-4">
                            <Package size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Empty Variant Matrix</h3>
                        <p className="text-slate-500 mt-2 max-w-sm">There are no specific sub-service configurations constructed inside the <strong className="text-slate-700 dark:text-slate-300">{service.name}</strong> namespace yet.</p>
                        <button onClick={handleCreateNew} className="mt-6 font-bold text-[#136dec] hover:text-[#136dec]/80 flex items-center gap-2">
                            Launch First Variant <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* ── SubService Dialog (Massive Form Layout) ── */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent showCloseButton={false} className="sm:max-w-[85vw] w-[95vw] h-[90vh] p-0 bg-transparent border-none shadow-none outline-none overflow-hidden font-['Inter',sans-serif]">
                    <div className="flex flex-col w-full h-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden relative">

                        {/* Header Pinned */}
                        <div className="px-6 md:px-8 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between z-20 gap-4">
                            <div className="flex-1 pr-4">
                                <DialogTitle className="text-2xl font-black">{editingSubService ? "Edit Sub-Service" : "Launch Sub-Service Variant"}</DialogTitle>
                                <DialogDescription className="text-sm mt-1.5 font-medium text-slate-500">
                                    Creates a specialized execution variant of <strong className="text-slate-700 dark:text-slate-300">{service.name}</strong>, detailing specific pricing mechanics and imagery.
                                </DialogDescription>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <Button variant="outline" onClick={() => setShowForm(false)} className="h-11 font-bold">Discard Changes</Button>
                                <Button className="h-11 px-8 font-bold bg-[#136dec] hover:bg-[#136dec]/90 text-white shadow-lg shadow-[#136dec]/20" onClick={handleSave} disabled={saving || !formState.name.trim() || !formState.price_per_unit}>
                                    {saving ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Save className="mr-2 h-5 w-5" />}
                                    {editingSubService ? "Synchronize Updates" : "Deploy Live Now"}
                                </Button>
                            </div>
                        </div>

                        {/* Scrollable Editor */}
                        <div className="flex-1 overflow-y-auto w-full p-4 md:p-8 bg-slate-50 dark:bg-slate-900/50">
                            <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto pb-16">

                                {/* CORE SETTINGS BLOCK */}
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-8 space-y-8 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#136dec]"></div>

                                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                                        <div className="size-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-[#136dec]">
                                            <Package strokeWidth={2.5} size={20} />
                                        </div>
                                        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Essential Architecture</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        <div className="space-y-2.5">
                                            <label className="text-sm font-black text-slate-700 dark:text-slate-300">Variant Master Title <span className="text-red-500">*</span></label>
                                            <Input className="h-12 text-base shadow-inner bg-slate-50 focus:bg-white transition-colors" value={formState.name} onChange={e => setFormState({ ...formState, name: e.target.value })} placeholder="e.g. Standard Softcover Binding" />
                                            <p className="text-xs text-slate-500 font-medium flex gap-1.5 items-start">
                                                <Info size={14} className="shrink-0 text-[#136dec] mt-0.5" />
                                                The absolute identifier title globally shown to the buyer.
                                            </p>
                                        </div>

                                        <div className="space-y-2.5">
                                            <label className="text-sm font-black text-slate-700 dark:text-slate-300 flex justify-between">
                                                <span>System Path (Slug)</span>
                                                <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Optional</span>
                                            </label>
                                            <Input className="h-12 text-base font-mono shadow-inner bg-slate-50 focus:bg-white transition-colors" value={formState.slug} onChange={e => setFormState({ ...formState, slug: e.target.value })} placeholder="standard-softcover-binding" />
                                            <p className="text-xs text-slate-500 font-medium flex gap-1.5 items-start">
                                                <Info size={14} className="shrink-0 mt-0.5" />
                                                Overrules standard URL generation. Useful for SEO links.
                                            </p>
                                        </div>

                                        <div className="space-y-2.5">
                                            <label className="text-sm font-black text-slate-700 dark:text-slate-300">Price Per Unit (₹) <span className="text-red-500">*</span></label>
                                            <Input type="number" step="0.01" className="h-12 text-lg font-bold shadow-inner bg-slate-50 focus:bg-white transition-colors" value={formState.price_per_unit} onChange={e => setFormState({ ...formState, price_per_unit: parseFloat(e.target.value) })} placeholder="150" />
                                        </div>

                                        <div className="space-y-2.5">
                                            <label className="text-sm font-black text-slate-700 dark:text-slate-300">Minimum Order Quantity (MOQ)</label>
                                            <Input type="number" className="h-12 text-base shadow-inner bg-slate-50 focus:bg-white transition-colors" value={formState.minimum_quantity} onChange={e => setFormState({ ...formState, minimum_quantity: parseInt(e.target.value) })} placeholder="100" />
                                        </div>
                                    </div>

                                    <div className="space-y-2.5 pt-2">
                                        <label className="text-sm font-black text-slate-700 dark:text-slate-300">Detailed Specification Paragraph</label>
                                        <Textarea className="min-h-[120px] text-base resize-y shadow-inner bg-slate-50 focus:bg-white transition-colors p-4" value={formState.description} onChange={e => setFormState({ ...formState, description: e.target.value })} placeholder="Elaborate on the specific physical tolerances, material capabilities, and turnaround estimates for this precise service variant..." />
                                    </div>

                                    <div className="flex items-center justify-between border-2 border-slate-100 dark:border-slate-800 p-5 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">Public Cloud Status {formState.is_active && <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span></span>}</p>
                                            <p className="text-sm font-medium text-slate-500 mt-0.5">Disabling will immediately yank this variant from all checkout quoting engines globally.</p>
                                        </div>
                                        <Switch checked={formState.is_active} onCheckedChange={c => setFormState({ ...formState, is_active: c })} className="data-[state=checked]:bg-green-500 scale-110" />
                                    </div>
                                </div>

                                {/* MEDIA CDN BLOCK */}
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-8 space-y-8 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400"></div>

                                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-amber-500">
                                                <UploadCloud strokeWidth={2.5} size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Media Matrix</h3>
                                                <p className="text-xs font-semibold text-slate-500 mt-1">{formState.images.length} resources loaded</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            <Input className="h-11 shadow-inner bg-slate-50 focus:bg-white transition-colors flex-1" placeholder="Paste secure image URL (https://...)" value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImage() } }} />
                                            <Button type="button" onClick={addImage} className="h-11 px-6 font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-md">Ingest Source</Button>
                                        </div>

                                        {formState.images.length > 0 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                                                {formState.images.map((img, idx) => (
                                                    <div key={idx} className="group relative aspect-square rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:border-[#136dec] transition-colors">
                                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                            <Button type="button" variant="destructive" size="sm" onClick={() => removeImage(idx)} className="h-8 font-bold shadow-xl">
                                                                <Trash2 size={14} className="mr-1.5" /> Wipe
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-slate-400 mt-6">
                                                <UploadCloud size={40} className="mb-3 opacity-50" />
                                                <p className="font-semibold text-sm">No media resources attached</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
