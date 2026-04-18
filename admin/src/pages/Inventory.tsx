import { useState } from "react";
import { BarChart3, Package, Layers, ArrowLeftRight } from "lucide-react";
import PurchaseAnalytics from "./inventory/PurchaseAnalytics";
import Materials from "./inventory/Materials";
import StockBatches from "./inventory/StockBatches";
import Transactions from "./inventory/Transactions";
import CustomerStock from "./inventory/CustomerStock";

type InventoryScope = "FACTORY" | "CUSTOMER";

const TABS = [
    { id: "analytics", label: "Purchase Analytics", icon: BarChart3 },
    { id: "materials", label: "Materials", icon: Package },
    { id: "stock", label: "Stock & Batches", icon: Layers },
    { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Inventory() {
    const [tab, setTab] = useState<string>("analytics");
    const [scope, setScope] = useState<InventoryScope>("FACTORY");

    const tabs = scope === "FACTORY" ? [
        { id: "analytics", label: "Analytics", icon: BarChart3 },
        { id: "materials", label: "Materials", icon: Package },
        { id: "stock", label: "Stock & Batches", icon: Layers },
        { id: "transactions", label: "Ledger", icon: ArrowLeftRight },
    ] : [
        { id: "customer_stock", label: "Customer Stock", icon: Package },
        { id: "transactions", label: "Returns Ledger", icon: ArrowLeftRight },
    ];

    const handleScopeChange = (newScope: InventoryScope) => {
        setScope(newScope);
        setTab(newScope === "FACTORY" ? "analytics" : "customer_stock");
    };

    return (
        <div className="animate-fade-in font-['Inter'] min-h-screen bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] transition-colors">
            {/* Header */}
            <div className="pt-8 px-10 pb-0">
                <nav className="flex items-center gap-2 text-[10px] font-bold text-blue-600 dark:text-[#adc6ff] mb-2 tracking-widest uppercase">
                    <span>Operations</span>
                    <span>/</span>
                    <span className="text-slate-600 dark:text-[#c3c5d8]/60">Inventory</span>
                </nav>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-[#dae2fd] m-0">
                            Inventory Management
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-[#c3c5d8] mt-1 m-0">
                            Track materials, manage stock, and analyze purchase trends.
                        </p>
                    </div>

                    <div className="flex bg-slate-200/50 dark:bg-[#131b2e] rounded-xl p-1 w-fit">
                        <button 
                            onClick={() => handleScopeChange("FACTORY")}
                            className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${scope === "FACTORY" ? "bg-white dark:bg-[#1c263d] text-blue-600 dark:text-[#adc6ff] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            Factory
                        </button>
                        <button 
                            onClick={() => handleScopeChange("CUSTOMER")}
                            className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${scope === "CUSTOMER" ? "bg-white dark:bg-[#1c263d] text-blue-600 dark:text-[#adc6ff] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            Customer
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="px-10 mt-6">
                <div className="flex gap-1 border-b border-slate-200 dark:border-[#434655]/20">
                    {tabs.map(t => {
                        const active = tab === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all relative ${
                                    active
                                        ? "text-blue-600 dark:text-[#adc6ff]"
                                        : "text-slate-500 dark:text-[#c3c5d8] hover:text-slate-700 dark:hover:text-[#dae2fd]"
                                }`}
                            >
                                <t.icon size={14} />
                                {t.label}
                                {active && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 dark:bg-[#adc6ff] rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="px-10 py-8">
                {scope === "FACTORY" ? (
                    <>
                        {tab === "analytics" && <PurchaseAnalytics />}
                        {tab === "materials" && <Materials />}
                        {tab === "stock" && <StockBatches ownerType="FACTORY" />}
                        {tab === "transactions" && <Transactions ownerType="FACTORY" />}
                    </>
                ) : (
                    <>
                        {tab === "customer_stock" && <CustomerStock />}
                        {tab === "transactions" && <Transactions ownerType="CUSTOMER" />}
                    </>
                )}
            </div>
        </div>
    );
}
