import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Ticket, TicketMessage } from "@/types";
import { Send, Search, Loader2, ChevronDown, MoreHorizontal, CheckCircle, Ticket as TicketIcon, Clock, AlertCircle } from "lucide-react";

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
    LOW: { color: '#34d399', bg: '#34d399/10', border: '#34d399/20' },
    MEDIUM: { color: '#adc6ff', bg: '#1f70e3/10', border: '#1f70e3/20' },
    HIGH: { color: '#fcd34d', bg: '#f59e0b/10', border: '#f59e0b/20' },
    URGENT: { color: '#ffb4ab', bg: '#ffb4ab/10', border: '#ffb4ab/20' },
};

const PriorityBadge = ({ priority }: { priority: string }) => {
    const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.LOW;
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border"
            style={{ color: cfg.color, backgroundColor: `rgba(${cfg.bg})`, borderColor: `rgba(${cfg.border})` }}
        >
            {priority}
        </span>
    );
};

export default function Tickets() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [priorityFilter, setPriorityFilter] = useState("ALL");
    const [selected, setSelected] = useState<Ticket | null>(null);
    const [msgs, setMsgs] = useState<TicketMessage[]>([]);
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);
    const [search, setSearch] = useState("");

    const fetchTickets = () => {
        setLoading(true);
        let url = `/admin/tickets/all?skip=0&limit=100`;
        const params = new URLSearchParams();
        if (statusFilter !== "ALL") params.append("status_filter", statusFilter);
        if (priorityFilter !== "ALL") params.append("priority_filter", priorityFilter);
        if (params.toString()) url += `&${params.toString()}`;
        api<Ticket[]>(url).then(setTickets).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { fetchTickets(); }, [statusFilter, priorityFilter]);

    const selectTicket = async (t: Ticket) => {
        setSelected(t);
        try {
            const data = await api<Ticket>(`/tickets/${t.id}`);
            setMsgs(data.messages || []);
        } catch (e) { console.error(e); }
    };

    const sendReply = async () => {
        if (!selected || !reply.trim()) return;
        setSending(true);
        try {
            await api(`/tickets/${selected.id}/messages`, {
                method: "POST", body: JSON.stringify({ message: reply }),
            });
            setReply("");
            const data = await api<Ticket>(`/tickets/${selected.id}`);
            setMsgs(data.messages || []);
        } catch (e) { console.error(e); } finally { setSending(false); }
    };

    const markResolved = async () => {
        if (!selected) return;
        try {
            await api(`/admin/tickets/${selected.id}/status`, {
                method: "PATCH", body: JSON.stringify({ status: "RESOLVED" }),
            });
            fetchTickets();
            setSelected(prev => prev ? { ...prev, status: "RESOLVED" } : null);
        } catch (e) { console.error(e); }
    };

    const filtered = tickets.filter(t =>
        !search || t.subject?.toLowerCase().includes(search.toLowerCase()) ||
        (t as any).user_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full font-['Inter'] bg-[#0b1326] text-[#dae2fd] px-2 pb-12 animate-fade-in">

            {/* Top bar */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                    <nav className="flex items-center gap-2 text-[10px] font-bold text-[#adc6ff] mb-2 tracking-widest uppercase">
                        <span>Management</span>
                        <span>/</span>
                        <span className="text-[#c3c5d8]/60">Support Desk</span>
                    </nav>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#dae2fd] m-0">
                        Resolution Center
                    </h1>
                    <p className="text-xs text-[#c3c5d8] mt-1 m-0">{tickets.length} total threads active</p>
                </div>
                <div className="flex flex-wrap gap-3 items-center shrink-0">
                    <select
                        value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        className="h-10 px-3 border border-[#434655]/40 rounded-lg text-xs font-bold text-[#dae2fd] bg-[#131b2e] focus:border-[#adc6ff] outline-none transition-colors appearance-none min-w-[140px]"
                    >
                        {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(s => (
                            <option key={s} value={s}>{s === 'ALL' ? 'State: Any' : s.replace('_', ' ')}</option>
                        ))}
                    </select>
                    <select
                        value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
                        className="h-10 px-3 border border-[#434655]/40 rounded-lg text-xs font-bold text-[#dae2fd] bg-[#131b2e] focus:border-[#adc6ff] outline-none transition-colors appearance-none min-w-[140px]"
                    >
                        {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => (
                            <option key={p} value={p}>{p === 'ALL' ? 'Level: Any' : p}</option>
                        ))}
                    </select>
                    <button className="h-10 px-6 bg-[#adc6ff] hover:bg-white text-[#001a42] border-none rounded-lg text-[10px] uppercase tracking-widest font-extrabold transition-all shadow-[0_4px_12px_rgba(173,198,255,0.2)] ml-auto sm:ml-0">
                        Initialize Thread
                    </button>
                </div>
            </div>

            {/* Split view */}
            <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-[600px] h-[calc(100vh-200px)]">

                {/* Left: Ticket list */}
                <div className="w-full md:w-[350px] shrink-0 bg-[#131b2e] rounded-2xl border border-[#434655]/20 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-[#434655]/20 bg-[#060e20]/50">
                        <div className="flex items-center gap-2 mb-4">
                            <TicketIcon size={16} className="text-[#adc6ff]" />
                            <h2 className="text-[11px] font-extrabold text-[#dae2fd] uppercase tracking-widest m-0">Active Threads</h2>
                        </div>
                        {/* Search */}
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#434655]" />
                            <input
                                type="text" placeholder="Query thread vector..."
                                value={search} onChange={e => setSearch(e.target.value)}
                                className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#434655]/40 text-xs font-mono text-[#adc6ff] bg-[#0b1326] outline-none focus:border-[#adc6ff] transition-colors placeholder:text-[#434655]"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="p-12 flex flex-col items-center justify-center text-[#c3c5d8] gap-3">
                                <Loader2 size={24} className="animate-spin text-[#adc6ff]" />
                                <p className="text-[10px] font-bold uppercase tracking-widest m-0">Fetching Data...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="p-12 flex flex-col items-center justify-center text-[#434655]">
                                <AlertCircle size={32} className="mb-3 opacity-50" />
                                <p className="text-[10px] font-bold uppercase tracking-widest m-0">Zero Threads Found</p>
                            </div>
                        ) : filtered.map(ticket => (
                            <div key={ticket.id}
                                onClick={() => selectTicket(ticket)}
                                className={`p-4 border-b border-[#434655]/10 cursor-pointer transition-all ${
                                    selected?.id === ticket.id 
                                        ? 'bg-[#1f70e3]/10 border-l-2 border-l-[#1f70e3]' 
                                        : 'bg-transparent border-l-2 border-l-transparent hover:bg-[#171f33]/80'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-mono tracking-widest text-[#adc6ff]">#{ticket.id}</span>
                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${ticket.status === 'RESOLVED' ? 'text-[#34d399]' : 'text-[#8d90a1]'}`}>
                                        {ticket.status}
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-[#dae2fd] m-0 mb-1 leading-snug line-clamp-2">
                                    {ticket.subject || 'Support Request'}
                                </p>
                                <div className="flex items-center justify-between mt-3">
                                    <p className="text-[11px] text-[#c3c5d8] m-0 font-medium">
                                        {(ticket as any).user_name || 'Customer Identity Name'}
                                    </p>
                                    <PriorityBadge priority={ticket.priority || 'LOW'} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Chat thread */}
                {selected ? (
                    <div className="flex-1 bg-[#131b2e] rounded-2xl border border-[#434655]/20 shadow-sm flex flex-col overflow-hidden relative">
                        {/* Chat header */}
                        <div className="p-5 border-b border-[#434655]/20 bg-[#060e20]/50 flex items-center justify-between shrink-0">
                            <div>
                                <h2 className="text-lg font-extrabold text-[#dae2fd] m-0">
                                    {selected.subject || 'Support Request'}
                                </h2>
                                <p className="text-xs text-[#8d90a1] font-mono mt-1 m-0 flex items-center gap-2">
                                    <span className="text-[#adc6ff]">#{selected.id}</span>
                                    <span className="text-[#434655]">•</span>
                                    {(selected as any).user_name || 'Customer'}
                                    <span className="text-[#434655]">•</span>
                                    Init: {new Date(selected.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                            <div className="flex gap-3 items-center">
                                {selected.status !== 'RESOLVED' && (
                                    <button
                                        onClick={markResolved}
                                        className="h-9 px-4 bg-[#34d399]/10 text-[#34d399] border hover:border-[#34d399] border-[#34d399]/30 rounded-lg text-[10px] font-bold uppercase tracking-widest cursor-pointer flex items-center gap-2 transition-all hover:bg-[#34d399]/20"
                                    >
                                        <CheckCircle size={14} /> Mark Sealed
                                    </button>
                                )}
                                {selected.status === 'RESOLVED' && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#34d399]/10 text-[#34d399] border border-[#34d399]/20 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                                        <CheckCircle size={14} /> Sealed
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-6 bg-[#0b1326]">
                            {/* First message (customer request) */}
                            {selected.description && (
                                <div className="p-5 bg-[#171f33] rounded-2xl border border-[#434655]/30">
                                    <div className="flex items-center gap-2 mb-3">
                                        <p className="text-[10px] font-bold text-[#fcd34d] uppercase tracking-[0.2em] m-0">
                                            Incident Vector
                                        </p>
                                    </div>
                                    <p className="text-sm text-[#dae2fd] leading-relaxed m-0 font-medium">
                                        {selected.description}
                                    </p>
                                    {(selected as any).order_id && (
                                        <div className="mt-4 flex gap-2">
                                            <span className="text-[10px] font-mono tracking-widest bg-[#0b1326] px-2 py-1 rounded border border-[#434655]/40 text-[#adc6ff]">
                                                REF_PO_{(selected as any).order_id}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Thread messages */}
                            {msgs.map((msg, i) => {
                                const isAdmin = (msg as any).sender_type === 'admin' || (msg as any).is_admin;
                                return (
                                    <div key={i} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] p-4 rounded-2xl ${
                                            isAdmin 
                                                ? 'bg-[#1f70e3] text-white rounded-tr-sm' 
                                                : 'bg-[#171f33] border border-[#434655]/30 text-[#dae2fd] rounded-tl-sm'
                                        }`}>
                                            <p className="text-[13px] leading-relaxed m-0 font-medium whitespace-pre-wrap">{msg.message}</p>
                                            <p className={`text-[9px] font-mono tracking-wider mt-2 m-0 ${isAdmin ? 'text-white/60' : 'text-[#8d90a1]'}`}>
                                                {isAdmin ? 'SYS_ADMIN' : 'USER_NODE'} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}

                            {msgs.length === 0 && !selected.description && (
                                <div className="flex flex-col items-center justify-center p-12 text-[#434655]">
                                    <p className="text-[10px] font-bold uppercase tracking-widest">No data fragments</p>
                                </div>
                            )}
                        </div>

                        {/* Reply input */}
                        <div className="p-5 border-t border-[#434655]/20 bg-[#060e20]/50 flex gap-3 items-end shrink-0">
                            <textarea
                                placeholder={`Compile response payload for ${(selected as any).user_name || 'node'}...`}
                                value={reply}
                                onChange={e => setReply(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendReply();
                                    }
                                }}
                                className="flex-1 min-h-[48px] max-h-[120px] p-3 rounded-xl border border-[#434655]/40 text-[13px] text-[#dae2fd] bg-[#0b1326] outline-none focus:border-[#adc6ff] transition-colors resize-y custom-scrollbar placeholder:text-[#434655]"
                            />
                            <button
                                onClick={sendReply}
                                disabled={sending || !reply.trim()}
                                className={`w-12 h-12 rounded-xl border-none flex items-center justify-center transition-all ${
                                    reply.trim() 
                                        ? 'bg-[#adc6ff] hover:bg-white text-[#001a42] cursor-pointer shadow-[0_4px_12px_rgba(173,198,255,0.2)]' 
                                        : 'bg-[#131b2e] border border-[#434655]/40 text-[#434655] cursor-default'
                                }`}
                            >
                                {sending
                                    ? <Loader2 size={18} className="animate-spin text-[#001a42]" />
                                    : <Send size={18} className={reply.trim() ? "translate-x-0.5" : ""} />
                                }
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 bg-[#131b2e] rounded-2xl border border-[#434655]/20 shadow-sm flex flex-col items-center justify-center text-[#434655] gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#0b1326] border border-[#434655]/20 flex items-center justify-center">
                            <TicketIcon size={24} className="text-[#434655]" />
                        </div>
                        <div className="text-center">
                            <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#8d90a1] m-0 mb-1.5">No Thread Selected</p>
                            <p className="text-[10px] font-medium text-[#434655] m-0">Select a vector from the queue to process data</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}