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
                const data = await res.json();
                showAlert("Inquiry saved as draft! Please review and submit it to our studio.", "success");
                dispatch(clearInquiry());
                setIsOpen(false);
                router.push(`/dashboard/inquiries/${data.id}`);
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
                <Button variant="ghost" className="relative p-0 h-9 w-9 bg-[#d5fa90] border border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all cursor-pointer flex items-center justify-center shrink-0">
                    <ShoppingCart className="h-4 w-4 text-black" />
                    {itemCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-[#ff63ff] text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-black shadow-[1px_1px_4px_0px_rgba(0,0,0,0.1)]">
                            {itemCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>

            {/* Sidebar Container equivalent inside Sheet */}
            <SheetContent className="w-full sm:max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 p-0 flex flex-col shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] z-1001">
                <SheetHeader className="sr-only">
                    <SheetTitle>Your Cart</SheetTitle>
                </SheetHeader>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white dark:bg-slate-900 z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                        >
                            <ArrowRight className="h-4 w-4" />
                        </button>
                        <h2 className="text-xl font-bold tracking-tight uppercase">Your Cart</h2>
                    </div>
                    {items.length > 0 && (
                        <button
                            onClick={handleClear}
                            className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-600 transition-colors"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {items.length === 0 ? (
                        <div className="mt-8 p-8 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                            <ShoppingCart className="w-10 h-10 mb-3 opacity-30" />
                            <p className="text-sm font-medium">Add more to your order</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="p-3 bg-white dark:bg-slate-800 border border-black rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,2)] flex gap-4 items-center transition-all hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,2)]">
                                {/* Only missing image data from slice usually, so using a fallback abstract placeholder */}
                                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center border border-black">
                                    <img
                                        src={item.imageUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}&backgroundColor=ffffff`}
                                        alt={item.name}
                                        className={`w-full h-full object-cover ${!item.imageUrl ? 'mix-blend-multiply opacity-50' : ''}`}
                                        onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}&backgroundColor=ffffff`; }}
                                    />
                                </div>
                                <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                                    <span className="text-[10px] font-bold uppercase text-primary/70 tracking-wider">
                                        {item.productId ? 'Product' : 'Service'}
                                    </span>
                                    <h3 className="font-bold text-base leading-tight line-clamp-1" title={item.name}>
                                        {item.name}
                                    </h3>
                                    <p className="text-slate-400 font-medium text-xs">
                                        Qty: {item.quantity}
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex gap-3">
                                            <Link
                                                href={item.serviceId
                                                    ? `/services/request/${item.slug}?edit=${item.id}`
                                                    : `/products/customize/${item.slug}?edit=${item.id}`
                                                }
                                                className="text-slate-400 hover:text-black transition-colors text-xs font-bold flex items-center"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => handleRemove(item.id)}
                                                className="flex items-center text-slate-400 hover:text-red-500 transition-colors text-xs font-bold"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <span className="font-bold text-sm text-slate-900">₹{item.estimatedPrice.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer / Checkout Section */}
                <div className="p-6 border-t border-slate-100 bg-white dark:bg-slate-900 shrink-0">
                    <div className="space-y-2 mb-6">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium text-slate-500">Subtotal</span>
                            <span className="font-bold text-slate-900">₹{totalEstimate.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium text-slate-500">Shipping</span>
                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Calculated later</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                            <span className="text-lg font-bold uppercase tracking-tight text-slate-900">Total Estimate</span>
                            <span className="text-xl font-black text-primary">₹{totalEstimate.toLocaleString()}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => { setIsOpen(false); router.push("/cart"); }}
                        className="w-full border border-slate-200 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-600 bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.02)] mb-3"
                    >
                        <LayoutList className="w-4 h-4" /> View Full Cart
                    </button>
                    <button
                        onClick={handleSubmitInquiry}
                        disabled={items.length === 0 || isSubmitting}
                        className="w-full bg-accent-green text-black border border-black py-3 rounded-xl font-black text-base uppercase tracking-wider transition-all flex items-center justify-center gap-2 group hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Submit Inquiry
                                <ArrowRight className="group-hover:translate-x-1 transition-transform w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>

            </SheetContent>
        </Sheet>
    );
}
