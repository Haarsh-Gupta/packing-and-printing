"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    Download,
    Trash2,
    RefreshCcw,
    Pencil,
    Save,
    X
} from "lucide-react";

import Link from "next/link";
import { Inquiry, InquiryItem } from "@/types/dashboard";
import { useAlert } from "@/components/CustomAlert";

export default function InquiryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { showAlert } = useAlert();
    const inquiryId = params.id as string;

    const [inquiry, setInquiry] = useState<Inquiry | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [splitType, setSplitType] = useState<"FULL" | "HALF" | "CUSTOM_30">("FULL");
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editQuantity, setEditQuantity] = useState<number>(1);
    const [editNotes, setEditNotes] = useState<string>("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const getToken = () => localStorage.getItem("access_token");

    const fetchInquiryDetails = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const token = getToken();
            if (!token) {
                router.push("/auth/login");
                return;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/my/${inquiryId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setInquiry(data);
                if (data.allowed_split_types && data.allowed_split_types.length > 0) {
                    setSplitType(data.allowed_split_types[0]);
                }
            } else if (res.status === 401) {
                localStorage.removeItem("access_token");
                router.replace("/auth/login");
            } else {
                console.error("Failed to fetch inquiry");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [inquiryId, router]);

    useEffect(() => {
        if (inquiryId && fetchInquiryDetails) {
            fetchInquiryDetails();
        }
    }, [inquiryId, fetchInquiryDetails]);

    // Real-time listener for new messages
    useEffect(() => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        const token = getToken();
        if (!baseUrl || !token || !inquiryId) return;

        const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        const eventSource = new EventSource(`${cleanUrl}/events/stream?token=${token}`);

        eventSource.addEventListener("new_inquiry_message", (e) => {
            try {
                const eventData = JSON.parse(e.data);
                if (eventData.group_id === inquiryId && eventData.message) {
                    setInquiry(prev => {
                        if (!prev) return prev;
                        const exists = prev.messages?.some(m => m.id === eventData.message.id);
                        if (exists) return prev;
                        return {
                            ...prev,
                            messages: [...(prev.messages || []), eventData.message]
                        };
                    });
                }
            } catch (err) {
                console.error("Failed to parse SSE data", err);
            }
        });

        return () => {
            eventSource.close();
        };
    }, [inquiryId]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [inquiry?.messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !inquiry) return;

        setIsSending(true);
        try {
            const token = getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/my/${inquiry.id}/messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content: newMessage })
            });

            if (res.ok) {
                const savedMessage = await res.json();
                setInquiry(prev => prev ? {
                    ...prev,
                    messages: prev.messages ? [...prev.messages, savedMessage] : [savedMessage]
                } : null);
                setNewMessage("");
            } else if (res.status === 401) {
                localStorage.removeItem("access_token");
                router.replace("/auth/login");
            }
        } catch (error) {
            console.error("Failed to send message");
        } finally {
            setIsSending(false);
        }
    };

    const handleStatusUpdate = async (status: "ACCEPTED" | "REJECTED") => {
        setActionLoading("status");
        try {
            const token = getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/my/${inquiryId}/respond`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(status === "ACCEPTED" ? { status, split_type: splitType } : { status })
            });

            if (res.ok) {
                setInquiry(prev => prev ? { ...prev, status } : null);

                if (status === "ACCEPTED") {
                    showAlert("Inquiry accepted and order placed successfully!", "success");
                    setTimeout(() => router.push("/dashboard/orders"), 1500);
                } else {
                    showAlert(`Inquiry ${status.toLowerCase()} successfully.`, "info");
                }
            } else {
                showAlert("Failed to update status", "error");
            }
        } catch (error) {
            showAlert("An error occurred", "error");
        } finally {
            setActionLoading(null);
        }
    };

    // ── DELETE INQUIRY ──
    const handleDeleteInquiry = async () => {
        if (!confirm("Are you sure you want to delete this inquiry? This cannot be undone.")) return;
        setActionLoading("delete-inquiry");
        try {
            const token = getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/my/${inquiryId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok || res.status === 204) {
                showAlert("Inquiry deleted successfully.", "success");
                router.push("/dashboard/inquiries");
            } else {
                const err = await res.json().catch(() => ({}));
                showAlert(err.detail || "Failed to delete inquiry.", "error");
            }
        } catch {
            showAlert("Network error.", "error");
        } finally {
            setActionLoading(null);
        }
    };

    // ── REORDER INQUIRY ──
    const handleReorder = async () => {
        setActionLoading("reorder");
        try {
            const token = getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/my/${inquiryId}/reorder`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const newInquiry = await res.json();
                showAlert("Reorder created! Redirecting…", "success");
                router.push(`/dashboard/inquiries/${newInquiry.id}`);
            } else {
                const err = await res.json().catch(() => ({}));
                showAlert(err.detail || "Failed to reorder.", "error");
            }
        } catch {
            showAlert("Network error.", "error");
        } finally {
            setActionLoading(null);
        }
    };

    // ── DELETE ITEM ──
    const handleDeleteItem = async (itemId: string) => {
        if (!confirm("Remove this item from the inquiry?")) return;
        setActionLoading(`delete-item-${itemId}`);
        try {
            const token = getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/my/${inquiryId}/items/${itemId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok || res.status === 204) {
                showAlert("Item removed.", "success");
                await fetchInquiryDetails(true);
            } else {
                const err = await res.json().catch(() => ({}));
                showAlert(err.detail || "Failed to remove item.", "error");
            }
        } catch {
            showAlert("Network error.", "error");
        } finally {
            setActionLoading(null);
        }
    };

    // ── EDIT ITEM (start editing) ──
    const startEditing = (item: InquiryItem) => {
        setEditingItemId(item.id);
        setEditQuantity(item.quantity);
        setEditNotes(item.notes || "");
    };

    const cancelEditing = () => {
        setEditingItemId(null);
    };

    // ── SAVE ITEM EDIT ──
    const handleSaveItem = async (item: InquiryItem) => {
        setActionLoading(`edit-item-${item.id}`);
        try {
            const token = getToken();

            // Build the full InquiryItemCreate payload (backend requires it)
            const payload: any = {
                quantity: editQuantity,
                notes: editNotes || null,
                images: item.images || null,
            };

            // Product inquiry
            if (item.product_id) {
                payload.product_id = item.product_id;
                payload.subproduct_id = item.subproduct_id || null;
                payload.selected_options = item.selected_options || {};
            }
            // Service inquiry
            if (item.service_id) {
                payload.service_id = item.service_id;
                payload.subservice_id = item.subservice_id || null;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/my/${inquiryId}/items/${item.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showAlert("Item updated.", "success");
                setEditingItemId(null);
                await fetchInquiryDetails(true);
            } else {
                const err = await res.json().catch(() => ({}));
                showAlert(err.detail || "Failed to update item.", "error");
            }
        } catch {
            showAlert("Network error.", "error");
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge className="bg-[#fdf567] text-black border-2 border-black rounded-none"><Clock className="w-3 h-3 mr-1" /> Pending Review</Badge>;
            case "QUOTED":
                return <Badge className="bg-[#ff90e8] text-black border-2 border-black rounded-none animate-pulse"><AlertCircle className="w-3 h-3 mr-1" /> Quote Ready</Badge>;
            case "ACCEPTED":
                return <Badge className="bg-[#90e8ff] text-black border-2 border-black rounded-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Accepted</Badge>;
            case "REJECTED":
                return <Badge className="bg-zinc-200 text-zinc-500 border-2 border-zinc-500 rounded-none"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
            case "EXPIRED":
                return <Badge className="bg-orange-200 text-orange-700 border-2 border-orange-500 rounded-none"><Clock className="w-3 h-3 mr-1" /> Expired</Badge>;
            case "CANCELLED":
                return <Badge className="bg-red-200 text-red-700 border-2 border-red-500 rounded-none"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    const isPending = inquiry?.status === "PENDING";
    const canReorder = ["ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"].includes(inquiry?.status || "");

    if (isLoading) {
        return <div className="p-12 text-center text-xl font-bold animate-pulse">Loading inquiry details...</div>;
    }

    if (!inquiry) {
        return <div className="p-12 text-center">Inquiry not found.</div>;
    }

    const items = inquiry.items || [];

    return (
        <div className="space-y-8 max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b-4 border-black pb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="hover:bg-zinc-100 rounded-none">
                        <Link href="/dashboard/inquiries">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter">
                            Inquiry #{inquiry.id.slice(0, 8).toUpperCase()}
                        </h1>
                        <p className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                            {items.length} item{items.length !== 1 ? "s" : ""} • Created on {new Date(inquiry.created_at).toLocaleDateString()}
                            {inquiry.quote_valid_until && inquiry.status === "QUOTED" && (
                                <span className="bg-[#fdf567] text-black px-2 py-0.5 border border-black text-[10px] font-black uppercase">
                                    Valid Until {new Date(inquiry.quote_valid_until).toLocaleDateString()}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap justify-end">
                    {getStatusBadge(inquiry.status)}

                    {inquiry.total_quoted_price != null && inquiry.total_quoted_price > 0 && (
                        <div className="text-2xl font-black bg-[#4be794] text-black border-2 border-black px-4 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            ₹{inquiry.total_quoted_price.toLocaleString()}
                        </div>
                    )}

                    {/* Delete Inquiry (PENDING only) */}
                    {isPending && (
                        <Button
                            onClick={handleDeleteInquiry}
                            disabled={actionLoading === "delete-inquiry"}
                            variant="outline"
                            className="border-2 border-red-500 text-red-600 rounded-none hover:bg-red-50 uppercase font-black text-xs"
                        >
                            <Trash2 className="w-4 h-4 mr-1" />
                            {actionLoading === "delete-inquiry" ? "Deleting…" : "Delete"}
                        </Button>
                    )}

                    {/* Reorder (ACCEPTED/REJECTED/EXPIRED/CANCELLED) */}
                    {canReorder && (
                        <Button
                            onClick={handleReorder}
                            disabled={actionLoading === "reorder"}
                            className="bg-[#90e8ff] text-black border-2 border-black rounded-none hover:bg-[#6dd8f5] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase font-black text-xs"
                        >
                            <RefreshCcw className="w-4 h-4 mr-1" />
                            {actionLoading === "reorder" ? "Creating…" : "Reorder"}
                        </Button>
                    )}

                    {/* Accept/Reject Quote (QUOTED only) */}
                    {inquiry.status === "QUOTED" && (() => {
                        const SPLIT_LABELS: Record<string, string> = {
                            FULL: "Pay 100% Upfront",
                            HALF: "Pay 50% Advance",
                            CUSTOM_30: "Pay 30% Advance"
                        };
                        const allowed = inquiry.allowed_split_types && inquiry.allowed_split_types.length > 0
                            ? inquiry.allowed_split_types
                            : ["FULL"];

                        return (
                            <div className="flex gap-2 items-center">
                                {allowed.length > 1 ? (
                                    <Select value={splitType} onValueChange={(val: any) => setSplitType(val)}>
                                        <SelectTrigger className="w-fit border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white font-bold h-10 px-3 uppercase text-xs">
                                            <SelectValue placeholder="Select Payment Type" />
                                        </SelectTrigger>
                                        <SelectContent className="border-2 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                                            {allowed.map((s: string) => (
                                                <SelectItem key={s} value={s} className="font-bold text-sm">
                                                    {SPLIT_LABELS[s] || s}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <span className="border-2 border-black bg-white font-bold h-10 px-3 uppercase text-xs flex items-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        {SPLIT_LABELS[allowed[0]] || allowed[0]}
                                    </span>
                                )}

                                <Button
                                    onClick={() => handleStatusUpdate("ACCEPTED")}
                                    disabled={actionLoading === "status"}
                                    className="bg-[#4be794] text-black border-2 border-black rounded-none hover:bg-[#3bc27b] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase font-black"
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Accept Quote
                                </Button>
                                <Button
                                    onClick={() => handleStatusUpdate("REJECTED")}
                                    disabled={actionLoading === "status"}
                                    variant="outline"
                                    className="border-2 border-black rounded-none hover:bg-zinc-100 uppercase font-black"
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                </Button>
                            </div>
                        );
                    })()}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 grow overflow-hidden">

                {/* Left Column: All Items (Scrollable) */}
                <div className="lg:col-span-1 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
                    <CardHeader className="bg-zinc-50 border-b-2 border-black py-3">
                        <CardTitle className="uppercase text-lg font-black flex items-center justify-between">
                            <span>Project Specs ({items.length})</span>
                        </CardTitle>
                    </CardHeader>
                    <div className="grow p-4 overflow-y-auto space-y-4">
                        {items.map((item, idx) => {
                            const isEditing = editingItemId === item.id;
                            const itemName = item.service_id
                                ? (item.service_name || item.subservice_name || "Service Item")
                                : (item.product_name || item.subproduct_name || item.template_name || "Product Item");

                            return (
                                <div key={item.id} className="border-2 border-black p-4 bg-white">
                                    {/* Item Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Item {idx + 1}</span>
                                            <h4 className="font-black text-sm uppercase">{itemName}</h4>
                                        </div>
                                        {isPending && (
                                            <div className="flex gap-1">
                                                {!isEditing ? (
                                                    <button
                                                        onClick={() => startEditing(item)}
                                                        className="p-1 hover:bg-zinc-100 border border-zinc-200"
                                                        title="Edit item"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5 text-zinc-500" />
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleSaveItem(item)}
                                                            disabled={actionLoading === `edit-item-${item.id}`}
                                                            className="p-1 hover:bg-green-50 border border-green-300"
                                                            title="Save"
                                                        >
                                                            <Save className="w-3.5 h-3.5 text-green-600" />
                                                        </button>
                                                        <button
                                                            onClick={cancelEditing}
                                                            className="p-1 hover:bg-zinc-100 border border-zinc-200"
                                                            title="Cancel"
                                                        >
                                                            <X className="w-3.5 h-3.5 text-zinc-500" />
                                                        </button>
                                                    </>
                                                )}
                                                {items.length > 1 && (
                                                    <button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        disabled={actionLoading === `delete-item-${item.id}`}
                                                        className="p-1 hover:bg-red-50 border border-red-200"
                                                        title="Remove item"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Quantity */}
                                    <div className="mb-2">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-0.5">Quantity</span>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                min={1}
                                                value={editQuantity}
                                                onChange={e => setEditQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="border-2 border-black p-1 w-24 font-bold text-sm"
                                            />
                                        ) : (
                                            <div className="text-lg font-black">{item.quantity} Units</div>
                                        )}
                                    </div>

                                    {/* Variant */}
                                    {item.variant_name && (
                                        <div className="flex justify-between border-b border-zinc-100 pb-1 mb-1">
                                            <span className="text-xs font-medium capitalize text-zinc-600">Variant</span>
                                            <span className="text-xs font-bold capitalize">{item.variant_name}</span>
                                        </div>
                                    )}

                                    {/* Specifications */}
                                    {Object.entries(item.selected_options || {}).map(([key, value]) => {
                                        if (key === 'variant_name') return null;
                                        return (
                                            <div key={key} className="flex justify-between border-b border-zinc-100 pb-1 mb-1">
                                                <span className="text-xs font-medium capitalize text-zinc-600">{key.replace("_", " ")}</span>
                                                <span className="text-xs font-bold capitalize">{String(value)}</span>
                                            </div>
                                        );
                                    })}

                                    {/* Notes */}
                                    <div className="mt-2">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-0.5">Notes</span>
                                        {isEditing ? (
                                            <textarea
                                                value={editNotes}
                                                onChange={e => setEditNotes(e.target.value)}
                                                rows={2}
                                                className="border-2 border-black p-2 w-full text-sm font-medium resize-none"
                                                placeholder="Add notes..."
                                            />
                                        ) : (
                                            item.notes ? (
                                                <div className="bg-zinc-50 p-2 border border-black text-xs italic">"{item.notes}"</div>
                                            ) : (
                                                <span className="text-xs text-zinc-300 italic">No notes</span>
                                            )
                                        )}
                                    </div>

                                    {/* Line item price */}
                                    {item.line_item_price != null && (
                                        <div className="flex justify-between border-t-2 border-black pt-2 mt-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#2563eb]">Quoted Price</span>
                                            <span className="text-sm font-black text-[#2563eb]">₹{item.line_item_price.toLocaleString()}</span>
                                        </div>
                                    )}

                                    {/* Images */}
                                    {item.images && item.images.length > 0 && (
                                        <div className="pt-2 mt-2 border-t border-zinc-100">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Images</span>
                                            <div className="flex gap-1 overflow-x-auto pb-1">
                                                {item.images.map((img, i) => (
                                                    <img
                                                        key={i}
                                                        src={img}
                                                        alt="ref"
                                                        className="w-14 h-14 object-cover border-2 border-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-[-1px] transition-all"
                                                        onClick={() => window.open(img, '_blank')}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Admin Notes (applies to full inquiry) */}
                        {inquiry.admin_notes && (
                            <div className="bg-[#fdf567] p-4 border-2 border-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <span className="font-black uppercase block mb-1">Studio Note:</span>
                                {inquiry.admin_notes}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Message Thread (Chat Interface) */}
                <div className="lg:col-span-2 border-2 border-black bg-zinc-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden relative">

                    {/* Messages Area */}
                    <div className="grow overflow-y-auto p-6 space-y-6" ref={scrollRef}>
                        {!inquiry.messages || inquiry.messages.length === 0 ? (
                            <div className="text-center text-zinc-400 py-12 flex flex-col items-center">
                                <User className="w-12 h-12 mb-2 opacity-20" />
                                <p>No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            inquiry.messages.map((msg) => {
                                const isMe = msg.sender_id === inquiry.user_id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>

                                            {/* Avatar */}
                                            <div className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center shrink-0 ${isMe ? 'bg-black text-white' : 'bg-[#ff90e8] text-black'}`}>
                                                {isMe ? <User className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                            </div>

                                            {/* Bubble */}
                                            <div className={`space-y-1`}>
                                                <div className={`border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] ${isMe ? 'bg-white rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                                                    <p className="whitespace-pre-wrap text-sm font-medium">{msg.content}</p>
                                                    {msg.file_urls && msg.file_urls.length > 0 && (
                                                        <div className="mt-3 space-y-2 border-t-2 border-zinc-100 pt-2">
                                                            {msg.file_urls.map((url, idx) => {
                                                                const isImg = url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
                                                                return isImg ? (
                                                                    <img
                                                                        key={idx}
                                                                        src={url}
                                                                        alt="attachment"
                                                                        className="w-full max-h-48 object-cover border-2 border-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-[-2px] transition-all"
                                                                        onClick={() => window.open(url, '_blank')}
                                                                    />
                                                                ) : (
                                                                    <a
                                                                        key={idx}
                                                                        href={url}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="flex items-center gap-2 text-[10px] font-black uppercase underline hover:text-[#ff90e8]"
                                                                    >
                                                                        <Paperclip className="w-3 h-3" /> File Attachment {idx + 1}
                                                                    </a>
                                                                )
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={`text-[10px] uppercase font-bold text-zinc-400 ${isMe ? 'text-right' : 'text-left'}`}>
                                                    {isMe ? 'You' : 'Admin'} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="bg-white border-t-2 border-black p-4 shrink-0">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <Button type="button" variant="outline" size="icon" className="border-2 border-black rounded-none shrink-0" disabled>
                                <Paperclip className="w-4 h-4" />
                            </Button>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="grow border-2 border-black p-2 font-medium focus:outline-none focus:ring-2 focus:ring-[#fdf567] bg-zinc-50"
                                disabled={isSending}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                className="bg-black text-white border-2 border-black rounded-none hover:bg-zinc-800 shrink-0"
                                disabled={isSending || !newMessage.trim()}
                            >
                                {isSending ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}
