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
} from "lucide-react";

import Link from "next/link";
import { Inquiry, InquiryMessage } from "@/types/dashboard";
import { useAlert } from "@/components/CustomAlert";

type WsStatus = "connecting" | "connected" | "disconnected";

export default function InquiryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { showAlert } = useAlert();
    const inquiryId = params.id as string;

    const [inquiry, setInquiry] = useState<Inquiry | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
    const [attachmentName, setAttachmentName] = useState<string | null>(null);
    const [wsStatus, setWsStatus] = useState<WsStatus>("disconnected");
    const [adminTyping, setAdminTyping] = useState(false);

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
                headers: { Authorization: `Bearer ${token}` }
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

    useEffect(() => {
        if (inquiryId) fetchInquiryDetails();
    }, [inquiryId, fetchInquiryDetails]);

    // ── WebSocket ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!inquiryId) return;
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const wsBase = apiBase.replace(/^http/, "ws");
        const wsUrl = `${wsBase}/inquiries/ws/${inquiryId}?token=${token}`;

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
                } else if (data.type === "typing" && data.is_admin) {
                    setAdminTyping(data.is_typing);
                }
            } catch { /* ignore */ }
        };

        return () => {
            ws.close();
            wsRef.current = null;
        };
    }, [inquiryId]);

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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showAlert("File must be under 5MB size limit", "error");
            return;
        }
        setIsUploading(true);
        try {
            const token = localStorage.getItem("access_token");
            const formData = new FormData();
            formData.append("file", file);
            
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/?purpose=inquiry`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setAttachmentUrl(data.url);
                setAttachmentName(data.filename || file.name);
            } else {
                showAlert("Failed to upload file.", "error");
            }
        } catch {
            showAlert("Upload error.", "error");
        } finally {
            setIsUploading(false);
        }
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
                })
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
                body: JSON.stringify({ status })
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
                return <Badge className="bg-[#4be794] text-black border-2 border-black rounded-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Accepted</Badge>;
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
                        <div className="text-xl font-black bg-[#4be794] text-black border-2 border-black px-4 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
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
                            <Button onClick={() => handleStatusUpdate("ACCEPTED")} className="bg-[#4be794] text-black border-2 border-black rounded-none hover:bg-[#3bc27b] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase font-black">
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Accept
                            </Button>
                            <Button onClick={() => handleStatusUpdate("REJECTED")} variant="outline" className="border-2 border-black rounded-none uppercase font-black">
                                <XCircle className="w-4 h-4 mr-2" /> Reject
                            </Button>
                        </div>
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
                            <div>
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">Status</span>
                                <div className="font-black text-sm uppercase">{inquiry.status.replace("_", " ")}</div>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">Quantity</span>
                                <div className="text-xl font-black">{item?.quantity || 0} Units</div>
                            </div>

                            {/* All items */}
                            {inquiry.items && inquiry.items.length > 1 && (
                                <div>
                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-2">All Items ({inquiry.items.length})</span>
                                    <div className="space-y-2">
                                        {inquiry.items.map((it, idx) => (
                                            <div key={it.id} className="bg-zinc-50 border border-zinc-200 p-2 text-sm">
                                                <span className="font-bold">{idx + 1}. {it.template_name || it.service_name}</span>
                                                <span className="text-zinc-500 ml-2">×{it.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">Specifications</span>
                                {item?.variant_name && (
                                    <div className="flex justify-between border-b border-zinc-100 pb-1">
                                        <span className="text-sm font-medium capitalize text-zinc-600">Variant</span>
                                        <span className="text-sm font-bold capitalize">{item.variant_name}</span>
                                    </div>
                                )}
                                {Object.entries(item?.selected_options || {}).map(([key, value]) => {
                                    if (key === "variant_name") return null;
                                    return (
                                        <div key={key} className="flex justify-between border-b border-zinc-100 pb-1">
                                            <span className="text-sm font-medium capitalize text-zinc-600">{key.replace(/_/g, " ")}</span>
                                            <span className="text-sm font-bold capitalize">{String(value)}</span>
                                        </div>
                                    );
                                })}
                            </div>

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
                                        {[...inquiry.quote_versions].sort((a,b) => b.version_number - a.version_number).map(vq => (
                                            <div key={vq.id} className={`p-3 border-2 border-black flex items-center justify-between ${vq.id === inquiry.active_quote_id ? "bg-[#4be794]" : "bg-zinc-50"}`}>
                                                <div>
                                                    <div className="text-xs font-black uppercase tracking-tighter">v{vq.version_number} {vq.id === inquiry.active_quote_id && "(Active)"}</div>
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
                                const isMe = msg.sender_id === inquiry.user_id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[80%] flex gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                            <div className={`w-7 h-7 rounded-full border-2 border-black flex items-center justify-center shrink-0 ${isMe ? "bg-black text-white" : "bg-[#ff90e8] text-black"}`}>
                                                {isMe ? <User className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                            </div>
                                            <div className="space-y-1">
                                                <div className={`border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] bg-white ${isMe ? "rounded-tr-none" : "rounded-tl-none"}`}>
                                                    <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed">{msg.content}</p>
                                                    {msg.file_urls && msg.file_urls.length > 0 && (
                                                        <div className={`mt-2 pt-2 border-t ${isMe ? 'border-zinc-200' : 'border-zinc-200'}`}>
                                                            {msg.file_urls.map((url, i) => (
                                                                <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline mt-1">
                                                                    <FileText className="w-3 h-3" /> Attachment {i + 1}
                                                                </a>
                                                            ))}
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
                                    if(fileInputRef.current) fileInputRef.current.value="";
                                }} className="p-1 hover:text-red-500">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                        {canMessage ? (
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    ref={fileInputRef} 
                                    onChange={handleFileUpload} 
                                    accept="image/*,application/pdf" 
                                />
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="icon" 
                                    className="border-2 border-black rounded-none shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50" 
                                    disabled={isSending || isUploading || attachmentUrl !== null} 
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                                </Button>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={handleInputChange}
                                    placeholder="Type a message..."
                                    className="grow border-2 border-black p-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-[#fdf567] bg-zinc-50 text-sm"
                                    disabled={isSending}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="bg-black text-white border-2 border-black rounded-none hover:bg-zinc-800 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                                    disabled={isSending || isUploading || (!newMessage.trim() && !attachmentUrl)}
                                >
                                    {isSending ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </Button>
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
