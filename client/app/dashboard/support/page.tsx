"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, MessageSquare, X, ChevronRight } from "lucide-react";
import { useAlert } from "@/components/CustomAlert";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

type Priority = "LOW" | "MEDIUM" | "HIGH";

interface Ticket {
    id: number;
    subject: string;
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
    priority: Priority;
    created_at: string;
    updated_at: string;
}

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

export default function SupportPage() {
    const router = useRouter();
    const { showAlert } = useAlert();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({ subject: "", message: "", priority: "MEDIUM" as Priority });

    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    useEffect(() => {
        if (!token) { router.replace("/auth/login"); return; }
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401) { localStorage.removeItem("access_token"); router.replace("/auth/login"); return; }
            if (res.ok) setTickets(await res.json());
        } catch (e) {
            showAlert("Failed to load tickets.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.subject.trim() || !form.message.trim()) {
            showAlert("Subject and message are required.", "error");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tickets/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                const t = await res.json();
                setTickets((prev) => [t, ...prev]);
                setForm({ subject: "", message: "", priority: "MEDIUM" });
                setShowForm(false);
                showAlert("Support ticket created!", "success");
            } else {
                const err = await res.json();
                showAlert(err.detail || "Failed to create ticket.", "error");
            }
        } catch (e) {
            showAlert("Network error. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
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
                        <Input
                            value={form.subject}
                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                            placeholder="Brief description of your issue..."
                            className="border-2 border-black rounded-none h-12 focus:ring-0 focus:border-black"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="font-black uppercase tracking-tight">Priority</Label>
                        <div className="flex gap-3">
                            {(["LOW", "MEDIUM", "HIGH"] as Priority[]).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setForm({ ...form, priority: p })}
                                    className={`px-4 py-2 border-2 border-black font-black uppercase text-sm transition-all ${form.priority === p ? `${PRIORITY_STYLES[p]} shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]` : "bg-white hover:bg-zinc-100"}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="font-black uppercase tracking-tight">Message</Label>
                        <Textarea
                            value={form.message}
                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                            placeholder="Describe your issue in detail..."
                            className="min-h-[140px] border-2 border-black rounded-none focus:ring-0 focus:border-black"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-14 bg-[#4be794] hover:bg-[#3cd083] text-black font-black uppercase text-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all rounded-none"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : "Submit Ticket"}
                    </Button>
                </form>
            )}

            {/* Tickets List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="border-2 border-black p-6 animate-pulse bg-zinc-100 h-28" />
                    ))}
                </div>
            ) : tickets.length === 0 ? (
                <div className="border-2 border-dashed border-black p-16 text-center bg-zinc-50">
                    <MessageSquare className="w-12 h-12 mx-auto text-zinc-400 mb-4" />
                    <h3 className="text-xl font-bold uppercase">No tickets yet</h3>
                    <p className="text-zinc-500 mb-6">Have a question or issue? Open a support ticket above.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {tickets.map((ticket) => (
                        <Link key={ticket.id} href={`/dashboard/support/${ticket.id}`}>
                            <div className="border-2 border-black bg-white p-6 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-px hover:-translate-y-px transition-all flex items-center justify-between gap-4 group">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className={`h-12 w-2 shrink-0 ${PRIORITY_STYLES[ticket.priority]}`} />
                                    <div className="min-w-0">
                                        <h3 className="font-black text-lg truncate">{ticket.subject}</h3>
                                        <p className="text-sm text-zinc-500 font-medium">Opened {formatDate(ticket.created_at)} · #TKT-{ticket.id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`px-3 py-1 text-xs font-black uppercase border border-black ${STATUS_STYLES[ticket.status]}`}>
                                        {ticket.status.replace("_", " ")}
                                    </span>
                                    <ChevronRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
