"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Paperclip, Clock, AlertCircle, CheckCircle2, User, ShieldCheck } from "lucide-react";
import { MOCK_INQUIRIES, MOCK_MESSAGES } from "@/lib/mockData";
import { useAlert } from "@/components/CustomAlert";

const inquiry = {
    ...MOCK_INQUIRIES[0],
    user_id: 1,
    service_id: null,
    variant_id: null,
    template_name: "Premium Hardcover Book",
    service_name: undefined,
    variant_name: undefined,
    messages: MOCK_MESSAGES.map((m) => ({
        ...m,
        file_urls: [] as string[],
    })),
};

export default function InquiryChatDemoPage() {
    const { showAlert } = useAlert();
    const [messages, setMessages] = useState(inquiry.messages);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        setIsSending(true);
        // Simulate sending
        await new Promise((r) => setTimeout(r, 500));
        const msg = {
            id: messages.length + 1,
            inquiry_id: inquiry.id,
            sender_id: 1,
            content: newMessage,
            file_urls: [],
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, msg]);
        setNewMessage("");
        setIsSending(false);
        showAlert("Message sent!", "success");

        // Simulate admin reply after 2s
        setTimeout(() => {
            setMessages((prev) => [
                ...prev,
                {
                    id: prev.length + 1,
                    inquiry_id: inquiry.id,
                    sender_id: 2,
                    content: "Thank you for your message. We'll review and get back to you shortly!",
                    file_urls: [],
                    created_at: new Date().toISOString(),
                },
            ]);
        }, 2000);
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto h-[calc(100vh-100px)] flex flex-col">
            {/* Demo Banner */}
            <div className="bg-[#fdf567] border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between shrink-0">
                <p className="font-black uppercase tracking-tight text-sm">
                    🎭 DEMO MODE — Mock chat. Real page: <code className="bg-black text-[#fdf567] px-2 py-0.5">/dashboard/inquiries/[id]</code>
                </p>
                <Link href="/dashboard/inquiries/demo" className="font-black text-sm underline">Back to Inquiries Demo</Link>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b-4 border-black pb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="hover:bg-zinc-100 rounded-none">
                        <Link href="/dashboard/inquiries/demo"><ArrowLeft className="w-6 h-6" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter">{inquiry.template_name}</h1>
                        <p className="text-sm font-medium text-zinc-500">ID #{inquiry.id} • Created on {new Date(inquiry.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Badge className="bg-[#ff90e8] text-black border-2 border-black rounded-none animate-pulse">
                        <AlertCircle className="w-3 h-3 mr-1" /> Quote Ready
                    </Badge>
                    <div className="text-2xl font-black bg-[#4be794] text-black border-2 border-black px-4 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        ₹{inquiry.quoted_price?.toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 grow overflow-hidden">
                {/* Left: Project Specs */}
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
                                <div className="text-xl font-black">{inquiry.quantity} Units</div>
                            </div>
                            <div className="space-y-3">
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">Specifications</span>
                                {Object.entries(inquiry.selected_options).map(([key, value]) => (
                                    <div key={key} className="flex justify-between border-b border-zinc-100 pb-1">
                                        <span className="text-sm font-medium capitalize text-zinc-600">{key.replace("_", " ")}</span>
                                        <span className="text-sm font-bold capitalize">{String(value)}</span>
                                    </div>
                                ))}
                            </div>
                            {inquiry.notes && (
                                <div>
                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">User Notes</span>
                                    <div className="bg-zinc-50 p-3 border border-black text-sm italic">"{inquiry.notes}"</div>
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

                {/* Right: Chat */}
                <div className="lg:col-span-2 border-2 border-black bg-zinc-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden relative">
                    <div className="grow overflow-y-auto p-6 space-y-6" ref={scrollRef}>
                        {messages.map((msg) => {
                            const isMe = msg.sender_id === inquiry.user_id;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[80%] flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                        <div className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center shrink-0 ${isMe ? "bg-black text-white" : "bg-[#ff90e8] text-black"}`}>
                                            {isMe ? <User className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                        </div>
                                        <div className="space-y-1">
                                            <div className={`border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] ${isMe ? "bg-white rounded-tr-none" : "bg-white rounded-tl-none"}`}>
                                                <p className="whitespace-pre-wrap text-sm font-medium">{msg.content}</p>
                                            </div>
                                            <div className={`text-[10px] uppercase font-bold text-zinc-400 ${isMe ? "text-right" : "text-left"}`}>
                                                {isMe ? "You" : "Admin"} • {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/* Input */}
                    <div className="bg-white border-t-2 border-black p-4 shrink-0">
                        <form onSubmit={handleSend} className="flex gap-2">
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
                            <Button type="submit" size="icon" className="bg-black text-white border-2 border-black rounded-none hover:bg-zinc-800 shrink-0" disabled={isSending || !newMessage.trim()}>
                                {isSending ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
