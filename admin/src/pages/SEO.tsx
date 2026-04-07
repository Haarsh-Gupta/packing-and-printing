import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Loader2, Save, Globe } from "lucide-react";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export interface SEOConfig {
    id: number;
    path: string;
    title: string;
    description?: string;
    keywords?: string;
    og_image?: string;
    og_title?: string;
    og_description?: string;
    canonical_url?: string;
}

export default function SEO() {
    const [configs, setConfigs] = useState<SEOConfig[]>([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [editingConfig, setEditingConfig] = useState<SEOConfig | null>(null);
    const [formState, setFormState] = useState({
        path: "",
        title: "",
        description: "",
        keywords: "",
        og_image: "",
        og_title: "",
        og_description: "",
        canonical_url: ""
    });
    const [saving, setSaving] = useState(false);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const data = await api<SEOConfig[]>("/admin/seo/configs");
            setConfigs(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const openCreate = () => {
        setEditingConfig(null);
        setFormState({
            path: "",
            title: "",
            description: "",
            keywords: "",
            og_image: "",
            og_title: "",
            og_description: "",
            canonical_url: ""
        });
        setShowForm(true);
    };

    const openEdit = (e: React.MouseEvent, c: SEOConfig) => {
        e.stopPropagation();
        setEditingConfig(c);
        setFormState({
            path: c.path,
            title: c.title,
            description: c.description || "",
            keywords: c.keywords || "",
            og_image: c.og_image || "",
            og_title: c.og_title || "",
            og_description: c.og_description || "",
            canonical_url: c.canonical_url || ""
        });
        setShowForm(true);
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm("Permanently delete this SEO configuration?")) return;
        try {
            await api(`/admin/seo/config/${id}`, { method: "DELETE" });
            fetchConfigs();
        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const payload: any = { ...formState };
        
        // Remove empty strings so we don't send them if they're meant to be null/optional
        Object.keys(payload).forEach(key => {
            if (payload[key] === "") delete payload[key];
        });

        if (!payload.title || !payload.path) {
            alert("Path and Title are required.");
            setSaving(false);
            return;
        }

        try {
            if (editingConfig) {
                await api(`/admin/seo/config/${editingConfig.id}`, {
                    method: "PUT",
                    body: JSON.stringify(payload)
                });
            } else {
                await api("/admin/seo/config", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });
            }
            setShowForm(false);
            fetchConfigs();
        } catch (e: any) {
            console.error(e);
            alert(e.message || "Failed to save SEO config.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full font-['Inter'] bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] px-2">
            
            <div className="flex items-end justify-between mb-8">
                <div>
                    <nav className="flex items-center gap-2 text-[10px] font-bold text-blue-600 dark:text-[#adc6ff] mb-2 tracking-widest uppercase">
                        <span>Settings</span>
                        <span>/</span>
                        <span className="text-slate-600 dark:text-[#c3c5d8]/60">SEO</span>
                    </nav>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-[#dae2fd] m-0">
                        SEO Management
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-[#c3c5d8] mt-1 m-0">
                        {configs.length} Active Pages Configured
                    </p>
                </div>
                <button onClick={openCreate} className="h-10 px-5 bg-[#adc6ff] hover:bg-white text-[#001a42] font-extrabold text-[11px] uppercase tracking-widest rounded-lg flex items-center gap-2 transition-colors shadow-[0_4px_12px_rgba(173,198,255,0.2)]">
                    <Plus size={16} />
                    Add Config
                </button>
            </div>

            <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100 dark:bg-[#0b1326]/50 text-slate-600 dark:text-[#c3c5d8] uppercase text-[10px] tracking-[0.2em] font-bold border-b border-slate-200 dark:border-[#434655]/20">
                                <th className="px-6 py-4 w-12 text-center">ID</th>
                                <th className="px-6 py-4">URL Path</th>
                                <th className="px-6 py-4">Page Title</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#434655]/10">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-16 text-slate-600 dark:text-[#c3c5d8] font-bold tracking-widest text-[10px] uppercase"><Loader2 className="animate-spin inline mr-2" size={16} /> Loading SEO configs...</td></tr>
                            ) : configs.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-16 text-slate-600 dark:text-[#c3c5d8]/50 font-bold tracking-widest text-[10px] uppercase">No SEO configurations found.</td></tr>
                            ) : configs.map((config) => (
                                <tr key={config.id} className="group hover:bg-slate-50 dark:hover:bg-[#171f33]/80 transition-colors">
                                    <td className="px-6 py-5 text-center text-xs font-mono text-slate-500">{config.id}</td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <Globe size={14} className="text-[#434655]" />
                                            <code className="text-[11px] font-mono font-bold text-blue-600 dark:text-[#adc6ff] bg-[#adc6ff]/10 px-2 py-1 rounded border border-blue-400 dark:border-[#adc6ff]/20">{config.path}</code>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="font-extrabold text-slate-900 dark:text-[#dae2fd] text-sm">{config.title}</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-xs text-slate-600 dark:text-[#c3c5d8]/70 truncate max-w-[300px]">
                                            {config.description || <span className="italic opacity-50">No description</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="inline-flex items-center gap-1.5">
                                            <button onClick={(e) => openEdit(e, config)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-[#1f70e3]/20 rounded-lg transition-all text-slate-600 dark:text-[#c3c5d8] hover:text-blue-600 dark:hover:text-[#adc6ff]">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={(e) => handleDelete(e, config.id)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-[#ffb4ab]/10 rounded-lg transition-all text-slate-600 dark:text-[#c3c5d8] hover:text-[#ffb4ab]">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-2xl bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 text-slate-900 dark:text-[#dae2fd] shadow-2xl p-0 overflow-y-auto max-h-[90vh] font-['Inter']">
                    <DialogHeader className="px-8 py-6 border-b border-slate-200 dark:border-[#434655]/20 bg-white dark:bg-[#131b2e] sticky top-0 z-10">
                        <DialogTitle className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-[#dae2fd]">
                            {editingConfig ? "Edit SEO Config" : "Add SEO Config"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-600 dark:text-[#c3c5d8] mt-1 font-medium">
                            Manage meta tags and OpenGraph data for a specific path.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-8 py-6 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest flex items-center gap-1.5">
                                    Path <span className="text-[#ffb4ab] text-sm leading-none">*</span>
                                </label>
                                <Input disabled={!!editingConfig} className="h-10 text-sm font-mono bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40 text-blue-600 dark:text-[#adc6ff] focus:border-blue-400 dark:border-[#adc6ff] placeholder:text-[#434655]" value={formState.path} onChange={e => setFormState({ ...formState, path: e.target.value })} placeholder="e.g. /about" />
                                <p className="text-[10px] text-slate-500 dark:text-[#8d90a1] mt-1.5 leading-snug">The URL path of the page (e.g. "/", "/about").</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest flex items-center gap-1.5">
                                    Page Title <span className="text-[#ffb4ab] text-sm leading-none">*</span>
                                </label>
                                <Input className="h-10 text-sm font-bold bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40 text-slate-900 dark:text-[#dae2fd] focus:border-blue-400 dark:border-[#adc6ff] placeholder:text-[#434655]" value={formState.title} onChange={e => setFormState({ ...formState, title: e.target.value })} placeholder="Page Title | Brand" />
                                <p className="text-[10px] text-slate-500 dark:text-[#8d90a1] mt-1.5 leading-snug">Appears on the browser tab and Google search results.</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest flex items-center justify-between">
                                <span>Description</span>
                                <span className="text-[9px] bg-[#434655]/30 text-slate-500 dark:text-[#8d90a1] px-1.5 py-0.5 rounded">OPT</span>
                            </label>
                            <Textarea
                                className="min-h-[80px] bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40 text-slate-900 dark:text-[#dae2fd] focus:border-blue-400 dark:border-[#adc6ff] placeholder:text-[#434655] resize-y"
                                value={formState.description}
                                onChange={e => setFormState({ ...formState, description: e.target.value })}
                                placeholder="Meta description..."
                            />
                            <p className="text-[10px] text-slate-500 dark:text-[#8d90a1] mt-1.5 leading-snug">A concise summary of the page shown below the title in search results.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest flex items-center justify-between">
                                <span>Keywords</span>
                                <span className="text-[9px] bg-[#434655]/30 text-slate-500 dark:text-[#8d90a1] px-1.5 py-0.5 rounded">OPT</span>
                            </label>
                            <Input className="h-10 text-sm bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40 text-slate-900 dark:text-[#dae2fd] focus:border-blue-400 dark:border-[#adc6ff] placeholder:text-[#434655]" value={formState.keywords} onChange={e => setFormState({ ...formState, keywords: e.target.value })} placeholder="keyword1, keyword2..." />
                            <p className="text-[10px] text-slate-500 dark:text-[#8d90a1] mt-1.5 leading-snug">Comma-separated list of search terms.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest flex items-center justify-between">
                                    <span>OG Title</span>
                                    <span className="text-[9px] bg-[#434655]/30 text-slate-500 dark:text-[#8d90a1] px-1.5 py-0.5 rounded">OPT</span>
                                </label>
                                <Input className="h-10 text-sm bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40 text-slate-900 dark:text-[#dae2fd] focus:border-blue-400 dark:border-[#adc6ff] placeholder:text-[#434655]" value={formState.og_title} onChange={e => setFormState({ ...formState, og_title: e.target.value })} placeholder="OpenGraph Title" />
                                <p className="text-[10px] text-slate-500 dark:text-[#8d90a1] mt-1.5 leading-snug">Title shown when shared on social media.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest flex items-center justify-between">
                                    <span>Canonical URL</span>
                                    <span className="text-[9px] bg-[#434655]/30 text-slate-500 dark:text-[#8d90a1] px-1.5 py-0.5 rounded">OPT</span>
                                </label>
                                <Input className="h-10 text-sm font-mono bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40 text-slate-900 dark:text-[#dae2fd] focus:border-blue-400 dark:border-[#adc6ff] placeholder:text-[#434655]" value={formState.canonical_url} onChange={e => setFormState({ ...formState, canonical_url: e.target.value })} placeholder="https://..." />
                                <p className="text-[10px] text-slate-500 dark:text-[#8d90a1] mt-1.5 leading-snug">The main URL of the page (prevents duplicate content issues).</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest flex items-center justify-between">
                                <span>OG Description</span>
                                <span className="text-[9px] bg-[#434655]/30 text-slate-500 dark:text-[#8d90a1] px-1.5 py-0.5 rounded">OPT</span>
                            </label>
                            <Textarea
                                className="min-h-[60px] bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40 text-slate-900 dark:text-[#dae2fd] focus:border-blue-400 dark:border-[#adc6ff] placeholder:text-[#434655] resize-y"
                                value={formState.og_description}
                                onChange={e => setFormState({ ...formState, og_description: e.target.value })}
                                placeholder="OpenGraph Description..."
                            />
                            <p className="text-[10px] text-slate-500 dark:text-[#8d90a1] mt-1.5 leading-snug">Description shown when shared on social media.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-600 dark:text-[#c3c5d8] uppercase tracking-widest flex items-center justify-between">
                                <span>OG Image URL</span>
                                <span className="text-[9px] bg-[#434655]/30 text-slate-500 dark:text-[#8d90a1] px-1.5 py-0.5 rounded">OPT</span>
                            </label>
                            <Input className="h-10 text-sm font-mono bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40 text-slate-900 dark:text-[#dae2fd] focus:border-blue-400 dark:border-[#adc6ff] placeholder:text-[#434655]" value={formState.og_image} onChange={e => setFormState({ ...formState, og_image: e.target.value })} placeholder="https://..." />
                            <p className="text-[10px] text-slate-500 dark:text-[#8d90a1] mt-1.5 leading-snug">Image URL used for the preview card on social media.</p>
                        </div>
                    </div>

                    <DialogFooter className="px-8 py-5 border-t border-slate-200 dark:border-[#434655]/20 bg-white dark:bg-[#131b2e] sticky bottom-0 z-10">
                        <DialogClose asChild>
                            <Button variant="outline" className="h-10 px-6 font-bold text-xs uppercase tracking-widest bg-transparent border-[#434655] hover:bg-[#434655]/20 text-slate-600 dark:text-[#c3c5d8]">Cancel</Button>
                        </DialogClose>
                        <Button className="h-10 px-8 font-bold text-xs uppercase tracking-widest bg-[#adc6ff] hover:bg-white text-[#001a42]" onClick={handleSave} disabled={saving || !formState.title.trim() || !formState.path.trim()}>
                            {saving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                            Write
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

