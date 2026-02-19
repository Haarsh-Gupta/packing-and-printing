"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UploadCloud } from "lucide-react";

// Types based on your FastAPI JSON schema
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
    name: string;
    base_price: number;
    minimum_quantity: number;
    config_schema: {
        sections: SchemaSection[];
    };
}

export default function ProductInquiryForm({ product }: { product: ProductSchema }) {
    const [isLoading, setIsLoading] = useState(false);
    const [quantity, setQuantity] = useState<number>(product.minimum_quantity);

    // State to hold the user's current selections
    const [answers, setAnswers] = useState<Record<string, any>>({});

    // Initialize default answers when the component loads
    useEffect(() => {
        const initialAnswers: Record<string, any> = {};
        product.config_schema.sections.forEach((section) => {
            if ((section.type === "dropdown" || section.type === "radio") && section.options) {
                initialAnswers[section.key] = section.options[0].value; // Select first option by default
            } else if (section.type === "number_input") {
                initialAnswers[section.key] = section.min_val || 0;
            } else {
                initialAnswers[section.key] = "";
            }
        });
        setAnswers(initialAnswers);
    }, [product]);

    // Handle changes to any field
    const handleAnswerChange = (key: string, value: any) => {
        setAnswers((prev) => ({ ...prev, [key]: value }));
    };

    // Dynamically calculate the price
    const { unitPrice, totalPrice } = useMemo(() => {
        let currentUnitPrice = product.base_price;

        product.config_schema.sections.forEach((section) => {
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

        const payload = {
            product_name: product.name,
            quantity,
            configuration: answers,
            estimated_total: totalPrice,
        };

        console.log("Submitting Inquiry:", payload);

        setTimeout(() => {
            setIsLoading(false);
            alert("Inquiry submitted successfully!");
        }, 1500);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 flex flex-col h-full">

            {/* Scrollable Form Fields */}
            <div className="space-y-8 flex-grow">

                {/* Fixed Quantity Field */}
                <div className="space-y-3 bg-zinc-50 p-4 border-2 border-black">
                    <Label className="text-lg font-bold">Quantity (Min: {product.minimum_quantity})</Label>
                    <Input
                        type="number"
                        min={product.minimum_quantity}
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="border-2 border-black rounded-md text-lg h-12"
                    />
                </div>

                {/* Dynamic Fields from Schema */}
                {product.config_schema.sections.map((section) => (
                    <div key={section.key} className="space-y-3 border-b-2 border-zinc-200 pb-6">
                        <Label className="text-lg font-bold flex items-center justify-between">
                            {section.label}
                            {section.type === "number_input" && section.price_per_unit && (
                                <span className="text-sm font-normal text-zinc-500">
                                    (+₹{section.price_per_unit} per unit)
                                </span>
                            )}
                        </Label>

                        {/* Render both 'dropdown' and 'radio' as RadioGroups with Gumroad-style cards */}
                        {(section.type === "dropdown" || section.type === "radio") && section.options && (
                            <RadioGroup
                                value={answers[section.key]}
                                onValueChange={(val) => handleAnswerChange(section.key, val)}
                                className="flex flex-col gap-4"
                            >
                                {section.options.map((option) => {
                                    const isSelected = answers[section.key] === option.value;
                                    const priceDisplay = (option.price_mod || 0) > 0
                                        ? `+₹${option.price_mod}`
                                        : (option.price_mod || 0) < 0
                                            ? `-₹${Math.abs(option.price_mod || 0)}`
                                            : "Free";

                                    return (
                                        <Label
                                            key={option.value}
                                            className={`
                        relative flex items-center justify-between p-4 border-2 border-black cursor-pointer transition-all rounded-md
                        ${isSelected
                                                    ? "bg-[#4be794] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1"
                                                    : "bg-white hover:bg-zinc-50"
                                                }
                      `}
                                        >
                                            {/* Hidden Radio Input */}
                                            <RadioGroupItem value={option.value} id={`${section.key}-${option.value}`} className="sr-only" />

                                            {/* Left: Label and Selection Text */}
                                            <div className="flex flex-col gap-1">
                                                <span className="text-lg font-bold">{option.label}</span>
                                                {isSelected && <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Selected</span>}
                                            </div>

                                            {/* Right: Price Pill */}
                                            <div className="bg-white border-2 border-black px-3 py-1 text-sm font-bold min-w-[70px] text-center rounded-full shadow-sm">
                                                {priceDisplay}
                                            </div>
                                        </Label>
                                    );
                                })}
                            </RadioGroup>
                        )}

                        {/* Number Input */}
                        {section.type === "number_input" && (
                            <Input
                                type="number"
                                min={section.min_val}
                                max={section.max_val}
                                value={answers[section.key] || ""}
                                onChange={(e) => handleAnswerChange(section.key, e.target.value)}
                                className="border-2 border-black rounded-md text-lg h-12"
                            />
                        )}

                        {/* Text Input */}
                        {section.type === "text_input" && (
                            <Input
                                type="text"
                                placeholder="Enter details..."
                                value={answers[section.key] || ""}
                                onChange={(e) => handleAnswerChange(section.key, e.target.value)}
                                className="border-2 border-black rounded-md text-lg h-12"
                            />
                        )}
                    </div>
                ))}

                {/* File Upload Section (Static addition for printing jobs) */}
                <div className="space-y-3">
                    <Label className="text-lg font-bold">Design File (.cdr, .ai, .pdf)</Label>
                    <div className="rounded-md border-2 border-dashed border-black bg-zinc-50 p-8 text-center hover:bg-zinc-100 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2">
                        <UploadCloud className="h-10 w-10 text-zinc-500" />
                        <span className="font-medium">Upload your vector or PDF design</span>
                    </div>
                </div>

            </div>

            {/* Sticky Price Summary Footer */}
            <div className="sticky bottom-0 bg-white border-t-4 border-black pt-6 pb-2 mt-8 flex flex-col gap-4 z-10">
                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <p className="text-zinc-500 font-medium">Price per unit: <span className="text-black font-bold">₹{unitPrice.toFixed(2)}</span></p>
                        <p className="text-3xl font-black">Total: ₹{totalPrice.toLocaleString()}</p>
                    </div>
                </div>

                <Button type="submit" className="w-full h-16 bg-[#4be794] text-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded-md font-bold border-2 border-black" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Request Official Quote"}
                </Button>
            </div>
        </form>
    );
}