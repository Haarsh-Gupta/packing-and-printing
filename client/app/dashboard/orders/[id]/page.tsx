"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Package, Truck, Receipt, CreditCard, Loader2, ArrowLeft, Download, X, CircleDot } from "lucide-react";
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

interface Milestone {
    id: string;
    label: string;
    amount: number;
    percentage: number;
    status: string;
    order_index: number;
    paid_at: string | null;
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
    milestones: Milestone[];
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
    const [isSwitching, setIsSwitching] = useState(false);

    // Manual QR Modal States
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrData, setQrData] = useState<{ qr_code: string, amount: number, milestone_label: string, milestone_id: string } | null>(null);
    const [utrNumber, setUtrNumber] = useState("");
    const [isFetchingQr, setIsFetchingQr] = useState(false);
    const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/my/${orderId}`, {
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

    const handleSwitchSplit = async (type: "FULL" | "HALF") => {
        setIsSwitching(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/my/${orderId}/milestones`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ split_type: type })
            });

            if (res.ok) {
                const updatedOrder = await res.json();
                setOrder(updatedOrder);
                showAlert(`Payment schedule updated to ${type === "FULL" ? "Full Payment" : "Half & Half"}.`, "success");
            } else {
                const err = await res.json();
                showAlert(err.detail || "Failed to update payment schedule.", "error");
            }
        } catch (e) {
            showAlert("Network error.", "error");
        } finally {
            setIsSwitching(false);
        }
    };

    let currentSplitType = "CUSTOM";
    if (order.milestones?.length === 1) currentSplitType = "FULL";
    else if (order.milestones?.length === 2 && order.milestones[0].percentage === 50) currentSplitType = "HALF";

    // Find the next unpaid milestone
    const nextMilestone = order.milestones
        ?.slice()
        .sort((a, b) => a.order_index - b.order_index)
        .find((m) => m.status !== "PAID");

    const handlePayNow = async (milestone: any) => {
        setIsFetchingQr(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/my/${orderId}/milestones/${milestone.id}/qr`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setQrData(data);
                setShowQrModal(true);
                setUtrNumber("");
            } else {
                const err = await res.json();
                showAlert(err.detail || "Failed to fetch QR code.", "error");
            }
        } catch (e) {
            showAlert("Network error.", "error");
        } finally {
            setIsFetchingQr(false);
        }
    };

    const handleSubmitUtr = async () => {
        if (!qrData || !nextMilestone) return;
        setIsSubmittingUtr(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/my/${orderId}/declarations`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    milestone_id: qrData.milestone_id || nextMilestone.id,
                    payment_mode: "UPI_MANUAL",
                    utr_number: utrNumber
                })
            });

            if (res.ok) {
                showAlert("Payment declaration submitted successfully! It is now pending admin approval.", "success");
                setShowQrModal(false);
                fetchOrder(); // Reload order so the milestone or declarations can show processing
            } else {
                const err = await res.json();
                showAlert(err.detail || "Failed to submit declaration.", "error");
            }
        } catch (e) {
            showAlert("Network error.", "error");
        } finally {
            setIsSubmittingUtr(false);
        }
    };

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

            {/* Payment Schedule Switcher (Only if unpaid) */}
            {order.amount_paid === 0 && (
                <div className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl">
                    <h2 className="text-xl font-black uppercase tracking-tight mb-4">Payment Schedule</h2>
                    {currentSplitType === "CUSTOM" ? (
                        <div className="flex items-center gap-3 p-4 bg-[#fdf567]/30 border-2 border-black rounded-lg">
                            <span className="px-3 py-1 bg-[#fdf567] border-2 border-black rounded-full text-xs font-black uppercase">Custom</span>
                            <p className="text-sm font-medium text-zinc-700">This order has a custom payment schedule set by admin. Contact support to modify it.</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm font-medium text-zinc-600 mb-4">You can change how you want to pay for this order before making your first payment.</p>
                            <div className="flex flex-wrap gap-3">
                                <Button
                                    variant={currentSplitType === "FULL" ? "default" : "outline"}
                                    className={`flex-1 min-w-[140px] font-black uppercase border-2 border-black rounded-lg ${currentSplitType === "FULL" ? "bg-[#fdf567] text-black hover:bg-[#ece459]" : "hover:bg-zinc-100"}`}
                                    onClick={() => handleSwitchSplit("FULL")}
                                    disabled={isSwitching || currentSplitType === "FULL"}
                                >
                                    Full Payment
                                </Button>
                                <Button
                                    variant={currentSplitType === "HALF" ? "default" : "outline"}
                                    className={`flex-1 min-w-[140px] font-black uppercase border-2 border-black rounded-lg ${currentSplitType === "HALF" ? "bg-[#fdf567] text-black hover:bg-[#ece459]" : "hover:bg-zinc-100"}`}
                                    onClick={() => handleSwitchSplit("HALF")}
                                    disabled={isSwitching || currentSplitType === "HALF"}
                                >
                                    Half & Half (50%)
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 min-w-[140px] font-black uppercase border-2 border-black rounded-lg hover:bg-zinc-100"
                                    onClick={() => showAlert("Please contact support to request a custom payment schedule for this order.", "info")}
                                    disabled={isSwitching}
                                >
                                    Custom Schedule
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Milestones */}
            {order.milestones && order.milestones.length > 0 && (
                <div className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl">
                    <h2 className="text-xl font-black uppercase tracking-tight mb-4">Payment Milestones</h2>
                    <div className="space-y-4">
                        {order.milestones.slice().sort((a, b) => a.order_index - b.order_index).map((milestone, idx) => (
                            <div key={milestone.id} className={`border-2 border-black p-4 rounded-lg flex items-center justify-between ${milestone.status === 'PAID' ? 'bg-[#4be794]/20' : 'bg-zinc-50'}`}>
                                <div>
                                    <p className="font-bold text-lg">{idx + 1}. {milestone.label} <span className="text-xs text-zinc-500 font-bold ml-2">({milestone.percentage}%)</span></p>
                                    <p className="text-sm font-medium mt-1">₹{milestone.amount.toLocaleString()}</p>
                                </div>
                                <div>
                                    {milestone.status === 'PAID' ? (
                                        <div className="flex flex-col items-end">
                                            <span className="px-3 py-1 bg-[#4be794] border-2 border-black rounded-full text-xs font-black uppercase">PAID</span>
                                            {milestone.paid_at && <span className="text-xs font-bold text-zinc-500 mt-1">{formatDate(milestone.paid_at)}</span>}
                                        </div>
                                    ) : (
                                        <span className="px-3 py-1 bg-zinc-200 border-2 border-black text-zinc-600 rounded-full text-xs font-black uppercase">PENDING</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
                {nextMilestone && (
                    <Button
                        className="h-12 px-8 bg-[#4be794] hover:bg-[#3cd083] text-black font-black uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all rounded-full disabled:opacity-70 disabled:cursor-not-allowed"
                        disabled={isFetchingQr}
                        onClick={() => handlePayNow(nextMilestone)}
                    >
                        {isFetchingQr ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CreditCard className="h-4 w-4 mr-2" /> Pay {nextMilestone.label} (₹{nextMilestone.amount.toLocaleString()})</>}
                    </Button>
                )}

                {showQrModal && qrData && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                        <div className="bg-white border-4 border-black p-6 md:p-8 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md relative">
                            <button
                                onClick={() => setShowQrModal(false)}
                                className="absolute top-4 right-4 h-8 w-8 bg-zinc-100 hover:bg-zinc-200 border-2 border-black rounded-full flex items-center justify-center transition-colors focus:outline-none"
                            >
                                <X className="h-4 w-4" />
                            </button>
                            <h2 className="text-2xl font-black uppercase tracking-tight mb-2 text-center">Scan & Pay</h2>
                            <p className="text-center text-sm font-medium text-zinc-600 mb-6">
                                Pay <span className="font-bold text-black">₹{qrData.amount.toLocaleString()}</span> for {qrData.milestone_label}
                            </p>
                            <div className="flex justify-center mb-6">
                                <div className="border-4 border-black rounded-xl p-2 bg-white">
                                    <img src={qrData.qr_code} alt="UPI QR Code" className="w-48 h-48 object-contain" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Enter 12-Digit UTR Number</label>
                                <input
                                    type="text"
                                    value={utrNumber}
                                    onChange={(e) => setUtrNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                                    placeholder="e.g. 123456789012"
                                    maxLength={22}
                                    className="w-full h-12 border-2 border-black rounded-lg px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4be794] focus:border-transparent transition-all"
                                />
                            </div>
                            <Button
                                onClick={handleSubmitUtr}
                                disabled={isSubmittingUtr || utrNumber.length < 6}
                                className="w-full h-12 mt-6 bg-[#4be794] hover:bg-[#3cd083] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all text-black font-black uppercase rounded-lg disabled:opacity-50"
                            >
                                {isSubmittingUtr ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Submit Payment"}
                            </Button>
                        </div>
                    </div>
                )}
                <Button
                    variant="outline"
                    className="h-12 px-8 border-2 border-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all rounded-full"
                    onClick={async () => {
                        try {
                            const token = localStorage.getItem("access_token");
                            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/my/${order.id}/invoice`, {
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
