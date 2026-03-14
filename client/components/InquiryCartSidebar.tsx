"use client";

import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { removeFromInquiry, clearInquiry, updateQuantity } from "@/lib/store/inquirySlice";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, Loader2, ArrowRight, LayoutList } from "lucide-react";
import { useState } from "react";
import { useAlert } from "@/components/CustomAlert";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function InquiryCartSidebar() {
    const dispatch = useAppDispatch();
    const { items, totalEstimate } = useAppSelector((state) => state.inquiry);
    const { showAlert } = useAlert();
    const router = useRouter();

    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRemove = (id: string) => {
        dispatch(removeFromInquiry(id));
    };

    const handleClear = () => {
        dispatch(clearInquiry());
    };

    const handleSubmitInquiry = async () => {
        if (items.length === 0) return;

        setIsSubmitting(true);
        const token = localStorage.getItem("access_token");
        if (!token) {
            showAlert("Please login to submit your inquiry.", "error");
            setIsSubmitting(false);
            setIsOpen(false);
            router.push("/auth/login");
            return;
        }

        const payloadItems = items.map(item => {
            if (item.productId != null) {
                // Products need: product_id, subproduct_id, quantity, selected_options (required)
                const { notes: _n, ...productOptions } = item.options as any;
                return {
                    product_id: Number(item.productId),
                    subproduct_id: item.subproductId != null ? Number(item.subproductId) : undefined,
                    quantity: Number(item.quantity),
                    selected_options: Object.keys(productOptions).length > 0 ? productOptions : { _default: "true" },
                    notes: (item.options?.notes as string) || null,
                };
            } else if (item.serviceId != null) {
                // Services need: service_id, subservice_id, quantity — NO selected_options
                return {
                    service_id: Number(item.serviceId),
                    subservice_id: item.subserviceId != null ? Number(item.subserviceId) : null,
                    quantity: Number(item.quantity),
                    notes: (item.options?.notes as string) || null,
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
                showAlert("Inquiry submitted! Our studio will review it soon.", "success");
                dispatch(clearInquiry());
                setIsOpen(false);
                router.push("/dashboard/inquiries");
            } else {
                const err = await res.json();
                // Pydantic validation errors come back as an array
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

    const itemCount = items.reduce((total, item) => total + item.quantity, 0);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" className="relative p-0 h-10 w-10 bg-[#ccff00] border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all cursor-pointer flex items-center justify-center shrink-0">
                    <ShoppingCart className="h-5 w-5 text-black" />
                    {itemCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-[#ff00ff] text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {itemCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>

            {/* Sidebar Container equivalent inside Sheet */}
            <SheetContent className="w-full sm:max-w-md bg-white dark:bg-slate-900 border-l-4 border-black p-0 flex flex-col shadow-[-8px_0px_0px_0px_rgba(0,0,0,0.1)]">
                <SheetHeader className="sr-only">
                    <SheetTitle>Your Cart</SheetTitle>
                </SheetHeader>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b-2 border-black sticky top-0 bg-white dark:bg-slate-900 z-10 shrink-0">
                    <h2 className="text-3xl font-bold tracking-tight uppercase">Your Cart</h2>
                    {items.length > 0 && (
                        <button
                            onClick={handleClear}
                            className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 border-2 border-transparent hover:border-red-200 rounded transition-colors"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {items.length === 0 ? (
                        <div className="mt-8 p-4 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400">
                            <ShoppingCart className="w-12 h-12 mb-2 opacity-50" />
                            <p className="text-sm font-medium">Add more to your order</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="neu-border neu-card p-4 bg-white dark:bg-slate-800 flex gap-4 items-center">
                                {/* Only missing image data from slice usually, so using a fallback abstract placeholder */}
                                <div className="w-24 h-24 neu-border overflow-hidden shrink-0 bg-zinc-100 flex items-center justify-center border-2 border-black">
                                    <img
                                        src={item.imageUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}&backgroundColor=ffffff`}
                                        alt={item.name}
                                        className={`w-full h-full object-cover ${!item.imageUrl ? 'mix-blend-multiply opacity-50' : ''}`}
                                        onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}&backgroundColor=ffffff`; }}
                                    />
                                </div>
                                <div className="flex-1 flex flex-col gap-1 min-w-0">
                                    <span className="text-xs font-bold uppercase text-primary line-clamp-1 wrap-break-word">
                                        {item.productId ? 'Product' : 'Service'}
                                    </span>
                                    <h3 className="font-bold text-lg leading-tight line-clamp-2" title={item.name}>
                                        {item.name}
                                    </h3>
                                    <p className="text-slate-500 font-medium text-xs">
                                        Qty: {item.quantity}
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                        <button
                                            onClick={() => handleRemove(item.id)}
                                            className="flex items-center neu-border rounded-full overflow-hidden h-8 bg-background-light px-3 hover:bg-red-100 hover:text-red-600 transition-colors text-xs font-bold"
                                        >
                                            <Trash2 className="w-3 h-3 mr-1" /> Remove
                                        </button>
                                        <span className="font-bold">₹{item.estimatedPrice.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer / Checkout Section */}
                <div className="p-6 border-t-4 border-black bg-white dark:bg-slate-900 shrink-0">
                    <div className="space-y-2 mb-6">
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-slate-500">Subtotal</span>
                            <span className="font-bold">₹{totalEstimate.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-slate-500">Shipping</span>
                            <span className="text-xs font-bold uppercase bg-slate-100 px-2 py-0.5 border border-black dark:text-black">Calculated later</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-black/10">
                            <span className="text-xl font-bold uppercase tracking-tight">Total Estimate</span>
                            <span className="text-2xl font-black text-primary">₹{totalEstimate.toLocaleString()}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => { setIsOpen(false); router.push("/cart"); }}
                        className="w-full border-2 border-black py-3 rounded-xl font-black text-base uppercase tracking-wider text-black bg-white hover:bg-zinc-50 transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] mb-3"
                    >
                        <LayoutList className="w-5 h-5" /> View Full Cart
                    </button>
                    <button
                        onClick={handleSubmitInquiry}
                        disabled={items.length === 0 || isSubmitting}
                        className="w-full neu-border neu-card bg-primary text-white py-4 rounded-xl font-black text-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 group hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                Submit Inquiry
                                <ArrowRight className="font-bold group-hover:translate-x-1 transition-transform w-5 h-5" />
                            </>
                        )}
                    </button>
                    <p className="mt-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-normal">
                        Quotes are finalized by the PrintPack studio.<br />Secure payment link provided post-approval.
                    </p>
                </div>

            </SheetContent>
        </Sheet>
    );
}
