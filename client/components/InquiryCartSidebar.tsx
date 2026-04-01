"use client";

import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { removeFromInquiry, clearInquiry, updateQuantity } from "@/lib/store/inquirySlice";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, Loader2, ArrowRight, LayoutList, Minus, Plus, Sparkles, Package, Layers, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAlert } from "@/components/CustomAlert";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ContactDetailsModal } from "@/components/ContactDetailsModal";

/* ── Confetti burst on add-to-cart ─────────────────────────────────────────── */
function ConfettiBurst({ trigger }: { trigger: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (trigger === 0) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = 60;
        canvas.height = 60;
        const colors = ["#FF90E8", "#4be794", "#fdf567", "#a788fa", "#87CEEB"];
        const particles: { x: number; y: number; vx: number; vy: number; r: number; c: string; life: number }[] = [];

        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 * i) / 16;
            particles.push({
                x: 30, y: 30,
                vx: Math.cos(angle) * (2 + Math.random() * 3),
                vy: Math.sin(angle) * (2 + Math.random() * 3),
                r: 2 + Math.random() * 2,
                c: colors[Math.floor(Math.random() * colors.length)],
                life: 1,
            });
        }

        let raf: number;
        const draw = () => {
            ctx.clearRect(0, 0, 60, 60);
            let alive = false;
            particles.forEach(p => {
                if (p.life <= 0) return;
                alive = true;
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.15;
                p.life -= 0.03;
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.fillStyle = p.c;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            });
            if (alive) raf = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(raf);
    }, [trigger]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute -top-4 -right-4 w-[60px] h-[60px] pointer-events-none z-50"
        />
    );
}

/* ── Main Sidebar Component ────────────────────────────────────────────────── */
export default function InquiryCartSidebar() {
    const dispatch = useAppDispatch();
    const { items, totalEstimate } = useAppSelector((state) => state.inquiry);
    const { showAlert } = useAlert();
    const router = useRouter();
    const { user, refreshUser } = useAuth();

    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [confettiKey, setConfettiKey] = useState(0);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const prevCountRef = useRef(items.length);

    // Confetti burst when a new item is added
    useEffect(() => {
        if (items.length > prevCountRef.current) {
            setConfettiKey(k => k + 1);
        }
        prevCountRef.current = items.length;
    }, [items.length]);

    const handleRemove = (id: string) => {
        setRemovingId(id);
        setTimeout(() => {
            dispatch(removeFromInquiry(id));
            setRemovingId(null);
        }, 300);
    };

    const handleClear = () => {
        dispatch(clearInquiry());
    };

    const handleQtyChange = (id: string, delta: number, currentQty: number, pricePerUnit: number) => {
        const next = Math.max(1, currentQty + delta);
        if (next === currentQty) return;
        dispatch(updateQuantity({ id, quantity: next, pricePerUnit }));
    };

    const doSubmit = async () => {
        setIsSubmitting(true);
        const token = localStorage.getItem("access_token");

        const payloadItems = items.map(item => {
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

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ items: payloadItems })
            });

            if (res.ok) {
                const data = await res.json();
                showAlert("Inquiry saved as draft! Please review and submit it to our studio.", "success");
                dispatch(clearInquiry());
                setIsOpen(false);
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
        } catch (error) {
            console.error("Submission error:", error);
            showAlert("Network error. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitInquiry = async () => {
        if (items.length === 0) return;

        const token = localStorage.getItem("access_token");
        if (!token) {
            showAlert("Please login to submit your inquiry.", "error");
            setIsOpen(false);
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

    const itemCount = items.reduce((total, item) => total + item.quantity, 0);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            {showContactModal && (
                <ContactDetailsModal
                    existingPhone={user?.phone || null}
                    existingAddress={user?.address || null}
                    onSave={handleContactSaved}
                    onClose={() => setShowContactModal(false)}
                />
            )}
            {/* ── Trigger Button ──────────────────────────────────────────── */}
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative p-0 h-9 w-9 bg-[#d5fa90] border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all cursor-pointer flex items-center justify-center shrink-0"
                >
                    <ShoppingCart className="h-4 w-4 text-black" />
                    {itemCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-[#FF90E8] text-black text-[10px] font-black min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] animate-[bounce_0.4s_ease-out]">
                            {itemCount}
                        </span>
                    )}
                    <ConfettiBurst trigger={confettiKey} />
                </Button>
            </SheetTrigger>

            {/* ── Sidebar Panel ───────────────────────────────────────────── */}
            <SheetContent className="w-full sm:max-w-[420px] bg-[#F9F6EE] border-l-4 border-black p-0 flex flex-col z-[1001] overflow-hidden">
                <SheetHeader className="sr-only">
                    <SheetTitle>Your Cart</SheetTitle>
                </SheetHeader>

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-6 py-5 border-b-4 border-black bg-[#FF90E8] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                            <ShoppingCart className="w-5 h-5 text-[#FF90E8]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight uppercase text-black leading-none">Your Cart</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 mt-0.5">
                                {itemCount === 0 ? "Empty" : `${itemCount} item${itemCount > 1 ? "s" : ""}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {items.length > 0 && (
                            <button
                                onClick={handleClear}
                                className="p-2 bg-black/10 hover:bg-red-500 hover:text-white text-black/70 rounded-lg transition-all text-xs font-black uppercase"
                                title="Clear all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 bg-black/10 hover:bg-black hover:text-[#FF90E8] text-black/70 rounded-lg transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* ── Cart Items ──────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                    {items.length === 0 ? (
                        <div className="mt-12 flex flex-col items-center gap-5">
                            {/* Fun empty state */}
                            <div className="w-24 h-24 bg-white border-3 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center rotate-3">
                                <ShoppingCart className="w-10 h-10 text-black/20" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-black uppercase tracking-tight">Nothing here yet</h3>
                                <p className="text-sm text-zinc-500 font-medium mt-1">Explore our catalog to get started</p>
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    href="/products"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 bg-black text-white text-xs font-black uppercase tracking-wider border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all"
                                >
                                    Products
                                </Link>
                                <Link
                                    href="/services"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 bg-[#a788fa] text-black text-xs font-black uppercase tracking-wider border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all"
                                >
                                    Services
                                </Link>
                            </div>
                        </div>
                    ) : (
                        items.map((item) => {
                            const pricePerUnit = item.pricePerUnit ?? (item.quantity > 0 ? item.estimatedPrice / item.quantity : 0);
                            const isRemoving = removingId === item.id;

                            return (
                                <div
                                    key={item.id}
                                    className={`bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-3.5 transition-all duration-300 ${isRemoving ? "opacity-0 scale-95 -translate-x-8" : "opacity-100 scale-100 translate-x-0"}`}
                                >
                                    <div className="flex gap-3">
                                        {/* Thumbnail */}
                                        <div className="w-16 h-16 border-2 border-black rounded-lg overflow-hidden shrink-0 bg-zinc-50 relative">
                                            <img
                                                src={item.imageUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}&backgroundColor=f9f6ee`}
                                                alt={item.name}
                                                className={`w-full h-full object-cover ${!item.imageUrl ? "opacity-40" : ""}`}
                                                onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}&backgroundColor=f9f6ee`; }}
                                            />
                                            {/* Type badge */}
                                            <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-md flex items-center justify-center ${item.serviceId ? "bg-[#a788fa]" : "bg-[#87CEEB]"} border border-black`}>
                                                {item.serviceId ? <Layers className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-sm leading-tight line-clamp-1" title={item.name}>
                                                {item.name}
                                            </h3>
                                            <p className="text-lg font-black tracking-tight mt-0.5">
                                                ₹{item.estimatedPrice.toLocaleString()}
                                                {item.quantity > 1 && (
                                                    <span className="text-[10px] font-bold text-zinc-400 ml-1">
                                                        (₹{pricePerUnit.toLocaleString()}/ea)
                                                    </span>
                                                )}
                                            </p>

                                            {/* Qty + Actions row */}
                                            <div className="flex items-center justify-between mt-2">
                                                {/* Quantity stepper */}
                                                <div className="flex items-center border-2 border-black rounded-lg overflow-hidden h-7 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                                    <button
                                                        onClick={() => handleQtyChange(item.id, -1, item.quantity, pricePerUnit)}
                                                        className="h-full px-2 hover:bg-[#fdf567] transition-colors border-r border-black"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="px-3 text-xs font-black tabular-nums">{item.quantity}</span>
                                                    <button
                                                        onClick={() => handleQtyChange(item.id, 1, item.quantity, pricePerUnit)}
                                                        className="h-full px-2 hover:bg-[#4be794] transition-colors border-l border-black"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>

                                                {/* Action buttons */}
                                                <div className="flex items-center gap-1">
                                                    <Link
                                                        href={item.serviceId
                                                            ? `/services/request/${item.slug}?edit=${item.id}`
                                                            : `/products/customize/${item.slug}?edit=${item.id}`
                                                        }
                                                        onClick={() => setIsOpen(false)}
                                                        className="text-[10px] font-black uppercase tracking-wider text-zinc-400 hover:text-black px-2 py-1 hover:bg-[#fdf567] rounded transition-all"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => handleRemove(item.id)}
                                                        className="text-zinc-300 hover:text-red-500 p-1 hover:bg-red-50 rounded transition-all"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ── Footer / Checkout ───────────────────────────────────── */}
                {items.length > 0 && (
                    <div className="border-t-4 border-black bg-white px-5 py-5 shrink-0">
                        {/* Price breakdown */}
                        <div className="space-y-2 mb-5">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-medium text-zinc-500">Subtotal ({itemCount} items)</span>
                                <span className="font-bold">₹{totalEstimate.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-medium text-zinc-500">Shipping & Tax</span>
                                <span className="text-[9px] font-black uppercase tracking-wider bg-[#fdf567] border border-black px-2 py-0.5 rounded">After Quote</span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t-2 border-black">
                                <span className="text-base font-black uppercase tracking-tight">Estimate</span>
                                <span className="text-2xl font-black">₹{totalEstimate.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Action Buttons — clear spacing */}
                        <div className="space-y-3">
                            {/* Submit CTA — primary */}
                            <button
                                onClick={handleSubmitInquiry}
                                disabled={items.length === 0 || isSubmitting}
                                className="w-full py-4 bg-[#4be794] text-black border-2 border-black rounded-xl font-black text-sm uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Submit Inquiry
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            {/* View Full Cart — secondary */}
                            <button
                                onClick={() => { setIsOpen(false); router.push("/cart"); }}
                                className="w-full py-3 bg-white border-2 border-black rounded-xl font-bold text-xs uppercase tracking-wider text-zinc-600 hover:bg-zinc-50 transition-all flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]"
                            >
                                <LayoutList className="w-4 h-4" /> View Full Cart
                            </button>
                        </div>

                        {/* Trust text */}
                        <p className="text-center text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed mt-4">
                            Final pricing confirmed after studio review.
                            <br />No payment required at this stage.
                        </p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
