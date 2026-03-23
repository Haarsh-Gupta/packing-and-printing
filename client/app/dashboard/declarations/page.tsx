"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, ImageIcon, Clock, Eye, X } from "lucide-react";
import { useAlert } from "@/components/CustomAlert";
import { useAuth } from "@/context/AuthContext";

interface Declaration {
    id: string;
    order_id: string;
    milestone_id: string;
    user_id: string;
    payment_mode: string;
    utr_number: string | null;
    screenshot_url: string | null;
    status: string;
    rejection_reason: string | null;
    created_at: string;
    reviewed_at: string | null;
}

export default function DeclarationsPage() {
    const router = useRouter();
    const { showAlert } = useAlert();
    const { user } = useAuth();

    const [declarations, setDeclarations] = useState<Declaration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    useEffect(() => {
        if (!user?.admin) {
            router.replace("/dashboard");
            return;
        }
        fetchDeclarations();
    }, [user]);

    const fetchDeclarations = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/orders/declarations/pending`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401 || res.status === 403) {
                router.replace("/dashboard");
                return;
            }
            if (res.ok) {
                setDeclarations(await res.json());
            }
        } catch {
            showAlert("Failed to load declarations.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (decl: Declaration) => {
        setActionLoading(decl.id);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/orders/${decl.order_id}/declarations/${decl.id}/review`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ is_approved: true }),
                }
            );
            if (res.ok) {
                showAlert("Payment approved successfully!", "success");
                setDeclarations((prev) => prev.filter((d) => d.id !== decl.id));
            } else {
                const err = await res.json();
                showAlert(err.detail || "Failed to approve.", "error");
            }
        } catch {
            showAlert("Network error.", "error");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (decl: Declaration) => {
        if (!rejectionReason.trim()) {
            showAlert("Please enter a reason for rejection.", "error");
            return;
        }
        setActionLoading(decl.id);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/orders/${decl.order_id}/declarations/${decl.id}/review`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        is_approved: false,
                        rejection_reason: rejectionReason.trim(),
                    }),
                }
            );
            if (res.ok) {
                showAlert("Declaration rejected.", "success");
                setDeclarations((prev) => prev.filter((d) => d.id !== decl.id));
                setRejectingId(null);
                setRejectionReason("");
            } else {
                const err = await res.json();
                showAlert(err.detail || "Failed to reject.", "error");
            }
        } catch {
            showAlert("Network error.", "error");
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Payment Declarations</h1>
                    <p className="text-zinc-500 font-bold mt-1">
                        {declarations.length} pending verification{declarations.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={fetchDeclarations}
                    className="border-2 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all"
                >
                    Refresh
                </Button>
            </div>

            {declarations.length === 0 ? (
                <div className="border-2 border-black p-12 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl text-center">
                    <CheckCircle2 className="h-12 w-12 text-[#4be794] mx-auto mb-4" />
                    <h2 className="text-xl font-black uppercase">All caught up!</h2>
                    <p className="text-zinc-500 font-medium mt-2">No pending payment declarations to review.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {declarations.map((decl) => (
                        <div
                            key={decl.id}
                            className="border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Screenshot */}
                                    <div className="shrink-0">
                                        {decl.screenshot_url ? (
                                            <button
                                                onClick={() => setPreviewImage(decl.screenshot_url)}
                                                className="block w-full md:w-48 h-48 border-2 border-black rounded-lg overflow-hidden hover:opacity-90 transition-opacity relative group"
                                            >
                                                <img
                                                    src={decl.screenshot_url}
                                                    alt="Payment screenshot"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                    <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                                </div>
                                            </button>
                                        ) : (
                                            <div className="w-full md:w-48 h-48 border-2 border-dashed border-zinc-300 rounded-lg flex flex-col items-center justify-center bg-zinc-50">
                                                <ImageIcon className="h-8 w-8 text-zinc-300" />
                                                <span className="text-xs text-zinc-400 mt-2 font-medium">No screenshot</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="px-3 py-1 bg-[#fdf567] border-2 border-black text-xs font-black uppercase rounded-full flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> Pending
                                            </span>
                                            <span className="text-xs font-mono text-zinc-400">#{decl.id}</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Order ID</p>
                                                <p className="text-sm font-mono font-bold truncate">{decl.order_id}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Payment Mode</p>
                                                <p className="text-sm font-bold">{decl.payment_mode.replace("_", " ")}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">UTR Number</p>
                                                <p className="text-sm font-mono font-bold">{decl.utr_number || "—"}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Submitted</p>
                                                <p className="text-sm font-bold">{formatDate(decl.created_at)}</p>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        {rejectingId === decl.id ? (
                                            <div className="space-y-3 pt-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">
                                                    Rejection Reason *
                                                </label>
                                                <textarea
                                                    value={rejectionReason}
                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                    placeholder="e.g. UTR not found in bank statement, screenshot unclear..."
                                                    className="w-full h-24 border-2 border-black rounded-lg p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all resize-none"
                                                />
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => handleReject(decl)}
                                                        disabled={actionLoading === decl.id || !rejectionReason.trim()}
                                                        className="bg-red-500 hover:bg-red-600 text-white font-black uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all disabled:opacity-50"
                                                    >
                                                        {actionLoading === decl.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            "Confirm Reject"
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setRejectingId(null);
                                                            setRejectionReason("");
                                                        }}
                                                        className="border-2 border-black font-bold"
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-3 pt-2">
                                                <Button
                                                    onClick={() => handleApprove(decl)}
                                                    disabled={actionLoading === decl.id}
                                                    className="bg-[#4be794] hover:bg-[#3cd083] text-black font-black uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all disabled:opacity-50"
                                                >
                                                    {actionLoading === decl.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    onClick={() => setRejectingId(decl.id)}
                                                    disabled={actionLoading === decl.id}
                                                    className="bg-red-100 hover:bg-red-200 text-red-700 font-black uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all"
                                                >
                                                    <XCircle className="h-4 w-4 mr-2" /> Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Full-screen Image Preview */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <button
                        onClick={() => setPreviewImage(null)}
                        className="absolute top-6 right-6 h-10 w-10 bg-white border-2 border-black rounded-full flex items-center justify-center hover:bg-zinc-100 transition-colors z-10"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <img
                        src={previewImage}
                        alt="Payment screenshot preview"
                        className="max-w-full max-h-[85vh] object-contain rounded-xl border-4 border-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
