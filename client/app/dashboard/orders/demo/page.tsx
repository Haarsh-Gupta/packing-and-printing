"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, CheckCircle2, Truck, CircleDot, CreditCard, Download } from "lucide-react";
import { MOCK_ORDERS } from "@/lib/mockData";
import { useAlert } from "@/components/CustomAlert";

const order = {
    ...MOCK_ORDERS[0],
    transactions: [
        {
            id: 1,
            amount: 5000,
            payment_mode: "ONLINE",
            notes: "First instalment via Razorpay",
            gateway_payment_id: "pay_demo_abc123xyz",
            created_at: new Date(Date.now() - 500000000).toISOString(),
        }
    ]
};

const STATUS_STEPS = [
    { key: "PENDING", label: "Order Placed", icon: CircleDot },
    { key: "IN_PRODUCTION", label: "In Production", icon: Package },
    { key: "SHIPPED", label: "Shipped", icon: Truck },
    { key: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
    { key: "COMPLETED", label: "Completed", icon: CheckCircle2 },
];

const currentStep = 1; // IN_PRODUCTION
const progressPct = ((currentStep + 1) / STATUS_STEPS.length) * 100;
const balanceDue = order.total_amount - order.amount_paid;

export default function PaymentDemoPage() {
    const { showAlert } = useAlert();

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Demo Banner */}
            <div className="bg-[#fdf567] border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
                <p className="font-black uppercase tracking-tight text-sm">
                    🎭 DEMO MODE — Using mock data. Real page: <code className="bg-black text-[#fdf567] px-2 py-0.5">/dashboard/orders/[id]</code>
                </p>
                <Link href="/dashboard/orders" className="font-black text-sm underline">Exit Demo</Link>
            </div>

            {/* Back */}
            <Link href="/dashboard/orders" className="flex items-center gap-2 text-zinc-500 font-bold hover:text-black transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Orders
            </Link>

            {/* Order Header */}
            <div className="border-4 border-black p-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter">
                            {order.product_name}
                        </h1>
                        <p className="text-zinc-500 font-bold mt-1">
                            Order #{order.id} · Placed {formatDate(order.created_at)}
                        </p>
                    </div>
                    <span className="px-4 py-2 text-sm font-black uppercase border-2 border-black bg-[#fdf567]">
                        {order.status.replace("_", " ")}
                    </span>
                </div>

                {/* Progress Stepper */}
                <div className="mt-6">
                    <div className="flex justify-between mb-3">
                        {STATUS_STEPS.map((step, idx) => {
                            const StepIcon = step.icon;
                            const isActive = idx <= currentStep;
                            return (
                                <div key={step.key} className="flex flex-col items-center gap-1 text-center">
                                    <div className={`h-8 w-8 border-2 border-black flex items-center justify-center transition-colors ${isActive ? "bg-black text-white" : "bg-white text-zinc-300"}`}>
                                        <StepIcon className="h-4 w-4" />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-tight hidden sm:block ${isActive ? "text-black" : "text-zinc-400"}`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="h-2 bg-zinc-200 border border-black">
                        <div className="h-full bg-black transition-all duration-700" style={{ width: `${progressPct}%` }} />
                    </div>
                </div>
            </div>

            {/* Price Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border-4 border-black p-5 bg-[#90e8ff] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-xs font-black uppercase tracking-widest">Total Amount</p>
                    <p className="text-3xl font-black mt-1">₹{order.total_amount.toLocaleString()}</p>
                </div>
                <div className="border-4 border-black p-5 bg-[#4be794] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-xs font-black uppercase tracking-widest">Amount Paid</p>
                    <p className="text-3xl font-black mt-1">₹{order.amount_paid.toLocaleString()}</p>
                </div>
                <div className="border-4 border-black p-5 bg-[#ff90e8] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-xs font-black uppercase tracking-widest">Balance Due</p>
                    <p className="text-3xl font-black mt-1">₹{balanceDue.toLocaleString()}</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
                <Button
                    className="h-12 px-8 bg-[#4be794] hover:bg-[#3cd083] text-black font-black uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all rounded-none"
                    onClick={() => showAlert("In production: this opens the Razorpay checkout modal!", "info")}
                >
                    <CreditCard className="h-4 w-4 mr-2" /> Pay ₹{balanceDue.toLocaleString()} Now
                </Button>
                <Button
                    variant="outline"
                    className="h-12 px-8 border-2 border-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all rounded-none"
                    onClick={() => showAlert("Invoice download coming soon!", "info")}
                >
                    <Download className="h-4 w-4 mr-2" /> Download Invoice
                </Button>
            </div>

            {/* Transaction History */}
            <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="border-b-4 border-black p-4 bg-zinc-50">
                    <h2 className="font-black uppercase tracking-tight">Transaction History</h2>
                </div>
                <div className="divide-y-2 divide-zinc-100">
                    {order.transactions.map((txn) => (
                        <div key={txn.id} className="p-5 flex items-center justify-between">
                            <div>
                                <p className="font-black uppercase text-sm">{txn.payment_mode}</p>
                                <p className="text-zinc-500 text-sm font-medium">{txn.notes}</p>
                                <p className="text-[11px] font-mono text-zinc-400 mt-1">{txn.gateway_payment_id}</p>
                            </div>
                            <p className="text-xl font-black text-green-700">+₹{txn.amount.toLocaleString()}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
