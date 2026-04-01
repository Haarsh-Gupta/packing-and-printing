import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronRight, Edit2, Trash2, Loader2, Save, Info } from "lucide-react";
import { api } from "@/lib/api";
import type { Service } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import ImageCropper from "@/components/ImageCropper";

export default function Services() {
    const navigate = useNavigate();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [formState, setFormState] = useState({ name: "", description: "", cover_image: "", is_active: true, slug: "" });
    const [saving, setSaving] = useState(false);

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
            formData.append("file", blob, "service.jpg");
            
            const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/uploads/?purpose=product`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
                body: formData
            });
            
            if (!response.ok) throw new Error("Upload failed");
            const data = await response.json();
            setFormState(prev => ({ ...prev, cover_image: data.url }));
            setCroppingImage(null);
        } catch (e) {
            console.error(e);
            alert("Error uploading image");
        } finally {
            setUploading(false);
        }
    };

    const fetchServices = async () => {
        setLoading(true);
        try {
            const data = await api<Service[]>("/admin/services/");
            setServices(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const openCreate = () => {
        setEditingService(null);
        setFormState({ name: "", description: "", cover_image: "", is_active: true, slug: "" });
        setShowForm(true);
    };

    const openEdit = (e: React.MouseEvent, s: Service) => {
        e.stopPropagation();
        setEditingService(s);
        setFormState({
            name: s.name,
            description: s.description || "",
            cover_image: s.cover_image || "",
            is_active: s.is_active,
            slug: s.slug
        });
        setShowForm(true);
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm("Permanently delete this service and all its sub-services?")) return;
        try {
            await api(`/admin/services/${id}`, { method: "DELETE" });
            fetchServices();
        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        let payload: any = { ...formState };

        if (editingService) {
            // Calculate delta
            payload = {};
            if (formState.name !== editingService.name) payload.name = formState.name;
            if (formState.description !== (editingService.description || "")) payload.description = formState.description;
            if (formState.cover_image !== (editingService.cover_image || "")) payload.cover_image = formState.cover_image;
            if (formState.is_active !== editingService.is_active) payload.is_active = formState.is_active;
            if (formState.slug !== editingService.slug) payload.slug = formState.slug;

            // If nothing changed, just close
            if (Object.keys(payload).length === 0) {
                setShowForm(false);
                setSaving(false);
                return;
            }
        } else {
            if (!payload.slug) delete (payload as any).slug;
            if (!payload.description) delete (payload as any).description;
            if (!payload.cover_image) delete (payload as any).cover_image;
        }

        try {
            if (editingService) {
                await api(`/admin/services/${editingService.id}`, {
                    method: "PATCH",
                    body: JSON.stringify(payload)
                });
            } else {
                await api("/admin/services/", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });
            }
            setShowForm(false);
            fetchServices();
        } catch (e: any) {
            console.error(e);
            alert(e.message || "Failed to save service.");
        } finally {
            setSaving(false);
        }
    };

    const activeSubServicesCount = services.reduce((acc, s) => acc + (s.sub_services?.filter(ss => ss.is_active)?.length || 0), 0);
    const catColors = [
        "bg-[#1f70e3]/10 text-blue-600 dark:text-[#adc6ff] border-[#1f70e3]/20",
        "bg-[#34d399]/10 text-[#34d399] border-[#34d399]/20",
        "bg-[#8b5cf6]/10 text-[#c4b5fd] border-[#8b5cf6]/20",
        "bg-[#f59e0b]/10 text-[#fcd34d] border-[#f59e0b]/20",
        "bg-[#06b6d4]/10 text-[#67e8f9] border-[#06b6d4]/20"
    ];

    return (
        <div className="flex flex-col h-full font-['Inter'] bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] px-2">
            
            {/* Header */}
            <div className="flex items-end justify-between mb-8">
                <div>
                    <nav className="flex items-center gap-2 text-[10px] font-bold text-blue-600 dark:text-[#adc6ff] mb-2 tracking-widest uppercase">
                        <span>Systems</span>
                        <span>/</span>
                        <span className="text-slate-600 dark:text-[#c3c5d8]/60">Service Categories</span>
                    </nav>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-[#dae2fd] m-0">
                        Services
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-[#c3c5d8] mt-1 m-0">
                        {services.length} Manage your service categories
                    </p>
                </div>
                <button onClick={openCreate} className="h-10 px-5 bg-[#adc6ff] hover:bg-white text-[#001a42] font-extrabold text-[11px] uppercase tracking-widest rounded-lg flex items-center gap-2 transition-colors shadow-[0_4px_12px_rgba(173,198,255,0.2)]">
                    <Plus size={16} />
                    Add Service
                </button>
            </div>

            {/* Stats Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#434655] rounded-full"></span> Total Services
                    </p>
                    <p className="text-3xl font-black text-slate-900 dark:text-[#dae2fd]">{services.length}</p>
                </div>
                <div className="p-6 bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#434655] rounded-full"></span> Active Variants
                    </p>
                    <p className="text-3xl font-black text-slate-900 dark:text-[#dae2fd]">{activeSubServicesCount}</p>
                </div>
                <div className="p-6 bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#1f70e3]/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <p className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#434655] rounded-full"></span> System Status
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-[#adc6ff] flex items-center gap-2 relative z-10">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1f70e3] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#adc6ff]"></span>
                        </span>
                        Online
                    </p>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100 dark:bg-[#0b1326]/50 text-slate-600 dark:text-[#c3c5d8] uppercase text-[10px] tracking-[0.2em] font-bold border-b border-slate-200 dark:border-[#434655]/20">
                                <th className="px-6 py-4 w-24">Graphic</th>
                                <th className="px-6 py-4">Service Name</th>
                                <th className="px-6 py-4">URL Slug</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Sub-Services</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#434655]/10">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-16 text-slate-600 dark:text-[#c3c5d8] font-bold tracking-widest text-[10px] uppercase"><Loader2 className="animate-spin inline mr-2" size={16} /> Loading services...</td></tr>
                            ) : services.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-16 text-slate-600 dark:text-[#c3c5d8]/50 font-bold tracking-widest text-[10px] uppercase">No services found.</td></tr>
                            ) : services.map((service, idx) => (
                                <tr key={service.id} onClick={() => navigate(`/services/${service.slug}`)} className="group hover:bg-slate-50 dark:hover:bg-[#171f33]/80 transition-colors cursor-pointer">
                                    <td className="px-6 py-5">
                                        <div className="size-14 rounded-xl bg-slate-50 dark:bg-[#0b1326] flex items-center justify-center overflow-hidden border border-slate-200 dark:border-[#434655]/30 relative">
                                            {service.cover_image ? (
                                                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${service.cover_image}')` }}></div>
                                            ) : (
                                                <span className="text-[10px] text-[#434655] font-bold uppercase tracking-wider">NULL</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="font-extrabold text-slate-900 dark:text-[#dae2fd] text-base mb-1">{service.name}</div>
                                        {service.description && <div className="text-xs text-slate-600 dark:text-[#c3c5d8]/70 truncate max-w-[250px]">{service.description}</div>}
                                    </td>
                                    <td className="px-6 py-5">
                                        <code className="text-[11px] font-mono font-bold text-blue-600 dark:text-[#adc6ff] bg-[#adc6ff]/10 px-2 py-1 rounded border border-blue-400 dark:border-[#adc6ff]/20">{service.slug}</code>
                                    </td>
                                    <td className="px-6 py-5 text-sm">
                                        <span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest border ${service.is_active ? catColors[idx % catColors.length] : 'bg-[#434655]/10 text-slate-500 dark:text-[#8d90a1] border-slate-200 dark:border-[#434655]/20'}`}>
                                            {service.is_active ? "Live" : "Offline"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-[13px] font-bold text-slate-600 dark:text-[#c3c5d8]">
                                        <span className="text-slate-900 dark:text-[#dae2fd] bg-[#434655]/20 px-2.5 py-1 text-xs rounded-md shadow-inner">{service.sub_services?.length || 0}</span> sub-services
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="inline-flex items-center gap-1.5">
                                            <button onClick={(e) => openEdit(e, service)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-[#1f70e3]/20 rounded-lg transition-all text-slate-600 dark:text-[#c3c5d8] hover:text-blue-600 dark:hover:text-[#adc6ff]">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={(e) => handleDelete(e, service.id)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-[#ffb4ab]/10 rounded-lg transition-all text-slate-600 dark:text-[#c3c5d8] hover:text-[#ffb4ab]">
                                                <Trash2 size={16} />
                                            </button>
                                            <button className="p-2 text-[#434655] group-hover:text-slate-600 dark:hover:text-[#c3c5d8] transition-colors">
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

            {/* Service Modal */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-2xl bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 text-slate-900 dark:text-[#dae2fd] shadow-2xl p-0 overflow-hidden font-['Inter']">
                    <DialogHeader className="px-8 py-6 border-b border-slate-200 dark:border-[#434655]/20 bg-white dark:bg-[#131b2e]">
                        <DialogTitle className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-[#dae2fd]">
                            {editingService ? "Edit Service" : "Add New Service"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-600 dark:text-[#c3c5d8] mt-1 font-medium">
                            Create a new service category.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-8 py-6 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest flex items-center gap-1.5">
                                    Service Name <span className="text-[#ffb4ab] text-sm leading-none">*</span>
                                </label>
                                <Input className="h-10 text-sm font-bold bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40 text-slate-900 dark:text-[#dae2fd] focus:border-blue-400 dark:border-[#adc6ff] placeholder:text-[#434655]" value={formState.name} onChange={e => setFormState({ ...formState, name: e.target.value })} placeholder="e.g. Binding Services" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest flex items-center justify-between">
                                    <span>URL Slug</span>
                                    <span className="text-[9px] bg-[#434655]/30 text-slate-500 dark:text-[#8d90a1] px-1.5 py-0.5 rounded">AUTO</span>
                                </label>
                                <Input className="h-10 text-sm font-mono text-blue-600 dark:text-[#adc6ff] bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40 focus:border-blue-400 dark:border-[#adc6ff] placeholder:text-[#434655]" value={formState.slug} onChange={e => setFormState({ ...formState, slug: e.target.value })} placeholder="binding-services" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest flex items-center justify-between">
                                <span>Description</span>
                                <span className="text-[9px] bg-[#434655]/30 text-slate-500 dark:text-[#8d90a1] px-1.5 py-0.5 rounded">OPT</span>
                            </label>
                            <Textarea
                                className="min-h-[150px] bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40 text-slate-900 dark:text-[#dae2fd] focus:border-blue-400 dark:border-[#adc6ff] placeholder:text-[#434655] resize-y"
                                value={formState.description}
                                onChange={e => setFormState({ ...formState, description: e.target.value })}
                                placeholder="Enter a brief description..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest flex items-center justify-between">
                                <span>Cover Image URL</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] bg-[#434655]/30 text-slate-500 dark:text-[#8d90a1] px-1.5 py-0.5 rounded">OPT</span>
                                    {uploading && <div className="animate-spin h-3 w-3 border-2 border-blue-400 border-t-transparent rounded-full" />}
                                </div>
                            </label>
                            <div className="flex gap-2">
                                <Input className="h-10 text-sm font-mono text-slate-600 dark:text-[#c3c5d8] bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40 focus:border-blue-400 dark:border-[#adc6ff] placeholder:text-[#434655]" value={formState.cover_image} onChange={e => setFormState({ ...formState, cover_image: e.target.value })} placeholder="https://..." />
                                <label className="shrink-0 h-10 px-4 bg-[#1f70e3]/10 hover:bg-[#1f70e3]/20 border border-[#1f70e3]/30 rounded-lg flex items-center justify-center cursor-pointer transition-colors group">
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-[#adc6ff] group-hover:text-white transition-colors">Frame</span>
                                </label>
                            </div>
                        </div>

                        {croppingImage && (
                            <ImageCropper 
                                image={croppingImage} 
                                onCropComplete={handleCropComplete} 
                                onCancel={() => setCroppingImage(null)} 
                                aspect={1.5} 
                            />
                        )}

                        <div className="flex items-center justify-between border border-slate-200 dark:border-[#434655]/30 p-4 rounded-xl bg-white dark:bg-[#131b2e]">
                            <div>
                                <p className="font-bold text-slate-900 dark:text-[#dae2fd] text-sm">Active Status</p>
                                <p className="text-xs text-slate-600 dark:text-[#c3c5d8]/70 mt-0.5">Make this service visible to customers.</p>
                            </div>
                            <Switch checked={formState.is_active} onCheckedChange={c => setFormState({ ...formState, is_active: c })} className="data-[state=checked]:bg-[#34d399]" />
                        </div>
                    </div>

                    <DialogFooter className="px-8 py-5 border-t border-slate-200 dark:border-[#434655]/20 bg-white dark:bg-[#131b2e]">
                        <DialogClose asChild>
                            <Button variant="outline" className="h-10 px-6 font-bold text-xs uppercase tracking-widest bg-transparent border-[#434655] hover:bg-[#434655]/20 text-slate-600 dark:text-[#c3c5d8]">Cancel</Button>
                        </DialogClose>
                        <Button className="h-10 px-8 font-bold text-xs uppercase tracking-widest bg-[#adc6ff] hover:bg-white text-[#001a42]" onClick={handleSave} disabled={saving || !formState.name.trim()}>
                            {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                            Commit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}