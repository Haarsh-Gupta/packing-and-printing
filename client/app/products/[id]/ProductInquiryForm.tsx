"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, UploadCloud, ShoppingCart, Plus, Minus, Check } from "lucide-react";
import { useAlert } from "@/components/CustomAlert";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { addToInquiry, updateOptions, updateQuantity } from "@/lib/store/inquirySlice";

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
    default_val?: number;
    price_per_unit?: number;
}

interface ProductSchema {
    id: number;
    product_id: number;
    name: string;
    slug: string;
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
    const searchParams = useSearchParams();
    const editId = searchParams?.get("edit");
    const { items } = useAppSelector(s => s.inquiry);

    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [quantity, setQuantity] = useState<number>(product.minimum_quantity);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [answers, setAnswers] = useState<Record<string, any>>(() => {
        const initialAnswers: Record<string, any> = {};
        product.config_schema.sections.forEach((section) => {
            if (section.type === "radio" && section.options) {
                initialAnswers[section.key] = section.options[0].value;
            } else if (section.type === "dropdown") {
                initialAnswers[section.key] = [];
            } else if (section.type === "number_input") {
                initialAnswers[section.key] = section.default_val !== undefined ? section.default_val : (section.min_val || 0);
            } else {
                initialAnswers[section.key] = "";
            }
        });
        return initialAnswers;
    });
    
    // Populate data if in edit mode
    useEffect(() => {
        if (editId) {
            const item = items.find(i => i.id === editId);
            if (item) {
                setAnswers(item.options);
                setQuantity(item.quantity);
            }
        }
    }, [editId, items]);

    const handleAnswerChange = (key: string, value: any) => {
        setAnswers((prev) => ({ ...prev, [key]: value }));
    };

    const handleCheckboxToggle = (key: string, value: string) => {
        setAnswers((prev) => {
            const currentArr = Array.isArray(prev[key]) ? prev[key] : [];
            if (currentArr.includes(value)) {
                return { ...prev, [key]: currentArr.filter((v: string) => v !== value) };
            } else {
                return { ...prev, [key]: [...currentArr, value] };
            }
        });
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

        product.config_schema.sections.forEach((section) => {
            const answer = answers[section.key];
            if (answer === undefined || answer === "") return;

            if (section.type === "radio" && section.options) {
                const selectedOption = section.options.find((opt) => opt.value === answer);
                if (selectedOption?.price_mod) {
                    currentUnitPrice += selectedOption.price_mod;
                }
            }

            if (section.type === "dropdown" && section.options) {
                const arr = Array.isArray(answer) ? answer : [answer];
                arr.forEach((val) => {
                    const selectedOption = section.options!.find((opt) => opt.value === val);
                    if (selectedOption?.price_mod) {
                        currentUnitPrice += selectedOption.price_mod;
                    }
                });
            }

            if (section.type === "number_input" && section.price_per_unit) {
                const userVal = Number(answer) || 0;
                const defVal = section.default_val || 0;
                currentUnitPrice += (userVal - defVal) * section.price_per_unit;
            }
        });

        return {
            unitPrice: currentUnitPrice,
            totalPrice: currentUnitPrice * quantity,
        };
    }, [answers, quantity, product]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showAlert("File must be under 5MB size limit", "error");
            return;
        }
        setIsUploading(true);
        try {            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/?purpose=inquiry`, {
                method: "POST",
                credentials: "include",
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                handleAnswerChange("uploaded_files", [data.url]);
                handleAnswerChange("uploaded_file_name", data.filename || file.name);
                showAlert("File attached successfully!", "success");
            } else {
                showAlert("Failed to upload file.", "error");
            }
        } catch {
            showAlert("Upload error.", "error");
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (editId) {
            dispatch(updateOptions({
                id: editId,
                options: answers as any,
                estimatedPrice: totalPrice
            }));
            // also update quantity if it changed
            dispatch(updateQuantity({
                id: editId,
                quantity: quantity,
                pricePerUnit: unitPrice
            }));
            showAlert(`${product.name} updated!`, "success");
            router.push("/cart");
        } else {
            dispatch(addToInquiry({
                id: generateId(),
                productId: product.product_id,
                subproductId: product.id,
                name: product.name,
                slug: product.slug,
                quantity: quantity,
                options: answers,
                estimatedPrice: totalPrice,
                imageUrl: (product as any).images?.[0] ?? undefined,
                pricePerUnit: unitPrice
            }));
            showAlert(`${product.name} added to cart!`, "success");
        }
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="relative flex flex-col space-y-6 w-full font-sans pb-4">

            <div className="space-y-6 max-w-[400px] w-full">
                {product.config_schema.sections.map((section) => {
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

                            {section.type === "radio" && section.options && (
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
                                                            ? "shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-[2px] -translate-x-[2px] ring-2 r ring-inset"
                                                            : "hover:-translate-y-px hover:-translate-x-px hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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

                            {/* DROPDOWN - MULTI SELECT (CHECKBOXES) */}
                            {section.type === "dropdown" && section.options && (
                                <div className={isColorOption ? "flex flex-wrap gap-2.5" : "flex flex-col gap-3"}>
                                    {section.options.map((option) => {
                                        const isSelected = Array.isArray(answers[section.key]) && answers[section.key].includes(option.value);

                                        // SQUARE COLOR BLOCKS
                                        if (isColorOption) {
                                            return (
                                                <div
                                                    key={option.value}
                                                    onClick={() => handleCheckboxToggle(section.key, option.value)}
                                                    style={{ backgroundColor: getColorValue(option.label) }}
                                                    className={`
                                                        relative h-10 w-12 cursor-pointer transition-all rounded-[2px] border-2 border-black flex items-center justify-center
                                                        ${isSelected
                                                            ? "shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-[2px] -translate-x-[2px] ring-2 ring-white ring-inset"
                                                            : "hover:-translate-y-px hover:-translate-x-px hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                        }
                                                    `}
                                                    title={`${cleanLabelText(option.label)} ${option.price_mod ? `(+₹${option.price_mod})` : ''}`}
                                                >
                                                    {isSelected && <Check className="h-4 w-4 text-white drop-shadow-md" />}
                                                </div>
                                            );
                                        }

                                        // GUMROAD VERTICAL LIST
                                        return (
                                            <div
                                                key={option.value}
                                                onClick={() => handleCheckboxToggle(section.key, option.value)}
                                                className={`
                                                    relative flex items-center gap-4 p-4 cursor-pointer transition-all border-2 border-black rounded-md w-full
                                                    ${isSelected
                                                        ? "bg-zinc-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-[2px] -translate-x-[2px]"
                                                        : "bg-white hover:bg-zinc-50"
                                                    }
                                                `}
                                            >
                                                {/* Checkbox UI Indicator */}
                                                <div className={`flex h-6 w-6 shrink-0 items-center justify-center border-2 border-black rounded-sm transition-colors ${isSelected ? "bg-black" : "bg-white"}`}>
                                                    {isSelected && <Check className="h-4 w-4 text-white" />}
                                                </div>

                                                {/* Text Content */}
                                                <div className="flex flex-col flex-1">
                                                    <span className="font-bold text-sm text-black">{cleanLabelText(option.label)}</span>
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${isSelected ? "text-green-600" : "text-zinc-400"}`}>
                                                        {isSelected ? "Selected" : "Select Option"}
                                                    </span>
                                                </div>

                                                {/* Circle Price Badge */}
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white font-bold text-xs shadow-sm text-center leading-none">
                                                    {option.price_mod > 0 ? "+" : (option.price_mod < 0 ? "-" : "")}₹{Math.abs(option.price_mod || 0)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
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
                                <div className="space-y-2">
                                    <Input
                                        type="number"
                                        min={section.min_val}
                                        max={section.max_val}
                                        value={answers[section.key] || ""}
                                        onChange={(e) => handleAnswerChange(section.key, e.target.value)}
                                        className="border-2 border-black rounded-md h-12 font-bold uppercase text-sm focus-visible:ring-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] focus-visible:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                                    />
                                    <div className="flex justify-between px-1">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                            {section.min_val !== undefined && section.max_val !== undefined 
                                                ? `Range: ${section.min_val} - ${section.max_val}`
                                                : section.min_val !== undefined 
                                                    ? `Min: ${section.min_val}` 
                                                    : section.max_val !== undefined 
                                                        ? `Max: ${section.max_val}` 
                                                        : "No limits"}
                                        </p>
                                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                                            Base: {section.default_val || 0}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-black uppercase tracking-widest text-zinc-800">Design File</Label>
                        <input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="image/*,.pdf,.ai,.psd,.eps,.zip"
                        />
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-black bg-white h-12 flex items-center justify-center hover:bg-[#fdf567] hover:border-solid transition-colors cursor-pointer group rounded-md overflow-hidden relative px-4"
                        >
                            {isUploading ? (
                                <Loader2 className="w-4 h-4 animate-spin text-black" />
                            ) : answers["uploaded_file_name"] ? (
                                <span className="text-xs font-bold uppercase tracking-wide text-green-600 flex items-center gap-2 truncate">
                                    <Check className="h-4 w-4 shrink-0" /> {answers["uploaded_file_name"]}
                                </span>
                            ) : (
                                <span className="text-xs font-bold uppercase tracking-wide text-black flex items-center gap-2 shrink-0">
                                    <UploadCloud className="h-4 w-4" /> Upload
                                </span>
                            )}
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
                    className="h-14 px-8 bg-accent-green text-black font-black uppercase text-sm border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <>
                            {editId ? "Update Item" : "Add to Cart"}
                            {editId ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}