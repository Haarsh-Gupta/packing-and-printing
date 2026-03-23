import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import type { Ticket, TicketMessage } from "@/types";
import { Loader2, ArrowLeft, Send, CheckCircle } from "lucide-react";

export default function TicketDetail() {
    const { id } = useParams<{ id: string }>();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [msgs, setMsgs] = useState<TicketMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        api<Ticket>(`/tickets/${id}`)
            .then(data => {
                setTicket(data);
                setMsgs(data.messages || []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const sendReply = async () => {
        if (!ticket || !reply.trim()) return;
        setSending(true);
        try {
            await api(`/tickets/${ticket.id}/messages`, {
                method: "POST", body: JSON.stringify({ message: reply }),
            });
            setReply("");
            const data = await api<Ticket>(`/tickets/${ticket.id}`);
            setTicket(data);
            setMsgs(data.messages || []);
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    const updateStatus = async (newStatus: string) => {
        if (!ticket) return;
        try {
            await api(`/admin/tickets/${ticket.id}/status`, {
                method: "PATCH", body: JSON.stringify({ status: newStatus }),
            });
            setTicket({ ...ticket, status: newStatus });
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center min-h-[500px]">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-[#434655]">
                <h2 className="text-xl font-bold mb-2">Ticket Not Found</h2>
                <Link to="/tickets" className="text-primary hover:underline">Return to Tickets</Link>
            </div>
        );
    }

    return (
        <div className="font-['Inter'] pb-12 w-full mx-auto max-w-7xl relative min-h-screen">
            <Link to="/tickets" className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors mb-6 font-medium">
                <ArrowLeft size={16} /> Back to Tickets
            </Link>

            <div className="grid grid-cols-12 gap-8 animate-fade-in">
                {/* Left Col: Ticket Details & Thread */}
                <div className="col-span-12 lg:col-span-8 space-y-8">
                    {/* Ticket Summary Block */}
                    <section className="bg-white dark:bg-[#131b2e] rounded-xl p-8 border border-slate-200 dark:border-transparent shadow-sm transition-colors">
                        <div className="flex justify-between items-start mb-6">
                            <div className="space-y-2">
                                <span className="text-xs font-bold tracking-widest text-primary uppercase">TICKET #{ticket.id}</span>
                                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-[#dae2fd] leading-tight">
                                    {ticket.subject}
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full bg-error/10 text-error text-[10px] font-bold border border-error/20">
                                    {ticket.priority}
                                </span>
                                <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold border border-secondary/20">
                                    {ticket.status}
                                </span>
                            </div>
                        </div>

                        <p className="text-slate-600 dark:text-[#c3c5d8] leading-relaxed mb-8">
                            {ticket.description}
                        </p>

                        <div className="flex flex-wrap gap-4 border-t border-slate-200 dark:border-[#434655]/30 pt-8">
                            <div className="bg-slate-50 dark:bg-[#060e20] p-4 rounded-lg flex-1 min-w-[140px] border border-slate-100 dark:border-transparent">
                                <p className="text-[10px] text-slate-500 dark:text-[#c3c5d8]/60 font-bold uppercase mb-1">Requester</p>
                                <span className="text-sm font-medium text-slate-800 dark:text-[#dae2fd]">
                                    {(ticket as any).user_name || 'Customer'}
                                </span>
                            </div>
                            <div className="bg-slate-50 dark:bg-[#060e20] p-4 rounded-lg flex-1 min-w-[140px] border border-slate-100 dark:border-transparent">
                                <p className="text-[10px] text-slate-500 dark:text-[#c3c5d8]/60 font-bold uppercase mb-1">Created At</p>
                                <span className="text-sm font-medium text-slate-800 dark:text-[#dae2fd]">
                                    {new Date(ticket.created_at).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Communication Thread */}
                    <section className="space-y-6">
                        <h3 className="text-lg font-bold tracking-tight px-2 flex items-center gap-2 text-slate-900 dark:text-[#dae2fd]">
                            Communication Thread
                        </h3>

                        <div className="space-y-6 mt-4">
                            {msgs.map((msg, i) => {
                                const isAdmin = msg.is_admin || (msg as any).sender_type === 'admin';
                                return (
                                    <div key={i} className={`flex gap-4 max-w-[90%] ${isAdmin ? 'ml-auto flex-row-reverse' : ''}`}>
                                        <div className={`w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-bold ${
                                            isAdmin ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-[#2d3449] text-slate-700 dark:text-[#dae2fd]'
                                        }`}>
                                            {isAdmin ? 'A' : 'U'}
                                        </div>
                                        <div className={`space-y-1 ${isAdmin ? 'text-right' : 'text-left'}`}>
                                            <div className={`flex items-center gap-3 ${isAdmin ? 'justify-end' : ''}`}>
                                                {!isAdmin && <span className="text-sm font-bold text-slate-800 dark:text-[#dae2fd]">{(ticket as any).user_name || 'Customer'}</span>}
                                                <span className="text-[10px] text-slate-500 dark:text-[#c3c5d8]/50">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {isAdmin && <span className="text-sm font-bold text-primary">Admin</span>}
                                            </div>
                                            <div className={`p-5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                                                isAdmin 
                                                    ? 'bg-primary text-white rounded-tl-2xl rounded-bl-2xl rounded-br-2xl' 
                                                    : 'bg-white dark:bg-[#171f33] border border-slate-200 dark:border-[#434655]/30 text-slate-700 dark:text-[#dae2fd] rounded-tr-2xl rounded-br-2xl rounded-bl-2xl'
                                            }`}>
                                                {msg.message}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Input Box */}
                        <div className="bg-white dark:bg-[#131b2e] p-6 rounded-xl border border-slate-200 dark:border-[#434655]/10 mt-8 shadow-sm transition-colors">
                            <div className="flex gap-4 items-end">
                                <div className="flex-1 bg-slate-50 dark:bg-[#060e20] rounded-xl p-2 border border-slate-200 dark:border-transparent">
                                    <textarea 
                                        className="w-full bg-transparent border-none text-sm focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-600 dark:text-[#c3c5d8]/30 resize-none outline-none dark:text-white" 
                                        placeholder="Write a response..." 
                                        rows={3}
                                        value={reply}
                                        onChange={e => setReply(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                sendReply();
                                            }
                                        }}
                                    />
                                    <div className="flex justify-end items-center pt-2 px-2">
                                        <button 
                                            onClick={sendReply}
                                            disabled={sending || !reply.trim()}
                                            className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} 
                                            Send Update
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Col: Controls & Timeline */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    {/* Ticket Management */}
                    <section className="bg-white dark:bg-[#171f33] rounded-xl overflow-hidden border border-slate-200 dark:border-transparent shadow-sm transition-colors">
                        <div className="p-6 border-b border-slate-200 dark:border-[#434655]/10">
                            <h4 className="text-sm font-bold tracking-tight text-slate-900 dark:text-[#dae2fd]">Ticket Controls</h4>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-[#c3c5d8] uppercase tracking-widest">Update Status</label>
                                <select 
                                    value={ticket.status}
                                    onChange={(e) => updateStatus(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-[#060e20] border border-slate-200 dark:border-[#434655]/20 rounded-lg py-2.5 px-4 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-slate-800 dark:text-[#dae2fd] transition-colors"
                                >
                                    <option value="OPEN">Open</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="RESOLVED">Resolved</option>
                                    <option value="CLOSED">Closed</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Timeline / Recent Activity (Mocked Structure) */}
                    <section className="bg-slate-50 dark:bg-[#060e20] rounded-xl p-6 border border-slate-200 dark:border-[#434655]/5 transition-colors">
                        <h4 className="text-xs font-bold tracking-tight mb-6 text-slate-800 dark:text-[#dae2fd]">Ticket Timeline</h4>
                        <ul className="space-y-4">
                            {msgs.slice().reverse().map((msg, idx) => (
                                <li key={idx} className="flex gap-4">
                                    <div className="relative">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-outline-variant mt-1.5"></div>
                                        {idx !== msgs.length - 1 && <div className="absolute top-4 left-[3px] w-[1px] h-full bg-slate-200 dark:bg-outline-variant/20"></div>}
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-700 dark:text-on-surface leading-snug">
                                            {msg.is_admin ? "Admin replied" : "Customer replied"}
                                        </p>
                                        <span className="text-[9px] text-slate-500 dark:text-on-surface-variant/40">
                                            {new Date(msg.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                </li>
                            ))}
                            <li className="flex gap-4 border-t border-slate-200 dark:border-[#434655]/10 pt-4">
                                <div className="relative">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                                </div>
                                <div>
                                    <p className="text-[11px] text-slate-700 dark:text-on-surface leading-snug">Ticket created</p>
                                    <span className="text-[9px] text-slate-500 dark:text-on-surface-variant/40">
                                        {new Date(ticket.created_at).toLocaleString()}
                                    </span>
                                </div>
                            </li>
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
}
