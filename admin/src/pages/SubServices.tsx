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
import ImageCropper from "@/components/ImageCropper";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

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
        is_active: true,
        hsn_code: "",
        cgst_rate: "0",
        sgst_rate: "0"
    });
    const [newImageUrl, setNewImageUrl] = useState("");

    // Cropper State
    const [croppingImage, setCroppingImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setCroppingImage(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleCropComplete = async (blob: Blob) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", blob, "subservice.jpg");
            
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/uploads/?purpose=product`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
                body: formData
            });
            
            if (!response.ok) throw new Error("Upload failed");
            const data = await response.json();
            setFormState(prev => ({ ...prev, images: [...prev.images, data.url] }));
            setCroppingImage(null);
        } catch (e) {
            console.error(e);
            alert("Error uploading image");
        } finally {
            setUploading(false);
        }
    };

    const fetchService = async () => {
        setLoading(true);
        try {
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
            is_active: true,
            hsn_code: "",
            cgst_rate: "0",
            sgst_rate: "0"
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
            is_active: sub.is_active,
            hsn_code: sub.hsn_code || "",
            cgst_rate: String(sub.cgst_rate || 0),
            sgst_rate: String(sub.sgst_rate || 0)
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
        try {
            let payload: any = {};

            if (editingSubService) {
                // Delta Calculation
                if (formState.name !== editingSubService.name) payload.name = formState.name;
                if (formState.description !== (editingSubService.description || "")) payload.description = formState.description;
                
                const mq = Number(formState.minimum_quantity) || 1;
                if (mq !== editingSubService.minimum_quantity) payload.minimum_quantity = mq;
                
                const ppu = Number(formState.price_per_unit) || 0;
                if (ppu !== editingSubService.price_per_unit) payload.price_per_unit = ppu;
                
                if (formState.is_active !== editingSubService.is_active) payload.is_active = formState.is_active;
                
                if (JSON.stringify(formState.images) !== JSON.stringify(editingSubService.images || [])) {
                    payload.images = formState.images;
                }
                
                if (formState.hsn_code !== (editingSubService.hsn_code || "")) payload.hsn_code = formState.hsn_code;
                
                const cgst = parseFloat(formState.cgst_rate) || 0;
                if (cgst !== (editingSubService.cgst_rate || 0)) payload.cgst_rate = cgst;
                
                const sgst = parseFloat(formState.sgst_rate) || 0;
                if (sgst !== (editingSubService.sgst_rate || 0)) payload.sgst_rate = sgst;
                
                if (formState.slug !== editingSubService.slug) payload.slug = formState.slug;

                if (Object.keys(payload).length === 0) {
                    setShowForm(false);
                    setSaving(false);
                    return;
                }
            } else {
                // Full payload for creation
                payload = {
                    service_id: service.id,
                    name: formState.name,
                    minimum_quantity: Number(formState.minimum_quantity) || 1,
                    price_per_unit: Number(formState.price_per_unit) || 0,
                    is_active: formState.is_active,
                    images: formState.images,
                    hsn_code: formState.hsn_code || undefined,
                    cgst_rate: parseFloat(formState.cgst_rate) || 0,
                    sgst_rate: parseFloat(formState.sgst_rate) || 0,
                };

                if (formState.slug) payload.slug = formState.slug;
                if (formState.description) payload.description = formState.description;
            }

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
        return <div className="p-12 text-center text-slate-600 dark:text-[#c3c5d8] font-bold tracking-widest text-[10px] uppercase font-['Inter'] animate-pulse"><Loader2 className="animate-spin inline mr-2" size={16} /> Loading sub-services...</div>;
    }

    if (!service) return null;

    const variants = service.sub_services || [];
    const activeVariants = variants.filter(v => v.is_active).length;

    return (
        <div className="flex flex-col h-full font-['Inter'] bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] px-2 pb-24">

            {/* Breadcrumbs & Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                    <nav className="flex items-center gap-2 text-[10px] font-bold text-blue-600 dark:text-[#adc6ff] mb-2 tracking-widest uppercase">
                        <button onClick={() => navigate('/services')} className="hover:text-white transition-colors">Services Directory</button>
                        <ChevronRight size={10} className="text-[#434655]" />
                        <span className="text-slate-600 dark:text-[#c3c5d8]/60">{service.name}</span>
                        <ChevronRight size={10} className="text-[#434655]" />
                        <span className="text-slate-600 dark:text-[#c3c5d8]/60">Variants</span>
                    </nav>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/services')} className="p-2 -ml-2 hover:bg-white dark:hover:bg-[#131b2e] rounded-lg transition-colors text-slate-600 dark:text-[#c3c5d8] hover:text-blue-600 dark:hover:text-[#adc6ff]">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-[#dae2fd] m-0">
                            {service.name}
                        </h1>
                        <span className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/30 text-blue-600 dark:text-[#adc6ff] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm mt-1">
                            ID: {service.id}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block mr-2">
                        <p className="text-[11px] font-extrabold text-slate-900 dark:text-[#dae2fd] uppercase tracking-widest">{variants.length} Sub-Services</p>
                        <p className="text-[10px] text-[#34d399] font-bold mt-0.5">{activeVariants} Live</p>
                    </div>
                    <button onClick={handleCreateNew} className="h-10 px-5 bg-[#adc6ff] hover:bg-white text-[#001a42] font-extrabold text-[11px] uppercase tracking-widest rounded-lg flex items-center gap-2 transition-colors shadow-[0_4px_12px_rgba(173,198,255,0.2)]">
                        <PlusCircle size={16} />
                        <span>Add Sub-Service</span>
                    </button>
                </div>
            </div>

            {/* Management Grid Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {variants.map((sub, i) => (
                    <div key={sub.id} className="group flex flex-col bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 overflow-hidden hover:border-blue-400 dark:hover:border-[#adc6ff]/50 transition-all duration-300">
                        {/* Upper Info Box */}
                        <div className="p-6 pb-5 flex-1 relative z-10">
                            <div className="absolute top-4 right-4 flex gap-1 bg-white dark:bg-[#131b2e]/90 backdrop-blur-sm p-1 rounded-lg border border-slate-200 dark:border-[#434655]/40 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(sub)} className="p-1.5 text-slate-600 dark:text-[#c3c5d8] hover:text-blue-600 dark:hover:text-[#adc6ff] hover:bg-[#1f70e3]/20 rounded-md transition-all">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(sub.id)} className="p-1.5 text-slate-600 dark:text-[#c3c5d8] hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 rounded-md transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="flex gap-4">
                                <div className="shrink-0">
                                    {sub.images && sub.images.length > 0 ? (
                                        <div className="size-16 rounded-xl bg-cover bg-center border border-slate-200 dark:border-[#434655]/30 shadow-inner" style={{ backgroundImage: `url('${sub.images[0]}')` }} />
                                    ) : (
                                        <div className="size-16 rounded-xl bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 flex items-center justify-center text-[#434655]">
                                            <Package size={28} strokeWidth={1.5} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 pr-12">
                                    <h3 className="font-extrabold text-slate-900 dark:text-[#dae2fd] truncate text-lg">{sub.name}</h3>
                                    <p className="text-[10px] text-blue-600 dark:text-[#adc6ff] font-mono font-bold mt-1 truncate bg-[#adc6ff]/10 inline-block px-1.5 py-0.5 rounded border border-blue-400 dark:border-[#adc6ff]/20">{sub.slug}</p>
                                </div>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-[#c3c5d8]/70 mt-4 line-clamp-2 min-h-[40px] leading-relaxed">
                                {sub.description || <span className="italic text-[#434655]">No descriptive brief provided.</span>}
                            </p>
                        </div>

                        {/* Status/Metrics Footer */}
                        <div className="border-t border-slate-200 dark:border-[#434655]/20 bg-slate-50 dark:bg-[#0b1326] p-4 px-6 flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="font-black text-[#fcd34d] font-mono">₹{sub.price_per_unit.toLocaleString()} <span className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest font-['Inter']">/unit</span></div>
                            </div>
                            <div className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded-sm border ${sub.is_active ? 'bg-[#34d399]/10 text-[#34d399] border-[#34d399]/20' : 'bg-[#434655]/10 text-slate-500 dark:text-[#8d90a1] border-slate-200 dark:border-[#434655]/20'}`}>
                                {sub.is_active ? 'Live' : 'Disabled'}
                            </div>
                        </div>
                    </div>
                ))}

                {variants.length === 0 && (
                    <div className="col-span-full py-20 bg-white dark:bg-[#131b2e] rounded-2xl border border-dashed border-slate-200 dark:border-[#434655]/40 flex flex-col items-center justify-center text-center px-4">
                        <div className="size-16 bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 text-[#434655] rounded-2xl flex items-center justify-center mb-4">
                            <Package size={32} />
                        </div>
                        <h3 className="text-sm font-bold tracking-widest uppercase text-slate-600 dark:text-[#c3c5d8]">No Sub-Services Added</h3>
                        <p className="text-xs text-slate-500 dark:text-[#8d90a1] mt-2 max-w-sm">There are no specific sub-service configurations constructed inside the <strong className="text-blue-600 dark:text-[#adc6ff]">{service.name}</strong> namespace yet.</p>
                        <button onClick={handleCreateNew} className="mt-6 text-[11px] font-bold tracking-widest uppercase text-blue-600 dark:text-[#adc6ff] hover:text-slate-900 dark:hover:text-[#dae2fd] flex items-center gap-2 transition-colors">
                            Add First Sub-Service <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent showCloseButton={false} className="sm:max-w-[1200px] w-[95vw] h-[90vh] p-0 bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 shadow-2xl overflow-hidden font-['Inter'] flex flex-col">
                    
                    {/* Header Pinned */}
                    <div className="px-8 py-5 border-b border-slate-200 dark:border-[#434655]/20 bg-white dark:bg-[#131b2e] shrink-0 flex items-center justify-between z-20">
                        <div>
                            <DialogTitle className="text-xl font-extrabold text-slate-900 dark:text-[#dae2fd]">{editingSubService ? "Edit Sub-Service" : "Add Sub-Service"}</DialogTitle>
                            <DialogDescription className="text-xs mt-1 text-slate-600 dark:text-[#c3c5d8]">
                                Instance branch of <strong className="text-blue-600 dark:text-[#adc6ff]">{service.name}</strong> detailing pricing mechanics and images.
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={() => setShowForm(false)} className="h-10 font-bold border-[#434655] hover:bg-[#434655]/20 text-xs uppercase tracking-widest text-slate-600 dark:text-[#c3c5d8]">Cancel</Button>
                            <Button className="h-10 px-6 font-bold text-xs uppercase tracking-widest bg-[#adc6ff] hover:bg-white text-[#001a42]" onClick={handleSave} disabled={saving || !formState.name.trim() || !formState.price_per_unit}>
                                {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                                {editingSubService ? "Synchronize" : "Deploy Live"}
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
                                    <div className="bg-[#1f70e3]/10 p-2 rounded-lg"><Package size={20} className="text-blue-600 dark:text-[#adc6ff]" /></div>
                                    <h3 className="text-sm font-bold tracking-widest uppercase text-slate-900 dark:text-[#dae2fd]">Basic Details</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest flex justify-between">
                                            <span>Sub-Service Name <span className="text-[#ffb4ab] ml-0.5">*</span></span>
                                        </label>
                                        <Input className="h-10 bg-slate-50 dark:bg-[#0b1326] border-slate-200 dark:border-[#434655]/40 text-slate-900 dark:text-[#dae2fd] focus:border-blue-400 dark:border-[#adc6ff] text-sm font-bold placeholder:text-[#434655]" value={formState.name} onChange={e => setFormState({ ...formState, name: e.target.value })} placeholder="e.g. Standard Softcover Binding" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest flex justify-between">
                                            <span>URL Slug</span>
                                            <span className="text-[9px] bg-[#434655]/30 text-slate-500 dark:text-[#8d90a1] px-1.5 py-0.5 rounded">OPT</span>
                                        </label>
                                        <Input className="h-10 text-sm font-mono bg-slate-50 dark:bg-[#0b1326] border-slate-200 dark:border-[#434655]/40 text-blue-600 dark:text-[#adc6ff] focus:border-blue-400 dark:border-[#adc6ff] placeholder:text-[#434655]" value={formState.slug} onChange={e => setFormState({ ...formState, slug: e.target.value })} placeholder="standard-softcover" />
                                    </div>
                                </div>

                                <div className="h-px bg-[#434655]/20 mb-6" />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">
                                            Price Per Unit (₹) <span className="text-[#ffb4ab]">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-[#434655] font-bold text-sm">₹</span>
                                            <Input type="number" step="0.01" className="h-10 pl-8 font-black text-[#fcd34d] bg-slate-50 dark:bg-[#0b1326] border-slate-200 dark:border-[#434655]/40 focus:border-blue-400 dark:border-[#adc6ff]" value={formState.price_per_unit} onChange={e => setFormState({ ...formState, price_per_unit: parseFloat(e.target.value) })} placeholder="150.00" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Minimum Quantity</label>
                                        <Input type="number" className="h-10 text-sm font-mono bg-slate-50 dark:bg-[#0b1326] border-slate-200 dark:border-[#434655]/40 text-blue-600 dark:text-[#adc6ff]" value={formState.minimum_quantity} onChange={e => setFormState({ ...formState, minimum_quantity: parseInt(e.target.value) })} placeholder="100" />
                                    </div>
                                </div>

                                <div className="space-y-2 mb-6">
                                    <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">Description</label>
                                    <div className="bg-white text-black min-h-[200px] border border-slate-200 dark:border-[#434655]/40 rounded-md overflow-hidden">
                                        <ReactQuill theme="snow" value={formState.description} onChange={val => setFormState({ ...formState, description: val })} placeholder="Elaborate on the specific physical tolerances, material capabilities, and included services..." className="h-[150px] border-none" />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border border-slate-200 dark:border-[#434655]/30 bg-slate-50 dark:bg-[#0b1326] p-4 rounded-xl">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-[#dae2fd] text-sm tracking-tight mb-0.5 flex items-center gap-2">Status {formState.is_active && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34d399] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[#34d399]"></span></span>}</p>
                                        <p className="text-[11px] text-slate-600 dark:text-[#c3c5d8]">Make this sub-service visible.</p>
                                    </div>
                                    <Switch checked={formState.is_active} onCheckedChange={c => setFormState({ ...formState, is_active: c })} className="data-[state=checked]:bg-[#34d399]" />
                                </div>
                            </div>

                            {/* TAXATION BLOCK */}
                            <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/20 rounded-2xl p-6 relative overflow-hidden mb-6">
                                <div className="absolute top-0 left-0 w-1 h-full bg-[#8b5cf6]"></div>
                                <h3 className="text-sm font-bold tracking-widest uppercase text-slate-900 dark:text-[#dae2fd] mb-6 flex items-center gap-2">Taxation & Compliance</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest">HSN/SAC Code</label>
                                        <input type="text" className="h-10 w-full px-3 rounded-md text-sm font-mono bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/40 text-slate-900 dark:text-[#dae2fd] focus:border-blue-400 dark:border-[#adc6ff] outline-none" value={formState.hsn_code} onChange={e => setFormState({ ...formState, hsn_code: e.target.value })} placeholder="e.g. 9989" />
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
                            <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/20 rounded-2xl p-6 relative overflow-hidden">
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
                                        <Button type="button" onClick={addImage} className="h-10 px-6 font-bold text-[10px] uppercase tracking-widest bg-[#434655]/30 text-slate-600 dark:text-[#c3c5d8] hover:bg-[#434655]/50 hover:text-white border border-slate-200 dark:border-[#434655]/50 flex items-center gap-1.5"><PlusCircle size={14} className="mr-1.5" />Link Image</Button>
                                        
                                        <label className="h-10 px-6 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 rounded-lg flex items-center justify-center cursor-pointer transition-colors group">
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                                            <div className="flex items-center gap-2">
                                                {uploading ? (
                                                    <div className="animate-spin h-3 w-3 border-2 border-blue-400 border-t-transparent rounded-full" />
                                                ) : (
                                                    <UploadCloud size={14} className="text-blue-600" />
                                                )}
                                                <span className="text-[10px] font-black uppercase tracking-widest text-[#adc6ff] group-hover:text-white transition-colors">Frame & Add</span>
                                            </div>
                                        </label>
                                    </div>

                                    {croppingImage && (
                                        <ImageCropper 
                                            image={croppingImage} 
                                            onCropComplete={handleCropComplete} 
                                            onCancel={() => setCroppingImage(null)} 
                                            aspect={1}
                                        />
                                    )}

                                    {formState.images.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                            {formState.images.map((img, idx) => (
                                                <div key={idx} className="group relative aspect-square rounded-xl bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 overflow-hidden shadow-sm hover:border-blue-400 dark:hover:border-[#adc6ff]/50 transition-colors">
                                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-slate-100 dark:bg-[#0b1326]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                        <Button type="button" variant="ghost" size="sm" onClick={() => removeImage(idx)} className="h-8 text-[10px] font-bold uppercase tracking-widest text-[#ffb4ab] hover:bg-[#ffb4ab]/20 hover:text-[#ffb4ab] border border-[#ffb4ab]/30">
                                                            <Trash2 size={12} className="mr-1.5" /> Wipe
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-12 border border-dashed border-slate-200 dark:border-[#434655]/50 rounded-xl bg-slate-50 dark:bg-[#0b1326] flex flex-col items-center justify-center text-[#434655] mt-6">
                                            <UploadCloud size={32} className="mb-3" />
                                            <p className="font-bold text-[10px] uppercase tracking-widest">No media resources attached</p>
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
