import { useEffect, useState } from "react";
import { Calculator, Box, FileText, ChevronRight, Activity, Percent, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";
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

    const handleSelectType = (val: string) => {
        setSelectedType(val as "product" | "service");
        setSelectedId("");
        setBasePrice(0);
        setConfigSchema(null);
        setSelectedOptions({});
    };

    const handleSelectItem = (id: string) => {
        const numId = parseInt(id);
        setSelectedId(numId || "");
        setSelectedOptions({});
        setGlobalMarkup(0);
        setOptionMarkups({});
        setOptionFixedMarkups({});

        if (!numId) return;

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
                    const userVal = parseFloat(val || "0");
                    const defaultVal = parseFloat(section.default_val || "0");
                    if (!isNaN(userVal)) {
                        let mod = ((userVal - defaultVal) * ppu);
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
        <div className="flex flex-col h-full font-['Inter'] bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] px-2 pb-12 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                    <nav className="flex items-center gap-2 text-[10px] font-bold text-blue-600 dark:text-[#adc6ff] mb-2 tracking-widest uppercase">
                        <span>Tools</span>
                        <span>/</span>
                        <span className="text-slate-600 dark:text-[#c3c5d8]/60">Estimator</span>
                    </nav>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-[#dae2fd] m-0 flex items-center gap-3">
                        <Calculator className="text-[#1f70e3]" size={28} /> Pricing Sandbox
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-[#c3c5d8] mt-1 m-0">Simulate payload configurations and rate modifications in an isolated environment.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
                
                {/* CONFIGURATION PANEL */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white dark:bg-[#131b2e] rounded-2xl shadow-sm border border-slate-200 dark:border-[#434655]/20 flex flex-col overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-200 dark:border-[#434655]/20 bg-slate-100 dark:bg-[#0b1326]/50">
                            <h2 className="text-[11px] uppercase tracking-widest font-extrabold text-slate-900 dark:text-[#dae2fd] m-0">Entity Vector</h2>
                        </div>
                        
                        <div className="p-6 flex flex-col gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-[#8d90a1]">Class</label>
                                    <div className="relative">
                                        <select 
                                            value={selectedType} 
                                            onChange={e => handleSelectType(e.target.value)}
                                            className="w-full h-11 pl-4 pr-10 rounded-lg border border-slate-200 dark:border-[#434655]/40 text-sm font-bold bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] outline-none focus:border-blue-400 dark:border-[#adc6ff] transition-colors appearance-none"
                                        >
                                            <option value="product">Manufacturing Structure (Product)</option>
                                            <option value="service">Execution Sequence (Service)</option>
                                        </select>
                                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#434655] pointer-events-none" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-[#8d90a1]">Identifier</label>
                                    <div className="relative">
                                        <select 
                                            value={String(selectedId)} 
                                            onChange={e => handleSelectItem(e.target.value)} 
                                            disabled={!selectedType || loading}
                                            className="w-full h-11 pl-4 pr-10 rounded-lg border border-slate-200 dark:border-[#434655]/40 text-sm font-bold bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] outline-none focus:border-blue-400 dark:border-[#adc6ff] transition-colors appearance-none disabled:opacity-50"
                                        >
                                            <option value="">-- Select Target --</option>
                                            {selectedType === "product" ? subProducts.map(p => (
                                                <option key={p.id} value={String(p.id)}>{p.name}</option>
                                            )) : subServices.map(s => (
                                                <option key={s.id} value={String(s.id)}>{s.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#434655] pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {selectedId && (
                            <div className="border-t border-slate-200 dark:border-[#434655]/20 bg-slate-50 dark:bg-[#0b1326]">
                                <div className="p-6 space-y-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-[#c3c5d8]">Base Evaluation (₹)</label>
                                        <input 
                                            type="number" 
                                            value={basePrice} 
                                            onChange={e => setBasePrice(e.target.value)} 
                                            className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-[#434655]/40 bg-white dark:bg-[#131b2e] text-lg font-mono font-extrabold text-blue-600 dark:text-[#adc6ff] outline-none focus:border-blue-400 dark:border-[#adc6ff] transition-colors"
                                        />
                                    </div>

                                    {selectedType === "product" && configSchema?.sections?.length > 0 && (
                                        <div className="flex flex-col gap-4">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-[#c3c5d8]">Configuration Parameters</label>
                                            {configSchema.sections.map((sec: any) => (
                                                <div key={sec.key} className="flex flex-col gap-3 p-5 rounded-xl border border-slate-200 dark:border-[#434655]/40 bg-slate-50 dark:bg-[#171f33]/50">
                                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className="text-[11px] font-extrabold text-slate-900 dark:text-[#dae2fd] leading-none uppercase tracking-widest">{sec.label}</span>
                                                            <span className="text-[9px] font-mono uppercase tracking-[0.2em]">
                                                                {sec.type === 'number_input' ? (
                                                                    <span className="text-slate-500 dark:text-[#8d90a1]">₹{sec.price_per_unit || 0} / UNIT</span>
                                                                ) : (
                                                                    <span className="text-[#1f70e3]">MUTATOR</span>
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#434655]">DELTA:</span>
                                                            <div className="relative">
                                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-600 dark:text-[#c3c5d8]">₹</span>
                                                                <input 
                                                                    type="number" 
                                                                    placeholder="0" 
                                                                    value={optionFixedMarkups[sec.key] || ""} 
                                                                    onChange={e => handleFixedMarkupChange(sec.key, e.target.value)} 
                                                                    className="w-[80px] h-8 pl-6 pr-2 rounded text-[11px] font-mono font-bold bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/40 text-slate-900 dark:text-[#dae2fd] outline-none focus:border-blue-400 dark:border-[#adc6ff] transition-colors placeholder:text-[#434655]" 
                                                                />
                                                            </div>
                                                            <span className="text-[#434655] font-extrabold">+</span>
                                                            <div className="relative">
                                                                <input 
                                                                    type="number" 
                                                                    placeholder="0" 
                                                                    value={optionMarkups[sec.key] || ""} 
                                                                    onChange={e => handleMarkupChange(sec.key, e.target.value)} 
                                                                    className="w-[70px] h-8 px-2 pr-6 rounded text-[11px] font-mono font-bold bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/40 text-slate-900 dark:text-[#dae2fd] outline-none focus:border-blue-400 dark:border-[#adc6ff] transition-colors placeholder:text-[#434655] text-right" 
                                                                />
                                                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-600 dark:text-[#c3c5d8]">%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {sec.type === "dropdown" || sec.type === "radio" ? (
                                                        <div className="relative w-full">
                                                            <select 
                                                                value={String(selectedOptions[sec.key] || "")} 
                                                                onChange={(e) => handleOptionChange(sec.key, e.target.value)}
                                                                className="w-full h-11 pl-4 pr-10 rounded-lg border border-slate-200 dark:border-[#434655]/40 text-xs font-bold bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] outline-none focus:border-blue-400 dark:border-[#adc6ff] transition-colors appearance-none"
                                                            >
                                                                <option value="">-- Select State --</option>
                                                                {sec.options?.map((opt: any, i:number) => {
                                                                    const markupPct = parseFloat(String(optionMarkups[sec.key])) || 0;
                                                                    const markupFixed = parseFloat(String(optionFixedMarkups[sec.key])) || 0;
                                                                    const baseMod = parseFloat(opt.price_mod) || 0;
                                                                    const finalMod = baseMod + (baseMod * (markupPct / 100)) + markupFixed;
                                                                    return (
                                                                        <option key={i} value={String(opt.value)}>
                                                                            {opt.label} {(finalMod !== 0 || baseMod !== 0 || markupFixed !== 0) ? ` (+${finalMod < 0 ? '-' : ''}₹${Math.abs(finalMod).toFixed(2)})` : ''}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </select>
                                                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#434655] pointer-events-none" />
                                                        </div>
                                                    ) : sec.type === "number_input" ? (
                                                        <input 
                                                            type="number" 
                                                            min={sec.min || 0} 
                                                            max={sec.max} 
                                                            value={selectedOptions[sec.key] || ""} 
                                                            onChange={e => handleOptionChange(sec.key, e.target.value)} 
                                                            className="w-full h-11 px-4 rounded-lg border border-slate-200 dark:border-[#434655]/40 text-xs font-bold bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] outline-none focus:border-blue-400 dark:border-[#adc6ff] transition-colors placeholder:text-[#434655]" 
                                                            placeholder={`Define metric for ${sec.label}`} 
                                                        />
                                                    ) : (
                                                        <input 
                                                            type="text"
                                                            value={selectedOptions[sec.key] || ""} 
                                                            onChange={e => handleOptionChange(sec.key, e.target.value)} 
                                                            className="w-full h-11 px-4 rounded-lg border border-slate-200 dark:border-[#434655]/40 text-xs font-bold bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] outline-none focus:border-blue-400 dark:border-[#adc6ff] transition-colors" 
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* REAL TIME OUTPUT PANEL */}
                <div className="flex flex-col gap-6 sticky top-6 self-start">
                    {/* Live Output Card */}
                    <div className="bg-[#1f70e3] rounded-2xl shadow-lg border border-transparent overflow-hidden text-white relative">
                        {/* Decorative highlights */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-10 blur-[60px] rounded-full pointer-events-none" />
                        
                        <div className="p-8 relative z-10 flex flex-col items-center justify-center text-center gap-4">
                            <p className="text-[10px] font-extrabold text-blue-600 dark:text-[#adc6ff] tracking-[0.3em] uppercase flex items-center gap-2 m-0">
                                <Activity size={14} /> Live Computation
                            </p>
                            <h3 className="text-5xl font-extrabold tracking-tight font-mono text-white m-0">
                                ₹{total.toLocaleString()}
                            </h3>
                            <div className="bg-[#001a42]/30 border border-white/10 px-4 py-1.5 rounded-lg text-[11px] font-mono text-blue-600 dark:text-[#adc6ff] shadow-inner mt-2">
                                Unit Metric: <span className="font-bold text-white">₹{unitPrice.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="p-6 bg-[#001a42]/60 flex flex-col gap-5 border-t border-white/10 relative z-10">
                            <div className="flex flex-col gap-2">
                                <label className="text-[9px] font-bold text-blue-600 dark:text-[#adc6ff] uppercase tracking-[0.2em] text-center">Batch Size Volume</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    value={quantity} 
                                    onChange={e => setQuantity(e.target.value)} 
                                    className="w-full h-12 text-center text-xl font-mono font-extrabold bg-slate-50 dark:bg-[#0b1326] border border-[#1f70e3]/50 rounded-xl text-white outline-none focus:border-white transition-colors" 
                                />
                            </div>
                            
                            <div className="flex flex-col gap-3 pt-4 border-t border-[#1f70e3]/30">
                                <label className="text-[9px] font-bold text-blue-600 dark:text-[#adc6ff] uppercase tracking-[0.2em] text-center">Global Metric Override</label>
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="range" 
                                        min="-100" 
                                        max="100" 
                                        value={typeof globalMarkup === "number" ? globalMarkup : parseFloat(globalMarkup as string) || 0} 
                                        onChange={e => setGlobalMarkup(e.target.value)}
                                        className="flex-1 accent-white h-1.5 rounded-full bg-white dark:bg-[#131b2e] appearance-none"
                                    />
                                    <div className="relative w-20 shrink-0">
                                        <input 
                                            type="number" 
                                            value={globalMarkup} 
                                            onChange={e => setGlobalMarkup(e.target.value)} 
                                            className="w-full h-9 pl-2 pr-6 rounded-lg text-xs font-mono font-extrabold bg-slate-50 dark:bg-[#0b1326] border border-[#1f70e3]/50 text-white outline-none text-center" 
                                        />
                                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-blue-600 dark:text-[#adc6ff]">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notice */}
                    <div className="bg-[#f59e0b]/10 rounded-xl p-5 border border-[#f59e0b]/20 flex gap-4">
                        <Percent className="text-[#fcd34d] shrink-0 mt-0.5" size={20} />
                        <div className="flex flex-col gap-1.5 text-slate-900 dark:text-[#dae2fd]">
                            <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#fcd34d] m-0">Isolated Environment</p>
                            <p className="text-[11px] font-medium leading-relaxed m-0 text-slate-600 dark:text-[#c3c5d8]">
                                Vectors injected into this sandbox do <span className="text-white font-bold underline">not</span> mutate global state. Used purely for projective calculations.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
