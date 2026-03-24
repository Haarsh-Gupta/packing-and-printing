"use client";

import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { removeFromInquiry, clearInquiry, updateQuantity, updateOptions, InquiryItem } from "@/lib/store/inquirySlice";
import { useAlert } from "@/components/CustomAlert";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
    ShoppingCart, Trash2, ArrowRight, ArrowLeft, Loader2,
    Plus, Minus, Info, Pencil, X, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Inquiry } from "@/types/dashboard";

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
        // Update quantity through the proper action
        if (qty !== item.quantity) {
            dispatch(updateQuantity({ id: item.id, quantity: qty, pricePerUnit }));
        }
        // Update notes via updateOptions (preserving other options)
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
                className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full sm:w-96 p-6 space-y-5 sm:rounded-none"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-black pb-3">
                    <h3 className="font-black text-xl uppercase">Edit Item</h3>
                    <button onClick={onClose} className="p-1 hover:bg-zinc-100"><X className="w-5 h-5" /></button>
                </div>

                {/* Image + Name */}
                <div className="flex items-center gap-3">
                    <div className="w-14 h-14 border-2 border-black overflow-hidden shrink-0 bg-zinc-50">
                        <img
                            src={item.imageUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}&backgroundColor=ffffff`}
                            alt={item.name}
                            className={`w-full h-full object-cover ${!item.imageUrl ? "opacity-40" : ""}`}
                        />
                    </div>
                    <p className="font-bold text-sm leading-tight line-clamp-2">{item.name}</p>
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest">Quantity</Label>
                    <div className="flex items-center border-2 border-black h-10 overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] w-40">
                        <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} className="h-full px-3 border-r-2 border-black hover:bg-zinc-100"><Minus className="w-3 h-3" /></button>
                        <input
                            type="number"
                            min={1}
                            value={qty}
                            onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                            className="w-full h-full text-center font-black text-base focus:outline-none"
                        />
                        <button type="button" onClick={() => setQty(q => q + 1)} className="h-full px-3 border-l-2 border-black hover:bg-zinc-100"><Plus className="w-3 h-3" /></button>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium">
                        ₹{pricePerUnit.toLocaleString()} / unit → <span className="font-black text-black">₹{(qty * pricePerUnit).toLocaleString()}</span>
                    </p>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest">Notes / Instructions</Label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Any special instructions…"
                        className="w-full border-2 border-black p-2 text-sm font-medium focus:outline-none resize-none"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                    <button onClick={onClose} className="flex-1 border-2 border-black py-2 font-black text-sm uppercase hover:bg-zinc-100 transition-colors">Cancel</button>
                    <button
                        onClick={handleSave}
                        className="flex-1 bg-[#4be794] border-2 border-black py-2 font-black text-sm uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all flex items-center justify-center gap-1"
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
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingItem, setEditingItem] = useState<InquiryItem | null>(null);

    const handleRemove = (id: string) => dispatch(removeFromInquiry(id));
    const handleClear = () => dispatch(clearInquiry());

    const handleQtyChange = (id: string, delta: number, currentQty: number, pricePerUnit: number, minQty = 1) => {
        const next = Math.max(minQty, currentQty + delta);
        if (next === currentQty) return;
        dispatch(updateQuantity({ id, quantity: next, pricePerUnit }));
    };

    const handleSubmit = async () => {
        if (items.length === 0) return;
        const token = localStorage.getItem("access_token");
        if (!token) {
            showAlert("Please login to submit your inquiry.", "error");
            router.push("/auth/login");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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

    return (
        <div className="min-h-screen bg-site-bg text-border-black font-sans">
            {editingItem && (
                <EditDrawer item={editingItem} onClose={() => setEditingItem(null)} />
            )}

            <div className="max-w-5xl mx-auto px-4 py-10 md:py-16 space-y-10">

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="flex items-center justify-between border-b-4 border-black pb-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild className="rounded-none hover:bg-zinc-100">
                            <Link href="/products"><ArrowLeft className="w-5 h-5" /></Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight flex items-center gap-2">
                                <ShoppingCart className="w-8 h-8" /> Your Cart
                            </h1>
                            <p className="text-sm font-medium text-zinc-500 mt-1">
                                {items.length === 0
                                    ? "Your cart is empty"
                                    : `${items.reduce((t, i) => t + i.quantity, 0)} item(s) — review before submitting`}
                            </p>
                        </div>
                    </div>
                    {items.length > 0 && (
                        <button
                            onClick={handleClear}
                            className="text-sm font-black uppercase tracking-wider text-red-600 border-2 border-red-200 hover:border-red-600 hover:bg-red-50 px-4 py-2 transition-colors"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                {items.length === 0 ? (
                    <div className="border-4 border-dashed border-black bg-white p-16 flex flex-col items-center gap-6 text-center">
                        <ShoppingCart className="w-20 h-20 text-zinc-200" />
                        <div>
                            <h2 className="text-2xl font-black uppercase">Nothing here yet</h2>
                            <p className="text-zinc-500 font-medium mt-1">Add products or services to get a quote from our studio.</p>
                        </div>
                        <div className="flex gap-3">
                            <Button asChild className="bg-black text-white border-2 border-black rounded-none font-black uppercase hover:bg-zinc-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all">
                                <Link href="/products">Browse Products</Link>
                            </Button>
                            <Button asChild variant="outline" className="border-2 border-black rounded-none font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all">
                                <Link href="/services">Browse Services</Link>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">

                        {/* ── Cart Items ───────────────────────────────── */}
                        <div className="space-y-4">
                            {items.map(item => {
                                const pricePerUnit = item.pricePerUnit ?? (item.quantity > 0 ? item.estimatedPrice / item.quantity : 0);

                                return (
                                    <div key={item.id} className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 flex gap-5">

                                        {/* Image */}
                                        <div className="w-20 h-20 border-2 border-black overflow-hidden shrink-0 bg-zinc-50">
                                            <img
                                                src={item.imageUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}&backgroundColor=f5f5f5`}
                                                alt={item.name}
                                                className={`w-full h-full object-cover ${!item.imageUrl ? "opacity-40" : ""}`}
                                                onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}&backgroundColor=f5f5f5`; }}
                                            />
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                                        {item.serviceId ? "Service" : "Product"}
                                                    </span>
                                                    <h3 className="font-bold text-lg leading-tight line-clamp-2">{item.name}</h3>
                                                </div>
                                                <div className="flex gap-1 shrink-0">
                                                    <Link
                                                        href={item.serviceId
                                                            ? `/services/request/${item.slug}?edit=${item.id}`
                                                            : `/products/customize/${item.slug}?edit=${item.id}`
                                                        }
                                                        className="p-2 hover:bg-[#fdf567] border border-transparent hover:border-black transition-colors rounded-none"
                                                        title="Customize options"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleRemove(item.id)}
                                                        className="p-2 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Options */}
                                            {item.productId && Object.entries(item.options).filter(([k]) => k !== 'notes').length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {Object.entries(item.options)
                                                        .filter(([k]) => k !== 'notes' && k !== 'variant_name' && k !== 'service_slug')
                                                        .slice(0, 4)
                                                        .map(([k, v]) => (
                                                            <span key={k} className="text-[10px] font-bold bg-zinc-100 border border-zinc-200 px-2 py-0.5 uppercase">
                                                                {k.replace(/_/g, ' ')}: {String(v)}
                                                            </span>
                                                        ))}
                                                </div>
                                            )}

                                            {/* Notes */}
                                            {item.options?.notes && (
                                                <p className="mt-1 text-xs font-medium text-zinc-500 italic">Note: {String(item.options.notes)}</p>
                                            )}

                                            {/* Qty + Price */}
                                            <div className="mt-3 flex items-center justify-between">
                                                <div className="flex items-center border-2 border-black h-9 overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                    <button type="button" onClick={() => handleQtyChange(item.id, -1, item.quantity, pricePerUnit)} className="h-full px-3 border-r-2 border-black hover:bg-zinc-100 flex items-center">
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="px-4 font-black text-sm tabular-nums min-w-[40px] text-center">{item.quantity}</span>
                                                    <button type="button" onClick={() => handleQtyChange(item.id, +1, item.quantity, pricePerUnit)} className="h-full px-3 border-l-2 border-black hover:bg-zinc-100 flex items-center">
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xl font-black">₹{item.estimatedPrice.toLocaleString()}</div>
                                                    {item.quantity > 1 && (
                                                        <div className="text-xs font-bold text-zinc-400">₹{pricePerUnit.toLocaleString()} / unit</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Info */}
                            <div className="flex items-start gap-3 bg-[#fdf567] border-2 border-black p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                                <p className="text-xs font-bold">
                                    Prices shown are <span className="underline">estimates</span>. Our studio will review your inquiry and send a final quote. No payment needed yet.
                                </p>
                            </div>
                        </div>

                        {/* ── Order Summary ────────────────────────────── */}
                        <div className="bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 space-y-5 sticky top-6">
                            <h2 className="text-xl font-black uppercase border-b-2 border-black pb-3">Order Summary</h2>

                            <div className="space-y-3">
                                {items.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm gap-2">
                                        <span className="font-medium text-zinc-600 line-clamp-1 shrink">{item.name} ×{item.quantity}</span>
                                        <span className="font-bold shrink-0">₹{item.estimatedPrice.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t-2 border-black pt-4 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-zinc-500">Shipping</span>
                                    <span className="text-xs font-black uppercase bg-zinc-100 border border-black px-2 py-0.5">Calculated later</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-black uppercase">Estimate Total</span>
                                    <span className="text-2xl font-black text-black">₹{totalEstimate.toLocaleString()}</span>
                                </div>
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full h-14 bg-[#4be794] text-black font-black uppercase text-base border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Submit Inquiry
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>

                            <p className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
                                Quotes are finalized by PrintPack Studio.<br />Secure payment link sent after approval.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
