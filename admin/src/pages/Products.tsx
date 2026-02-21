import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Product, FormSection, ProductOption } from "@/types";
import {
    Package, Plus, Pencil, Trash2, X, Loader2, Save,
    Settings2, MoreVertical, Copy, Eye, ExternalLink, Search,
    ImagePlus, Tag, Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted-foreground)', ...mono, marginBottom: '8px' }}>{children}</p>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)', ...mono, marginBottom: '5px' }}>{children}</label>
);

const StatusPill = ({ active }: { active: boolean }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px', background: active ? '#f0fdf4' : '#f5f5f5', borderRadius: '4px', fontSize: '10px', fontWeight: 700, color: active ? '#16a34a' : '#737373', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", border: `1px solid ${active ? '#bbf7d0' : 'var(--border)'}` }}>
        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: active ? '#16a34a' : '#737373', flexShrink: 0 }} />
        {active ? 'Active' : 'Archived'}
    </span>
);

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Product | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: "", base_price: "", minimum_quantity: "",
        type: "product", is_active: true, sections: [] as FormSection[],
        description: "",
    });

    const fetchProducts = () => {
        setLoading(true);
        api<Product[]>("/products/?skip=0&limit=100")
            .then(setProducts).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { fetchProducts(); }, []);

    const openCreate = () => {
        setEditing(null);
        setForm({ name: "", base_price: "", minimum_quantity: "", type: "product", is_active: true, sections: [], description: "" });
        setShowForm(true);
    };

    const openEdit = (p: Product) => {
        setEditing(p);
        setForm({ name: p.name, base_price: String(p.base_price), minimum_quantity: String(p.minimum_quantity), type: p.type, is_active: p.is_active, sections: [...p.config_schema.sections], description: "" });
        setShowForm(true);
    };

    const addSection = () => setForm(f => ({ ...f, sections: [...f.sections, { key: "", label: "", type: "dropdown", options: [{ label: "", value: "", price_mod: 0 }] }] }));
    const removeSection = (i: number) => setForm(f => ({ ...f, sections: f.sections.filter((_, j) => j !== i) }));
    const updateSection = (i: number, patch: Partial<FormSection>) => setForm(f => ({ ...f, sections: f.sections.map((s, j) => j === i ? { ...s, ...patch } : s) }));
    const addOption = (si: number) => setForm(f => ({ ...f, sections: f.sections.map((s, j) => j === si ? { ...s, options: [...(s.options || []), { label: "", value: "", price_mod: 0 }] } : s) }));
    const updateOption = (si: number, oi: number, patch: Partial<ProductOption>) => setForm(f => ({ ...f, sections: f.sections.map((s, j) => j === si ? { ...s, options: (s.options || []).map((o, k) => k === oi ? { ...o, ...patch } : o) } : s) }));
    const removeOption = (si: number, oi: number) => setForm(f => ({ ...f, sections: f.sections.map((s, j) => j === si ? { ...s, options: (s.options || []).filter((_, k) => k !== oi) } : s) }));

    const handleSave = async () => {
        setSaving(true);
        const body = { name: form.name, base_price: parseFloat(form.base_price), minimum_quantity: parseInt(form.minimum_quantity), type: form.type, is_active: form.is_active, config_schema: { sections: form.sections } };
        try {
            if (editing) await api(`/products/${editing.slug}`, { method: "PUT", body: JSON.stringify(body) });
            else await api("/products/admin", { method: "POST", body: JSON.stringify(body) });
            setShowForm(false); fetchProducts();
        } catch (e) { console.error(e); } finally { setSaving(false); }
    };

    const deleteProduct = async (slug: string) => {
        if (!confirm("Permanently delete this product?")) return;
        try { await api(`/products/${slug}`, { method: "DELETE" }); fetchProducts(); } catch (e) { console.error(e); }
    };

    const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: "'DM Sans', system-ui" }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                <div>
                    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted-foreground)', ...mono, marginBottom: '4px' }}>Catalog Management</p>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>
                        Product Inventory
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted-foreground)', marginLeft: '12px', letterSpacing: 0, ...mono }}>[{filtered.length} ITEMS]</span>
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                        <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '30px', height: '36px', width: '200px', fontSize: '13px' }} />
                    </div>
                    <Button onClick={openCreate} style={{ height: '36px', gap: '8px', fontWeight: 700, fontSize: '13px' }}>
                        <Plus size={14} /> New Product
                    </Button>
                </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                {[
                    { label: 'Total Products', value: products.length, color: '#2563eb' },
                    { label: 'Active', value: products.filter(p => p.is_active).length, color: '#16a34a' },
                    { label: 'Archived', value: products.filter(p => !p.is_active).length, color: '#737373' },
                    { label: 'Config Fields', value: products.reduce((a, p) => a + p.config_schema.sections.length, 0), color: '#9333ea' },
                ].map((s, i) => (
                    <div key={i} style={{ padding: '16px 20px', borderRight: i < 3 ? '1px solid var(--border)' : 'none', background: 'var(--card)' }}>
                        <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', ...mono, marginBottom: '6px' }}>{s.label}</p>
                        <p style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', color: s.color }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Product Grid */}
            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} style={{ height: '240px', background: 'var(--secondary)', borderRadius: '8px', border: '1px solid var(--border)', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ padding: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                    <Package size={40} style={{ color: 'var(--border)' }} />
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted-foreground)' }}>{search ? 'No products match your search' : 'Your product catalog is empty'}</p>
                    {!search && <Button onClick={openCreate} style={{ gap: '8px', fontWeight: 700 }}><Plus size={14} /> Add First Product</Button>}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {filtered.map(p => (
                        <div key={p.id} style={{ border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--card)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.2s ease' }}
                            className="group hover:border-foreground hover:shadow-xl">
                            <div style={{ height: '4px', background: p.is_active ? 'var(--foreground)' : 'var(--muted)' }} />
                            <div style={{ padding: '20px', flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--foreground)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</h3>
                                        <p style={{ fontSize: '10px', color: 'var(--muted-foreground)', ...mono, fontWeight: 700 }}>{p.slug}</p>
                                    </div>
                                    <StatusPill active={p.is_active} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                                    {[
                                        { label: 'Base Price', value: `₹${p.base_price.toLocaleString()}`, sub: 'INR' },
                                        { label: 'Min Qty', value: p.minimum_quantity, sub: 'UNITS' },
                                    ].map(item => (
                                        <div key={item.label} style={{ padding: '12px', background: 'var(--secondary)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                            <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', ...mono, marginBottom: '4px' }}>{item.label}</p>
                                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                                                <p style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>{item.value}</p>
                                                <span style={{ fontSize: '8px', fontWeight: 700, opacity: 0.4, ...mono }}>{item.sub}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    <span style={{ padding: '3px 8px', background: 'var(--secondary)', borderRadius: '4px', fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)', border: '1px solid var(--border)', ...mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.config_schema.sections.length} CONFIGS</span>
                                    <span style={{ padding: '3px 8px', background: 'var(--secondary)', borderRadius: '4px', fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)', border: '1px solid var(--border)', ...mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.type}</span>
                                </div>
                            </div>
                            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--secondary)', display: 'flex', gap: '8px' }}>
                                <Button variant="outline" onClick={() => openEdit(p)} style={{ flex: 1, height: '32px', fontSize: '12px', fontWeight: 700, background: 'var(--background)', gap: '6px' }}>
                                    <Pencil size={12} /> Edit
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon" style={{ width: '32px', height: '32px', background: 'var(--background)' }}>
                                            <MoreVertical size={14} />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[180px]">
                                        <DropdownMenuItem disabled style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Actions</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => openEdit(p)}><Copy size={14} className="mr-2" /> Duplicate</DropdownMenuItem>
                                        <DropdownMenuItem><Eye size={14} className="mr-2" /> View on Store</DropdownMenuItem>
                                        <DropdownMenuItem><ExternalLink size={14} className="mr-2" /> Get API Link</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => deleteProduct(p.slug)} className="text-destructive focus:text-destructive focus:bg-destructive/5"><Trash2 size={14} className="mr-2" /> Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Product Form Modal */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-[720px] p-0 overflow-hidden border-border shadow-2xl">
                    <DialogHeader style={{ padding: '24px', borderBottom: '1px solid var(--border)', background: 'var(--secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ padding: '3px 8px', background: 'var(--foreground)', color: 'var(--background)', borderRadius: '4px', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', ...mono }}>{editing ? 'UPDATE' : 'CREATE'}</span>
                        </div>
                        <DialogTitle style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.04em' }}>{editing ? "Edit Product" : "New Catalog Item"}</DialogTitle>
                        <DialogDescription style={{ fontSize: '14px', fontWeight: 500 }}>Define core attributes and build the customisation schema</DialogDescription>
                    </DialogHeader>

                    <ScrollArea style={{ maxHeight: '65vh' }}>
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
                            {/* Core fields */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <FieldLabel>Product Title</FieldLabel>
                                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Premium Hardcover Book" style={{ height: '42px', fontWeight: 700 }} />
                                </div>
                                <div>
                                    <FieldLabel>Type / Category</FieldLabel>
                                    <Select value={form.type} onValueChange={t => setForm({ ...form, type: t })}>
                                        <SelectTrigger style={{ height: '42px', fontSize: '13px', fontWeight: 600 }}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="product">Standard Product</SelectItem>
                                            <SelectItem value="bundle">Bundle Package</SelectItem>
                                            <SelectItem value="variant">Product Variant</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <FieldLabel>Base Price (₹)</FieldLabel>
                                    <Input type="number" value={form.base_price} onChange={e => setForm({ ...form, base_price: e.target.value })} placeholder="0.00" style={{ height: '42px', fontWeight: 800, fontSize: '16px' }} />
                                </div>
                                <div>
                                    <FieldLabel>Minimum Order Quantity</FieldLabel>
                                    <Input type="number" value={form.minimum_quantity} onChange={e => setForm({ ...form, minimum_quantity: e.target.value })} placeholder="1" style={{ height: '42px', fontWeight: 700 }} />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <FieldLabel>Description</FieldLabel>
                                    <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe this product for customers..." style={{ minHeight: '80px', fontSize: '13px', fontWeight: 500 }} />
                                </div>
                                <div style={{ gridColumn: '1 / -1', padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--secondary)/50', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <p style={{ fontSize: '13px', fontWeight: 800 }}>Listed on Storefront</p>
                                        <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontWeight: 500 }}>Uncheck to hide from public view</p>
                                    </div>
                                    <Switch checked={form.is_active} onCheckedChange={c => setForm({ ...form, is_active: c })} />
                                </div>
                            </div>

                            <Separator />

                            {/* Config Sections */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <div>
                                        <p style={{ fontSize: '15px', fontWeight: 800, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Settings2 size={16} /> Configuration Schema
                                        </p>
                                        <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontWeight: 500 }}>Customer customisation form builder</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={addSection} style={{ height: '32px', fontWeight: 700, fontSize: '11px' }}>
                                        <Plus size={14} className="mr-1" /> Add Section
                                    </Button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {form.sections.map((sec, si) => (
                                        <div key={si} style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--secondary)' }}>
                                            <div style={{ padding: '10px 16px', background: 'var(--card)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)', ...mono }}>Section 0{si + 1}</span>
                                                <Button variant="ghost" size="icon" onClick={() => removeSection(si)} style={{ height: '24px', width: '24px', color: '#dc2626' }}><X size={14} /></Button>
                                            </div>
                                            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '12px' }}>
                                                    <div>
                                                        <FieldLabel>ID Key</FieldLabel>
                                                        <Input value={sec.key} onChange={e => updateSection(si, { key: e.target.value })} placeholder="paper_type" style={{ height: '36px', fontSize: '12px', background: 'var(--background)', fontWeight: 600, ...mono }} />
                                                    </div>
                                                    <div>
                                                        <FieldLabel>Display Label</FieldLabel>
                                                        <Input value={sec.label} onChange={e => updateSection(si, { label: e.target.value })} placeholder="Paper Quality" style={{ height: '36px', fontSize: '13px', background: 'var(--background)', fontWeight: 700 }} />
                                                    </div>
                                                    <div>
                                                        <FieldLabel>Input UI</FieldLabel>
                                                        <Select value={sec.type} onValueChange={v => updateSection(si, { type: v as FormSection['type'] })}>
                                                            <SelectTrigger style={{ height: '36px', fontSize: '12px', background: 'var(--background)', fontWeight: 600 }}><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="dropdown">Dropdown</SelectItem>
                                                                <SelectItem value="radio">Radio Buttons</SelectItem>
                                                                <SelectItem value="number_input">Numeric</SelectItem>
                                                                <SelectItem value="text_input">Short Text</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                {(sec.type === 'dropdown' || sec.type === 'radio') && (
                                                    <div style={{ padding: '16px', background: 'var(--background)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                            <SectionLabel>Option Mapping</SectionLabel>
                                                            <Button variant="secondary" size="sm" onClick={() => addOption(si)} style={{ height: '24px', fontSize: '10px', fontWeight: 800 }}>+ ADD OPTION</Button>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            {(sec.options || []).map((opt, oi) => (
                                                                <div key={oi} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                    <Input placeholder="Label" value={opt.label} onChange={e => updateOption(si, oi, { label: e.target.value })} style={{ height: '32px', fontSize: '12px', fontWeight: 600 }} />
                                                                    <Input placeholder="Value" value={opt.value} onChange={e => updateOption(si, oi, { value: e.target.value })} style={{ height: '32px', fontSize: '11px', fontWeight: 600, ...mono }} />
                                                                    <div style={{ position: 'relative', width: '120px' }}>
                                                                        <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: 800, color: 'var(--muted-foreground)' }}>₹</span>
                                                                        <Input type="number" placeholder="0.00" value={opt.price_mod} onChange={e => updateOption(si, oi, { price_mod: parseFloat(e.target.value) || 0 })} style={{ height: '32px', fontSize: '12px', paddingLeft: '20px', fontWeight: 800 }} />
                                                                    </div>
                                                                    <Button variant="ghost" size="icon" onClick={() => removeOption(si, oi)} style={{ height: '32px', width: '32px', color: '#dc2626', flexShrink: 0 }}><X size={12} /></Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {form.sections.length === 0 && (
                                        <div style={{ padding: '40px', border: '1px dashed var(--border)', borderRadius: '8px', textAlign: 'center', color: 'var(--muted-foreground)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                                            <Settings2 size={24} style={{ opacity: 0.2 }} />
                                            <p style={{ fontSize: '13px', fontWeight: 500 }}>Add sections to define the customisation form for this product.</p>
                                            <Button variant="outline" onClick={addSection} style={{ gap: '6px', fontWeight: 700 }}><Plus size={13} /> Add First Section</Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', background: 'var(--secondary)', gap: '12px' }}>
                        <DialogClose asChild>
                            <Button variant="outline" style={{ fontWeight: 700, height: '40px' }}>Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleSave} disabled={saving || !form.name || !form.base_price} style={{ height: '40px', padding: '0 30px', fontWeight: 800 }}>
                            {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                            {editing ? "Save Changes" : "Create Product"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
