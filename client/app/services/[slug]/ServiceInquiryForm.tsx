"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UploadCloud, Info } from "lucide-react";
import { ServiceItem } from "@/types/service";
import { useAlert } from "@/components/CustomAlert";

export default function ServiceInquiryForm({ service }: { service: ServiceItem }) {
    const router = useRouter();
    const { showAlert } = useAlert();
    const searchParams = useSearchParams();
    const variantSlug = searchParams.get("variant");

    const [isLoading, setIsLoading] = useState(false);
    const [selectedVariantId, setSelectedVariantId] = useState<string>(
        service.variants.length > 0 ? service.variants[0].id.toString() : ""
    );

    // Deep linking: Select variant by slug if provided in URL
    useEffect(() => {
        if (variantSlug) {
            const variant = service.variants.find(v => v.slug === variantSlug);
            if (variant) {
                setSelectedVariantId(variant.id.toString());
            }
        }
    }, [variantSlug, service.variants]);
    const [quantity, setQuantity] = useState<number>(1);
    const [notes, setNotes] = useState("");

    const selectedVariant = useMemo(() => {
        return service.variants.find(v => v.id.toString() === selectedVariantId);
    }, [selectedVariantId, service.variants]);

    const { totalPrice } = useMemo(() => {
        if (!selectedVariant) return { totalPrice: 0 };

        const base = selectedVariant.base_price;
        const extra = selectedVariant.price_per_unit * quantity;
        return {
            totalPrice: base + extra
        };
    }, [selectedVariant, quantity]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const token = localStorage.getItem("access_token");
        if (!token) {
            showAlert("Please login to submit an inquiry.", "error");
            setIsLoading(false);
            router.push("/auth/login");
            return;
        }

        if (!selectedVariantId) {
            showAlert("Please select a service variant.", "error");
            setIsLoading(false);
            return;
        }

        const payload = {
            items: [{
                service_id: service.id,
                variant_id: parseInt(selectedVariantId),
                quantity: quantity,
                selected_options: {
                    variant_name: selectedVariant?.name,
                    service_slug: service.slug
                },
                notes: notes || `Service inquiry for ${service.name} (${selectedVariant?.name})`,
            }]
        };

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showAlert("Service inquiry submitted successfully! Our studio will review it shortly.", "success");
                router.push("/dashboard/inquiries");
            } else {
                const err = await res.json();
                showAlert(`Submission failed: ${err.detail || "Unknown error"}`, "error");
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Submission error:", error);
            showAlert("Network error. Please try again.", "error");
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Variant Selection */}
            <div className="space-y-4">
                <Label className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                    <Info className="h-5 w-5 text-[#90e8ff]" />
                    Select Expertise Level
                </Label>
                <RadioGroup
                    value={selectedVariantId}
                    onValueChange={setSelectedVariantId}
                    className="grid gap-4"
                >
                    {service.variants.map((variant) => {
                        const isSelected = selectedVariantId === variant.id.toString();
                        return (
                            <Label
                                key={variant.id}
                                className={`
                                    relative flex items-center justify-between p-4 border-2 border-black cursor-pointer transition-all rounded-none
                                    ${isSelected
                                        ? "bg-zinc-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1"
                                        : "bg-white hover:bg-zinc-50"
                                    }
                                `}
                            >
                                <RadioGroupItem value={variant.id.toString()} className="sr-only" />
                                <div className="space-y-1">
                                    <span className="text-lg font-black uppercase tracking-tight block">{variant.name}</span>
                                    <span className="text-xs font-bold text-zinc-500 uppercase">{variant.description}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-black bg-white border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        ₹{variant.base_price.toLocaleString()}
                                    </span>
                                </div>
                            </Label>
                        );
                    })}
                </RadioGroup>
            </div>

            {/* Quantity */}
            <div className="space-y-3">
                <Label className="text-lg font-black uppercase tracking-tight">Units / Items involved</Label>
                <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="border-2 border-black rounded-none text-lg h-14 focus:ring-0 focus:border-black transition-all"
                />
                {selectedVariant && selectedVariant.price_per_unit > 0 && (
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                        + ₹{selectedVariant.price_per_unit} per unit added to base price
                    </p>
                )}
            </div>

            {/* File Upload Mock */}
            <div className="space-y-3">
                <Label className="text-lg font-black uppercase tracking-tight">Reference Material</Label>
                <div className="border-2 border-dashed border-black p-8 text-center bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer flex flex-col items-center gap-2 group">
                    <UploadCloud className="h-10 w-10 text-zinc-400 group-hover:text-black transition-colors" />
                    <span className="text-sm font-bold uppercase tracking-widest">Upload Brief / Assets</span>
                </div>
            </div>

            {/* Notes */}
            <div className="space-y-3">
                <Label className="text-lg font-black uppercase tracking-tight">Additional Context</Label>
                <Textarea
                    placeholder="Tell us more about your vision, deadlines, or specific technical constraints..."
                    className="min-h-[120px] border-2 border-black rounded-none text-base focus:ring-0 focus:border-black"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </div>

            {/* Price Summary & Submit */}
            <div className="space-y-6 pt-6 border-t-4 border-black">
                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Estimated Project Start</span>
                        <div className="inline-flex items-baseline gap-2 bg-[#fdf567] border-2 border-black px-4 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-1">
                            <span className="text-4xl font-black">₹{totalPrice.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-16 bg-[#4be794] hover:bg-[#3cd083] text-black font-black uppercase text-xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all"
                >
                    {isLoading ? <Loader2 className="animate-spin h-8 w-8" /> : "Submit Studio Request"}
                </Button>

                <p className="text-[10px] font-bold text-center text-zinc-500 uppercase tracking-widest leading-relaxed">
                    By submitting, you agree to our studio's initial consultation terms. <br />
                    Quotes are estimates and may change during formal review.
                </p>
            </div>
        </form>
    );
}
