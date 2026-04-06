"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Package, Truck, Receipt, CreditCard, Loader2, ArrowLeft, Download, X, CircleDot, Upload, ImageIcon, AlertCircle } from "lucide-react";
import { useAlert } from "@/components/CustomAlert";
import { useRazorpay } from "@/hooks/useRazorpay";
import { useAuth } from "@/context/AuthContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import OrderDetailSkeleton from "./OrderDetailSkeleton";
interface Transaction {
    id: string;
    receipt_number?: string;
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
    split_type?: string;
}

interface Declaration {
    id: string;
    milestone_id: string;
    status: string;
    utr_number: string | null;
    screenshot_url: string | null;
    rejection_reason: string | null;
    created_at: string;
    reviewed_at: string | null;
}

interface Order {
    id: string;
    order_number?: string;
    inquiry_id: string;
    status: string;
    split_type?: string;
    is_custom_milestone_requested?: boolean;
    total_amount: number;
    amount_paid: number;
    product_name: string | null;
    quantity: number | null;
    created_at: string;
    updated_at: string;
    transactions?: Transaction[];
    milestones: Milestone[];
    declarations?: Declaration[];
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
    const [inquiry, setInquiry] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSwitching, setIsSwitching] = useState(false);

    // Manual QR Modal States
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrData, setQrData] = useState<{ qr_code: string, amount: number, milestone_label: string, milestone_id: string } | null>(null);
    const [utrNumber, setUtrNumber] = useState("");
    const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [isFetchingQr, setIsFetchingQr] = useState(false);
    const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
    const { user } = useAuth();
    const { initiatePayment, isProcessing } = useRazorpay();    useEffect(() => {
        // token check removed
        fetchOrder();
    }, [orderId]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (showQrModal && (screenshotFile || utrNumber.length > 0)) {
                e.preventDefault();
                e.returnValue = "You have entered payment details but haven't submitted them. Are you sure you want to leave?";
                return e.returnValue;
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [showQrModal, screenshotFile, utrNumber]);

    const userEmail = user?.email || "";

    const fetchOrder = async () => {
        setIsLoading(true);
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/orders/my/${orderId}`, {
                credentials: "include",
            });
            if (res.status === 401) { router.replace("/auth/login"); return; }
            if (res.status === 404) { showAlert("Order not found.", "error"); router.replace("/dashboard/orders"); return; }
            if (res.ok) {
                const data = await res.json();
                setOrder(data);
                if (data.inquiry_id) {
                    fetchInquiry(data.inquiry_id);
                }
            }
        } catch (e) {
            showAlert("Failed to load order.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchInquiry = async (inqId: string) => {
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/my/${inqId}`, {
                credentials: "include",
            });
            if (res.ok) {
                setInquiry(await res.json());
            }
        } catch (e) {
            console.error("Failed to fetch inquiry details");
        }
    };

    const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric"
    });

    if (isLoading) return <OrderDetailSkeleton />;

    if (!order) return null;

    const balanceDue = order.total_amount - order.amount_paid;
    const currentStep = getStepIndex(order.status);
    const progressPct = Math.max(0, Math.min(100, ((currentStep + 1) / STATUS_STEPS.length) * 100));

    const handleSwitchSplit = async (type: "FULL" | "HALF") => {
        setIsSwitching(true);
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/orders/my/${orderId}/milestones`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"},
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

    const currentSplitType = order.split_type || "CUSTOM";
    const activeMilestones = order.milestones?.filter(m => (!order.split_type && !m.split_type) || m.split_type === order.split_type) || [];

    // Find the next unpaid milestone
    const nextMilestone = activeMilestones
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
        .find((m) => m.status !== "PAID");

    const handlePayNow = async (milestone: any) => {
        setIsFetchingQr(true);
        try {
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/orders/my/${orderId}/milestones/${milestone.id}/qr`, {
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

    const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showAlert("Screenshot must be under 5MB.", "error");
                return;
            }
            setScreenshotFile(file);
            const reader = new FileReader();
            reader.onload = () => setScreenshotPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmitUtr = async () => {
        if (!qrData || !nextMilestone) return;
        if (!screenshotFile && utrNumber.length < 6) {
            showAlert("Please upload a screenshot or enter a UTR number.", "error");
            return;
        }
        setIsSubmittingUtr(true);
        try {
            // Step 1: Upload screenshot if provided
            let screenshotUrl: string | null = null;
            if (screenshotFile) {
                const formData = new FormData();
                formData.append("file", screenshotFile);
                const uploadRes = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/upload/?purpose=payment`, {
                    method: "POST",
                    body: formData,
                });
                if (!uploadRes.ok) {
                    const err = await uploadRes.json();
                    showAlert(err.detail || "Failed to upload screenshot.", "error");
                    return;
                }
                const uploadData = await uploadRes.json();
                screenshotUrl = uploadData.url;
            }

            // Step 2: Submit declaration
            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/orders/my/${orderId}/declarations`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"},
                body: JSON.stringify({
                    milestone_id: qrData.milestone_id || nextMilestone.id,
                    payment_mode: "UPI_MANUAL",
                    utr_number: utrNumber || undefined,
                    screenshot_url: screenshotUrl || undefined,
                })
            });

            if (res.ok) {
                showAlert("Payment declaration submitted! It is now pending admin verification.", "success");
                setShowQrModal(false);
                setScreenshotFile(null);
                setScreenshotPreview(null);
                setUtrNumber("");
                fetchOrder();
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

    const handlePayOnline = async (milestone: any) => {
        initiatePayment({
            orderId: order.id,
            balanceDue: milestone.amount,
            productName: order.product_name || `Order ${order.order_number || '#' + order.id.slice(0, 8)}`,
            userEmail,
            onSuccess: (data) => {
                showAlert("Payment successful!", "success");
                fetchOrder();
            },
            onError: (message) => {
                showAlert(message, "error");
            }
        });
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
                            {order.product_name || `Order ${order.order_number || '#' + order.id.slice(0, 8)}`}
                        </h1>
                        <p className="text-zinc-500 font-bold mt-1">{order.order_number || `#${order.id.slice(0, 8)}`} · Placed {formatDate(order.created_at)}</p>
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

            {/* Order Items */}
            {inquiry?.items && inquiry.items.length > 0 && (
                <div className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden mt-8 mb-8">
                    <div className="border-b-2 border-black p-4 bg-zinc-50">
                        <h2 className="font-black uppercase tracking-tight">Order Items</h2>
                    </div>
                    <div className="p-6">
                        <div className="space-y-6">
                            {inquiry.items.map((item: any, i: number) => {
                                const unitPrice = (item.estimated_price || 0) > 0 ? (item.estimated_price || 0) / (item.quantity || 1) : 0;
                                const lineTotal = item.total_estimated_price || (unitPrice * (item.quantity || 1));
                                const gstRate = (item.cgst_rate || 0) + (item.sgst_rate || 0);
                                const taxAmt = item.computed_tax_amount || (lineTotal * gstRate / 100);
                                const finalPrice = item.line_item_price || lineTotal;

                                return (
                                    <div key={item.id || i} className="flex flex-col sm:flex-row gap-6 pb-6 last:pb-0 border-b-2 border-zinc-100 last:border-b-0">
                                        {item.display_images && item.display_images.length > 0 ? (
                                            <div className="w-full sm:w-32 h-32 shrink-0 border-2 border-black rounded-lg overflow-hidden bg-zinc-100">
                                                <img src={item.display_images[0]} alt="Product" className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-full sm:w-32 h-32 shrink-0 border-2 border-black rounded-lg bg-zinc-100 flex items-center justify-center">
                                                <Package className="w-8 h-8 text-zinc-400" />
                                            </div>
                                        )}
                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <h3 className="text-xl font-black uppercase">
                                                    {item.subproduct_name || item.product_name || item.subservice_name || item.service_name || item.template_name || "Custom Item"}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    {item.variant_name && (
                                                        <span className="inline-block px-3 py-1 bg-[#fdf567] border-2 border-black text-black text-xs font-black uppercase rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                            {item.variant_name}
                                                        </span>
                                                    )}
                                                    {item.hsn_code && (
                                                        <span className="inline-block px-2 py-1 bg-zinc-200 border border-zinc-400 text-[10px] font-black uppercase">
                                                            HSN: {item.hsn_code}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                                                <span><span className="font-bold text-zinc-500">Qty:</span> <span className="font-black">{item.quantity}</span></span>
                                                {unitPrice > 0 && (
                                                    <span><span className="font-bold text-zinc-500">Unit Price:</span> <span className="font-black">₹{unitPrice.toLocaleString()}</span></span>
                                                )}
                                            </div>

                                            {gstRate > 0 && (
                                                <div className="flex items-center gap-3 text-xs">
                                                    <span className="font-bold text-zinc-500">CGST: {item.cgst_rate || 0}% + SGST: {item.sgst_rate || 0}%</span>
                                                    <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">Tax: ₹{taxAmt.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                                </div>
                                            )}

                                            {item.selected_options && typeof item.selected_options === 'object' && Object.keys(item.selected_options).length > 0 && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                    {Object.entries(item.selected_options).filter(([k]) => k !== 'variant_name').map(([k, v]) => (
                                                        <div key={k} className="flex flex-col">
                                                            <span className="text-xs text-zinc-500 font-bold uppercase">{k.replace(/_/g, " ")}</span>
                                                            <span className="font-medium text-black">{String(v)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {item.notes && (
                                                <div className="p-4 bg-zinc-50 border-2 border-black rounded-none shadow-[2px_2px_0_0_#000]">
                                                    <p className="text-xs text-black font-black uppercase mb-1">Notes</p>
                                                    <p className="text-sm">{item.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="sm:text-right mt-2 sm:mt-0 shrink-0">
                                            <p className="text-xs font-black uppercase text-zinc-500">Item Price</p>
                                            <p className="text-2xl font-black text-black">₹{finalPrice.toLocaleString()}</p>
                                            {item.line_item_price && (
                                                <span className="text-[10px] font-black text-purple-700 uppercase">Admin Set</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Order Items Summary */}
                        {(() => {
                            const subtotal = inquiry.items.reduce((s: number, it: any) => s + (it.line_item_price || it.total_estimated_price || 0), 0);
                            const totalTax = inquiry.items.reduce((s: number, it: any) => s + (it.computed_tax_amount || 0), 0);
                            return (
                                <div className="mt-6 pt-4 border-t-2 border-dashed border-zinc-200 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold text-zinc-500 uppercase">Items Subtotal</span>
                                        <span className="font-black">₹{subtotal.toLocaleString()}</span>
                                    </div>
                                    {totalTax > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="font-bold text-amber-700 uppercase">GST (CGST + SGST)</span>
                                            <span className="font-black text-amber-700">₹{totalTax.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Payment Schedule Switcher (Only if unpaid) */}
            {order.amount_paid === 0 && (
                <div className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl">
                    <h2 className="text-xl font-black uppercase tracking-tight mb-4">Payment Schedule</h2>
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
                        {currentSplitType === "CUSTOM" || order.is_custom_milestone_requested ? (
                            <Button
                                variant="default"
                                className="flex-1 min-w-[140px] font-black uppercase border-2 border-black rounded-lg bg-[#fdf567] text-black hover:bg-[#ece459] shadow-[4px_4px_0_0_#000]"
                                onClick={() => router.push(`/dashboard/inquiries/${order.inquiry_id}`)}
                            >
                                {order.is_custom_milestone_requested && currentSplitType !== "CUSTOM" ? "Custom Schedule Requested" : "Custom Schedule"}
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                className="flex-1 min-w-[140px] font-black uppercase border-2 border-black rounded-lg hover:bg-zinc-100"
                                onClick={async () => {
                                    setIsSwitching(true);
                                    try {
                                        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/orders/my/${orderId}/milestones/request-custom`, {
                                            method: "POST"
                                        });
                                        if (res.ok) {
                                            // Auto-send formal request message to the chat
                                            try {
                                                await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/my/${order.inquiry_id}/messages`, {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({
                                                        content: `[PAYMENT_REQUEST] I want to make changes in my payment schedule for Order #${order.order_number || order.id.slice(0, 8)}.`
                                                    })
                                                });
                                            } catch (err) { /* silent fail for auto-msg, focus on primary status success */ }

                                            showAlert("Custom schedule request recorded! Redirecting to chat...", "success");
                                            router.push(`/dashboard/inquiries/${order.inquiry_id}`);
                                        } else {
                                            showAlert("Failed to request custom schedule.", "error");
                                        }
                                    } catch (e) { showAlert("Network error.", "error"); } finally { setIsSwitching(false); }
                                }}
                                disabled={isSwitching}
                            >
                                Custom Schedule
                            </Button>
                        )}
                    </div>
                </div >
            )}

            {/* Milestones */}
            {
                activeMilestones.length > 0 && (
                    <div className="border-2 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl">
                        <h2 className="text-xl font-black uppercase tracking-tight mb-4">Payment Milestones</h2>
                        <div className="space-y-4">
                            {activeMilestones.slice().sort((a, b) => a.order_index - b.order_index).map((milestone, idx) => (
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
                )
            }

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
                {nextMilestone && (
                    <>
                        <Button
                            className="h-12 px-8 bg-[#fdf567] hover:bg-[#ece459] text-black font-black uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all rounded-full disabled:opacity-70 disabled:cursor-not-allowed"
                            disabled={isProcessing}
                            onClick={() => handlePayOnline(nextMilestone)}
                        >
                            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CreditCard className="h-4 w-4 mr-2" /> Pay Online (₹{nextMilestone.amount.toLocaleString()})</>}
                        </Button>
                        <Button
                            className="h-12 px-8 bg-[#4be794] hover:bg-[#3cd083] text-black font-black uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all rounded-full disabled:opacity-70 disabled:cursor-not-allowed"
                            disabled={isFetchingQr}
                            onClick={() => handlePayNow(nextMilestone)}
                        >
                            {isFetchingQr ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Receipt className="h-4 w-4 mr-2" /> Pay Offline</>}
                        </Button>
                    </>
                )}

                {showQrModal && qrData && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                        <div className="bg-white border-4 border-black p-6 md:p-8 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md relative max-h-[90vh] overflow-y-auto">
                            <button
                                onClick={() => {
                                    if ((screenshotFile || utrNumber) && !window.confirm("You have entered payment details but haven't submitted them. Are you sure you want to close this window? Your payment verification might be lost.")) {
                                        return;
                                    }
                                    setShowQrModal(false);
                                    setScreenshotFile(null);
                                    setScreenshotPreview(null);
                                    setUtrNumber("");
                                }}
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

                            {/* Screenshot Upload */}
                            <div className="space-y-3 mb-4">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Upload Payment Screenshot *</label>
                                {screenshotPreview ? (
                                    <div className="relative border-2 border-black rounded-lg overflow-hidden">
                                        <img src={screenshotPreview} alt="Screenshot preview" className="w-full max-h-48 object-contain bg-zinc-50" />
                                        <button
                                            onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); }}
                                            className="absolute top-2 right-2 h-7 w-7 bg-red-500 text-white border-2 border-black rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-black rounded-lg cursor-pointer hover:bg-zinc-50 transition-colors">
                                        <Upload className="h-6 w-6 text-zinc-400 mb-2" />
                                        <span className="text-sm font-medium text-zinc-500">Click to upload screenshot</span>
                                        <span className="text-xs text-zinc-400 mt-1">JPG, PNG or WebP (max 5MB)</span>
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden"
                                            onChange={handleScreenshotChange}
                                        />
                                    </label>
                                )}
                            </div>

                            {/* UTR Number (optional) */}
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">UTR Number (optional)</label>
                                <input
                                    type="text"
                                    value={utrNumber}
                                    onChange={(e) => setUtrNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                                    placeholder="e.g. 123456789012"
                                    maxLength={22}
                                    className="w-full h-12 border-2 border-black rounded-lg px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4be794] focus:border-transparent transition-all"
                                />
                            </div >

                            <p className="text-xs text-zinc-400 mt-3 text-center">Upload screenshot or enter UTR — at least one is required</p>

                            <Button
                                onClick={handleSubmitUtr}
                                disabled={isSubmittingUtr || (!screenshotFile && utrNumber.length < 6)}
                                className="w-full h-12 mt-4 bg-[#4be794] hover:bg-[#3cd083] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all text-black font-black uppercase rounded-lg disabled:opacity-50"
                            >
                                {isSubmittingUtr ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Submit Payment Declaration"}
                            </Button>
                        </div >
                    </div >
                )}
                <Button
                    variant="outline"
                    className="h-12 px-8 border-2 border-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all rounded-full"
                    onClick={async () => {
                        try {                            const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/orders/my/${order.id}/invoice`, {
                                credentials: "include",
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
                {
                    order.inquiry_id && (
                        <Button asChild variant="outline" className="h-12 px-8 border-2 border-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all rounded-full">
                            <Link href={`/dashboard/inquiries`}>View Inquiry</Link>
                        </Button>
                    )
                }
            </div >

            {/* Transaction History */}
            {
                order.transactions && order.transactions.length > 0 && (
                    <div className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden">
                        <div className="border-b-2 border-black p-4 bg-zinc-50">
                            <h2 className="font-black uppercase tracking-tight">Transaction History</h2>
                        </div>
                        <div className="divide-y-2 divide-zinc-100">
                            {order.transactions.map((txn) => (
                                <div key={txn.id} className="p-5 flex items-center justify-between">
                                    <div>
                                        <p className="font-black uppercase text-sm">{txn.payment_mode} {txn.receipt_number && <span className="text-zinc-400 font-mono text-xs ml-2">{txn.receipt_number}</span>}</p>
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
                )
            }

            {/* Payment Declarations */}
            {
                order.declarations && order.declarations.length > 0 && (
                    <div className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden">
                        <div className="border-b-2 border-black p-4 bg-zinc-50">
                            <h2 className="font-black uppercase tracking-tight">Payment Declarations</h2>
                        </div>
                        <div className="divide-y-2 divide-zinc-100">
                            {order.declarations.map((decl) => {
                                const milestone = order.milestones.find(m => m.id === decl.milestone_id);
                                return (
                                    <div key={decl.id} className="p-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`px-3 py-1 text-xs font-black uppercase border-2 border-black rounded-full ${decl.status === "APPROVED" ? "bg-[#4be794]" :
                                                        decl.status === "REJECTED" ? "bg-red-200 text-red-800" :
                                                            "bg-[#fdf567]"
                                                        }`}>
                                                        {decl.status}
                                                    </span>
                                                    {milestone && <span className="text-sm font-medium text-zinc-500">{milestone.label}</span>}
                                                </div>
                                                {decl.utr_number && <p className="text-sm font-mono text-zinc-600 mt-1">UTR: {decl.utr_number}</p>}
                                                <p className="text-xs text-zinc-400 mt-1">Submitted {formatDate(decl.created_at)}</p>
                                                {decl.rejection_reason && (
                                                    <div className="mt-2 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                        <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                                        <p className="text-sm text-red-700">{decl.rejection_reason}</p>
                                                    </div>
                                                )}
                                            </div>
                                            {decl.screenshot_url && (
                                                <a href={decl.screenshot_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                                    <div className="w-16 h-16 border-2 border-black rounded-lg overflow-hidden hover:opacity-80 transition-opacity">
                                                        <img src={decl.screenshot_url} alt="Payment screenshot" className="w-full h-full object-cover" />
                                                    </div>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )
            }
        </div >
    );
}
