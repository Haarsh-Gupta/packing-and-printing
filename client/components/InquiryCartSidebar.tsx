"use client";

import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { removeFromInquiry, clearInquiry } from "@/lib/store/inquirySlice";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAlert } from "@/components/CustomAlert";
import { useRouter } from "next/navigation";

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

        // Format payload for backend using the cart items
        const payloadItems = items.map(item => {
            if (item.productId != null) {
                return {
                    template_id: Number(item.productId),
                    quantity: Number(item.quantity),
                    selected_options: item.options || {},
                    notes: (item.options?.notes as string) || "Added from cart",
                };
            } else if (item.serviceId != null) {
                // Ensure variant_id is captured from options
                const variantId = item.options?.variant_id ?? item.options?.variantId;
                return {
                    service_id: Number(item.serviceId),
                    variant_id: variantId != null ? Number(variantId) : null,
                    quantity: Number(item.quantity),
                    selected_options: {
                        variant_name: String(item.options?.variant_name || ""),
                        service_slug: String(item.options?.service_slug || ""),
                        ...item.options
                    },
                    notes: (item.options?.notes as string) || "Added from cart",
                };
            }
            return null;
        }).filter((i): i is NonNullable<typeof i> => i !== null);

        console.log("Submitting inquiry payload:", { items: payloadItems });

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
                showAlert("Inquiry submitted successfully! Our studio will review it shortly.", "success");
                dispatch(clearInquiry());
                setIsOpen(false);
                router.push("/dashboard/inquiries");
            } else {
                const err = await res.json();
                showAlert(`Submission failed: ${err.detail || "Unknown error"}`, "error");
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
                <Button variant="ghost" className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full cursor-pointer h-10 w-10 overflow-hidden group border-0">
                    <ShoppingCart className="h-5 w-5" />
                    {itemCount > 0 && (
                        <span className="absolute top-1 right-1 bg-[#FF90E8] text-black text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-black shadow-sm group-hover:scale-110 transition-transform">
                            {itemCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>

            <SheetContent className="w-full sm:max-w-md border-l-4 border-black p-0 flex flex-col bg-zinc-50 font-sans shadow-[-8px_0px_0px_0px_rgba(0,0,0,0.1)]">
                <SheetHeader className="p-6 bg-black text-white border-b-4 border-black">
                    <SheetTitle className="text-2xl font-black uppercase tracking-widest text-[#FF90E8] flex justify-between items-center">
                        Your Cart
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClear}
                            className="text-white hover:text-red-400 hover:bg-white/10 text-xs font-bold transition-colors uppercase tracking-wider h-8"
                            disabled={items.length === 0}
                        >
                            Clear All
                        </Button>
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-zinc-50">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-4">
                            <ShoppingCart className="w-16 h-16 opacity-20" />
                            <p className="font-bold text-center uppercase tracking-widest text-sm opacity-50">Your cart is empty</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-2 rounded-none transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex flex-col space-y-1">
                                        <span className="font-black text-lg leading-tight uppercase tracking-tight line-clamp-2">
                                            {item.name}
                                        </span>
                                        <span className="text-sm font-bold text-zinc-500">Qty: {item.quantity}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemove(item.id)}
                                        className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="mt-2 border-t-2 border-dashed border-black/20 pt-2 flex justify-between items-center">
                                    <span className="text-xl font-black">₹{item.estimatedPrice.toLocaleString()}</span>
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-100 px-2 py-1">
                                        {item.productId ? 'Product' : 'Service'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer actions */}
                <div className="p-6 bg-white border-t-4 border-black flex flex-col gap-4 sticky bottom-0 z-10">
                    <div className="flex justify-between items-end">
                        <span className="text-sm font-black text-zinc-500 uppercase tracking-widest">Est. Subtotal</span>
                        <span className="text-3xl font-black">₹{totalEstimate.toLocaleString()}</span>
                    </div>

                    <Button
                        className="w-full h-14 bg-[#4be794] text-black font-black uppercase text-lg tracking-widest border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#3cd083] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
                        disabled={items.length === 0 || isSubmitting}
                        onClick={handleSubmitInquiry}
                    >
                        {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : "Request Official Quote"}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
