import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Product, FormSection, ProductOption } from "@/types";
import {
    Package, Plus, Pencil, Trash2, X, Loader2, Save,
    ChevronDown, ChevronUp, MoreVertical, Archive, Layout,
    Settings2, Layers, IndianRupee, Hash, Power
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Product | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: "",
        base_price: "",
        minimum_quantity: "",
        type: "product",
        is_active: true,
        sections: [] as FormSection[]
    });

    const fetchProducts = () => {
        setLoading(true);
        api<Product[]>("/products/?skip=0&limit=100")
            .then(setProducts)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchProducts(); }, []);

    const openCreate = () => {
        setEditing(null);
        setForm({ name: "", base_price: "", minimum_quantity: "", type: "product", is_active: true, sections: [] });
        setShowForm(true);
    };

    const openEdit = (p: Product) => {
        setEditing(p);
        setForm({
            name: p.name,
            base_price: String(p.base_price),
            minimum_quantity: String(p.minimum_quantity),
            type: p.type,
            is_active: p.is_active,
            sections: p.config_schema.sections
        });
        setShowForm(true);
    };

    const addSection = () => {
        setForm(f => ({ ...f, sections: [...f.sections, { key: "", label: "", type: "dropdown", options: [{ label: "", value: "", price_mod: 0 }] }] }));
    };

    const removeSection = (i: number) => {
        setForm(f => ({ ...f, sections: f.sections.filter((_, j) => j !== i) }));
    };

    const updateSection = (i: number, patch: Partial<FormSection>) => {
        setForm(f => ({ ...f, sections: f.sections.map((s, j) => j === i ? { ...s, ...patch } : s) }));
    };

    const addOption = (si: number) => {
        setForm(f => ({ ...f, sections: f.sections.map((s, j) => j === si ? { ...s, options: [...(s.options || []), { label: "", value: "", price_mod: 0 }] } : s) }));
    };

    const updateOption = (si: number, oi: number, patch: Partial<ProductOption>) => {
        setForm(f => ({ ...f, sections: f.sections.map((s, j) => j === si ? { ...s, options: (s.options || []).map((o, k) => k === oi ? { ...o, ...patch } : o) } : s) }));
    };

    const handleSave = async () => {
        setSaving(true);
        const body = {
            name: form.name,
            base_price: parseFloat(form.base_price),
            minimum_quantity: parseInt(form.minimum_quantity),
            type: form.type,
            is_active: form.is_active,
            config_schema: { sections: form.sections }
        };
        try {
            if (editing) { await api(`/products/${editing.slug}`, { method: "PUT", body: JSON.stringify(body) }); }
            else { await api("/products/admin", { method: "POST", body: JSON.stringify(body) }); }
            setShowForm(false);
            fetchProducts();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Products</h1>
                    <p className="text-muted-foreground font-medium mt-1">{products.length} catalog items managed</p>
                </div>
                <Button onClick={openCreate} className="font-bold">
                    <Plus size={16} className="mr-2" /> New Product
                </Button>
            </div>

            {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => <Card key={i} className="h-[200px] animate-pulse border-border bg-secondary/20" />)}
                </div>
            ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <Package size={64} className="text-muted-foreground opacity-20" />
                    <p className="text-sm font-bold text-muted-foreground">No products found in catalog</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map(p => (
                        <Card key={p.id} className="border-border overflow-hidden flex flex-col hover:border-zinc-400 group transition-all">
                            <CardHeader className="bg-secondary/20 border-b p-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-black truncate max-w-[200px]">{p.name}</CardTitle>
                                        <CardDescription className="text-[10px] font-bold uppercase tracking-tight font-mono">{p.slug}</CardDescription>
                                    </div>
                                    <Badge variant={p.is_active ? "default" : "outline"} className="font-black text-[10px] tracking-widest uppercase">
                                        {p.is_active ? "Active" : "Archived"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5 flex-1 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5"><IndianRupee size={10} /> Base Price</p>
                                        <p className="text-lg font-black tracking-tighter">₹{p.base_price}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5"><Hash size={10} /> Min Qty</p>
                                        <p className="text-lg font-black tracking-tighter">{p.minimum_quantity}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="font-bold text-[10px] lowercase px-2">
                                        {p.config_schema.sections.length} config sections
                                    </Badge>
                                    <Badge variant="outline" className="font-bold text-[10px] lowercase px-2">
                                        {p.type}
                                    </Badge>
                                </div>
                            </CardContent>
                            <CardFooter className="p-4 border-t bg-secondary/10 flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1 font-bold h-9" onClick={() => openEdit(p)}>
                                    <Pencil size={14} className="mr-2" /> Edit Details
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon" className="h-9 w-9">
                                            <MoreVertical size={16} />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem className="font-bold text-xs" onClick={() => openEdit(p)}>Duplicate Product</DropdownMenuItem>
                                        <DropdownMenuItem className="font-bold text-xs" onClick={() => openEdit(p)}>View Schema</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive font-bold text-xs">Delete Product</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Product Form Modal */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col border-border shadow-2xl">
                    <DialogHeader className="p-6 border-b bg-secondary/30">
                        <DialogTitle className="text-2xl font-bold tracking-tight">{editing ? "Update Product" : "Launch New Product"}</DialogTitle>
                        <DialogDescription className="font-medium text-sm">Configure catalog details and dynamic order form sections</DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1">
                        <div className="p-6 space-y-8">
                            {/* Core Information */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="prod-name" className="text-xs font-black uppercase text-muted-foreground">Product Title</Label>
                                        <Input id="prod-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Premium Hardcover Book" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="prod-type" className="text-xs font-black uppercase text-muted-foreground">Catalog Category</Label>
                                        <Select value={form.type} onValueChange={t => setForm({ ...form, type: t })}>
                                            <SelectTrigger id="prod-type">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="product">Standard Product</SelectItem>
                                                <SelectItem value="bundle">Product Bundle</SelectItem>
                                                <SelectItem value="variant">Special Variant</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="prod-price" className="text-xs font-black uppercase text-muted-foreground">Base Price</Label>
                                            <Input id="prod-price" type="number" value={form.base_price} onChange={e => setForm({ ...form, base_price: e.target.value })} placeholder="0.00" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="prod-mq" className="text-xs font-black uppercase text-muted-foreground">Min Qty</Label>
                                            <Input id="prod-mq" type="number" value={form.minimum_quantity} onChange={e => setForm({ ...form, minimum_quantity: e.target.value })} placeholder="1" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/20">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-black">Publish Visibility</Label>
                                            <p className="text-[10px] text-muted-foreground font-medium">Visible to customers in storefront</p>
                                        </div>
                                        <Switch checked={form.is_active} onCheckedChange={c => setForm({ ...form, is_active: c })} />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Dynamic Config Schema */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-black flex items-center gap-2"><Settings2 size={16} /> Dynamic Form Sections</Label>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Build user customisation options</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={addSection} className="font-bold border-2">
                                        <Plus size={14} className="mr-2" /> Add Section
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {form.sections.map((sec, si) => (
                                        <Card key={si} className="border-border bg-zinc-50 overflow-hidden">
                                            <div className="flex items-center justify-between p-3 bg-zinc-100 border-b">
                                                <Badge variant="outline" className="font-black bg-white text-[10px] tracking-tighter uppercase px-3 py-1">Section #{si + 1}</Badge>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeSection(si)}><X size={14} /></Button>
                                            </div>
                                            <CardContent className="p-4 space-y-4">
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Unique Key</Label>
                                                        <Input value={sec.key} onChange={e => updateSection(si, { key: e.target.value })} className="h-9 bg-white" placeholder="paper_type" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Display Label</Label>
                                                        <Input value={sec.label} onChange={e => updateSection(si, { label: e.target.value })} className="h-9 bg-white" placeholder="Paper Quality" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Input Type</Label>
                                                        <Select value={sec.type} onValueChange={v => updateSection(si, { type: v as any })}>
                                                            <SelectTrigger className="h-9 bg-white">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="dropdown">Dropdown</SelectItem>
                                                                <SelectItem value="radio">Radio Group</SelectItem>
                                                                <SelectItem value="number_input">Number Input</SelectItem>
                                                                <SelectItem value="text_input">Text Input</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                {/* Options Builder for Dropdown/Radio */}
                                                {(sec.type === 'dropdown' || sec.type === 'radio') && (
                                                    <div className="space-y-3 pt-2">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.1em]">Value Options</p>
                                                            <Button variant="ghost" size="sm" onClick={() => addOption(si)} className="text-[10px] font-bold h-6 text-primary hover:bg-primary/10">+ New Value</Button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {(sec.options || []).map((opt, oi) => (
                                                                <div key={oi} className="flex gap-2 items-center">
                                                                    <Input placeholder="Label" value={opt.label} onChange={e => updateOption(si, oi, { label: e.target.value })} className="h-8 text-xs bg-white" />
                                                                    <Input placeholder="Value" value={opt.value} onChange={e => updateOption(si, oi, { value: e.target.value })} className="h-8 text-xs bg-white" />
                                                                    <div className="relative w-32">
                                                                        <div className="absolute left-2 top-2 text-[10px] font-black text-muted-foreground">₹</div>
                                                                        <Input type="number" placeholder="Price ±" value={opt.price_mod} onChange={e => updateOption(si, oi, { price_mod: parseFloat(e.target.value) })} className="h-8 text-xs bg-white pl-5" />
                                                                    </div>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><X size={12} /></Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-6 border-t bg-secondary/30">
                        <DialogClose asChild>
                            <Button variant="outline" className="font-bold">Cancel</Button>
                        </DialogClose>
                        <Button className="font-black px-8" onClick={handleSave} disabled={saving || !form.name}>
                            {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
                            {editing ? "Save Product Changes" : "Confirm & Launch Product"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
