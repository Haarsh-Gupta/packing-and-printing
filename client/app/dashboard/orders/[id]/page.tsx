"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, CheckCircle2, Truck, CircleDot, Loader2, CreditCard, Download } from "lucide-react";
import { useAlert } from "@/components/CustomAlert";
import { useRazorpay } from "@/hooks/useRazorpay";
import { useAuth } from "@/context/AuthContext";
interface Transaction {
    id: string;
    amount: number;
    payment_mode: string;
    notes: string | null;
    created_at: string;
    gateway_payment_id: string | null;
}

interface Order {
    id: string;
    inquiry_id: string;
    status: string;
    total_amount: number;
    amount_paid: number;
    product_name: string | null;
    quantity: number | null;
    created_at: string;
    updated_at: string;
    transactions?: Transaction[];
}

const STATUS_STEPS = [
    { key: "PENDING", label: "Order Placed", icon: CircleDot },
    { key: "IN_PRODUCTION", label: "In Production", icon: Package },
    { key: "SHIPPED", label: "Shipped", icon: Truck },
    { key: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
    { key: "COMPLETED", label: "Completed", icon: CheckCircle2 },
];

const STATUS_ORDER = ["PENDING", "IN_PRODUCTION", "PARTIALLY_PAID", "PAID", "SHIPPED", "DELIVERED", "COMPLETED"];

function getStepIndex(status: string) {
    if (status === "PAID") return 1;
    if (status === "PARTIALLY_PAID") return 1;
    const steps = ["PENDING", "IN_PRODUCTION", "SHIPPED", "DELIVERED", "COMPLETED"];
    return steps.indexOf(status);
}

export default function OrderDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { showAlert } = useAlert();
    const orderId = params?.id;

    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const { initiatePayment, isProcessing } = useRazorpay();

    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    useEffect(() => {
        if (!token) { router.replace("/auth/login"); return; }
        fetchOrder();
    }, [orderId]);

    const userEmail = user?.email || "";

    const fetchOrder = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401) { localStorage.removeItem("access_token"); router.replace("/auth/login"); return; }
            if (res.status === 404) { showAlert("Order not found.", "error"); router.replace("/dashboard/orders"); return; }
            if (res.ok) setOrder(await res.json());
        } catch (e) {
            showAlert("Failed to load order.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric"
    });

    if (isLoading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin" />
        </div>
    );

    if (!order) return null;

    const balanceDue = order.total_amount - order.amount_paid;
    const currentStep = getStepIndex(order.status);
    const progressPct = Math.max(0, Math.min(100, ((currentStep + 1) / STATUS_STEPS.length) * 100));

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Back */}
            <Link href="/dashboard/orders" className="flex items-center gap-2 text-zinc-500 font-bold hover:text-black transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Orders
            </Link>

            {/* Order Header */}
            <div className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter">
                            {order.product_name || `Order #${order.id}`}
                        </h1>
                        <p className="text-zinc-500 font-bold mt-1">Order #{order.id} · Placed {formatDate(order.created_at)}</p>
                    </div>
                    <span className={`px-4 py-2 text-sm font-black uppercase border-2 border-black ${order.status === "COMPLETED" || order.status === "PAID" ? "bg-[#4be794]" : order.status === "SHIPPED" ? "bg-[#90e8ff]" : order.status === "CANCELLED" ? "bg-zinc-200 text-zinc-500" : "bg-[#fdf567]"}`}>
                        {order.status.replace("_", " ")}
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                    <div className="flex justify-between mb-3">
                        {STATUS_STEPS.map((step, idx) => {
                            const StepIcon = step.icon;
                            const isActive = idx <= currentStep;
                            return (
                                <div key={step.key} className="flex flex-col items-center gap-1 text-center">
                                    <div className={`h-8 w-8 border-2 border-black flex items-center justify-center transition-colors rounded-full ${isActive ? "bg-black text-white" : "bg-white text-zinc-300"}`}>
                                        <StepIcon className="h-4 w-4" />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-tight hidden sm:block ${isActive ? "text-black" : "text-zinc-400"}`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="h-2 bg-zinc-200 border border-black rounded-full overflow-hidden">
                        <div className="h-full bg-black transition-all duration-700" style={{ width: `${progressPct}%` }} />
                    </div>
                </div>
            </div>

            {/* Price Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border-4 border-black p-5 bg-[#90e8ff] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl">
                    <p className="text-xs font-black uppercase tracking-widest">Total Amount</p>
                    <p className="text-3xl font-black mt-1">₹{order.total_amount.toLocaleString()}</p>
                </div>
                <div className="border-4 border-black p-5 bg-[#4be794] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl">
                    <p className="text-xs font-black uppercase tracking-widest">Amount Paid</p>
                    <p className="text-3xl font-black mt-1">₹{order.amount_paid.toLocaleString()}</p>
                </div>
                <div className={`border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl ${balanceDue > 0 ? "bg-[#ff90e8]" : "bg-zinc-100"}`}>
                    <p className="text-xs font-black uppercase tracking-widest">Balance Due</p>
                    <p className="text-3xl font-black mt-1">₹{balanceDue.toLocaleString()}</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
                {balanceDue > 0 && (
                    <Button
                        className="h-12 px-8 bg-[#4be794] hover:bg-[#3cd083] text-black font-black uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all rounded-full disabled:opacity-70 disabled:cursor-not-allowed"
                        disabled={isProcessing}
                        onClick={() => initiatePayment({
                            orderId: order.id,
                            balanceDue,
                            productName: order.product_name || `Order #${order.id}`,
                            userEmail,
                            onSuccess: (data) => {
                                showAlert(`Payment successful! ₹${balanceDue.toLocaleString()} paid.`, "success");
                                // Refresh order data
                                setOrder((prev) => prev ? {
                                    ...prev,
                                    amount_paid: data.amount_paid,
                                    status: data.status,
                                } : prev);
                            },
                            onError: (msg) => showAlert(msg, "error"),
                        })}
                    >
                        {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CreditCard className="h-4 w-4 mr-2" /> Pay ₹{balanceDue.toLocaleString()} Now</>}
                    </Button>
                )}
                <Button
                    variant="outline"
                    className="h-12 px-8 border-2 border-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all rounded-full"
                    onClick={async () => {
                        try {
                            const token = localStorage.getItem("access_token");
                            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/${order.id}/invoice`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            if (!res.ok) throw new Error("Failed to generate invoice");
                            const blob = await res.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `invoice-order-${order.id}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            window.URL.revokeObjectURL(url);
                            showAlert("Invoice downloaded!", "success");
                        } catch {
                            showAlert("Could not download invoice. Please try again.", "error");
                        }
                    }}
                >
                    <Download className="h-4 w-4 mr-2" /> Download Invoice
                </Button>
                {order.inquiry_id && (
                    <Button asChild variant="outline" className="h-12 px-8 border-2 border-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all rounded-full">
                        <Link href={`/dashboard/inquiries`}>View Inquiry</Link>
                    </Button>
                )}
            </div>

            {/* Transaction History */}
            {order.transactions && order.transactions.length > 0 && (
                <div className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden">
                    <div className="border-b-2 border-black p-4 bg-zinc-50">
                        <h2 className="font-black uppercase tracking-tight">Transaction History</h2>
                    </div>
                    <div className="divide-y-2 divide-zinc-100">
                        {order.transactions.map((txn) => (
                            <div key={txn.id} className="p-5 flex items-center justify-between">
                                <div>
                                    <p className="font-black uppercase text-sm">{txn.payment_mode}</p>
                                    <p className="text-zinc-500 text-sm font-medium">{txn.notes || formatDate(txn.created_at)}</p>
                                    {txn.gateway_payment_id && (
                                        <p className="text-[11px] font-mono text-zinc-400 mt-1">{txn.gateway_payment_id}</p>
                                    )}
                                </div>
                                <p className="text-xl font-black text-green-700">+₹{txn.amount.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
