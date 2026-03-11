"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, UploadCloud, ShoppingCart, Plus, Minus, Zap } from "lucide-react";
import { useAlert } from "@/components/CustomAlert";
import { useAppDispatch } from "@/lib/store/hooks";
import { addToInquiry } from "@/lib/store/inquirySlice";

const generateId = () => Math.random().toString(36).substring(2, 9);

interface Option {
    label: string;
    value: string;
    price_mod: number;
}

interface SchemaSection {
    key: string;
    label: string;
    type: "dropdown" | "radio" | "number_input" | "text_input";
    options?: Option[];
    min_val?: number;
    max_val?: number;
    price_per_unit?: number;
}

interface ProductSchema {
    id: number;
    product_id?: number;
    name: string;
    base_price: number;
    minimum_quantity: number;
    config_schema: {
        sections: SchemaSection[];
    };
}

// Helper to extract a hex code if present, otherwise fallback to word mapping
const getColorValue = (label: string) => {
    // Look for a hex code in the string (e.g., "#FFF" or "#FF0000")
    const hexMatch = label.match(/#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/);
    if (hexMatch) return hexMatch[0];

    const colorMap: Record<string, string> = {
        "red": "#FF4D4D",
        "blue": "#3B82F6",
        "yellow": "#FFD700",
        "black": "#18181B",
        "white": "#FFFFFF",
        "green": "#4ADE80",
    };

    const lowerLabel = label.toLowerCase();
    for (const key in colorMap) {
        if (lowerLabel.includes(key)) return colorMap[key];
    }

    // Fallback if no color is found
    return "#E4E4E7";
};

// Helper to strip the hex code out of the label text for cleaner display
const cleanLabelText = (label: string) => {
    return label.replace(/#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/g, "").trim();
};

export default function ProductInquiryForm({ product }: { product: ProductSchema }) {
    const { showAlert } = useAlert();
    const dispatch = useAppDispatch();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(false);
    const [quantity, setQuantity] = useState<number>(product.minimum_quantity);

    const [answers, setAnswers] = useState<Record<string, any>>(() => {
        const initialAnswers: Record<string, any> = {};
        const sections = product.config_schema?.sections || [];
        sections.forEach((section) => {
            if ((section.type === "dropdown" || section.type === "radio") && section.options) {
                initialAnswers[section.key] = section.options[0]?.value || "";
            } else if (section.type === "number_input") {
                initialAnswers[section.key] = section.min_val || 0;
            } else {
                initialAnswers[section.key] = "";
            }
        });
        return initialAnswers;
    });

    const handleAnswerChange = (key: string, value: any) => {
        setAnswers((prev) => ({ ...prev, [key]: value }));
    };

    const handleQuantityChange = (type: "inc" | "dec") => {
        setQuantity(prev => {
            if (type === "inc") return prev + 1;
            if (type === "dec" && prev > product.minimum_quantity) return prev - 1;
            return prev;
        });
    };

    const { unitPrice, totalPrice } = useMemo(() => {
        let currentUnitPrice = product.base_price;

        const sections = product.config_schema?.sections || [];
        sections.forEach((section) => {
            const answer = answers[section.key];
            if (answer === undefined || answer === "") return;

            if ((section.type === "dropdown" || section.type === "radio") && section.options) {
                const selectedOption = section.options.find((opt) => opt.value === answer);
                if (selectedOption?.price_mod) {
                    currentUnitPrice += selectedOption.price_mod;
                }
            }

            if (section.type === "number_input" && section.price_per_unit) {
                currentUnitPrice += Number(answer) * section.price_per_unit;
            }
        });

        return {
            unitPrice: currentUnitPrice,
            totalPrice: currentUnitPrice * quantity,
        };
    }, [answers, quantity, product]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // If zero-cost, do direct checkout
        if (totalPrice === 0) {
            try {
                const token = localStorage.getItem("access_token");
                if (!token) {
                    showAlert("Please log in to continue.", "error");
                    router.push("/auth/login");
                    setIsLoading(false);
                    return;
                }

                const payload: any = {
                    quantity,
                    selected_options: answers,
                    notes: `Direct checkout for ${product.name}`,
                };
                if (product.product_id) {
                    payload.product_id = product.product_id;
                    payload.subproduct_id = product.id;
                } else {
                    payload.product_id = product.id;
                }

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/direct-checkout`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    showAlert("Order placed successfully! Redirecting…", "success");
                    setTimeout(() => router.push("/dashboard/orders"), 1200);
                } else {
                    const err = await res.json().catch(() => ({}));
                    showAlert(err.detail || "Checkout failed. Try adding to cart instead.", "error");
                }
            } catch {
                showAlert("Network error. Please try again.", "error");
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // Normal add-to-cart flow
        dispatch(addToInquiry({
            id: generateId(),
            productId: product.product_id,
            subProductId: product.id,
            name: product.name,
            quantity: quantity,
            options: answers,
            estimatedPrice: totalPrice
        }));

        showAlert(`${product.name} added to cart!`, "success");
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="relative flex flex-col space-y-6 w-full font-sans pb-4">

            <div className="space-y-6 max-w-[400px] w-full">
                {(product.config_schema?.sections || []).map((section) => {
                    const isColorOption = section.label.toLowerCase().includes("color");

                    return (
                        <div key={section.key} className="space-y-3">
                            <Label className="text-sm font-black uppercase tracking-widest text-zinc-800 flex items-center justify-between">
                                {section.label}
                                {section.type === "number_input" && section.price_per_unit && (
                                    <span className="text-[10px] font-bold text-zinc-500">
                                        (+₹{section.price_per_unit} / unit)
                                    </span>
                                )}
                            </Label>

                            {(section.type === "dropdown" || section.type === "radio") && section.options && (
                                <RadioGroup
                                    value={answers[section.key]}
                                    onValueChange={(val) => handleAnswerChange(section.key, val)}
                                    className={isColorOption ? "flex flex-wrap gap-2.5" : "flex flex-col gap-3"}
                                >
                                    {section.options.map((option) => {
                                        const isSelected = answers[section.key] === option.value;

                                        // SQUARE COLOR BLOCKS
                                        if (isColorOption) {
                                            return (
                                                <Label
                                                    key={option.value}
                                                    style={{ backgroundColor: getColorValue(option.label) }}
                                                    className={`
                                                        relative h-10 w-12 cursor-pointer transition-all rounded-[2px] border-2 border-black block
                                                        ${isSelected
                                                            ? "shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-[2px] -translate-x-[2px] ring-2 ring-white ring-inset"
                                                            : "hover:-translate-y-[1px] hover:-translate-x-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                        }
                                                    `}
                                                    title={`${cleanLabelText(option.label)} ${option.price_mod ? `(+₹${option.price_mod})` : ''}`}
                                                >
                                                    <RadioGroupItem value={option.value} id={`${section.key}-${option.value}`} className="sr-only" />
                                                </Label>
                                            );
                                        }

                                        // GUMROAD VERTICAL LIST (with circular price badges)
                                        return (
                                            <Label
                                                key={option.value}
                                                className={`
                                                    relative flex items-center gap-4 p-4 cursor-pointer transition-all border-2 border-black rounded-md w-full
                                                    ${isSelected
                                                        ? "bg-zinc-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-[2px] -translate-x-[2px]"
                                                        : "bg-white hover:bg-zinc-50"
                                                    }
                                                `}
                                            >
                                                <RadioGroupItem value={option.value} id={`${section.key}-${option.value}`} className="sr-only" />

                                                {/* Circle Price Badge */}
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white font-bold text-xs shadow-sm text-center leading-none">
                                                    {option.price_mod > 0 ? "+" : (option.price_mod < 0 ? "-" : "")}₹{Math.abs(option.price_mod || 0)}
                                                </div>

                                                {/* Text Content */}
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-black">{cleanLabelText(option.label)}</span>
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${isSelected ? "text-green-600" : "text-zinc-400"}`}>
                                                        {isSelected ? "Selected" : "Select Option"}
                                                    </span>
                                                </div>
                                            </Label>
                                        );
                                    })}
                                </RadioGroup>
                            )}

                            {/* Inputs */}
                            {section.type === "text_input" && (
                                <Input
                                    type="text"
                                    placeholder="Your text here..."
                                    value={answers[section.key] || ""}
                                    onChange={(e) => handleAnswerChange(section.key, e.target.value)}
                                    className="border-2 border-black rounded-md h-12 font-bold uppercase text-sm focus-visible:ring-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] focus-visible:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-zinc-400"
                                />
                            )}

                            {section.type === "number_input" && (
                                <Input
                                    type="number"
                                    min={section.min_val}
                                    max={section.max_val}
                                    value={answers[section.key] || ""}
                                    onChange={(e) => handleAnswerChange(section.key, e.target.value)}
                                    className="border-2 border-black rounded-md h-12 font-bold uppercase text-sm focus-visible:ring-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] focus-visible:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                                />
                            )}
                        </div>
                    );
                })}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-black uppercase tracking-widest text-zinc-800">Design File</Label>
                        <div className="border-2 border-dashed border-black bg-white h-12 flex items-center justify-center hover:bg-[#fdf567] hover:border-solid transition-colors cursor-pointer group rounded-md">
                            <span className="text-xs font-bold uppercase tracking-wide text-black flex items-center gap-2">
                                <UploadCloud className="h-4 w-4" /> Upload
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-black uppercase tracking-widest text-zinc-800">Quantity</Label>
                        <div className="flex items-center border-2 border-black h-12 w-full rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
                            <button type="button" onClick={() => handleQuantityChange("dec")} className="h-full px-4 border-r-2 border-black hover:bg-zinc-100 active:bg-zinc-200 flex items-center justify-center transition-colors">
                                <Minus className="h-3 w-3" />
                            </button>
                            <input type="number" min={product.minimum_quantity} value={quantity} onChange={(e) => setQuantity(Math.max(product.minimum_quantity, Number(e.target.value)))} className="w-full h-full text-center font-bold text-sm focus:outline-none bg-transparent appearance-none" />
                            <button type="button" onClick={() => handleQuantityChange("inc")} className="h-full px-4 border-l-2 border-black hover:bg-zinc-100 active:bg-zinc-200 flex items-center justify-center transition-colors">
                                <Plus className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Bottom Bar with Pill Button */}
            <div className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-sm border-t-2 border-black pt-4 pb-4 mt-8 w-full flex items-center justify-between gap-4 max-w-[400px]">
                <div className="flex flex-col">
                    <span className="text-xs font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Total Estimate</span>
                    <span className="text-3xl font-black leading-none text-black">₹{totalPrice.toLocaleString()}</span>
                </div>

                {/* Rounded Pill Button matching the reference image */}
                <Button
                    type="submit"
                    className="h-14 px-8 bg-[#4be794] text-black font-black uppercase text-sm border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : totalPrice === 0 ? (
                        <>
                            Get It Free
                            <Zap className="h-4 w-4" />
                        </>
                    ) : (
                        <>
                            Add to Cart
                            <ShoppingCart className="h-4 w-4" />
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}