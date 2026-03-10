"use client";

import { useEffect, useState, useRef } from "react";
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
    Download
} from "lucide-react";

import Link from "next/link";
import { Inquiry } from "@/types/dashboard";
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
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (inquiryId) {
            fetchInquiryDetails();
        }
    }, [inquiryId]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [inquiry?.messages]);

    const fetchInquiryDetails = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("access_token");
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
                // Set initial split type from admin-allowed options
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
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !inquiry) return;

        setIsSending(true);

        try {
            const token = localStorage.getItem("access_token");
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
        setIsLoading(true);
        try {
            const token = localStorage.getItem("access_token");
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
            setIsLoading(false);
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
            default:
                return <Badge>{status}</Badge>;
        }
    };

    if (isLoading) {
        return <div className="p-12 text-center text-xl font-bold animate-pulse">Loading inquiry details...</div>;
    }

    if (!inquiry) {
        return <div className="p-12 text-center">Inquiry not found.</div>;
    }

    const item = inquiry.items && inquiry.items.length > 0 ? inquiry.items[0] : null;

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
                            {item?.service_id ? item?.service_name : item?.template_name}
                        </h1>
                        <p className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                            ID #{inquiry.id.slice(0, 8).toUpperCase()} • Created on {new Date(inquiry.created_at).toLocaleDateString()}
                            {inquiry.quote_valid_until && inquiry.status === "QUOTED" && (
                                <span className="bg-[#fdf567] text-black px-2 py-0.5 border border-black text-[10px] font-black uppercase">
                                    Valid Until {new Date(inquiry.quote_valid_until).toLocaleDateString()}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {getStatusBadge(inquiry.status)}
                    {inquiry.total_quoted_price && (
                        <div className="text-2xl font-black bg-[#4be794] text-black border-2 border-black px-4 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            ₹{inquiry.total_quoted_price.toLocaleString()}
                        </div>
                    )}
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
                                    className="bg-[#4be794] text-black border-2 border-black rounded-none hover:bg-[#3bc27b] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase font-black"
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Accept Quote
                                </Button>
                                <Button
                                    onClick={() => handleStatusUpdate("REJECTED")}
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

                {/* Left Column: Inquiry Details (Scrollable) */}
                <div className="lg:col-span-1 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
                    <CardHeader className="bg-zinc-50 border-b-2 border-black py-3">
                        <CardTitle className="uppercase text-lg font-black">Project Specs</CardTitle>
                    </CardHeader>
                    <div className="grow p-6 overflow-y-auto">
                        <div className="space-y-6">
                            <div>
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">Status</span>
                                <div className="font-black text-sm uppercase">{inquiry.status}</div>
                            </div>

                            <div>
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">Quantity</span>
                                <div className="text-xl font-black">{item?.quantity || 0} Units</div>
                            </div>

                            <div className="space-y-3">
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">Specifications</span>
                                {item?.variant_name && (
                                    <div className="flex justify-between border-b border-zinc-100 pb-1">
                                        <span className="text-sm font-medium capitalize text-zinc-600">Variant</span>
                                        <span className="text-sm font-bold capitalize">{item?.variant_name}</span>
                                    </div>
                                )}
                                {Object.entries(item?.selected_options || {}).map(([key, value]) => {
                                    if (key === 'variant_name') return null;
                                    return (
                                        <div key={key} className="flex justify-between border-b border-zinc-100 pb-1">
                                            <span className="text-sm font-medium capitalize text-zinc-600">{key.replace("_", " ")}</span>
                                            <span className="text-sm font-bold capitalize">{String(value)}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {item?.notes && (
                                <div>
                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">User Notes</span>
                                    <div className="bg-zinc-50 p-3 border border-black text-sm italic">
                                        "{item.notes}"
                                    </div>
                                </div>
                            )}

                            {inquiry.admin_notes && (
                                <div className="bg-[#fdf567] p-4 border-2 border-black text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <span className="font-black uppercase block mb-1">Studio Note:</span>
                                    {inquiry.admin_notes}
                                </div>
                            )}

                            {item?.line_item_price != null && (
                                <div className="flex justify-between border-t-2 border-black pt-3 mt-4">
                                    <span className="text-xs font-black uppercase tracking-widest text-[#2563eb]">Quoted Price</span>
                                    <span className="text-lg font-black text-[#2563eb]">₹{item.line_item_price.toLocaleString()}</span>
                                </div>
                            )}

                            {item?.images && item.images.length > 0 && (
                                <div className="pt-4 border-t-2 border-zinc-100">
                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-2">Reference Images</span>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {item.images.map((img, idx) => (
                                            <img
                                                key={idx}
                                                src={img}
                                                alt="ref"
                                                className="w-20 h-20 object-cover border-2 border-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-[-2px] transition-all"
                                                onClick={() => window.open(img, '_blank')}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
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
