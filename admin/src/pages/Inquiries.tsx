import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { InquiryGroupList } from "@/types";
import {
    MessageSquare, Search, Loader2, Trash2, ChevronRight, Layers, Hash
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const STATUS_TABS = ["ALL", "DRAFT", "SUBMITTED", "UNDER_REVIEW", "QUOTED", "ACCEPTED", "REJECTED"];

const STATUS_CONFIG: Record<string, { color: string; bg: string; borderColor: string }> = {
    DRAFT: { color: 'text-slate-400', bg: 'bg-[#434655]/10', borderColor: 'border-slate-200 dark:border-[#434655]/30' },
    SUBMITTED: { color: 'text-amber-400', bg: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
    UNDER_REVIEW: { color: 'text-purple-400', bg: 'bg-purple-500/10', borderColor: 'border-purple-500/20' },
    NEGOTIATING: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20' },
    QUOTED: { color: 'text-blue-600 dark:text-[#adc6ff]', bg: 'bg-[#adc6ff]/10', borderColor: 'border-blue-400 dark:border-[#adc6ff]/20' },
    ACCEPTED: { color: 'text-[#34d399]', bg: 'bg-[#34d399]/10', borderColor: 'border-[#34d399]/20' },
    REJECTED: { color: 'text-[#ffb4ab]', bg: 'bg-[#ffb4ab]/10', borderColor: 'border-[#ffb4ab]/20' },
    CANCELLED: { color: 'text-slate-600 dark:text-[#c3c5d8]', bg: 'bg-[#434655]/10', borderColor: 'border-slate-200 dark:border-[#434655]/20' },
    EXPIRED: { color: 'text-slate-500 dark:text-[#8d90a1]', bg: 'bg-[#2d3449]/30', borderColor: 'border-[#2d3449]/50' },
};

const StatusPill = ({ status }: { status: string }) => {
    const cfg = STATUS_CONFIG[status] || { color: 'text-slate-600 dark:text-[#c3c5d8]', bg: 'bg-[#434655]/20', borderColor: 'border-slate-200 dark:border-[#434655]/30' };
    const label = status.replace(/_/g, ' ');
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.color} border ${cfg.borderColor}`}>
            {label}
        </span>
    );
};

function shortId(uuid: string) {
    return uuid.slice(0, 8).toUpperCase();
}

export default function Inquiries() {
    const navigate = useNavigate();
    const [inquiries, setInquiries] = useState<InquiryGroupList[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [deleting, setDeleting] = useState<string | null>(null);

    const fetchInquiries = () => {
        setLoading(true);
        let url = "/admin/inquiries";
        if (statusFilter !== "ALL") url += `?status_filter=${statusFilter}`;
        api<InquiryGroupList[]>(url).then(setInquiries).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { fetchInquiries(); }, [statusFilter]);

    const deleteInquiry = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Delete this inquiry? This cannot be undone.")) return;
        setDeleting(id);
        try {
            await api(`/admin/inquiries/${id}`, { method: "DELETE" });
            fetchInquiries();
        } catch (err) { console.error(err); } finally { setDeleting(null); }
    };

    const filtered = inquiries.filter(iq =>
        !search ||
        shortId(iq.id).includes(search.toUpperCase()) ||
        iq.user_id?.includes(search)
    );

    return (
        <div className="flex flex-col h-full font-['Inter'] bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] transition-colors">

            {/* Header */}
            <div className="flex items-end justify-between mb-8 px-2">
                <div>
                    <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-[#adc6ff] mb-2 tracking-widest uppercase">
                        <span>Commerce</span>
                        <span>/</span>
                        <span className="opacity-60">Lead Management</span>
                    </nav>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-[#dae2fd] m-0">
                        Inquiries
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-[#c3c5d8] mt-1 m-0 font-medium">
                        {inquiries.length} customer {inquiries.length === 1 ? 'inquiry' : 'inquiries'} active
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#c3c5d8]" />
                        <input
                            type="text" placeholder="Search by ID…" value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-white dark:bg-[#060e20] border border-slate-200 dark:border-[#434655]/20 rounded-full py-2 pl-10 pr-4 text-sm w-64 focus:ring-1 focus:ring-blue-500 dark:focus:ring-[#adc6ff] transition-all text-slate-900 dark:text-[#dae2fd] placeholder:text-slate-400 dark:placeholder:text-slate-600 dark:text-[#c3c5d8]/40 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 rounded-2xl overflow-hidden flex flex-col min-h-[400px] px-2">
                {/* Status Filters Bar */}
                <section className="mb-6 flex flex-wrap items-center gap-3">
                    {STATUS_TABS.map(tab => (
                        <button key={tab} onClick={() => setStatusFilter(tab)}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all border ${
                                statusFilter === tab 
                                ? 'bg-white dark:bg-[#171f33] text-blue-600 dark:text-[#adc6ff] border-blue-200 dark:border-[#adc6ff]/30 shadow-sm dark:shadow-[0_0_15px_rgba(173,198,255,0.05)]' 
                                : 'bg-white/50 dark:bg-[#131b2e] text-slate-500 dark:text-[#c3c5d8] border-slate-200 dark:border-[#434655]/10 hover:bg-white dark:hover:bg-slate-50 dark:hover:bg-[#171f33]'
                            }`}
                        >
                            {tab === 'ALL' ? 'All' : tab.replace(/_/g, ' ')}
                        </button>
                    ))}
                </section>

                {/* Table */}
                <div className="bg-white dark:bg-[#131b2e] rounded-2xl overflow-hidden border border-slate-200 dark:border-[#434655]/10 flex-1 flex flex-col shadow-sm">
                    {loading ? (
                        <div className="p-16 text-center text-slate-400 dark:text-[#c3c5d8]">
                            <Loader2 size={24} className="animate-spin text-blue-500 dark:text-[#adc6ff] mx-auto" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-16 text-center text-slate-400 dark:text-[#c3c5d8]">
                            <MessageSquare size={32} className="opacity-20 dark:opacity-30 mx-auto mb-3 block" />
                            <p className="text-sm font-medium tracking-wide m-0">No inquiries found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto flex-1 custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-[#060e20]/50 text-slate-500 dark:text-[#c3c5d8] uppercase text-[10px] tracking-[0.2em] font-bold border-b border-slate-200 dark:border-[#434655]/20">
                                        <th className="px-6 py-4">Inquiry ID</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Items</th>
                                        <th className="px-6 py-4">Quoted Value</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-[#434655]/10">
                                    {filtered.map(iq => (
                                        <tr key={iq.id}
                                            onClick={() => navigate(`/inquiries/${iq.id}`)}
                                            className="group cursor-pointer transition-colors duration-200 hover:bg-slate-50/80 dark:hover:bg-slate-50 dark:hover:bg-[#171f33]/60"
                                        >
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-[13px] text-blue-600 dark:text-[#adc6ff] font-semibold tracking-wider font-mono">
                                                        <Hash size={11} className="text-slate-400 dark:text-[#c3c5d8]/60" />
                                                        {shortId(iq.id)}
                                                    </div>
                                                    <div className="font-mono text-[9px] text-slate-500 dark:text-[#8d90a1] select-all" title="Original UUID">
                                                        {iq.id}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <StatusPill status={iq.status} />
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-1.5 text-[13px] font-medium text-slate-600 dark:text-[#c3c5d8]">
                                                    <Layers size={13} className="text-slate-400 dark:text-[#434655]" />
                                                    {iq.item_count} {iq.item_count === 1 ? 'item' : 'items'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-[14px] font-bold text-slate-900 dark:text-[#dae2fd]">
                                                    {iq.active_quote?.total_price ? `₹${iq.active_quote.total_price.toLocaleString()}` : '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-xs text-slate-500 dark:text-[#c3c5d8]">
                                                {new Date(iq.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={e => deleteInquiry(iq.id, e)}
                                                        disabled={deleting === iq.id}
                                                        className="bg-transparent border-none cursor-pointer text-slate-400 dark:text-[#c3c5d8] hover:text-red-500 dark:hover:text-[#ffb4ab] opacity-0 group-hover:opacity-100 p-1.5 transition-all text-xs flex items-center gap-1"
                                                    >
                                                        {deleting === iq.id
                                                            ? <Loader2 size={14} className="animate-spin" />
                                                            : <Trash2 size={14} />
                                                        }
                                                    </button>
                                                    <ChevronRight size={15} className="text-slate-300 dark:text-[#c3c5d8]" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
