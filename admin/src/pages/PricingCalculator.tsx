import { useEffect, useState } from "react";
import { Calculator, Box, FileText, ChevronRight, Activity, Percent } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SubProduct, SubService } from "@/types";

export default function PricingCalculator() {
    const [subProducts, setSubProducts] = useState<SubProduct[]>([]);
    const [subServices, setSubServices] = useState<SubService[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedType, setSelectedType] = useState<"product" | "service">("product");
    const [selectedId, setSelectedId] = useState<number | "">("");

    // Active item details
    const [basePrice, setBasePrice] = useState<number | string>(0);
    const [quantity, setQuantity] = useState<number | string>(1);
    const [configSchema, setConfigSchema] = useState<any>(null);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({});
    
    // Percentage Markups (-100 to infinity)
    const [globalMarkup, setGlobalMarkup] = useState<number | string>(0);
    const [optionMarkups, setOptionMarkups] = useState<Record<string, number | string>>({});
    const [optionFixedMarkups, setOptionFixedMarkups] = useState<Record<string, number | string>>({});

    useEffect(() => {
        Promise.all([
            api<SubProduct[]>("/admin/products/subproducts"),
            api<SubService[]>("/admin/services/subservices")
        ]).then(([prods, servs]) => {
            setSubProducts(prods.filter(p => p.is_active));
            setSubServices(servs.filter(s => s.is_active));
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    const handleSelectType = (val: "product" | "service") => {
        setSelectedType(val);
        setSelectedId("");
        setBasePrice(0);
        setConfigSchema(null);
        setSelectedOptions({});
    };

    const handleSelectItem = (id: string) => {
        const numId = parseInt(id);
        setSelectedId(numId);
        setSelectedOptions({});
        setGlobalMarkup(0);
        setOptionMarkups({});
        setOptionFixedMarkups({});

        if (selectedType === "product") {
            const prod = subProducts.find(p => p.id === numId);
            if (prod) {
                setBasePrice(prod.base_price || 0);
                setConfigSchema(prod.config_schema || null);
                // Pre-fill defaults
                const def: any = {};
                prod.config_schema?.sections?.forEach((s: any) => {
                    if (s.options?.length) {
                        def[s.key] = s.options[0].value;
                    }
                });
                setSelectedOptions(def);
            }
        } else {
            const serv = subServices.find(s => s.id === numId);
            if (serv) {
                setBasePrice(serv.price_per_unit || 0);
                setConfigSchema(null);
            }
        }
    };

    const handleOptionChange = (key: string, val: any) => {
        setSelectedOptions(prev => ({ ...prev, [key]: val }));
    };

    const handleMarkupChange = (key: string, val: string) => {
        setOptionMarkups(prev => ({ ...prev, [key]: val }));
    };

    const handleFixedMarkupChange = (key: string, val: string) => {
        setOptionFixedMarkups(prev => ({ ...prev, [key]: val }));
    };

    const calculateTotal = () => {
        let unitPrice = typeof basePrice === "number" ? basePrice : parseFloat(basePrice as string) || 0;
        
        if (selectedType === "product" && configSchema?.sections) {
            configSchema.sections.forEach((section: any) => {
                const val = selectedOptions[section.key];
                const markupPct = parseFloat(String(optionMarkups[section.key])) || 0;
                const markupFixed = parseFloat(String(optionFixedMarkups[section.key])) || 0;
                
                if (val === undefined) return;

                if (section.type === "dropdown" || section.type === "radio") {
                    const opt = section.options?.find((o: any) => String(o.value) === String(val));
                    if (opt) {
                        let mod = parseFloat(opt.price_mod) || 0;
                        mod = mod + (mod * (markupPct / 100)) + markupFixed;
                        unitPrice += mod;
                    }
                } else if (section.type === "number_input") {
                    const ppu = parseFloat(section.price_per_unit || "0");
                    const qty = parseFloat(val || "0");
                    if (!isNaN(qty)) {
                        let mod = (qty * ppu);
                        mod = mod + (mod * (markupPct / 100)) + markupFixed;
                        unitPrice += mod;
                    }
                }
            });
        }
        
        // Apply Global Product Markup
        const gMarkup = parseFloat(String(globalMarkup)) || 0;
        unitPrice = unitPrice + (unitPrice * (gMarkup / 100));

        const validQuantity = typeof quantity === "number" ? quantity : parseInt(quantity as string) || 1;
        return { unitPrice, total: unitPrice * validQuantity };
    };

    const { unitPrice, total } = calculateTotal();

    return (
        <div className="max-w-6xl mx-auto w-full space-y-6 animate-fade-in font-['Inter',sans-serif]">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Calculator className="text-[#136dec]" size={28} /> Pricing Sandbox
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Test bulk configurations and modify base prices in real-time.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* CONFIGURATION PANEL */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Type</label>
                                <Select value={selectedType} onValueChange={handleSelectType}>
                                    <SelectTrigger className="h-12 border-slate-200 bg-slate-50">
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="product">Product</SelectItem>
                                        <SelectItem value="service">Service</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Item</label>
                                <Select value={String(selectedId)} onValueChange={handleSelectItem} disabled={!selectedType || loading}>
                                    <SelectTrigger className="h-12 border-slate-200 bg-slate-50">
                                        <SelectValue placeholder="Select Item" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedType === "product" ? subProducts.map(p => (
                                            <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                        )) : subServices.map(s => (
                                            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {selectedId && (
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Base Price (₹)</label>
                                    <Input type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)} className="h-12 text-lg font-bold" />
                                </div>

                                {selectedType === "product" && configSchema?.sections?.map((sec: any) => (
                                    <div key={sec.key} className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-bold text-slate-700 flex flex-col gap-1">
                                                <span>{sec.label}</span>
                                                {sec.type === 'number_input' ? (
                                                    <span className="text-xs text-slate-500 font-mono">₹{sec.price_per_unit || 0} per unit</span>
                                                ) : (
                                                    <span className="text-xs text-[#136dec] font-mono">Mod</span>
                                                )}
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-400">Options Adjust:</span>
                                                <div className="relative w-24">
                                                    <span className="absolute left-2 top-2 text-xs text-slate-400">₹</span>
                                                    <Input type="number" placeholder="0" value={optionFixedMarkups[sec.key] || ""} onChange={e => handleFixedMarkupChange(sec.key, e.target.value)} className="h-8 text-xs font-mono pl-6 bg-white" />
                                                </div>
                                                <span className="text-slate-300 font-bold">+</span>
                                                <div className="relative w-20">
                                                    <Input type="number" placeholder="0" value={optionMarkups[sec.key] || ""} onChange={e => handleMarkupChange(sec.key, e.target.value)} className="h-8 text-xs font-mono pr-6 bg-white" />
                                                    <span className="absolute right-2 top-2 text-xs text-slate-400">%</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {sec.type === "dropdown" || sec.type === "radio" ? (
                                            <Select value={String(selectedOptions[sec.key] || "")} onValueChange={(v) => handleOptionChange(sec.key, v)}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="Select Option" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {sec.options?.map((opt: any, i:number) => {
                                                        const markupPct = parseFloat(String(optionMarkups[sec.key])) || 0;
                                                        const markupFixed = parseFloat(String(optionFixedMarkups[sec.key])) || 0;
                                                        const baseMod = parseFloat(opt.price_mod) || 0;
                                                        const finalMod = baseMod + (baseMod * (markupPct / 100)) + markupFixed;
                                                        return (
                                                            <SelectItem key={i} value={String(opt.value)}>
                                                                {opt.label} {(finalMod !== 0 || baseMod !== 0 || markupFixed !== 0) && <span className="text-xs text-slate-400 ml-2">(+{finalMod < 0 ? '-' : ''}₹{Math.abs(finalMod).toFixed(2)})</span>}
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        ) : sec.type === "number_input" ? (
                                            <Input type="number" min={sec.min || 0} max={sec.max} value={selectedOptions[sec.key] || ""} onChange={e => handleOptionChange(sec.key, e.target.value)} className="bg-white" placeholder={`Quantity for ${sec.label}`} />
                                        ) : (
                                            <Input value={selectedOptions[sec.key] || ""} onChange={e => handleOptionChange(sec.key, e.target.value)} className="bg-white" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* REAL TIME OUTPUT PANEL */}
                <div className="space-y-6 sticky top-20 self-start">
                    <div className="bg-slate-900 rounded-2xl shadow-xl shadow-[#136dec]/10 overflow-hidden text-white border border-slate-800 relative">
                        {/* decorative blobs */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#136dec] opacity-20 blur-[50px] rounded-full" />
                        
                        <div className="p-6 relative z-10 flex flex-col items-center text-center space-y-4 border-b border-white/10">
                            <p className="text-xs font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2"><Activity size={14}/> Live Total</p>
                            <h3 className="text-5xl font-black tracking-tight font-mono text-transparent bg-clip-text bg-linear-to-br from-white to-slate-400">
                                ₹{total.toLocaleString()}
                            </h3>
                            <div className="bg-slate-800/50 px-4 py-1.5 rounded-full text-sm font-mono text-slate-300">
                                Unit Price: <span className="font-bold text-white">₹{unitPrice.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-950/50 space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bulk Quantity</label>
                                <Input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className="h-12 text-center text-xl font-bold bg-slate-800 border-slate-700 text-white" />
                            </div>
                            <div className="space-y-2 pt-2 border-t border-slate-800">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Global Price Adjustment</label>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="range" 
                                        min="-100" 
                                        max="100" 
                                        value={typeof globalMarkup === "number" ? globalMarkup : parseFloat(globalMarkup as string) || 0} 
                                        onChange={e => setGlobalMarkup(e.target.value)}
                                        className="flex-1 accent-[#136dec]"
                                    />
                                    <div className="relative w-20 shrink-0">
                                        <Input type="number" value={globalMarkup} onChange={e => setGlobalMarkup(e.target.value)} className="bg-slate-800 border-slate-700 text-white pr-6 text-center font-bold" />
                                        <span className="absolute right-2 top-2.5 text-xs text-slate-400">%</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 text-center">Applies to total unit price (defaults to 0%)</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                        <div className="flex gap-3">
                            <Percent className="text-amber-600 shrink-0 mt-0.5" size={18} />
                            <div className="text-sm text-amber-800">
                                <p className="font-bold">Sandbox Mode</p>
                                <p className="mt-1 opacity-90">Changes made here are <span className="font-semibold underline">not</span> saved to the database. This tool is purely for calculation previews.</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
