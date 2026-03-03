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

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function ServiceInquiryForm({ service }: { service: ServiceItem }) {
    const router = useRouter();
    const { showAlert } = useAlert();
    const dispatch = useAppDispatch();
    const searchParams = useSearchParams();
    const variantSlug = searchParams.get("variant");

    const [isLoading, setIsLoading] = useState(false);
    const [selectedVariantId, setSelectedVariantId] = useState<string>(
        service.sub_services && service.sub_services.length > 0 ? service.sub_services[0].id.toString() : ""
    );

    useEffect(() => {
        if (variantSlug && service.sub_services) {
            const variant = service.sub_services.find(v => v.slug === variantSlug);
            if (variant) {
                setSelectedVariantId(variant.id.toString());
            }
        }
    }, [variantSlug, service.sub_services]);

    const [quantity, setQuantity] = useState<number>(1);
    const [notes, setNotes] = useState("");

    const selectedVariant = useMemo(() => {
        return service.sub_services?.find(v => v.id.toString() === selectedVariantId);
    }, [selectedVariantId, service.sub_services]);

    const { totalPrice } = useMemo(() => {
        if (!selectedVariant) return { totalPrice: 0 };
        const base = selectedVariant.base_price;
        const extra = selectedVariant.price_per_unit * quantity;
        return {
            totalPrice: base + extra
        };
    }, [selectedVariant, quantity]);

    const handleQuantityChange = (type: "inc" | "dec") => {
        setQuantity(prev => {
            if (type === "inc") return prev + 1;
            if (type === "dec" && prev > 1) return prev - 1;
            return prev;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!selectedVariantId) {
            showAlert("Please select a service variant.", "error");
            setIsLoading(false);
            return;
        }

        dispatch(addToInquiry({
            id: generateId(),
            serviceId: service.id,
            name: `${service.name} - ${selectedVariant?.name}`,
            quantity: quantity,
            options: {
                variant_id: parseInt(selectedVariantId),
                variant_name: selectedVariant?.name || "",
                service_slug: service.slug,
                notes: notes,
            },
            estimatedPrice: totalPrice
        }));

        showAlert(`${service.name} added to cart!`, "success");
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="relative flex flex-col space-y-6 w-full font-sans pb-4">
            <div className="space-y-6 max-w-[400px] w-full">

                {/* Variant Selection (Gumroad Tier Style) */}
                <div className="space-y-3">
                    <Label className="text-sm font-black uppercase tracking-widest text-zinc-800 flex items-center gap-2">
                        <Info className="h-4 w-4 text-[#90e8ff]" />
                        Select Expertise Level
                    </Label>
                    <RadioGroup
                        value={selectedVariantId}
                        onValueChange={setSelectedVariantId}
                        className="flex flex-col gap-3"
                    >
                        {service.sub_services?.map((variant) => {
                            const isSelected = selectedVariantId === variant.id.toString();
                            return (
                                <Label
                                    key={variant.id}
                                    className={`
                                        relative flex items-center gap-4 p-4 cursor-pointer transition-all border-2 border-black rounded-md w-full
                                        ${isSelected
                                            ? "bg-zinc-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-[2px] -translate-x-[2px]"
                                            : "bg-white hover:bg-zinc-50 hover:-translate-y-[1px] hover:-translate-x-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                        }
                                    `}
                                >
                                    <RadioGroupItem value={variant.id.toString()} className="sr-only" />

                                    {/* Price Badge */}
                                    <div className="flex h-12 w-auto min-w-[3rem] px-3 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white font-black text-xs shadow-sm text-center">
                                        ₹{variant.base_price.toLocaleString()}
                                    </div>

                                    {/* Text Content */}
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm text-black uppercase">{variant.name}</span>
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider leading-tight mt-0.5 line-clamp-2">
                                            {variant.description}
                                        </span>
                                    </div>
                                </Label>
                            );
                        })}
                    </RadioGroup>
                </div>

                {/* Additional Units / Quantity */}
                <div className="space-y-2">
                    <Label className="text-sm font-black uppercase tracking-widest text-zinc-800 flex items-center justify-between">
                        Items Involved
                        {selectedVariant && selectedVariant.price_per_unit > 0 && (
                            <span className="text-[10px] font-bold text-zinc-500 normal-case">
                                (+₹{selectedVariant.price_per_unit} / unit)
                            </span>
                        )}
                    </Label>
                    <div className="flex items-center border-2 border-black h-12 w-full rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
                        <button type="button" onClick={() => handleQuantityChange("dec")} className="h-full px-4 border-r-2 border-black hover:bg-zinc-100 active:bg-zinc-200 flex items-center justify-center transition-colors">
                            <Minus className="h-4 w-4" />
                        </button>
                        <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} className="w-full h-full text-center font-black text-lg focus:outline-none bg-transparent appearance-none" />
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