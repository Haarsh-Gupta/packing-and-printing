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

export default function Services() {
    const navigate = useNavigate();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [formState, setFormState] = useState({ name: "", description: "", cover_image: "", is_active: true, slug: "" });
    const [saving, setSaving] = useState(false);

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
        const payload = { ...formState };
        if (!payload.slug) delete (payload as any).slug; // let backend auto-slugify if empty
        if (!payload.description) delete (payload as any).description;
        if (!payload.cover_image) delete (payload as any).cover_image;

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
        "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
        "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
        "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
        "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
        "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
    ];

    return (
        <div className="max-w-7xl mx-auto w-full space-y-6 animate-fade-in font-['Inter',sans-serif]">
            {/* Page Title Area */}
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Parent Services</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage core service categories and printing models.</p>
                </div>
                <button onClick={openCreate} className="bg-[#136dec] hover:bg-[#136dec]/90 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-[#136dec]/20 transition-all active:scale-95">
                    <Plus size={20} />
                    New Service
                </button>
            </div>

            {/* Main Table Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">Cover</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Service Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Slug</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sub-services</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-12 text-slate-500 font-medium"><Loader2 className="animate-spin inline mr-2" /> Loading services...</td></tr>
                            ) : services.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-12 text-slate-500 font-medium">No services found. Create your first service!</td></tr>
                            ) : services.map((service, idx) => (
                                <tr key={service.id} onClick={() => navigate(`/services/${service.slug}`)} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer">
                                    <td className="px-6 py-4">
                                        <div className="size-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                                            {service.cover_image ? (
                                                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${service.cover_image}')` }}></div>
                                            ) : (
                                                <span className="text-xs text-slate-400 font-medium">N/A</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900 dark:text-slate-100 text-base">{service.name}</div>
                                        {service.description && <div className="text-xs text-slate-500 mt-1 truncate max-w-xs">{service.description}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <code className="text-xs font-mono font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700">{service.slug}</code>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${service.is_active ? catColors[idx % catColors.length] : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                            {service.is_active ? "Active" : "Archived"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                                        {service.sub_services?.length || 0} variants
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="inline-flex items-center gap-1.5">
                                            <button onClick={(e) => openEdit(e, service)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-blue-600">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={(e) => handleDelete(e, service.id)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-red-600">
                                                <Trash2 size={18} />
                                            </button>
                                            <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400">
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Stats Summary Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Services</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{services.length}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Active Variants</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{activeSubServicesCount}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">System Status</p>
                    <p className="text-2xl font-bold text-[#136dec] flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#136dec] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#136dec]"></span>
                        </span>
                        Live Synced
                    </p>
                </div>
            </div>

            {/* Service Modal */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-[75vw] w-[75vw] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-['Inter',sans-serif] p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <DialogTitle className="text-2xl font-bold">{editingService ? "Edit Service Category" : "Build Service Category"}</DialogTitle>
                        <DialogDescription className="text-base mt-2">
                            This creates the top-level parent grouping (e.g., 'Binding') which will hold multiple specific sub-services.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-8 py-6 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    Name <span className="text-red-500 font-normal">*</span>
                                </label>
                                <Input className="h-11 text-base placeholder:text-slate-400" value={formState.name} onChange={e => setFormState({ ...formState, name: e.target.value })} placeholder="e.g. Binding Services" />
                                <p className="text-xs text-slate-500 flex items-start gap-1.5 mt-1.5">
                                    <Info size={14} className="shrink-0 mt-0.5 text-[#136dec]" />
                                    <span>The public-facing display name of this service class.</span>
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                    <span>System Slug</span>
                                    <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">Optional</span>
                                </label>
                                <Input className="h-11 text-base font-mono bg-slate-50 dark:bg-slate-900/50 placeholder:text-slate-400" value={formState.slug} onChange={e => setFormState({ ...formState, slug: e.target.value })} placeholder="binding-services" />
                                <p className="text-xs text-slate-500 flex items-start gap-1.5 mt-1.5">
                                    <Info size={14} className="shrink-0 mt-0.5" />
                                    <span>Used in the URL. Leave blank to auto-generate from the Name.</span>
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                <span>Description</span>
                                <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">Optional</span>
                            </label>
                            <Textarea className="resize-none min-h-[90px] text-base placeholder:text-slate-400" value={formState.description} onChange={e => setFormState({ ...formState, description: e.target.value })} placeholder="A short marketing description..." />
                            <p className="text-xs text-slate-500 flex items-start gap-1.5 mt-1.5">
                                <Info size={14} className="shrink-0 mt-0.5" />
                                <span>Shown to customers to summarize what's in this service container.</span>
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                <span>Cover Image URL</span>
                                <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">Optional</span>
                            </label>
                            <Input className="h-11 text-base placeholder:text-slate-400" value={formState.cover_image} onChange={e => setFormState({ ...formState, cover_image: e.target.value })} placeholder="https://domain.com/image.jpg" />
                            <p className="text-xs text-slate-500 flex items-start gap-1.5 mt-1.5">
                                <Info size={14} className="shrink-0 mt-0.5" />
                                <span>The thumbnail graphic for the services grid.</span>
                            </p>
                        </div>

                        <div className="flex items-center justify-between border-2 border-slate-100 dark:border-slate-800 p-5 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                            <div>
                                <p className="font-bold text-slate-900 dark:text-slate-100">Live Status</p>
                                <p className="text-sm text-slate-500 mt-0.5">Determines if customers can see this service class online.</p>
                            </div>
                            <Switch checked={formState.is_active} onCheckedChange={c => setFormState({ ...formState, is_active: c })} className="data-[state=checked]:bg-[#136dec]" />
                        </div>
                    </div>

                    <DialogFooter className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <DialogClose asChild>
                            <Button variant="outline" className="h-11 px-6 font-semibold">Discard</Button>
                        </DialogClose>
                        <Button className="h-11 px-8 font-semibold bg-[#136dec] hover:bg-[#136dec]/90 text-white" onClick={handleSave} disabled={saving || !formState.name.trim()}>
                            {saving ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Save className="mr-2 h-5 w-5" />}
                            {editingService ? "Update Configuration" : "Publish Service"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}