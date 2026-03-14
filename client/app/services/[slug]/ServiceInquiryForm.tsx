"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UploadCloud, Info, Plus, Minus, ArrowRight } from "lucide-react";
import { ServiceItem } from "@/types/service";
import { useAlert } from "@/components/CustomAlert";
import { useAppDispatch } from "@/lib/store/hooks";
import { addToInquiry } from "@/lib/store/inquirySlice";
import { SubService } from "@/types/service";

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function ServiceInquiryForm({ service, activeVariant }: { service: ServiceItem, activeVariant: SubService }) {
    const router = useRouter();
    const { showAlert } = useAlert();
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [quantity, setQuantity] = useState<number>(activeVariant?.minimum_quantity || 1);

    // Update quantity minimum when variant changes
    useEffect(() => {
        if (activeVariant && quantity < activeVariant.minimum_quantity) {
            setQuantity(activeVariant.minimum_quantity);
        }
    }, [activeVariant, quantity]);

    const [notes, setNotes] = useState("");

    const { totalPrice } = useMemo(() => {
        if (!activeVariant) return { totalPrice: 0 };
        return {
            totalPrice: activeVariant.price_per_unit * quantity
        };
    }, [activeVariant, quantity]);

    const handleQuantityChange = (type: "inc" | "dec") => {
        if (!activeVariant) return;
        setQuantity(prev => {
            if (type === "inc") return prev + 1;
            if (type === "dec" && prev > activeVariant.minimum_quantity) return prev - 1;
            return prev;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!activeVariant) {
            showAlert("No variant selected.", "error");
            setIsLoading(false);
            return;
        }

        dispatch(addToInquiry({
            id: generateId(),
            serviceId: service.id,
            subserviceId: activeVariant.id,
            name: `${service.name} — ${activeVariant.name}`,
            quantity: quantity,
            options: {
                // stored for display only — NOT sent to the API for services
                variant_name: activeVariant.name,
                service_slug: service.slug,
                notes: notes,
            },
            estimatedPrice: totalPrice,
            imageUrl: (activeVariant.images?.[0] || service.cover_image) ?? undefined,
            pricePerUnit: activeVariant.price_per_unit,
        }));

        showAlert(`${service.name} added to cart!`, "success");
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="relative flex flex-col space-y-6 w-full font-sans pb-4">
            <div className="space-y-6 max-w-[400px] w-full">

                {/* Variant Pre-Selected Indicator */}
                <div className="p-4 border-2 border-dashed border-black bg-zinc-50 rounded-md">
                    <p className="text-xs font-black uppercase text-zinc-500 mb-1 tracking-widest">Selected Variant</p>
                    <p className="font-bold text-lg text-black">{activeVariant?.name}</p>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="text-sm font-black bg-[#90e8ff] px-2 py-1 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            ₹{activeVariant?.price_per_unit}/unit
                        </span>
                        <span className="text-xs font-bold text-zinc-500 uppercase">Min: {activeVariant?.minimum_quantity}</span>
                    </div>
                </div>

                {/* Additional Units / Quantity */}
                <div className="space-y-2">
                    <Label className="text-sm font-black uppercase tracking-widest text-zinc-800 flex items-center justify-between">
                        Items Involved
                        {activeVariant && activeVariant.price_per_unit > 0 && (
                            <span className="text-[10px] font-bold text-zinc-500 normal-case">
                                (+₹{activeVariant.price_per_unit} / unit)
                            </span>
                        )}
                    </Label>
                    <div className="flex items-center border-2 border-black h-12 w-full rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
                        <button type="button" onClick={() => handleQuantityChange("dec")} className="h-full px-4 border-r-2 border-black hover:bg-zinc-100 active:bg-zinc-200 flex items-center justify-center transition-colors">
                            <Minus className="h-4 w-4" />
                        </button>
                        <input type="number" min={activeVariant?.minimum_quantity || 1} value={quantity} onChange={(e) => setQuantity(Math.max(activeVariant?.minimum_quantity || 1, Number(e.target.value)))} className="w-full h-full text-center font-black text-lg focus:outline-none bg-transparent appearance-none" />
                        <button type="button" onClick={() => handleQuantityChange("inc")} className="h-full px-4 border-l-2 border-black hover:bg-zinc-100 active:bg-zinc-200 flex items-center justify-center transition-colors">
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Reference Material */}
                <div className="space-y-2">
                    <Label className="text-sm font-black uppercase tracking-widest text-zinc-800">Reference Material</Label>
                    <div className="border-2 border-dashed border-black bg-white h-16 flex items-center justify-center hover:bg-[#fdf567] hover:border-solid transition-colors cursor-pointer group rounded-md">
                        <span className="text-xs font-black uppercase tracking-widest text-black flex items-center gap-2">
                            <UploadCloud className="h-5 w-5" /> Upload Brief
                        </span>
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <Label className="text-sm font-black uppercase tracking-widest text-zinc-800">Additional Context</Label>
                    <Textarea
                        placeholder="VISION, DEADLINES, OR CONSTRAINTS..."
                        className="min-h-[100px] border-2 border-black rounded-md text-sm font-bold uppercase focus-visible:ring-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] focus-visible:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-zinc-400 p-3"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
            </div>

            {/* Sticky Bottom Bar with Pill Button */}
            <div className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-sm border-t-2 border-black pt-4 pb-4 mt-8 w-full flex items-center justify-between gap-4 max-w-[400px]">
                <div className="flex flex-col">
                    <span className="text-xs font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Total Estimate</span>
                    <span className="text-3xl font-black leading-none text-black">₹{totalPrice.toLocaleString()}</span>
                </div>

                <Button
                    type="submit"
                    className="h-14 px-8 bg-[#4be794] text-black font-black uppercase text-sm border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <>
                            Request Quote
                            <ArrowRight className="h-4 w-4" />
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}