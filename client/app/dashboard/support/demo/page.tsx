"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, MessageSquare, X, ChevronRight, Send, User, ShieldCheck, Clock } from "lucide-react";
import { MOCK_TICKETS, MOCK_TICKET_MESSAGES } from "@/lib/mockData";
import { useAlert } from "@/components/CustomAlert";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

type Priority = "LOW" | "MEDIUM" | "HIGH";

const STATUS_STYLES: Record<string, string> = {
    OPEN: "bg-[#4be794] text-black",
    IN_PROGRESS: "bg-[#90e8ff] text-black",
    RESOLVED: "bg-zinc-200 text-zinc-700",
    CLOSED: "bg-zinc-100 text-zinc-500",
};

const PRIORITY_STYLES: Record<string, string> = {
    HIGH: "bg-[#ff90e8]",
    MEDIUM: "bg-[#fdf567]",
    LOW: "bg-zinc-100",
};

export default function SupportDemoPage() {
    const { showAlert } = useAlert();
    const [tickets, setTickets] = useState(MOCK_TICKETS);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ subject: "", message: "", priority: "MEDIUM" as Priority });
    const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
    const [chatMessages, setChatMessages] = useState(MOCK_TICKET_MESSAGES);
    const [newMessage, setNewMessage] = useState("");

    const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.subject.trim() || !form.message.trim()) {
            showAlert("Subject and message are required.", "error");
            return;
        }
        const newTicket = {
            id: tickets.length + 1,
            subject: form.subject,
            status: "OPEN" as const,
            priority: form.priority,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        setTickets((prev) => [newTicket, ...prev]);
        setForm({ subject: "", message: "", priority: "MEDIUM" });
        setShowForm(false);
        showAlert("Ticket created!", "success");
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        setChatMessages((prev) => [...prev, {
            id: prev.length + 1,
            ticket_id: selectedTicket!,
            sender_id: 1,
            sender_name: "You",
            content: newMessage,
            is_admin: false,
            created_at: new Date().toISOString(),
        }]);
        setNewMessage("");
        showAlert("Reply sent!", "success");

        // Auto admin reply
        setTimeout(() => {
            setChatMessages((prev) => [...prev, {
                id: prev.length + 1,
                ticket_id: selectedTicket!,
                sender_id: 99,
                sender_name: "Support Team",
                content: "Thanks for the update! We're on it and will keep you posted.",
                is_admin: true,
                created_at: new Date().toISOString(),
            }]);
        }, 2000);
    };

    const ticket = selectedTicket ? tickets.find((t) => t.id === selectedTicket) : null;
    const ticketMessages = chatMessages.filter((m) => m.ticket_id === selectedTicket);

    // --- Ticket Detail View ---
    if (selectedTicket && ticket) {
        return (
            <div className="space-y-8 max-w-4xl mx-auto h-[calc(100vh-100px)] flex flex-col">
                {/* Demo Banner */}
                <div className="bg-[#fdf567] border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between shrink-0">
                    <p className="font-black uppercase tracking-tight text-sm">
                        🎭 DEMO — Ticket chat. Real page: <code className="bg-black text-[#fdf567] px-2 py-0.5">/dashboard/support/[id]</code>
                    </p>
                    <button onClick={() => setSelectedTicket(null)} className="font-black text-sm underline">Back to Tickets</button>
                </div>

                <div className="flex items-center justify-between border-b-4 border-black pb-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedTicket(null)} className="hover:bg-zinc-100 rounded-none">
                            <ChevronRight className="w-6 h-6 rotate-180" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tighter">{ticket.subject}</h1>
                            <p className="text-sm text-zinc-500 font-bold">#TKT-{ticket.id} · Opened {formatDate(ticket.created_at)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-xs font-black uppercase border border-black ${STATUS_STYLES[ticket.status]}`}>
                            {ticket.status.replace("_", " ")}
                        </span>
                        <span className={`px-3 py-1 text-xs font-black uppercase border border-black ${PRIORITY_STYLES[ticket.priority]}`}>
                            {ticket.priority}
                        </span>
                    </div>
                </div>

                {/* Messages */}
                <div className="border-2 border-black bg-zinc-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col grow overflow-hidden">
                    <div className="grow overflow-y-auto p-6 space-y-6">
                        {ticketMessages.length === 0 ? (
                            <div className="text-center text-zinc-400 py-12">
                                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>No messages in this ticket yet.</p>
                            </div>
                        ) : ticketMessages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.is_admin ? "justify-start" : "justify-end"}`}>
                                <div className={`max-w-[80%] flex gap-3 ${msg.is_admin ? "flex-row" : "flex-row-reverse"}`}>
                                    <div className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center shrink-0 ${msg.is_admin ? "bg-[#ff90e8] text-black" : "bg-black text-white"}`}>
                                        {msg.is_admin ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                    </div>
                                    <div className="space-y-1">
                                        <div className={`border-2 border-black p-3 ${msg.is_admin ? "bg-white rounded-tl-none" : "bg-[#fdf567] rounded-tr-none"}`}>
                                            <p className="text-sm font-medium whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                        <div className={`text-[10px] uppercase font-bold text-zinc-400 ${msg.is_admin ? "text-left" : "text-right"}`}>
                                            {msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="bg-white border-t-2 border-black p-4 shrink-0">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your reply..."
                                className="grow border-2 border-black p-2 font-medium focus:outline-none focus:ring-2 focus:ring-[#fdf567] bg-zinc-50"
                            />
                            <Button type="submit" size="icon" className="bg-black text-white border-2 border-black rounded-none hover:bg-zinc-800 shrink-0" disabled={!newMessage.trim()}>
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // --- Tickets List View ---
    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Demo Banner */}
            <div className="bg-[#fdf567] border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
                <p className="font-black uppercase tracking-tight text-sm">
                    🎭 DEMO MODE — Mock tickets. Real page: <code className="bg-black text-[#fdf567] px-2 py-0.5">/dashboard/support</code>
                </p>
                <Link href="/dashboard" className="font-black text-sm underline">Exit Demo</Link>
            </div>

            <DashboardHeader
                title="Support Tickets"
                description="Get help from our team. Open a ticket and we'll respond shortly."
            />

            {/* New Ticket Button */}
            <div className="flex justify-end">
                <Button
                    onClick={() => setShowForm(!showForm)}
                    className="h-12 px-6 font-black uppercase border-2 border-black bg-black text-white hover:bg-[#fdf567] hover:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all rounded-none"
                >
                    {showForm ? <><X className="h-4 w-4 mr-2" /> Cancel</> : <><Plus className="h-4 w-4 mr-2" /> New Ticket</>}
                </Button>
            </div>

            {/* New Ticket Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="border-4 border-black p-8 bg-zinc-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6">
                    <h2 className="text-2xl font-black uppercase tracking-tight border-b-4 border-black pb-4">Open a New Ticket</h2>
                    <div className="space-y-2">
                        <Label className="font-black uppercase tracking-tight">Subject</Label>
                        <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Brief description..." className="border-2 border-black rounded-none h-12" required />
                    </div>
                    <div className="space-y-2">
                        <Label className="font-black uppercase tracking-tight">Priority</Label>
                        <div className="flex gap-3">
                            {(["LOW", "MEDIUM", "HIGH"] as Priority[]).map((p) => (
                                <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })} className={`px-4 py-2 border-2 border-black font-black uppercase text-sm transition-all ${form.priority === p ? `${PRIORITY_STYLES[p]} shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]` : "bg-white hover:bg-zinc-100"}`}>
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="font-black uppercase tracking-tight">Message</Label>
                        <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Describe your issue..." className="min-h-[140px] border-2 border-black rounded-none" required />
                    </div>
                    <Button type="submit" className="w-full h-14 bg-[#4be794] hover:bg-[#3cd083] text-black font-black uppercase text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all rounded-none">
                        Submit Ticket
                    </Button>
                </form>
            )}

            {/* Ticket List */}
            <div className="space-y-4">
                {tickets.map((t) => (
                    <div key={t.id} onClick={() => setSelectedTicket(t.id)} className="cursor-pointer border-2 border-black bg-white p-6 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-px hover:-translate-y-px transition-all flex items-center justify-between gap-4 group">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={`h-12 w-2 shrink-0 ${PRIORITY_STYLES[t.priority]}`} />
                            <div className="min-w-0">
                                <h3 className="font-black text-lg truncate">{t.subject}</h3>
                                <p className="text-sm text-zinc-500 font-medium">Opened {formatDate(t.created_at)} · #TKT-{t.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <span className={`px-3 py-1 text-xs font-black uppercase border border-black ${STATUS_STYLES[t.status]}`}>
                                {t.status.replace("_", " ")}
                            </span>
                            <ChevronRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
