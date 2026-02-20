"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Send, User, ShieldCheck } from "lucide-react";
import { useAlert } from "@/components/CustomAlert";

interface Message {
    id: number;
    sender_id: number;
    message: string;
    is_read: boolean;
    created_at: string;
}

interface Ticket {
    id: number;
    subject: string;
    status: string;
    priority: string;
    created_at: string;
    updated_at: string;
    user_id: number;
    messages: Message[];
}

const STATUS_STYLES: Record<string, string> = {
    OPEN: "bg-[#4be794] text-black",
    IN_PROGRESS: "bg-[#90e8ff] text-black",
    RESOLVED: "bg-zinc-200 text-zinc-700",
    CLOSED: "bg-zinc-100 text-zinc-500",
};

export default function TicketDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { showAlert } = useAlert();
    const ticketId = params?.id;

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [reply, setReply] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    useEffect(() => {
        if (!token) { router.replace("/auth/login"); return; }
        fetchTicket();
        fetchCurrentUser();
    }, [ticketId]);

    const fetchCurrentUser = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const user = await res.json();
                setCurrentUserId(user.id);
            }
        } catch (e) { /* silent */ }
    };

    const fetchTicket = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/${ticketId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401) { localStorage.removeItem("access_token"); router.replace("/auth/login"); return; }
            if (res.status === 404) { router.replace("/dashboard/support"); return; }
            if (res.ok) setTicket(await res.json());
        } catch (e) {
            showAlert("Failed to load ticket.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reply.trim()) return;
        if (ticket?.status === "CLOSED") {
            showAlert("This ticket is closed.", "error");
            return;
        }
        setIsSending(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/${ticketId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ message: reply }),
            });
            if (res.ok) {
                const msg = await res.json();
                setTicket((prev) => prev ? { ...prev, messages: [...prev.messages, msg] } : prev);
                setReply("");
            } else {
                showAlert("Failed to send reply.", "error");
            }
        } catch (e) {
            showAlert("Network error.", "error");
        } finally {
            setIsSending(false);
        }
    };

    const formatTime = (iso: string) => new Date(iso).toLocaleString("en-IN", {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin" />
            </div>
        );
    }

    if (!ticket) return null;

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Back + Header */}
            <div>
                <Link href="/dashboard/support" className="flex items-center gap-2 text-zinc-500 font-bold hover:text-black mb-4 transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Back to Tickets
                </Link>

                <div className="border-4 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tight">{ticket.subject}</h1>
                            <p className="text-zinc-500 font-bold text-sm mt-1">
                                #TKT-{ticket.id} · Opened {formatTime(ticket.created_at)}
                            </p>
                        </div>
                        <span className={`px-4 py-2 font-black uppercase text-sm border-2 border-black ${STATUS_STYLES[ticket.status] || "bg-zinc-100"}`}>
                            {ticket.status.replace("_", " ")}
                        </span>
                    </div>
                </div>
            </div>

            {/* Messages Thread */}
            <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="border-b-4 border-black p-4 bg-zinc-50">
                    <h2 className="font-black uppercase tracking-tight">Conversation</h2>
                </div>

                <div className="divide-y-2 divide-zinc-100 max-h-[500px] overflow-y-auto">
                    {ticket.messages.length === 0 ? (
                        <div className="p-12 text-center text-zinc-400 font-bold">
                            No messages yet. Start the conversation below.
                        </div>
                    ) : (
                        ticket.messages.map((msg) => {
                            const isMe = msg.sender_id === currentUserId;
                            return (
                                <div key={msg.id} className={`p-6 ${isMe ? "bg-white" : "bg-zinc-50 border-l-4 border-black"}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`p-1.5 border-2 border-black ${isMe ? "bg-[#fdf567]" : "bg-black text-white"}`}>
                                            {isMe ? <User className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                                        </div>
                                        <span className="font-black text-sm uppercase tracking-tight">
                                            {isMe ? "You" : "Support Team"}
                                        </span>
                                        <span className="text-xs text-zinc-400 font-medium ml-auto">
                                            {formatTime(msg.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-zinc-800 font-medium leading-relaxed">{msg.message}</p>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Reply Box */}
            {ticket.status !== "CLOSED" ? (
                <form onSubmit={handleReply} className="border-4 border-black p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
                    <h3 className="font-black uppercase tracking-tight">Add a Reply</h3>
                    <Textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Type your message here..."
                        className="min-h-[120px] border-2 border-black rounded-none focus:ring-0 focus:border-black"
                    />
                    <Button
                        type="submit"
                        disabled={isSending || !reply.trim()}
                        className="h-12 px-8 bg-black text-white font-black uppercase border-2 border-black hover:bg-[#fdf567] hover:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all rounded-none"
                    >
                        {isSending ? <Loader2 className="animate-spin h-5 w-5" /> : <><Send className="h-4 w-4 mr-2" /> Send Reply</>}
                    </Button>
                </form>
            ) : (
                <div className="border-4 border-black p-6 bg-zinc-100 text-center font-black uppercase text-zinc-500">
                    This ticket is closed. Open a new one if you need further help.
                </div>
            )}
        </div>
    );
}
