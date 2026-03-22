import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import type { Ticket } from "@/types";
import { Loader2, Filter, Plus, ChevronLeft, ChevronRight, Zap, Headset } from "lucide-react";

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

    // Derived statistics
    const totalActive = tickets.filter(t => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length;
    const criticalIssues = tickets.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH').length;

    const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');
    const resolvedRate = tickets.length > 0 ? ((resolvedTickets.length / tickets.length) * 100).toFixed(1) + '%' : '100%';

    let avgResolutionStr = "N/A";
    if (resolvedTickets.length > 0) {
        const totalResolveTime = resolvedTickets.reduce((acc, t) => {
            return acc + (new Date(t.updated_at).getTime() - new Date(t.created_at).getTime());
        }, 0);
        const avgMs = totalResolveTime / resolvedTickets.length;
        const avgHours = avgMs / (1000 * 60 * 60);
        avgResolutionStr = avgHours < 24 ? `${avgHours.toFixed(1)}h` : `${(avgHours / 24).toFixed(1)}d`;
    }

    const renderPriority = (priority: string) => {
        let colorClass = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
        if (priority === "MEDIUM") colorClass = "text-blue-500 bg-blue-500/10 border-blue-500/20";
        if (priority === "HIGH") colorClass = "text-amber-500 bg-amber-500/10 border-amber-500/20";
        if (priority === "URGENT") colorClass = "text-rose-500 bg-rose-500/10 border-rose-500/20";

        return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-widest ${colorClass}`}>
                {priority}
            </span>
        );
    };

    const renderStatus = (status: string) => {
        let dotColor = "bg-primary";
        let colorClass = "bg-primary/10 text-primary border-primary/20";
        
        if (status === "RESOLVED" || status === "CLOSED") {
            dotColor = "bg-emerald-500";
            colorClass = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
        } else if (status === "OPEN") {
            dotColor = "bg-rose-500";
            colorClass = "bg-rose-500/10 text-rose-500 border-rose-500/20";
        }

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${colorClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                {status.replace("_", " ")}
            </span>
        );
    };

    return (
        <div className="font-['Inter'] pb-12 animate-fade-in w-full max-w-[1400px] mx-auto min-h-screen">
            
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-[#dae2fd] mb-2">Support Tickets</h1>
                    <p className="text-slate-500 dark:text-[#c3c5d8] text-sm max-w-xl">Monitor and resolve incoming customer requests across all architectural modules.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-[#222a3d] border border-slate-200 dark:border-[#434655]/10 text-slate-800 dark:text-[#dae2fd] text-sm font-semibold hover:bg-slate-50 dark:hover:bg-[#31394d] transition-colors shadow-sm">
                        <Filter size={18} />
                        Filters
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform">
                        <Plus size={18} />
                        Create Ticket
                    </button>
                </div>
            </div>

            {/* Dashboard Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                <div className="p-6 rounded-xl bg-white dark:bg-[#131b2e] border-l-4 border-primary shadow-sm">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-[#c3c5d8] mb-1 font-bold">Total Active</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-[#dae2fd]">{totalActive}</h3>
                </div>
                <div className="p-6 rounded-xl bg-white dark:bg-[#131b2e] border-l-4 border-rose-500 shadow-sm">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-[#c3c5d8] mb-1 font-bold">Critical Issues</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-[#dae2fd]">{criticalIssues}</h3>
                </div>
                <div className="p-6 rounded-xl bg-white dark:bg-[#131b2e] border-l-4 border-amber-500 shadow-sm">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-[#c3c5d8] mb-1 font-bold">Avg Resolution</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-[#dae2fd]">{avgResolutionStr}</h3>
                </div>
                <div className="p-6 rounded-xl bg-white dark:bg-[#131b2e] border-l-4 border-emerald-500 shadow-sm">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-[#c3c5d8] mb-1 font-bold">Resolve Rate</p>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-[#dae2fd]">{resolvedRate}</h3>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-slate-50 dark:bg-[#060e20] rounded-xl border border-slate-200 dark:border-transparent">
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none bg-white dark:bg-[#171f33] border border-slate-200 dark:border-[#434655]/20 text-slate-700 dark:text-[#c3c5d8] text-xs py-2 px-4 pr-10 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-200 dark:hover:bg-[#222a3d] transition-colors font-medium shadow-sm"
                >
                    <option value="ALL">Status: All</option>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                </select>

                <select 
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="appearance-none bg-white dark:bg-[#171f33] border border-slate-200 dark:border-[#434655]/20 text-slate-700 dark:text-[#c3c5d8] text-xs py-2 px-4 pr-10 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-200 dark:hover:bg-[#222a3d] transition-colors font-medium shadow-sm"
                >
                    <option value="ALL">Priority: All</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                </select>

                <div className="ml-auto flex items-center gap-2 text-xs text-slate-500 dark:text-[#c3c5d8] font-medium">
                    <span>Showing {tickets.length} tickets</span>
                    <div className="flex gap-1 ml-4">
                        <button className="p-1 rounded bg-white dark:bg-[#222a3d] hover:bg-slate-100 dark:hover:bg-primary/20 transition-colors border border-slate-200 dark:border-transparent shadow-sm">
                            <ChevronLeft size={16} />
                        </button>
                        <button className="p-1 rounded bg-white dark:bg-[#222a3d] hover:bg-slate-100 dark:hover:bg-primary/20 transition-colors border border-slate-200 dark:border-transparent shadow-sm">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* High-Fidelity Table Container */}
            <div className="bg-white dark:bg-[#131b2e] rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-[#434655]/10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-[#060e20]/50 text-slate-600 dark:text-[#c3c5d8]">
                                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest border-b border-slate-200 dark:border-[#434655]/10">Ticket ID</th>
                                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest border-b border-slate-200 dark:border-[#434655]/10">User</th>
                                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest border-b border-slate-200 dark:border-[#434655]/10">Subject</th>
                                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest border-b border-slate-200 dark:border-[#434655]/10">Status</th>
                                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest border-b border-slate-200 dark:border-[#434655]/10">Priority</th>
                                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest border-b border-slate-200 dark:border-[#434655]/10 text-right">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#434655]/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <Loader2 size={24} className="animate-spin mx-auto text-primary mb-2" />
                                        <p className="text-xs uppercase tracking-widest font-bold">Fetching Data</p>
                                    </td>
                                </tr>
                            ) : tickets.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <p className="text-xs uppercase tracking-widest font-bold">No tickets found</p>
                                    </td>
                                </tr>
                            ) : tickets.map((ticket) => (
                                <tr 
                                    key={ticket.id} 
                                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-50 dark:hover:bg-[#171f33]/50 transition-colors group cursor-pointer"
                                >
                                    <td className="px-6 py-5 min-w-[150px]">
                                        <div className="font-mono text-xs text-primary font-bold">
                                            #TKT-{ticket.id}
                                        </div>
                                        <div className="font-mono text-[9px] text-slate-400 mt-1 select-all" title="Original UUID">
                                            {ticket.id}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#222a3d] flex items-center justify-center font-bold text-xs text-slate-600 dark:text-[#dae2fd]">
                                                {((ticket as any).user_name || 'U')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-[#dae2fd]">
                                                    {(ticket as any).user_name || 'Customer'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-sm font-medium text-slate-900 dark:text-[#dae2fd] max-w-xs truncate">
                                            {ticket.subject || 'Support Inquiry'}
                                        </p>
                                        <span className="text-[10px] text-slate-500 dark:text-[#c3c5d8]/60">General Queue</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        {renderStatus(ticket.status)}
                                    </td>
                                    <td className="px-6 py-5">
                                        {renderPriority(ticket.priority || 'LOW')}
                                    </td>
                                    <td className="px-6 py-5 text-right text-xs text-slate-500 dark:text-[#c3c5d8] font-medium">
                                        {new Date(ticket.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Table Pagination */}
                <div className="px-10 py-5 bg-slate-50 dark:bg-[#060e20]/30 flex justify-between items-center border-t border-slate-200 dark:border-[#434655]/10">
                    <p className="text-xs text-slate-500 dark:text-[#c3c5d8] font-medium">Page 1 of 1</p>
                    <div className="flex gap-2">
                        <button className="px-4 py-1.5 rounded-lg bg-white dark:bg-[#222a3d] text-xs font-semibold text-slate-500 dark:text-[#c3c5d8] hover:text-slate-900 dark:hover:text-slate-900 dark:hover:text-[#dae2fd] transition-colors disabled:opacity-30 border border-slate-200 dark:border-transparent shadow-sm" disabled>Previous</button>
                        <button className="px-4 py-1.5 rounded-lg bg-white dark:bg-[#222a3d] text-xs font-semibold text-slate-500 dark:text-[#c3c5d8] hover:text-slate-900 dark:hover:text-slate-900 dark:hover:text-[#dae2fd] transition-colors border border-slate-200 dark:border-transparent shadow-sm">Next</button>
                    </div>
                </div>
            </div>

            {/* Bento Grid - Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                <div className="md:col-span-2 p-8 rounded-2xl bg-white dark:bg-[#131b2e] relative overflow-hidden group shadow-sm border border-slate-200 dark:border-transparent">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                    
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-[#dae2fd]">
                        <Zap className="text-primary size-5" />
                        Quick Analysis
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#171f33] border border-slate-200 dark:border-[#434655]/10">
                            <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#c3c5d8] mb-2">Total Received</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-[#dae2fd]">{tickets.length}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#171f33] border border-slate-200 dark:border-[#434655]/10">
                            <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#c3c5d8] mb-2">Team Load</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-[#dae2fd]">{totalActive > 10 ? 'High Capacity' : 'Moderate Capacity'}</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 rounded-2xl bg-primary text-white relative overflow-hidden group shadow-sm">
                    <Headset className="absolute right-[-20px] bottom-[-20px] text-[120px] opacity-10 -rotate-12" />
                    
                    <h4 className="text-lg font-bold mb-2">Help Center</h4>
                    <p className="text-sm opacity-90 mb-6 leading-relaxed">Need protocol assistance with a complex or escalated customer ticket?</p>
                    
                    <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors">
                        Review Policies
                    </button>
                </div>
            </div>

        </div>
    );
}