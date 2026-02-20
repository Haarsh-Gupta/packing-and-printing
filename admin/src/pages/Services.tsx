import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Service, ServiceVariant } from "@/types";
import {
    Wrench, Plus, Pencil, Trash2, X, Loader2, Save,
    ChevronDown, ChevronUp, Layers, IndianRupee,
    Info, Activity, MoreVertical, Archive
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Services() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Service | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: "", is_active: true });
    const [showVariant, setShowVariant] = useState<{ svcSlug: string; variant?: ServiceVariant } | null>(null);
    const [varForm, setVarForm] = useState({ name: "", base_price: "", price_per_unit: "", description: "" });
    const [expanded, setExpanded] = useState<number | null>(null);

    const fetchServices = () => {
        setLoading(true);
        api<Service[]>("/services/").then(setServices).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { fetchServices(); }, []);

    const openCreate = () => {
        setEditing(null);
        setForm({ name: "", is_active: true });
        setShowForm(true);
    };

    const openEdit = (s: Service) => {
        setEditing(s);
        setForm({ name: s.name, is_active: s.is_active });
        setShowForm(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editing) { await api(`/services/${editing.slug}`, { method: "PUT", body: JSON.stringify(form) }); }
            else { await api("/services/", { method: "POST", body: JSON.stringify(form) }); }
            setShowForm(false); fetchServices();
        } catch (e) { console.error(e); } finally { setSaving(false); }
    };

    const deleteService = async (slug: string) => {
        if (!confirm("Permanently archive this service?")) return;
        try { await api(`/services/${slug}`, { method: "DELETE" }); fetchServices(); } catch (e) { console.error(e); }
    };

    const openVariantForm = (svcSlug: string, v?: ServiceVariant) => {
        setShowVariant({ svcSlug, variant: v });
        setVarForm(v ? {
            name: v.name,
            base_price: String(v.base_price),
            price_per_unit: String(v.price_per_unit),
            description: v.description || ""
        } : { name: "", base_price: "", price_per_unit: "", description: "" });
    };

    const saveVariant = async () => {
        if (!showVariant) return; setSaving(true);
        const body = {
            name: varForm.name,
            base_price: parseFloat(varForm.base_price),
            price_per_unit: parseFloat(varForm.price_per_unit),
            description: varForm.description || undefined
        };
        try {
            if (showVariant.variant) { await api(`/services/${showVariant.svcSlug}/variants/${showVariant.variant.id}`, { method: "PUT", body: JSON.stringify(body) }); }
            else { await api(`/services/${showVariant.svcSlug}/variants`, { method: "POST", body: JSON.stringify(body) }); }
            setShowVariant(null); fetchServices();
        } catch (e) { console.error(e); } finally { setSaving(false); }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Services</h1>
                    <p className="text-muted-foreground font-medium mt-1">Configure service offerings and pricing tiers</p>
                </div>
                <Button onClick={openCreate} className="font-bold">
                    <Plus size={16} className="mr-2" /> New Service
                </Button>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    [1, 2, 3, 4].map(i => <Card key={i} className="h-16 animate-pulse border-border bg-secondary/20" />)
                ) : services.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
                        <Wrench size={48} className="mx-auto mb-4 opacity-10" />
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Service Catalog Empty</p>
                    </div>
                ) : (
                    services.map(s => (
                        <Card key={s.id} className="border-border overflow-hidden transition-all">
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/30"
                                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${s.is_active ? 'bg-primary/10 text-primary' : 'bg-zinc-100 text-zinc-400'}`}>
                                        <Wrench size={18} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-black tracking-tight">{s.name}</CardTitle>
                                        <CardDescription className="text-[10px] font-bold uppercase font-mono">{s.slug} · {s.variants.length} Variants</CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant={s.is_active ? 'default' : 'secondary'} className="font-black text-[10px] tracking-widest uppercase">
                                        {s.is_active ? 'Active' : 'Archived'}
                                    </Badge>
                                    <div className="hidden md:flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(s); }}>
                                            <Pencil size={14} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); deleteService(s.slug); }}>
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                    {expanded === s.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </div>
                            </div>

                            {expanded === s.id && (
                                <div className="border-t border-border bg-zinc-50/50 p-6 animate-fade-in">
                                    <div className="flex items-center justify-between mb-4">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5"><Layers size={12} /> Service Tiers / Variants</Label>
                                        <Button variant="outline" size="sm" className="font-bold border-2 h-8 text-[10px]" onClick={() => openVariantForm(s.slug)}>
                                            <Plus size={12} className="mr-1.5" /> Add Tier
                                        </Button>
                                    </div>

                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {s.variants.length === 0 ? (
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase py-4">No variants defined for this service.</p>
                                        ) : s.variants.map(v => (
                                            <Card key={v.id} className="border-border bg-white shadow-sm flex flex-col group">
                                                <CardHeader className="p-3 pb-0">
                                                    <div className="flex items-center justify-between">
                                                        <CardTitle className="text-sm font-black tracking-tight">{v.name}</CardTitle>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => openVariantForm(s.slug, v)}>
                                                            <Pencil size={12} />
                                                        </Button>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-3 pt-2">
                                                    {v.description && <p className="text-[10px] text-muted-foreground font-medium mb-3 line-clamp-2">{v.description}</p>}
                                                    <div className="grid grid-cols-2 gap-2 mt-auto">
                                                        <div className="p-2 rounded bg-secondary/50 border border-border">
                                                            <p className="text-[8px] font-bold text-muted-foreground uppercase">Base</p>
                                                            <p className="text-xs font-black">₹{v.base_price}</p>
                                                        </div>
                                                        <div className="p-2 rounded bg-secondary/50 border border-border">
                                                            <p className="text-[8px] font-bold text-muted-foreground uppercase">Rate</p>
                                                            <p className="text-xs font-black">₹{v.price_per_unit}/u</p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))
                )}
            </div>

            {/* Service Modal */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="max-w-md border-border shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight">{editing ? "Update Service" : "Register New Service"}</DialogTitle>
                        <DialogDescription className="font-medium text-sm">Basic metadata for your service catalog</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Service Name</Label>
                            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Spiral Binding" />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/20 font-bold text-sm">
                            <span>Enable Service Visibility</span>
                            <Switch checked={form.is_active} onCheckedChange={c => setForm({ ...form, is_active: c })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline" className="font-bold">Cancel</Button></DialogClose>
                        <Button className="font-black" onClick={handleSave} disabled={saving || !form.name}>
                            {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
                            Save Service
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Variant Modal */}
            <Dialog open={!!showVariant} onOpenChange={(open) => !open && setShowVariant(null)}>
                <DialogContent className="max-w-md border-border shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold tracking-tight">{showVariant?.variant ? "Edit Service Tier" : "Add Service Tier"}</DialogTitle>
                        <DialogDescription className="font-medium text-sm">Define pricing and details for this service option</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Tier Name</Label>
                            <Input value={varForm.name} onChange={e => setVarForm({ ...varForm, name: e.target.value })} placeholder="e.g. Classic Glossy" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground">Base Cost (₹)</Label>
                                <Input type="number" value={varForm.base_price} onChange={e => setVarForm({ ...varForm, base_price: e.target.value })} placeholder="0" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground">Unit Rate (₹)</Label>
                                <Input type="number" value={varForm.price_per_unit} onChange={e => setVarForm({ ...varForm, price_per_unit: e.target.value })} placeholder="0" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Description</Label>
                            <Textarea value={varForm.description} onChange={e => setVarForm({ ...varForm, description: e.target.value })} placeholder="Enter features, limitations, etc..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="font-bold" onClick={() => setShowVariant(null)}>Cancel</Button>
                        <Button className="font-black" onClick={saveVariant} disabled={saving || !varForm.name}>
                            {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
                            Confirm Tier
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
