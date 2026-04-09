import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { Ticket } from "@/types";
import { Loader2, Filter, ChevronRight, MessageSquare, Shield, User as UserIcon, Search } from "lucide-react";

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
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest font-bold border ${styles}`}>
            <span className={`w-1 h-1 rounded-full ${status === "OPEN" ? "bg-rose-500" : status === "RESOLVED" ? "bg-[#34d399]" : "bg-blue-500"}`} />
            {status.replace("_", " ")}
        </span>
    );
};

export default function Tickets() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [priorityFilter, setPriorityFilter] = useState("ALL");
    const navigate = useNavigate();

    const fetchTickets = () => {
        setLoading(true);
        let url = `/admin/tickets/all?skip=0&limit=100`;
        const params = new URLSearchParams();
        if (statusFilter !== "ALL") params.append("status_filter", statusFilter);
        if (priorityFilter !== "ALL") params.append("priority_filter", priorityFilter);
        if (params.toString()) url += `&${params.toString()}`;
        
        api<Ticket[]>(url)
            .then(setTickets)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { 
        fetchTickets(); 
    }, [statusFilter, priorityFilter]);

    const totalActive = tickets.filter(t => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length;
    const criticalIssues = tickets.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length;

    return (
        <div className="flex flex-col h-full font-['Inter'] bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] px-2">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
                <div>
                    <nav className="flex items-center gap-2 text-[10px] font-bold text-blue-600 dark:text-[#adc6ff] mb-2 tracking-widest uppercase">
                        <span>Support</span>
                        <span>/</span>
                        <span className="text-slate-600 dark:text-[#c3c5d8]/60">Ticketing System</span>
                    </nav>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-[#dae2fd] m-0">Customer Support Inquiries</h1>
                    <p className="text-xs text-slate-600 dark:text-[#c3c5d8] mt-1 m-0">Managing {tickets.length} support nodes in the current shard</p>
                </div>
                <div className="flex gap-3">
                    <div className="p-4 rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/20 shadow-sm flex items-center gap-4">
                        <div className="text-right border-r border-slate-100 dark:border-[#434655]/10 pr-4">
                            <p className="text-[9px] uppercase font-bold text-slate-500 dark:text-[#c3c5d8] mb-0.5 tracking-tighter">Active Queue</p>
                            <p className="text-xl font-black text-slate-900 dark:text-[#dae2fd] tabular-nums">{totalActive}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] uppercase font-bold text-rose-500 mb-0.5 tracking-tighter">Critical Nodes</p>
                            <p className="text-xl font-black text-rose-500 tabular-nums">{criticalIssues}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-4 mb-6 p-1.5 bg-slate-100 dark:bg-[#0b1326]/50 rounded-xl border border-slate-200 dark:border-[#434655]/10">
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-9 px-4 border border-slate-200 dark:border-[#434655]/30 rounded-lg text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-[#c3c5d8] bg-white dark:bg-[#131b2e] cursor-pointer outline-none focus:border-blue-400 dark:border-[#adc6ff]/50 transition-colors shadow-sm"
                >
                    <option value="ALL">Status: All Nodes</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                </select>

                <select 
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="h-9 px-4 border border-slate-200 dark:border-[#434655]/30 rounded-lg text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-[#c3c5d8] bg-white dark:bg-[#131b2e] cursor-pointer outline-none focus:border-blue-400 dark:border-[#adc6ff]/50 transition-colors shadow-sm"
                >
                    <option value="ALL">Priority: All Tiers</option>
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                </select>

                <div className="ml-auto pr-4 hidden md:block">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-[#c3c5d8]/50 uppercase tracking-widest">
                        Node Population: <span className="text-blue-600 dark:text-[#adc6ff]">{tickets.length}</span>
                    </p>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 flex-1 overflow-hidden flex flex-col shadow-sm">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-[#0b1326]/50 text-slate-500 dark:text-[#c3c5d8] uppercase text-[10px] tracking-[0.2em] font-black border-b border-slate-200 dark:border-[#434655]/20">
                                <th className="px-6 py-4">Ticket Protocol</th>
                                <th className="px-6 py-4">Identity Matrix</th>
                                <th className="px-6 py-4">Status / Priority</th>
                                <th className="px-6 py-4">Subject</th>
                                <th className="px-6 py-4 text-right">Age</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#434655]/10">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <Loader2 size={18} className="animate-spin mx-auto text-blue-600 dark:text-[#adc6ff] mb-2" />
                                        <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">Syncing nodes…</p>
                                    </td>
                                </tr>
                            ) : tickets.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <MessageSquare size={32} className="mx-auto mb-3 opacity-10 text-slate-400" />
                                        <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">No support nodes indexed</p>
                                    </td>
                                </tr>
                            ) : tickets.map((ticket) => (
                                <tr 
                                    key={ticket.id} 
                                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                                    className="hover:bg-slate-50 dark:hover:bg-[#171f33]/80 transition-colors group cursor-pointer"
                                >
                                    <td className="px-6 py-5">
                                        <div className="font-mono text-[11px] text-blue-600 dark:text-[#adc6ff] font-black tracking-widest">
                                            {ticket.display_id || `#TKT-${ticket.id.toString().slice(0, 8)}`}
                                        </div>
                                        <div className="text-[9px] text-slate-400 font-medium mt-0.5">Vector ID: {ticket.id.toString().slice(0, 12)}...</div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/30 flex items-center justify-center font-black text-sm text-slate-600 dark:text-[#dae2fd] overflow-hidden group-hover:border-blue-400 dark:group-hover:border-[#adc6ff]/50 transition-colors">
                                                {ticket.user?.profile_picture ? (
                                                    <img src={ticket.user.profile_picture} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    (ticket.user?.name || ticket.user?.email || 'U')[0].toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 dark:text-[#dae2fd] group-hover:text-blue-600 dark:group-hover:text-[#adc6ff] transition-colors">
                                                    {ticket.user?.name || 'Anonymous Node'}
                                                </p>
                                                <p className="text-[10px] font-mono text-slate-500 dark:text-[#c3c5d8]/60 mt-0.5">
                                                    {ticket.user?.email}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex text-left"><StatusBadge status={ticket.status} /></div>
                                            <div className="flex text-left"><PriorityBadge priority={ticket.priority} /></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-xs font-bold text-slate-900 dark:text-[#dae2fd] max-w-xs truncate leading-relaxed">
                                            {ticket.subject || 'Support Inquiry'}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-[#434655]/50" />
                                            <span className="text-[9px] text-slate-500 dark:text-[#c3c5d8]/40 font-bold uppercase tracking-widest">Global Queue</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <span className="text-[10px] font-black text-slate-500 dark:text-[#8d90a1] uppercase tracking-wider">
                                            {new Date(ticket.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit" })}
                                        </span>
                                        <div className="text-[9px] text-slate-400 font-medium mt-0.5">{new Date(ticket.created_at).getFullYear()}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-[#0b1326]/50 flex justify-between items-center border-t border-slate-200 dark:border-[#434655]/20">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-[#c3c5d8]/40 uppercase tracking-[0.2em]">Listing active support nodes</p>
                    <div className="flex items-center gap-3">
                        <button className="text-[10px] font-black text-slate-400 dark:text-[#c3c5d8]/30 uppercase tracking-widest hover:text-blue-600 dark:hover:text-[#adc6ff] transition-colors disabled:opacity-30" disabled>Previous</button>
                        <div className="w-px h-3 bg-slate-200 dark:bg-[#434655]/20" />
                        <button className="text-[10px] font-black text-slate-400 dark:text-[#c3c5d8]/30 uppercase tracking-widest hover:text-blue-600 dark:hover:text-[#adc6ff] transition-colors">Next Matrix</button>
                    </div>
                </div>
            </div>
        </div>
    );
}