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
    price_mod?: number;
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
        sections: Array<{
            key: string;
            label: string;
            type: "dropdown" | "radio" | "number_input" | "text_input";
            options?: Array<Option>; // Use the Option interface
            min_val?: number;
            max_val?: number;
            price_per_unit?: number;
        }>;
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
                        className="border-2 border-black rounded-none text-lg h-12"
                    />
                </div>

                {/* Dynamic Fields from Schema */}
                {product.config_schema.sections.map((section) => (
                    <div key={section.key} className="space-y-4 pb-6">
                        <div className="bg-black p-3">
                            <Label className="text-lg font-bold flex items-center justify-between text-white">
                                {section.label}
                                {section.type === "number_input" && section.price_per_unit && (
                                    <span className="text-sm font-normal text-zinc-300">
                                        (+₹{section.price_per_unit} per unit)
                                    </span>
                                )}
                            </Label>
                        </div>

                        {/* Render both 'dropdown' and 'radio' as RadioGroups */}
                        {(section.type === "dropdown" || section.type === "radio") && section.options && (
                            <RadioGroup
                                value={answers[section.key]}
                                onValueChange={(val) => handleAnswerChange(section.key, val)}
                                className="grid gap-3"
                            >
                                {section.options.map((option) => (
                                    <div key={option.value} className="flex items-center space-x-2 border-2 border-transparent hover:border-black p-2 transition-colors cursor-pointer">
                                        <RadioGroupItem value={option.value} id={`${section.key}-${option.value}`} className="border-2 border-black border-black text-black" />
                                        <Label htmlFor={`${section.key}-${option.value}`} className="flex-grow cursor-pointer text-base">
                                            {option.label}
                                        </Label>
                                        <span className="text-sm font-bold bg-zinc-100 px-2 py-1 border border-black">
                                            {(option.price_mod || 0) > 0 ? `+₹${option.price_mod}` : (option.price_mod || 0) < 0 ? `-₹${Math.abs(option.price_mod || 0)}` : "Included"}
                                        </span>
                                    </div>
                                ))}
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
                                className="border-2 border-black rounded-none text-lg h-12"
                            />
                        )}

                        {/* Text Input */}
                        {section.type === "text_input" && (
                            <Input
                                type="text"
                                placeholder="Enter details..."
                                value={answers[section.key] || ""}
                                onChange={(e) => handleAnswerChange(section.key, e.target.value)}
                                className="border-2 border-black rounded-none text-lg h-12"
                            />
                        )}
                    </div>
                ))}

                {/* File Upload Section (Static addition for printing jobs) */}
                <div className="space-y-3">
                    <Label className="text-lg font-bold">Design File (.cdr, .ai, .pdf)</Label>
                    <div className="border-2 border-dashed border-black bg-zinc-50 p-8 text-center hover:bg-zinc-100 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2">
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

                <Button type="submit" className="w-full h-16 bg-black text-white text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded-none" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Request Official Quote"}
                </Button>
            </div>
        </form>
    );
}