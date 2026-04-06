"use client";

import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { removeFromInquiry, clearInquiry, updateQuantity, updateOptions, InquiryItem } from "@/lib/store/inquirySlice";
import { useAlert } from "@/components/CustomAlert";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    ShoppingCart, Trash2, ArrowRight, ArrowLeft, Loader2,
    Plus, Minus, Info, Pencil, X, Check, Package, Layers, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ContactDetailsModal } from "@/components/ContactDetailsModal";

// ── SUBMIT HELPERS ────────────────────────────────────────────────────────────
function buildPayload(items: InquiryItem[]) {
    return items.map(item => {
        if (item.productId != null) {
            const { notes: _n, uploaded_files: _u, uploaded_file_name: _un, ...productOptions } = item.options as any;
            return {
                product_id: Number(item.productId),
                subproduct_id: item.subproductId != null ? Number(item.subproductId) : undefined,
                quantity: Number(item.quantity),
                selected_options: Object.keys(productOptions).length > 0 ? productOptions : { _default: "true" },
                notes: (item.options?.notes as string) || null,
                images: item.options?.uploaded_files || undefined,
            };
        } else if (item.serviceId != null) {
            return {
                service_id: Number(item.serviceId),
                subservice_id: item.subserviceId != null ? Number(item.subserviceId) : null,
                quantity: Number(item.quantity),
                notes: (item.options?.notes as string) || null,
                images: item.options?.uploaded_files || undefined,
            };
        }
        return null;
    }).filter((i): i is NonNullable<typeof i> => i !== null);
}

// ── EDIT DRAWER ──────────────────────────────────────────────────────────────
function EditDrawer({ item, onClose }: { item: InquiryItem; onClose: () => void }) {
    const dispatch = useAppDispatch();
    const [qty, setQty] = useState(item.quantity);
    const [notes, setNotes] = useState(String(item.options?.notes ?? ""));
    const pricePerUnit = item.pricePerUnit ?? (item.quantity > 0 ? item.estimatedPrice / item.quantity : 0);

    const handleSave = () => {
        if (qty !== item.quantity) {
            dispatch(updateQuantity({ id: item.id, quantity: qty, pricePerUnit }));
        }
        if (String(item.options?.notes ?? "") !== notes) {
            dispatch(updateOptions({
                id: item.id,
                options: { ...item.options, notes },
                estimatedPrice: qty * pricePerUnit,
            }));
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full sm:w-96 sm:rounded-xl p-6 space-y-5"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b-2 border-black pb-3">
                    <h3 className="font-black text-xl uppercase">Edit Item</h3>
                    <button onClick={onClose} className="p-1 hover:bg-zinc-100 rounded"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-14 h-14 border-2 border-black rounded-lg overflow-hidden shrink-0 bg-zinc-50">
                        <img
                            src={item.imageUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}&backgroundColor=ffffff`}
                            alt={item.name}
                            className={`w-full h-full object-cover ${!item.imageUrl ? "opacity-40" : ""}`}
                        />
                    </div>
                    <p className="font-bold text-sm leading-tight line-clamp-2">{item.name}</p>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest">Quantity</Label>
                    <div className="flex items-center border-2 border-black h-10 overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] w-40 rounded-lg">
                        <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} className="h-full px-3 border-r-2 border-black hover:bg-zinc-100"><Minus className="w-3 h-3" /></button>
                        <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} className="w-full h-full text-center font-black text-base focus:outline-none" />
                        <button type="button" onClick={() => setQty(q => q + 1)} className="h-full px-3 border-l-2 border-black hover:bg-zinc-100"><Plus className="w-3 h-3" /></button>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium">
                        ₹{pricePerUnit.toLocaleString()} / unit → <span className="font-black text-black">₹{(qty * pricePerUnit).toLocaleString()}</span>
                    </p>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest">Notes / Instructions</Label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any special instructions…" className="w-full border-2 border-black p-2 text-sm font-medium focus:outline-none resize-none rounded-lg" />
                </div>

                <div className="flex gap-3 pt-1">
                    <button onClick={onClose} className="flex-1 border-2 border-black py-2 font-black text-sm uppercase hover:bg-zinc-100 transition-colors rounded-lg">Cancel</button>
                    <button
                        onClick={handleSave}
                        className="flex-1 bg-accent-green border-2 border-black py-2 font-black text-sm uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all flex items-center justify-center gap-1 rounded-lg"
                    >
                        <Check className="w-4 h-4" /> Save
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── MAIN CART PAGE ───────────────────────────────────────────────────────────
export default function CartPage() {
    const dispatch = useAppDispatch();
    const { items, totalEstimate } = useAppSelector(s => s.inquiry);
    const { showAlert } = useAlert();
    const { user, refreshUser } = useAuth();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingItem, setEditingItem] = useState<InquiryItem | null>(null);
    const [showContactModal, setShowContactModal] = useState(false);

    const handleRemove = (id: string) => dispatch(removeFromInquiry(id));
    const handleClear = () => dispatch(clearInquiry());

    const handleQtyChange = (id: string, delta: number, currentQty: number, pricePerUnit: number, minQty = 1) => {
        const next = Math.max(minQty, currentQty + delta);
        if (next === currentQty) return;
        dispatch(updateQuantity({ id, quantity: next, pricePerUnit }));
    };

    const doSubmit = async () => {
        setIsSubmitting(true);
        try {            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/`, {
                method: "POST",
                headers: { "Content-Type": "application/json"},
                body: JSON.stringify({ items: buildPayload(items) }),
            });

            if (res.ok) {
                const data = await res.json();
                showAlert("Inquiry saved as draft! Please review and submit it to our studio.", "success");
                dispatch(clearInquiry());
                router.push(`/dashboard/inquiries/${data.id}`);
            } else {
                const err = await res.json();
                const detail = typeof err.detail === "string"
                    ? err.detail
                    : Array.isArray(err.detail)
                        ? err.detail.map((e: any) => `${e.loc?.slice(-1)[0] ?? ""}: ${e.msg}`).join("; ")
                        : JSON.stringify(err.detail);
                showAlert(`Submission failed: ${detail}`, "error");
            }
        } catch {
            showAlert("Network error. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async () => {
        if (items.length === 0) return;        if (!user) {
            showAlert("Please login to submit your inquiry.", "error");
            router.push("/auth/login");
            return;
        }

        const needsPhone = !user?.phone;
        const needsAddress = !user?.address;

        if (needsPhone || needsAddress) {
            setShowContactModal(true);
            return;
        }

        await doSubmit();
    };

    const handleContactSaved = async () => {
        setShowContactModal(false);
        await refreshUser();
        await doSubmit();
    };

    const itemCount = items.reduce((t, i) => t + i.quantity, 0);

    return (
        <div className="min-h-screen bg-site-bg font-sans">
            {editingItem && (
                <EditDrawer item={editingItem} onClose={() => setEditingItem(null)} />
            )}
            {showContactModal && (
                <ContactDetailsModal
                    existingPhone={user?.phone || null}
                    existingAddress={user?.address || null}
                    onSave={handleContactSaved}
                    onClose={() => setShowContactModal(false)}
                />
            )}

            {/* ── Hero Banner ─────────────────────────────────────── */}
            <div className="bg-[#90e8ff] border-b-2 border-black relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle,#000_1px,transparent_1px)] bg-size-[24px_24px]" />
                <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 relative z-10">
                    <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link href="/products" className="w-10 h-10 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all shrink-0">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <div className="inline-block bg-white text-black px-3 py-1 font-black text-[10px] uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -rotate-1 mb-3">
                                    Inquiry Cart
                                </div>
                                <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-black leading-[0.9]">
                                    Review <span className="text-black/40">Your Items</span>
                                </h1>
                                <p className="text-sm font-medium text-black/50 mt-2">
                                    {items.length === 0
                                        ? "Your cart is empty — start adding products!"
                                        : `${itemCount} item${itemCount > 1 ? "s" : ""} ready for inquiry`}
                                </p>
                            </div>
                        </div>
                        {items.length > 0 && (
                            <button
                                onClick={handleClear}
                                className="text-xs font-black uppercase tracking-wider text-red-600 bg-white border-2 border-red-300 hover:border-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                            >
                                <Trash2 className="w-3.5 h-3.5 inline mr-1.5" />
                                Clear All
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">

                {items.length === 0 ? (
                    /* ── Empty State ─────────────────────────────────── */
                    <div className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl p-12 md:p-20 flex flex-col items-center gap-6 text-center">
                        <div className="w-24 h-24 bg-[#FF90E8] border-3 border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-3">
                            <ShoppingCart className="w-10 h-10 text-black/30" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight">Nothing here yet</h2>
                            <p className="text-zinc-500 font-medium mt-2 max-w-md">
                                Add products or services to get a custom quote from our studio. No payment needed until you approve.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 mt-2">
                            <Button asChild className="bg-black text-white border-2 border-black rounded-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all h-12 px-8">
                                <Link href="/products">
                                    <Package className="w-4 h-4 mr-2" /> Browse Products
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="border-2 border-black rounded-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all h-12 px-8">
                                <Link href="/services">
                                    <Layers className="w-4 h-4 mr-2" /> Browse Services
                                </Link>
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* ── Cart Content Grid ───────────────────────────── */
                    <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">

                        {/* ── Cart Items ─────────────────────────────── */}
                        <div className="space-y-4">
                            {items.map(item => {
                                const pricePerUnit = item.pricePerUnit ?? (item.quantity > 0 ? item.estimatedPrice / item.quantity : 0);
                                const isService = !!item.serviceId;

                                return (
                                    <div key={item.id} className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
                                        <div className="p-5 flex gap-5">
                                            {/* Image */}
                                            <div className="w-24 h-24 border-2 border-black rounded-xl overflow-hidden shrink-0 bg-zinc-50 relative">
                                                <img
                                                    src={item.imageUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}&backgroundColor=f5f5f5`}
                                                    alt={item.name}
                                                    className={`w-full h-full object-cover ${!item.imageUrl ? "opacity-40" : ""}`}
                                                    onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}&backgroundColor=f5f5f5`; }}
                                                />
                                                {/* Type badge */}
                                                <div className={`absolute top-1 left-1 w-6 h-6 rounded-lg flex items-center justify-center border-2 border-black ${isService ? "bg-[#a788fa]" : "bg-[#90e8ff]"}`}>
                                                    {isService ? <Layers className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">
                                                            {isService ? "Service" : "Product"}
                                                        </span>
                                                        <h3 className="font-black text-base leading-tight line-clamp-2 uppercase tracking-tight">{item.name}</h3>
                                                    </div>
                                                    <div className="flex gap-1 shrink-0">
                                                        <Link
                                                            href={isService
                                                                ? `/services/request/${item.slug}?edit=${item.id}`
                                                                : `/products/customize/${item.slug}?edit=${item.id}`
                                                            }
                                                            className="p-2 hover:bg-[#fdf567] border-2 border-transparent hover:border-black transition-all rounded-lg"
                                                            title="Customize options"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleRemove(item.id)}
                                                            className="p-2 hover:bg-red-50 hover:text-red-600 border-2 border-transparent hover:border-red-200 transition-all rounded-lg"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Options tags */}
                                                {item.productId && Object.entries(item.options).filter(([k]) => k !== 'notes').length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                        {Object.entries(item.options)
                                                            .filter(([k]) => k !== 'notes' && k !== 'variant_name' && k !== 'service_slug' && k !== 'uploaded_files' && k !== 'uploaded_file_name')
                                                            .slice(0, 5)
                                                            .map(([k, v]) => (
                                                                <span key={k} className="text-[9px] font-bold bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded uppercase">
                                                                    {k.replace(/_/g, ' ')}: {String(v)}
                                                                </span>
                                                            ))}
                                                    </div>
                                                )}

                                                {/* Notes */}
                                                {item.options?.notes && (
                                                    <p className="mt-1.5 text-xs font-medium text-zinc-400 italic line-clamp-1">
                                                        📝 {String(item.options.notes)}
                                                    </p>
                                                )}

                                                {/* Qty + Price row */}
                                                <div className="mt-3 flex items-center justify-between">
                                                    <div className="flex items-center border-2 border-black h-9 overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg">
                                                        <button type="button" onClick={() => handleQtyChange(item.id, -1, item.quantity, pricePerUnit)} className="h-full px-3 border-r-2 border-black hover:bg-[#fdf567] transition-colors flex items-center">
                                                            <Minus className="w-3 h-3" />
                                                        </button>
                                                        <span className="px-4 font-black text-sm tabular-nums min-w-[40px] text-center">{item.quantity}</span>
                                                        <button type="button" onClick={() => handleQtyChange(item.id, +1, item.quantity, pricePerUnit)} className="h-full px-3 border-l-2 border-black hover:bg-accent-green transition-colors flex items-center">
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xl font-black">₹{item.estimatedPrice.toLocaleString()}</div>
                                                        {item.quantity > 1 && (
                                                            <div className="text-[10px] font-bold text-zinc-400">₹{pricePerUnit.toLocaleString()} / unit</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Info callout */}
                            <div className="flex items-start gap-3 bg-[#fdf567] border-2 border-black p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-xl">
                                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                                <p className="text-xs font-bold">
                                    Prices shown are <span className="underline">estimates</span>. Our studio will review your inquiry and send a final quote. No payment needed yet.
                                </p>
                            </div>
                        </div>

                        {/* ── Order Summary (Sticky) ─────────────────── */}
                        <div className="lg:sticky lg:top-6 space-y-4">
                            <div className="bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl p-6 space-y-5">
                                <h2 className="text-xl font-black uppercase tracking-tight border-b-2 border-black pb-3 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5" />
                                    Order Summary
                                </h2>

                                <div className="space-y-2.5">
                                    {items.map(item => (
                                        <div key={item.id} className="flex justify-between items-center text-sm gap-2">
                                            <span className="font-medium text-zinc-500 line-clamp-1 shrink min-w-0">
                                                {item.name} <span className="text-zinc-300">×{item.quantity}</span>
                                            </span>
                                            <span className="font-bold shrink-0">₹{item.estimatedPrice.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t-2 border-black pt-4 space-y-2.5">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-zinc-400 text-sm">Shipping</span>
                                        <span className="text-[9px] font-black uppercase bg-[#fdf567] border border-black px-2 py-0.5 rounded">After Quote</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-zinc-400 text-sm">Tax (GST)</span>
                                        <span className="text-[9px] font-black uppercase bg-zinc-100 border border-black px-2 py-0.5 rounded">After Quote</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t-2 border-dashed border-zinc-200">
                                        <span className="text-base font-black uppercase tracking-tight">Estimate</span>
                                        <span className="text-2xl font-black">₹{totalEstimate.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* CTA Buttons with proper spacing */}
                                <div className="space-y-3 pt-2">
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="w-full h-14 bg-accent-green text-black font-black uppercase text-base border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5" />
                                                Submit Inquiry
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        asChild
                                        variant="outline"
                                        className="w-full h-11 border-2 border-black rounded-xl font-black uppercase text-xs tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)] hover:bg-zinc-50 transition-all"
                                    >
                                        <Link href="/products">
                                            <ArrowLeft className="w-4 h-4 mr-2" /> Continue Shopping
                                        </Link>
                                    </Button>
                                </div>

                                <p className="text-center text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed pt-1">
                                    Quotes are finalized by PrintPack Studio.<br />Secure payment link sent after approval.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
