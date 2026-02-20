import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Service, ServiceVariant } from "@/types";
import {
    Wrench, Plus, Pencil, Trash2, X, Loader2, Save,
    ChevronDown, ChevronUp, Layers
} from "lucide-react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <label style={{
        display: 'block', fontSize: '9px', fontWeight: 700,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'var(--muted-foreground)', ...mono, marginBottom: '5px',
    }}>{children}</label>
);

export default function Services() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<number | null>(null);

    // Service form
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [serviceForm, setServiceForm] = useState({ name: "", is_active: true });
    const [savingService, setSavingService] = useState(false);

    // Variant form
    const [showVariantForm, setShowVariantForm] = useState<{ svcSlug: string; variant?: ServiceVariant } | null>(null);
    const [varForm, setVarForm] = useState({ name: "", base_price: "", price_per_unit: "", description: "" });
    const [savingVariant, setSavingVariant] = useState(false);

    const fetchServices = () => {
        setLoading(true);
        api<Service[]>("/services/")
            .then(setServices).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { fetchServices(); }, []);

    const openCreateService = () => {
        setEditingService(null);
        setServiceForm({ name: "", is_active: true });
        setShowServiceForm(true);
    };

    const openEditService = (s: Service) => {
        setEditingService(s);
        setServiceForm({ name: s.name, is_active: s.is_active });
        setShowServiceForm(true);
    };

    const saveService = async () => {
        setSavingService(true);
        try {
            if (editingService) {
                await api(`/services/${editingService.slug}`, { method: "PUT", body: JSON.stringify(serviceForm) });
            } else {
                await api("/services/", { method: "POST", body: JSON.stringify(serviceForm) });
            }
            setShowServiceForm(false);
            fetchServices();
        } catch (e) { console.error(e); } finally { setSavingService(false); }
    };

    const deleteService = async (slug: string) => {
        if (!confirm("Permanently delete this service and all its variants?")) return;
        try { await api(`/services/${slug}`, { method: "DELETE" }); fetchServices(); } catch (e) { console.error(e); }
    };

    const openCreateVariant = (svcSlug: string) => {
        setShowVariantForm({ svcSlug });
        setVarForm({ name: "", base_price: "", price_per_unit: "", description: "" });
    };

    const openEditVariant = (svcSlug: string, v: ServiceVariant) => {
        setShowVariantForm({ svcSlug, variant: v });
        setVarForm({
            name: v.name,
            base_price: String(v.base_price),
            price_per_unit: String(v.price_per_unit),
            description: v.description || "",
        });
    };

    const saveVariant = async () => {
        if (!showVariantForm) return;
        setSavingVariant(true);
        const body = {
            name: varForm.name,
            base_price: parseFloat(varForm.base_price),
            price_per_unit: parseFloat(varForm.price_per_unit),
            description: varForm.description || undefined,
        };
        try {
            if (showVariantForm.variant) {
                await api(`/services/${showVariantForm.svcSlug}/variants/${showVariantForm.variant.id}`, {
                    method: "PUT", body: JSON.stringify(body),
                });
            } else {
                await api(`/services/${showVariantForm.svcSlug}/variants`, {
                    method: "POST", body: JSON.stringify(body),
                });
            }
            setShowVariantForm(null);
            fetchServices();
        } catch (e) { console.error(e); } finally { setSavingVariant(false); }
    };

    const deleteVariant = async (svcSlug: string, variantId: number) => {
        if (!confirm("Delete this variant?")) return;
        try {
            await api(`/services/${svcSlug}/variants/${variantId}`, { method: "DELETE" });
            fetchServices();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="animate-fade-in" style={{ fontFamily: "'DM Sans', system-ui" }}>

            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                paddingBottom: '24px', borderBottom: '1px solid var(--border)', marginBottom: '28px',
            }}>
                <div>
                    <p style={{
                        fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em',
                        textTransform: 'uppercase', color: 'var(--muted-foreground)',
                        ...mono, marginBottom: '4px',
                    }}>
                        Service Catalog
                    </p>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>
                        Services
                        <span style={{
                            fontSize: '14px', fontWeight: 500, color: 'var(--muted-foreground)',
                            marginLeft: '10px', letterSpacing: 0,
                        }}>
                            {services.length} categories
                        </span>
                    </h1>
                </div>
                <button onClick={openCreateService} style={{
                    height: '36px', padding: '0 16px', background: 'var(--foreground)',
                    color: 'var(--background)', border: 'none', borderRadius: '6px',
                    fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontFamily: "'DM Sans', system-ui",
                }}>
                    <Plus size={14} /> New Service
                </button>
            </div>

            {/* Services List */}
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{
                            height: '64px', background: 'var(--secondary)',
                            borderRadius: '8px', border: '1px solid var(--border)',
                            animation: 'pulse 1.5s ease-in-out infinite',
                        }} />
                    ))}
                </div>
            ) : services.length === 0 ? (
                <div style={{
                    padding: '80px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '12px',
                    border: '1px dashed var(--border)', borderRadius: '8px',
                }}>
                    <Wrench size={40} style={{ color: 'var(--border)' }} />
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted-foreground)' }}>
                        No services yet
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {services.map(s => (
                        <div key={s.id} style={{
                            border: '1px solid var(--border)', borderRadius: '8px',
                            background: 'var(--card)', overflow: 'hidden',
                            transition: 'border-color 0.15s',
                        }}>
                            {/* Service Row */}
                            <div
                                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                                style={{
                                    padding: '16px 20px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '16px',
                                    transition: 'background 0.1s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--secondary)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                {/* Status dot */}
                                <div style={{
                                    width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                                    background: s.is_active ? '#16a34a' : '#d4d4d4',
                                }} />

                                {/* Name + slug */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                                        <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                                            {s.name}
                                        </span>
                                        <span style={{
                                            fontSize: '10px', color: 'var(--muted-foreground)',
                                            ...mono, fontWeight: 500,
                                        }}>
                                            {s.slug}
                                        </span>
                                    </div>
                                </div>

                                {/* Variant count */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '5px',
                                    padding: '3px 9px', background: 'var(--secondary)',
                                    border: '1px solid var(--border)', borderRadius: '4px',
                                }}>
                                    <Layers size={11} style={{ color: 'var(--muted-foreground)' }} />
                                    <span style={{ fontSize: '11px', fontWeight: 700, ...mono }}>
                                        {s.variants.length} tier{s.variants.length !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                {/* Status badge */}
                                <span style={{
                                    padding: '2px 8px', borderRadius: '3px', fontSize: '9px',
                                    fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', ...mono,
                                    background: s.is_active ? '#f0fdf4' : 'var(--secondary)',
                                    color: s.is_active ? '#16a34a' : '#737373',
                                    border: `1px solid ${s.is_active ? '#bbf7d0' : 'var(--border)'}`,
                                }}>
                                    {s.is_active ? 'Active' : 'Archived'}
                                </span>

                                {/* Action buttons */}
                                <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => openEditService(s)}
                                        style={{
                                            width: '30px', height: '30px', background: 'var(--secondary)',
                                            border: '1px solid var(--border)', borderRadius: '5px',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', color: 'var(--muted-foreground)',
                                        }}
                                    >
                                        <Pencil size={12} />
                                    </button>
                                    <button
                                        onClick={() => deleteService(s.slug)}
                                        style={{
                                            width: '30px', height: '30px', background: 'var(--secondary)',
                                            border: '1px solid var(--border)', borderRadius: '5px',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', color: '#dc2626',
                                        }}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>

                                {/* Expand icon */}
                                <div style={{ color: 'var(--muted-foreground)', flexShrink: 0 }}>
                                    {expanded === s.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                            </div>

                            {/* Expanded Variants Panel */}
                            {expanded === s.id && (
                                <div style={{
                                    borderTop: '1px solid var(--border)',
                                    background: 'var(--secondary)',
                                    padding: '20px',
                                    animation: 'fade-in 0.15s ease-out',
                                }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: 'space-between', marginBottom: '14px',
                                    }}>
                                        <p style={{
                                            fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em',
                                            textTransform: 'uppercase', color: 'var(--muted-foreground)', ...mono,
                                        }}>
                                            Service Tiers · {s.variants.length}
                                        </p>
                                        <button
                                            onClick={() => openCreateVariant(s.slug)}
                                            style={{
                                                height: '28px', padding: '0 10px',
                                                background: 'var(--background)',
                                                border: '1px solid var(--border)', borderRadius: '5px',
                                                fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                fontFamily: "'DM Sans', system-ui", color: 'var(--foreground)',
                                            }}
                                        >
                                            <Plus size={11} /> Add Tier
                                        </button>
                                    </div>

                                    {s.variants.length === 0 ? (
                                        <div style={{
                                            padding: '24px', border: '1px dashed var(--border)',
                                            borderRadius: '6px', textAlign: 'center',
                                        }}>
                                            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontWeight: 500 }}>
                                                No tiers yet — add a tier to define pricing options
                                            </p>
                                        </div>
                                    ) : (
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                                            gap: '8px',
                                        }}>
                                            {s.variants.map(v => (
                                                <div key={v.id} style={{
                                                    background: 'var(--card)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '6px', overflow: 'hidden',
                                                    transition: 'border-color 0.15s, box-shadow 0.15s',
                                                }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.borderColor = 'var(--foreground)';
                                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.borderColor = 'var(--border)';
                                                        e.currentTarget.style.boxShadow = 'none';
                                                    }}
                                                >
                                                    <div style={{ padding: '12px 14px' }}>
                                                        <div style={{
                                                            display: 'flex', alignItems: 'flex-start',
                                                            justifyContent: 'space-between', marginBottom: '10px',
                                                        }}>
                                                            <p style={{
                                                                fontSize: '13px', fontWeight: 800,
                                                                letterSpacing: '-0.02em', flex: 1, minWidth: 0,
                                                            }}>
                                                                {v.name}
                                                            </p>
                                                            <div style={{ display: 'flex', gap: '3px', flexShrink: 0, marginLeft: '6px' }}>
                                                                <button
                                                                    onClick={() => openEditVariant(s.slug, v)}
                                                                    style={{
                                                                        width: '24px', height: '24px', background: 'var(--secondary)',
                                                                        border: '1px solid var(--border)', borderRadius: '4px',
                                                                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                                        justifyContent: 'center', color: 'var(--muted-foreground)',
                                                                    }}
                                                                >
                                                                    <Pencil size={10} />
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteVariant(s.slug, v.id)}
                                                                    style={{
                                                                        width: '24px', height: '24px', background: 'var(--secondary)',
                                                                        border: '1px solid var(--border)', borderRadius: '4px',
                                                                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                                        justifyContent: 'center', color: '#dc2626',
                                                                    }}
                                                                >
                                                                    <Trash2 size={10} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {v.description && (
                                                            <p style={{
                                                                fontSize: '11px', color: 'var(--muted-foreground)',
                                                                lineHeight: 1.5, marginBottom: '10px',
                                                                display: '-webkit-box', WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                                            }}>
                                                                {v.description}
                                                            </p>
                                                        )}

                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                                            {[
                                                                { label: 'Base', value: `₹${v.base_price}` },
                                                                { label: 'Per Unit', value: `₹${v.price_per_unit}` },
                                                            ].map(item => (
                                                                <div key={item.label} style={{
                                                                    padding: '7px 10px', background: 'var(--secondary)',
                                                                    border: '1px solid var(--border)', borderRadius: '4px',
                                                                }}>
                                                                    <p style={{
                                                                        fontSize: '8px', fontWeight: 700, letterSpacing: '0.1em',
                                                                        textTransform: 'uppercase', color: 'var(--muted-foreground)',
                                                                        ...mono, marginBottom: '2px',
                                                                    }}>{item.label}</p>
                                                                    <p style={{
                                                                        fontSize: '15px', fontWeight: 900,
                                                                        letterSpacing: '-0.03em',
                                                                    }}>{item.value}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Service Form Modal ── */}
            <Dialog open={showServiceForm} onOpenChange={setShowServiceForm}>
                <DialogContent style={{
                    maxWidth: '420px', padding: 0, overflow: 'hidden',
                    border: '1px solid var(--border)',
                }}>
                    <DialogHeader style={{
                        padding: '20px 24px', borderBottom: '1px solid var(--border)',
                        background: 'var(--secondary)',
                    }}>
                        <DialogTitle style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.03em' }}>
                            {editingService ? "Edit Service" : "New Service"}
                        </DialogTitle>
                        <DialogDescription style={{ fontSize: '12px' }}>
                            {editingService ? "Update service name and visibility." : "Create a new service category."}
                        </DialogDescription>
                    </DialogHeader>

                    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <FieldLabel>Service Name</FieldLabel>
                            <Input
                                value={serviceForm.name}
                                onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                                placeholder="e.g. Spiral Binding"
                                style={{ height: '40px', fontSize: '13px' }}
                            />
                        </div>

                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 14px', border: '1px solid var(--border)',
                            borderRadius: '6px', background: 'var(--secondary)',
                        }}>
                            <div>
                                <p style={{ fontSize: '13px', fontWeight: 700, marginBottom: '1px' }}>Published</p>
                                <p style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                                    Visible to customers
                                </p>
                            </div>
                            <Switch
                                checked={serviceForm.is_active}
                                onCheckedChange={c => setServiceForm({ ...serviceForm, is_active: c })}
                            />
                        </div>
                    </div>

                    <DialogFooter style={{
                        padding: '14px 24px', borderTop: '1px solid var(--border)',
                        background: 'var(--secondary)', display: 'flex', gap: '8px',
                    }}>
                        <DialogClose asChild>
                            <Button variant="outline" style={{ fontWeight: 600 }}>Cancel</Button>
                        </DialogClose>
                        <button
                            onClick={saveService}
                            disabled={savingService || !serviceForm.name.trim()}
                            style={{
                                height: '36px', padding: '0 20px',
                                background: savingService || !serviceForm.name.trim() ? 'var(--muted)' : 'var(--foreground)',
                                color: 'var(--background)', border: 'none', borderRadius: '6px',
                                fontSize: '13px', fontWeight: 700,
                                cursor: savingService || !serviceForm.name.trim() ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '7px',
                                fontFamily: "'DM Sans', system-ui",
                            }}
                        >
                            {savingService
                                ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                                : <Save size={14} />
                            }
                            {editingService ? "Save Changes" : "Create Service"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Variant Form Modal ── */}
            <Dialog open={!!showVariantForm} onOpenChange={(open) => !open && setShowVariantForm(null)}>
                <DialogContent style={{
                    maxWidth: '460px', padding: 0, overflow: 'hidden',
                    border: '1px solid var(--border)',
                }}>
                    <DialogHeader style={{
                        padding: '20px 24px', borderBottom: '1px solid var(--border)',
                        background: 'var(--secondary)',
                    }}>
                        <DialogTitle style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.03em' }}>
                            {showVariantForm?.variant ? "Edit Tier" : "Add Tier"}
                        </DialogTitle>
                        <DialogDescription style={{ fontSize: '12px' }}>
                            Define pricing and details for this service tier.
                        </DialogDescription>
                    </DialogHeader>

                    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                            <FieldLabel>Tier Name</FieldLabel>
                            <Input
                                value={varForm.name}
                                onChange={e => setVarForm({ ...varForm, name: e.target.value })}
                                placeholder="e.g. Classic Glossy A4"
                                style={{ height: '40px', fontSize: '13px' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <FieldLabel>Base Price (₹)</FieldLabel>
                                <Input
                                    type="number"
                                    value={varForm.base_price}
                                    onChange={e => setVarForm({ ...varForm, base_price: e.target.value })}
                                    placeholder="0"
                                    style={{ height: '40px', fontSize: '13px' }}
                                />
                            </div>
                            <div>
                                <FieldLabel>Price Per Unit (₹)</FieldLabel>
                                <Input
                                    type="number"
                                    value={varForm.price_per_unit}
                                    onChange={e => setVarForm({ ...varForm, price_per_unit: e.target.value })}
                                    placeholder="0"
                                    style={{ height: '40px', fontSize: '13px' }}
                                />
                            </div>
                        </div>

                        <div>
                            <FieldLabel>Description (optional)</FieldLabel>
                            <Textarea
                                value={varForm.description}
                                onChange={e => setVarForm({ ...varForm, description: e.target.value })}
                                placeholder="Describe features, specs, limitations..."
                                style={{ minHeight: '80px', fontSize: '13px', resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    <DialogFooter style={{
                        padding: '14px 24px', borderTop: '1px solid var(--border)',
                        background: 'var(--secondary)', display: 'flex', gap: '8px',
                    }}>
                        <Button variant="outline" onClick={() => setShowVariantForm(null)} style={{ fontWeight: 600 }}>
                            Cancel
                        </Button>
                        <button
                            onClick={saveVariant}
                            disabled={savingVariant || !varForm.name.trim() || !varForm.base_price}
                            style={{
                                height: '36px', padding: '0 20px',
                                background: savingVariant || !varForm.name.trim() || !varForm.base_price
                                    ? 'var(--muted)' : 'var(--foreground)',
                                color: 'var(--background)', border: 'none', borderRadius: '6px',
                                fontSize: '13px', fontWeight: 700,
                                cursor: savingVariant || !varForm.name.trim() || !varForm.base_price
                                    ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '7px',
                                fontFamily: "'DM Sans', system-ui",
                            }}
                        >
                            {savingVariant
                                ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                                : <Save size={14} />
                            }
                            {showVariantForm?.variant ? "Save Tier" : "Add Tier"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}