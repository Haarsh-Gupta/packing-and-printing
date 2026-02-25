"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                setInquiry(prev => prev ? { ...prev, status } : null);

                if (status === "ACCEPTED") {
                    try {
                        const orderRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({ inquiry_id: inquiryId })
                        });
                        if (orderRes.ok) {
                            showAlert("Inquiry accepted and order placed successfully!", "success");
                            setTimeout(() => router.push("/dashboard/orders"), 1500);
                        } else {
                            showAlert("Inquiry accepted, but failed to create order.", "error");
                        }
                    } catch (e) {
                        console.error("Order creation error:", e);
                        showAlert("Failed to create order.", "error");
                    }
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
                    {inquiry.status === "QUOTED" && (
                        <div className="flex gap-2">
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
                    )}
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
