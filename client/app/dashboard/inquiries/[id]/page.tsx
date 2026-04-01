"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Send,
    Paperclip,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    User,
    ShieldCheck,
    Wifi,
    WifiOff,
    Loader2,
    X,
    FileText,
    RotateCcw,
} from "lucide-react";

import Link from "next/link";
import { Inquiry, InquiryMessage } from "@/types/dashboard";
import { useAlert } from "@/components/CustomAlert";
import { useConfirm } from "@/components/ConfirmDialog";

type WsStatus = "connecting" | "connected" | "disconnected";

export default function InquiryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { showAlert } = useAlert();
    const { confirm } = useConfirm();
    const inquiryId = params.id as string;

    const [inquiry, setInquiry] = useState<Inquiry | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
    const [attachmentName, setAttachmentName] = useState<string | null>(null);
    const [wsStatus, setWsStatus] = useState<WsStatus>("disconnected");
    const [adminTyping, setAdminTyping] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTypingRef = useRef(false);

    // ── Auto-scroll on new messages ──────────────────────────────────────
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [inquiry?.messages, adminTyping]);

    // ── Fetch initial data ───────────────────────────────────────────────
    const fetchInquiryDetails = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            if (!token) { router.push("/auth/login"); return; }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/my/${inquiryId}`, {
                headers: { Authorization: `Bearer ${token}` },
                credentials: "include", // Ensure cookies are sent
            });

            if (res.ok) {
                setInquiry(await res.json());
            } else if (res.status === 401) {
                localStorage.removeItem("access_token");
                router.replace("/auth/login");
            }
        } catch { /* ignore */ } finally {
            setIsLoading(false);
        }
    }, [inquiryId, router]);

    const fetchCurrentUser = useCallback(async () => {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) return;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const user = await res.json();
                setCurrentUserId(String(user.id));
            }
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (inquiryId) {
            fetchInquiryDetails();
            fetchCurrentUser();
        }
    }, [inquiryId, fetchInquiryDetails, fetchCurrentUser]);

    // ── WebSocket ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!inquiryId) return;
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const wsBase = apiBase.replace(/^http/, "ws");
        const wsUrl = `${wsBase}/inquiries/ws/${inquiryId}?token=${encodeURIComponent(token)}`;

        setWsStatus("connecting");
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => setWsStatus("connected");
        ws.onclose = () => setWsStatus("disconnected");
        ws.onerror = () => setWsStatus("disconnected");

        ws.onmessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data as string);
                if (data.type === "new_message") {
                    const msg = data.message as InquiryMessage;
                    setInquiry(prev => {
                        if (!prev) return prev;
                        // Deduplicate: skip if message already exists (from optimistic render)
                        const exists = (prev.messages || []).some(m =>
                            m.id === msg.id || String(m.id) === String(msg.id)
                        );
                        if (exists) return prev;
                        return { ...prev, messages: [...(prev.messages || []), msg] };
                    });
                    setAdminTyping(false);
                } else if (data.type === "typing") {
                    // Only show typing if it's NOT from us
                    const isFromMe = String(data.user_id) === String(currentUserId);
                    if (!isFromMe && data.is_admin) {
                        setAdminTyping(data.is_typing);
                    }
                }
            } catch { /* ignore */ }
        };

        return () => {
            ws.close();
            wsRef.current = null;
        };
    }, [inquiryId, currentUserId]);

    // ── Typing events ────────────────────────────────────────────────────
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);

        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        if (!isTypingRef.current) {
            isTypingRef.current = true;
            ws.send(JSON.stringify({ type: "typing", is_typing: true }));
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "typing", is_typing: false }));
            }
        }, 1500);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showAlert("File must be under 5MB size limit", "error");
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);

        const token = localStorage.getItem("access_token");
        const formData = new FormData();
        formData.append("file", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${process.env.NEXT_PUBLIC_API_URL}/upload/?purpose=inquiry`, true);
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                setUploadProgress(percentComplete);
            }
        };

        xhr.onload = () => {
            setIsUploading(false);
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    setAttachmentUrl(data.url);
                    setAttachmentName(data.filename || file.name);
                } catch {
                    showAlert("Failed to parse upload response.", "error");
                }
            } else {
                showAlert("Failed to upload file.", "error");
            }
        };

        xhr.onerror = () => {
            setIsUploading(false);
            showAlert("Upload network error.", "error");
        };

        xhr.send(formData);
    };

    // ── Send message ─────────────────────────────────────────────────────
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !attachmentUrl) || !inquiry || isSending) return;

        setIsSending(true);
        // Stop typing indicator immediately
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "typing", is_typing: false }));
        }
        isTypingRef.current = false;
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/my/${inquiry.id}/messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    content: newMessage,
                    file_urls: attachmentUrl ? [attachmentUrl] : []
                }),
                credentials: "include",
            });

            if (res.ok) {
                const sentMsg = await res.json();
                // Optimistically append message so user sees it immediately
                setInquiry(prev => {
                    if (!prev) return prev;
                    const exists = (prev.messages || []).some(m =>
                        m.id === sentMsg.id || String(m.id) === String(sentMsg.id)
                    );
                    if (exists) return prev;
                    return { ...prev, messages: [...(prev.messages || []), sentMsg] };
                });
                setNewMessage("");
                setAttachmentUrl(null);
                setAttachmentName(null);
                setUploadProgress(0);
                if (fileInputRef.current) fileInputRef.current.value = "";
            } else if (res.status === 401) {
                localStorage.removeItem("access_token");
                router.replace("/auth/login");
            } else {
                showAlert("Failed to send message.", "error");
            }
        } catch {
            showAlert("Network error. Please try again.", "error");
        } finally {
            setIsSending(false);
        }
    };

    // ── Status update (accept / reject quote / submit draft) ────────────────────────────
    const handleStatusUpdate = async (status: "ACCEPTED" | "REJECTED" | "SUBMITTED") => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/my/${inquiryId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status }),
                credentials: "include",
            });

            if (res.ok) {
                setInquiry(prev => prev ? { ...prev, status } : null);
                if (status === "ACCEPTED") {
                    showAlert("Quote accepted! Your order is being placed...", "success");
                    setTimeout(() => router.push("/dashboard/orders"), 1800);
                } else if (status === "SUBMITTED") {
                    showAlert("Inquiry submitted to the studio!", "success");
                } else {
                    showAlert("Quote declined.", "info");
                }
            } else {
                showAlert("Failed to update status.", "error");
            }
        } catch {
            showAlert("An error occurred.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReorder = async () => {
        const confirmed = await confirm({
            title: "Reorder This Inquiry?",
            message: "A new draft inquiry will be created with the same items and specifications. You can modify it before submitting.",
            confirmText: "Yes, Reorder",
            cancelText: "Cancel",
        });
        if (!confirmed) return;

        setIsLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/my/${inquiryId}/reorder`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                credentials: "include",
            });

            if (res.ok) {
                const newInquiry = await res.json();
                showAlert("Inquiry cloned as a new draft! Redirecting...", "success");
                setTimeout(() => router.push(`/dashboard/inquiries/${newInquiry.id}`), 1200);
            } else {
                showAlert("Failed to reorder inquiry.", "error");
            }
        } catch {
            showAlert("An error occurred while reordering.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // ── Status badge ─────────────────────────────────────────────────────
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "DRAFT":
                return <Badge className="bg-zinc-100 text-zinc-500 border-2 border-zinc-400 rounded-none"><FileText className="w-3 h-3 mr-1" /> Draft</Badge>;
            case "SUBMITTED":
                return <Badge className="bg-[#fdf567] text-black border-2 border-black rounded-none"><Clock className="w-3 h-3 mr-1" /> Pending Review</Badge>;
            case "UNDER_REVIEW":
                return <Badge className="bg-[#c7d2fe] text-black border-2 border-black rounded-none"><AlertCircle className="w-3 h-3 mr-1" /> Under Review</Badge>;
            case "NEGOTIATING":
                return <Badge className="bg-cyan-100 text-cyan-700 border-2 border-cyan-400 rounded-none"><AlertCircle className="w-3 h-3 mr-1" /> Negotiating</Badge>;
            case "QUOTED":
                return <Badge className="bg-[#ff90e8] text-black border-2 border-black rounded-none animate-pulse"><AlertCircle className="w-3 h-3 mr-1" /> Quote Ready!</Badge>;
            case "ACCEPTED":
                return <Badge className="bg-accent-green text-black border-2 border-black rounded-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Accepted</Badge>;
            case "REJECTED":
                return <Badge className="bg-zinc-200 text-zinc-500 border-2 border-zinc-500 rounded-none"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
            case "CANCELLED":
                return <Badge className="bg-zinc-200 text-zinc-500 border-2 border-zinc-400 rounded-none"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
            case "EXPIRED":
                return <Badge className="bg-zinc-100 text-zinc-400 border-2 border-zinc-300 rounded-none"><Clock className="w-3 h-3 mr-1" /> Expired</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    if (isLoading && !inquiry) {
        return <div className="p-12 text-center text-xl font-bold animate-pulse">Loading inquiry details...</div>;
    }
    if (!inquiry) {
        return <div className="p-12 text-center">Inquiry not found.</div>;
    }

    const item = inquiry.items && inquiry.items.length > 0 ? inquiry.items[0] : null;
    const canMessage = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "NEGOTIATING", "QUOTED"].includes(inquiry.status);

    return (
        <div className="space-y-6 max-w-6xl mx-auto min-h-[calc(100vh-100px)] lg:h-[calc(100vh-100px)] flex flex-col">

            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between border-b-4 border-black pb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="hover:bg-zinc-100 rounded-none">
                        <Link href="/dashboard/inquiries">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black uppercase tracking-tighter">
                                {item?.service_id ? item?.service_name : (item?.template_name || "Inquiry")}
                            </h1>
                            {/* WS Connection badge */}
                            {wsStatus === "connected"
                                ? <span title="Live – connected"><Wifi className="w-4 h-4 text-green-600" /></span>
                                : wsStatus === "connecting"
                                    ? <span title="Connecting..."><Loader2 className="w-4 h-4 text-yellow-500 animate-spin" /></span>
                                    : <span title="Offline – reconnect to get live updates"><WifiOff className="w-4 h-4 text-zinc-400" /></span>}
                        </div>
                        <p className="text-sm font-medium text-zinc-500">
                            #{inquiry.id.slice(0, 8).toUpperCase()} · {new Date(inquiry.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap justify-end">
                    {getStatusBadge(inquiry.status)}
                    {inquiry.active_quote?.total_price != null && (
                        <div className="text-xl font-black bg-accent-green text-black border-2 border-black px-4 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            ₹{inquiry.active_quote.total_price.toLocaleString()}
                        </div>
                    )}
                    {inquiry.status === "DRAFT" && (
                        <Button onClick={() => handleStatusUpdate("SUBMITTED")} className="bg-black text-white hover:bg-zinc-800 border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase font-black">
                            <Send className="w-4 h-4 mr-2" /> Submit to Studio
                        </Button>
                    )}
                    {inquiry.status === "QUOTED" && (
                        <div className="flex gap-2">
                            <Button onClick={() => handleStatusUpdate("ACCEPTED")} className="bg-accent-green text-black border-2 border-black rounded-none hover:bg-[#3bc27b] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase font-black">
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Accept
                            </Button>
                            <Button onClick={() => handleStatusUpdate("REJECTED")} variant="outline" className="border-2 border-black rounded-none uppercase font-black">
                                <XCircle className="w-4 h-4 mr-2" /> Reject
                            </Button>
                        </div>
                    )}
                    {["ACCEPTED", "REJECTED", "CANCELLED", "EXPIRED"].includes(inquiry.status) && (
                        <Button
                            onClick={handleReorder}
                            className="bg-white text-black hover:bg-zinc-100 border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all uppercase font-black"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" /> Reorder
                        </Button>
                    )}
                </div>
            </div>

            {/* ── Body ────────────────────────────────────────────────── */}
            <div className="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-6 grow overflow-visible lg:overflow-hidden pb-6 lg:pb-0">

                {/* Left: Project specs */}
                <div className="lg:col-span-1 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden shrink-0">
                    <CardHeader className="bg-zinc-50 border-b-2 border-black py-3">
                        <CardTitle className="uppercase text-base font-black">Project Specs</CardTitle>
                    </CardHeader>
                    <div className="grow p-5 overflow-y-auto">
                        <div className="space-y-5">
                            {/* Top-level status */}
                            <div>
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">Status</span>
                                <div className="font-black text-sm uppercase">{inquiry.status.replace("_", " ")}</div>
                            </div>

                            {/* ── All Items with pricing ───────────── */}
                            <div>
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-3">Items ({inquiry.items?.length || 0})</span>
                                <div className="space-y-4">
                                    {(inquiry.items || []).map((it, idx) => {
                                        const unitPrice = (it.estimated_price || 0) > 0 ? (it.estimated_price || 0) / it.quantity : 0;
                                        const lineTotal = it.total_estimated_price || (unitPrice * it.quantity);
                                        const gstRate = (it.cgst_rate || 0) + (it.sgst_rate || 0);
                                        const taxAmt = it.computed_tax_amount || (lineTotal * gstRate / 100);
                                        const displayPrice = it.line_item_price || lineTotal;

                                        return (
                                            <div key={it.id} className="bg-zinc-50 border-2 border-zinc-200 p-4 space-y-3">
                                                {/* ITEM HEADER WITH IMAGE */}
                                                <div className="flex gap-4">
                                                    {it.display_images && it.display_images.length > 0 && (
                                                        <div className="w-16 h-16 border-2 border-black shrink-0 relative overflow-hidden bg-white rounded-md">
                                                            <img src={it.display_images[0]} alt={it.subproduct_name || it.subservice_name || "Item"} className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 flex justify-between items-start gap-2">
                                                        <div>
                                                            <span className="font-black text-sm block leading-tight">{idx + 1}. {it.subproduct_name || it.product_name || it.subservice_name || it.service_name || it.template_name || "Custom Item"}</span>
                                                            <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1 text-xs text-zinc-600">
                                                                <span className="font-bold">Qty: {it.quantity}</span>
                                                                {unitPrice > 0 && <span>| Unit: ₹{unitPrice.toLocaleString()}</span>}
                                                                {it.hsn_code && <span>| HSN: {it.hsn_code}</span>}
                                                            </div>
                                                        </div>
                                                        {displayPrice > 0 && (
                                                            <div className="font-black text-base shrink-0 text-right">
                                                                ₹{displayPrice.toLocaleString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* OPTIONS & SPECIFICATIONS */}
                                                {(it.variant_name || (it.selected_options && Object.keys(it.selected_options).length > 0)) && (
                                                    <div className="bg-white border-2 border-zinc-200 p-2.5 rounded-sm">
                                                        {it.variant_name && (
                                                            <div className="flex justify-between border-b border-dashed border-zinc-200 pb-1 mb-1">
                                                                <span className="text-xs font-medium text-zinc-500">Variant</span>
                                                                <span className="text-xs font-bold capitalize">{it.variant_name}</span>
                                                            </div>
                                                        )}
                                                        {Object.entries(it.selected_options || {}).map(([key, value]) => {
                                                            if (key === "variant_name") return null;
                                                            return (
                                                                <div key={key} className="flex justify-between border-b border-dashed border-zinc-200 pb-1 mb-1 last:border-0 last:pb-0 last:mb-0">
                                                                    <span className="text-xs font-medium capitalize text-zinc-500">{key.replace(/_/g, " ")}</span>
                                                                    <span className="text-xs font-bold capitalize truncate max-w-[150px] text-right" title={String(value)}>{String(value)}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* TAX & ADMIN OVERRIDE */}
                                                <div className="flex flex-col gap-1">
                                                    {gstRate > 0 && (
                                                        <div className="flex items-center justify-between text-[11px]">
                                                            <span className="text-zinc-500 font-bold">GST ({gstRate}%)</span>
                                                            <span className="font-bold text-amber-700">+₹{taxAmt.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                                        </div>
                                                    )}
                                                    {it.line_item_price && it.line_item_price !== lineTotal && (
                                                        <div className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-1 rounded w-fit mt-1">
                                                            Admin Quoted: ₹{it.line_item_price.toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ── Quote Breakdown ──────────────── */}
                            {inquiry.active_quote && (
                                <div className="bg-[#fdf567] border-2 border-black p-4 space-y-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <span className="font-black uppercase text-xs block">Quote Breakdown</span>
                                    {(inquiry.active_quote.discount_amount || 0) > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">Discount</span>
                                            <span className="font-bold text-red-700">−₹{(inquiry.active_quote.discount_amount || 0).toLocaleString()}</span>
                                        </div>
                                    )}
                                    {(inquiry.active_quote.tax_amount || 0) > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">GST</span>
                                            <span className="font-bold">₹{(inquiry.active_quote.tax_amount || 0).toLocaleString()}</span>
                                        </div>
                                    )}
                                    {(inquiry.active_quote.shipping_amount || 0) > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">Shipping</span>
                                            <span className="font-bold">₹{(inquiry.active_quote.shipping_amount || 0).toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-base border-t border-black pt-2 mt-1">
                                        <span className="font-black">Total</span>
                                        <span className="font-black">₹{inquiry.active_quote.total_price.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}

                            {/* My Notes (using item[0] as a fallback or inquiry notes if supported) */}
                            {item?.notes && (
                                <div>
                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">My Notes</span>
                                    <div className="bg-zinc-50 p-3 border border-black text-sm italic">"{item.notes}"</div>
                                </div>
                            )}

                            {inquiry.active_quote?.admin_notes && (
                                <div className="bg-[#fdf567] p-4 border-2 border-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <span className="font-black uppercase block mb-1">Studio Note:</span>
                                    {inquiry.active_quote.admin_notes}
                                </div>
                            )}

                            {inquiry.active_quote?.valid_until && (
                                <div className="text-xs font-bold text-zinc-400 uppercase">
                                    Quote valid until: {new Date(inquiry.active_quote.valid_until).toLocaleDateString()}
                                </div>
                            )}

                            {inquiry.quote_versions && inquiry.quote_versions.length > 0 && (
                                <div className="mt-6 border-t-2 border-dashed border-zinc-200 pt-4">
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Quote History</div>
                                    <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                                        {[...inquiry.quote_versions].sort((a, b) => b.version - a.version).map(vq => (
                                            <div key={vq.id} className={`p-3 border-2 border-black flex items-center justify-between ${vq.id === inquiry.active_quote_id ? "bg-accent-green" : "bg-zinc-50"}`}>
                                                <div>
                                                    <div className="text-xs font-black uppercase tracking-tighter">v{vq.version} {vq.id === inquiry.active_quote_id && "(Active)"}</div>
                                                    <div className="text-[10px] font-bold text-zinc-500 uppercase">{new Date(vq.created_at).toLocaleDateString()}</div>
                                                </div>
                                                <div className="font-black text-sm">₹{vq.total_price.toLocaleString()}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Chat */}
                <div className="lg:col-span-2 border-2 border-black bg-zinc-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden h-[calc(100vh-200px)] lg:h-auto">

                    {/* Header for chat panel */}
                    <div className="bg-white border-b-2 border-black px-5 py-3 flex items-center justify-between shrink-0">
                        <span className="text-xs font-black uppercase tracking-widest">Conversation</span>
                        <span className={`text-[10px] font-bold uppercase flex items-center gap-1.5 ${wsStatus === "connected" ? "text-green-600" : "text-zinc-400"}`}>
                            <span className={`w-2 h-2 rounded-full ${wsStatus === "connected" ? "bg-green-500 animate-pulse" : "bg-zinc-300"}`} />
                            {wsStatus === "connected" ? "Live" : wsStatus === "connecting" ? "Connecting..." : "Offline"}
                        </span>
                    </div>

                    {/* Messages */}
                    <div className="grow overflow-y-auto p-5 space-y-5" ref={scrollRef}>
                        {!inquiry.messages || inquiry.messages.length === 0 ? (
                            <div className="text-center text-zinc-400 py-14 flex flex-col items-center gap-2">
                                <User className="w-10 h-10 opacity-20" />
                                <p className="text-sm font-medium">No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            inquiry.messages.map((msg) => {
                                const isMe = String(msg.sender_id) === String(currentUserId);
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[80%] flex gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                            <div className={`w-7 h-7 rounded-full border-2 border-black flex items-center justify-center shrink-0 ${isMe ? "bg-black text-white" : "bg-[#ff90e8] text-black"}`}>
                                                {isMe ? <User className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                            </div>
                                            <div className="space-y-1">
                                                <div className={`border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] bg-white ${isMe ? "rounded-tr-none" : "rounded-tl-none"}`}>
                                                    {msg.content && <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed">{msg.content}</p>}
                                                    {msg.file_urls && msg.file_urls.length > 0 && (
                                                        <div className={`mt-2 pt-2 ${msg.content ? 'border-t' : ''} ${isMe ? 'border-zinc-200' : 'border-zinc-200'}`}>
                                                            {msg.file_urls.map((url, i) => {
                                                                const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url) || /\/image\//i.test(url);
                                                                return (
                                                                    <div key={i} className="flex flex-col gap-1 fade-in">
                                                                        {isImage ? (
                                                                            <a href={url} target="_blank" rel="noreferrer" className="block max-w-[220px] overflow-hidden rounded border border-zinc-200 shadow-sm mt-1">
                                                                                <img src={url} alt={`Attachment ${i + 1}`} className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300" />
                                                                            </a>
                                                                        ) : null}
                                                                        <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline mt-1">
                                                                            <FileText className="w-3 h-3 shrink-0" /> <span className="truncate max-w-[200px]">Attachment {i + 1}</span>
                                                                        </a>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={`text-[10px] uppercase font-bold text-zinc-400 ${isMe ? "text-right" : "text-left"}`}>
                                                    {isMe ? "You" : "Studio"} · {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {/* Typing indicator */}
                        {adminTyping && (
                            <div className="flex justify-start">
                                <div className="flex gap-2.5">
                                    <div className="w-7 h-7 rounded-full border-2 border-black flex items-center justify-center shrink-0 bg-[#ff90e8] text-black">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="border-2 border-black p-3 bg-white rounded-tl-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] flex items-center gap-1">
                                        <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                        <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                        <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:300ms]" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input area */}
                    <div className="bg-white border-t-2 border-black p-4 shrink-0 flex flex-col gap-2">
                        {attachmentUrl && (
                            <div className="flex items-center gap-2 bg-zinc-100 border border-black px-3 py-1.5 w-max">
                                <FileText className="w-4 h-4 text-[#ff90e8]" />
                                <span className="text-xs font-bold truncate max-w-[200px]">{attachmentName}</span>
                                <button type="button" onClick={() => {
                                    setAttachmentUrl(null);
                                    setAttachmentName(null);
                                    setUploadProgress(0);
                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                }} className="p-1 hover:text-red-500">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                        {isUploading && (
                            <div className="w-full bg-zinc-200 border-2 border-black h-4 overflow-hidden mt-1 relative">
                                <div 
                                    className="bg-blue-500 h-full transition-all duration-300 ease-out border-r-2 border-black"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black mix-blend-difference text-white tracking-widest">
                                    UPLOADING {uploadProgress}%
                                </span>
                            </div>
                        )}
                        {canMessage ? (
                            <form onSubmit={handleSendMessage} className="flex bg-zinc-50 border-2 border-black focus-within:ring-2 focus-within:ring-black">
                                <input
                                    type="text"
                                    className="grow bg-transparent p-3 outline-none text-sm font-medium"
                                    placeholder={isUploading ? "Uploading file..." : "Type your message..."}
                                    value={newMessage}
                                    onChange={handleInputChange}
                                    disabled={isSending || isUploading}
                                />
                                {/* Hidden File Input */}
                                <input
                                    type="file"
                                    className="hidden"
                                    id="file-upload"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                />
                                <label htmlFor="file-upload" className="flex items-center justify-center px-4 border-l-2 border-black hover:bg-zinc-200 cursor-pointer transition-colors" title="Attach File">
                                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                                </label>
                                <button
                                    type="submit"
                                    disabled={isSending || isUploading || (!newMessage.trim() && !attachmentUrl)}
                                    className="bg-[#b4ff4b] px-6 border-l-2 border-black font-black uppercase text-xs tracking-widest hover:bg-[#a1e643] active:bg-[#92cf3c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                >
                                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </form>
                        ) : (
                            <p className="text-center text-xs font-bold text-zinc-400 uppercase tracking-widest py-1">
                                {inquiry.status === "ACCEPTED" ? "Order placed — view in Orders" : "Messaging closed for this inquiry."}
                            </p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
