import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import type { Ticket, TicketMessage } from "@/types";
import { Loader2, ArrowLeft, Send, MessageCircle, Clock, Calendar, User, Mail, Shield, CheckCircle2, Search } from "lucide-react";

const PriorityBadge = ({ priority }: { priority: string }) => {
    let styles = "text-slate-600 dark:text-[#c3c5d8] bg-slate-100 dark:bg-[#0b1326]/50 border-slate-200 dark:border-[#434655]/20";
    if (priority === "HIGH") styles = "text-[#ffb4ab] bg-[#ffb4ab]/10 border-[#ffb4ab]/20";
    if (priority === "URGENT") styles = "text-rose-500 bg-rose-500/10 border-rose-500/20";
    if (priority === "MEDIUM") styles = "text-blue-600 dark:text-[#adc6ff] bg-[#1f70e3]/10 border-[#1f70e3]/20";

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[9px] uppercase tracking-widest font-bold border ${styles}`}>
            {priority}
        </span>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    let styles = "text-slate-600 dark:text-[#c3c5d8] bg-slate-100 dark:bg-[#0b1326]/50 border-slate-200 dark:border-[#434655]/20";
    if (status === "OPEN") styles = "text-rose-500 bg-rose-500/10 border-rose-500/20";
    if (status === "IN_PROGRESS") styles = "text-blue-600 dark:text-[#adc6ff] bg-[#1f70e3]/10 border-[#1f70e3]/20";
    if (status === "RESOLVED" || status === "CLOSED") styles = "text-[#34d399] bg-[#34d399]/10 border-[#34d399]/20";

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border ${styles}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === "OPEN" ? "bg-rose-500" : status === "RESOLVED" ? "bg-[#34d399]" : "bg-blue-500"}`} />
            {status.replace("_", " ")}
        </span>
    );
};

export default function TicketDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
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
        } catch (e) { console.error(e); }
    };

    if (loading) {
        return (
            <div className="flex flex-col h-full items-center justify-center min-h-[500px] text-slate-500">
                <Loader2 size={32} className="animate-spin text-blue-600 dark:text-[#adc6ff] mb-4" />
                <p className="text-[10px] uppercase font-black tracking-widest">Opening Archive...</p>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                <h2 className="text-xl font-bold mb-2">Protocol Error: Ticket Not Found</h2>
                <button onClick={() => navigate("/tickets")} className="text-blue-600 dark:text-[#adc6ff] hover:underline uppercase text-[10px] font-black tracking-widest mt-4">Return to Registry</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen font-['Inter'] bg-slate-50 dark:bg-[#060e20] text-slate-900 dark:text-[#dae2fd] px-2 md:px-4">
            
            {/* Header / Breadcrumb */}
            <div className="flex items-center justify-between mb-8 mt-4">
                <div>
                    <nav className="flex items-center gap-2 text-[10px] font-bold text-blue-600 dark:text-[#adc6ff] mb-2 tracking-widest uppercase cursor-pointer transition-opacity hover:opacity-70" onClick={() => navigate("/tickets")}>
                        <ArrowLeft size={10} />
                        <span>Support Directory</span>
                        <span>/</span>
                        <span className="text-slate-600 dark:text-[#c3c5d8]/60">Ticket Detail</span>
                    </nav>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-[#dae2fd] m-0">
                            {ticket.display_id || `#TKT-${ticket.id}`}
                        </h1>
                        <StatusBadge status={ticket.status} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 pb-20">
                {/* Main Content: Messages */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    
                    {/* Ticket Context Card */}
                    <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 p-6 shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                            <h2 className="text-lg font-black text-slate-900 dark:text-[#dae2fd] leading-tight">{ticket.subject}</h2>
                            <PriorityBadge priority={ticket.priority} />
                        </div>
                        <p className="text-sm text-slate-600 dark:text-[#c3c5d8] leading-relaxed">
                            {ticket.description}
                        </p>
                    </div>

                    {/* Chat Area */}
                    <div className="space-y-6">
                        {msgs.map((msg, i) => {
                            const isAdmin = msg.sender?.admin || msg.is_admin;
                            const displayName = isAdmin ? 'System Admin' : (msg.sender?.name || ticket.user?.name || 'Customer');
                            const displayInitial = (displayName || 'U')[0].toUpperCase();
                            const profilePic = isAdmin ? null : (msg.sender?.profile_picture || ticket.user?.profile_picture);

                            return (
                                <div key={i} className={`flex gap-3 max-w-[90%] md:max-w-[85%] ${isAdmin ? 'ml-auto flex-row-reverse' : ''}`}>
                                    <div className={`w-9 h-9 rounded-xl border border-slate-200 dark:border-[#434655]/30 shrink-0 flex items-center justify-center text-xs font-black shadow-sm overflow-hidden ${
                                        isAdmin ? 'bg-blue-600 text-white border-blue-500' : 'bg-white dark:bg-[#131b2e] text-slate-600 dark:text-[#adc6ff]'
                                    }`}>
                                        {profilePic ? (
                                            <img src={profilePic} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            displayInitial
                                        )}
                                    </div>
                                    <div className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} min-w-0`}>
                                        <div className="flex items-center gap-2 mb-1 px-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-[#c3c5d8]/50">
                                                {displayName}
                                            </span>
                                            <span className="text-[9px] font-mono text-slate-400 dark:text-[#434655]">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className={`p-4 text-xs leading-relaxed whitespace-pre-wrap rounded-2xl shadow-sm border ${
                                            isAdmin 
                                                ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' 
                                                : 'bg-white dark:bg-[#131b2e] border-slate-200 dark:border-[#434655]/40 text-slate-700 dark:text-[#dae2fd] rounded-tl-none'
                                        }`}>
                                            {msg.message}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Reply Input */}
                    <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/30 p-4 shadow-sm">
                        <textarea 
                            value={reply}
                            onChange={e => setReply(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-[#0b1326] border-none text-xs text-slate-900 dark:text-[#dae2fd] placeholder:text-slate-400 p-3 rounded-xl resize-none focus:ring-1 focus:ring-blue-400 transition-all outline-none"
                            placeholder="Synthesizing response node..."
                            rows={3}
                        />
                        <div className="flex justify-between items-center mt-3 px-1">
                            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Protocol: Direct Transmission</span>
                            <button 
                                onClick={sendReply}
                                disabled={sending || !reply.trim()}
                                className="h-9 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
                            >
                                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                Broadcast Reply
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar: User & System Meta */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    
                    {/* Customer Identity Card */}
                    <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 overflow-hidden shadow-sm">
                        <div className="h-2 bg-blue-600" />
                        <div className="p-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Identity Profile</h3>
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-[#434655]/10">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 flex items-center justify-center text-2xl font-black text-slate-600 dark:text-[#adc6ff] overflow-hidden">
                                    {ticket.user?.profile_picture ? (
                                        <img src={ticket.user.profile_picture} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        (ticket.user?.name || 'U')[0].toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <p className="text-base font-black text-slate-900 dark:text-[#dae2fd] mb-1">{ticket.user?.name || 'Anonymous'}</p>
                                <div className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded inline-block">
                                        <p className="text-[9px] font-mono font-bold text-blue-600 dark:text-[#adc6ff] uppercase tracking-tighter cursor-copy" title="Copy UUID">
                                            {ticket.user?.id ? ticket.user.id.toString().slice(0, 18) : 'ANON-NODE'}…
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-slate-600 dark:text-[#c3c5d8]">
                                    <Mail size={14} className="text-slate-400" />
                                    <span className="text-xs font-medium truncate">{ticket.user?.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 dark:text-[#c3c5d8]">
                                    <Calendar size={14} className="text-slate-400" />
                                    <span className="text-xs font-medium">Joined {ticket.user?.created_at ? new Date(ticket.user.created_at).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>

                            <Link to={`/users/${ticket.user?.id}`} className="mt-8 w-full py-2.5 bg-slate-100 dark:bg-[#0b1326] hover:bg-slate-200 dark:hover:bg-[#1c2a4d] text-slate-600 dark:text-[#adc6ff] border border-slate-200 dark:border-[#434655]/30 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                                <Search size={12} />
                                Full Identity Access
                            </Link>
                        </div>
                    </div>

                    {/* System Controls */}
                    <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 p-6 shadow-sm">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Transition Matrix</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 dark:text-[#c3c5d8] uppercase tracking-widest pl-1">Target Status</label>
                                <select 
                                    value={ticket.status}
                                    onChange={(e) => updateStatus(e.target.value)}
                                    className="w-full h-10 px-4 border border-slate-200 dark:border-[#434655]/30 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-[#c3c5d8] bg-slate-50 dark:bg-[#0b1326] cursor-pointer outline-none focus:border-blue-400 dark:border-[#adc6ff]/50 transition-colors shadow-sm"
                                >
                                    <option value="OPEN">Open Account</option>
                                    <option value="IN_PROGRESS">Active Resolution</option>
                                    <option value="RESOLVED">Condition Resolved</option>
                                    <option value="CLOSED">Archive Node</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Tracker */}
                    <div className="bg-slate-100 dark:bg-[#0b1326]/50 rounded-2xl border border-slate-200 dark:border-[#434655]/10 p-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Sync Timeline</h3>
                        <div className="space-y-6">
                            <div className="flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1" />
                                <div className="flex-1">
                                    <p className="text-[11px] font-bold text-slate-900 dark:text-[#dae2fd]">Current Operation</p>
                                    <p className="text-[9px] text-slate-500 dark:text-[#c3c5d8]/40 uppercase tracking-tighter">Ready for transmission</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-[#434655]/30 mt-1" />
                                <div className="flex-1">
                                    <p className="text-[11px] font-bold text-slate-500 dark:text-[#c3c5d8]/60">Initial Request</p>
                                    <p className="text-[9px] text-slate-400 font-mono tracking-tighter">{new Date(ticket.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
