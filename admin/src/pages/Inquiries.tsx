import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { InquiryGroupList } from "@/types";
import {
    MessageSquare, Search, Loader2, Trash2, ChevronRight, Layers, Hash
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const STATUS_TABS = ["ALL", "DRAFT", "SUBMITTED", "UNDER_REVIEW", "QUOTED", "ACCEPTED", "REJECTED"];

const STATUS_CONFIG: Record<string, string> = {
    DRAFT: 'text-slate-500 bg-slate-100 dark:bg-slate-800',
    SUBMITTED: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10',
    UNDER_REVIEW: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10',
    NEGOTIATING: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-500/10',
    QUOTED: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10',
    ACCEPTED: 'text-green-600 bg-green-50 dark:bg-green-500/10',
    REJECTED: 'text-red-600 bg-red-50 dark:bg-red-500/10',
    CANCELLED: 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800',
    EXPIRED: 'text-zinc-400 bg-zinc-100 dark:bg-zinc-800',
};

const StatusPill = ({ status }: { status: string }) => {
    const classes = STATUS_CONFIG[status] || 'text-slate-500 bg-slate-100 dark:bg-slate-800';
    const label = status.charAt(0) + status.slice(1).toLowerCase();
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold font-sans ${classes}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-75" />
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
        <div className="animate-fade-in flex flex-col gap-5 font-sans">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white m-0">
                        Inquiries
                    </h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 m-0">
                        {inquiries.length} customer {inquiries.length === 1 ? 'inquiry' : 'inquiries'}
                    </p>
                </div>
                <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                        type="text" placeholder="Search by ID…" value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="h-9 pl-8 pr-3 w-56 border border-slate-200 dark:border-slate-800 rounded-lg text-[13px] text-slate-900 dark:text-white bg-white dark:bg-slate-900 outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            {/* Status tabs */}
            <div className="flex gap-0.5 overflow-x-auto pb-1 scrollbar-hide">
                {STATUS_TABS.map(tab => (
                    <button key={tab} onClick={() => setStatusFilter(tab)} className={`
                        px-3.5 py-1.5 border-none rounded-lg text-[12.5px] font-sans cursor-pointer whitespace-nowrap transition-colors
                        ${statusFilter === tab 
                            ? 'font-semibold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                            : 'font-normal bg-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}
                    `}>
                        {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-16 text-center text-slate-400 dark:text-slate-500">
                        <Loader2 size={24} className="animate-spin text-blue-500 mx-auto" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-16 text-center text-slate-400 dark:text-slate-500">
                        <MessageSquare size={32} className="opacity-30 mx-auto mb-2.5 block" />
                        <p className="text-sm font-medium m-0">No inquiries found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800/60">
                                    {['ID', 'STATUS', 'ITEMS', 'QUOTED PRICE', 'DATE', ''].map((h, i) => (
                                        <th key={i} className="px-5 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 text-left tracking-wider">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(iq => (
                                    <tr key={iq.id}
                                        onClick={() => navigate(`/inquiries/${iq.id}`)}
                                        className="border-b border-slate-50 dark:border-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-blue-500 dark:text-blue-400 tracking-tight">
                                                <Hash size={11} className="text-slate-400 dark:text-slate-500" />
                                                {shortId(iq.id)}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5"><StatusPill status={iq.status} /></td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-1.5 text-[13px] font-medium text-slate-600 dark:text-slate-300">
                                                <Layers size={13} className="text-slate-400 dark:text-slate-500" />
                                                {iq.item_count} {iq.item_count === 1 ? 'item' : 'items'}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-[13px] font-semibold text-slate-900 dark:text-white">
                                                {iq.active_quote?.total_price ? `₹${iq.active_quote.total_price.toLocaleString()}` : '—'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {new Date(iq.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={e => deleteInquiry(iq.id, e)}
                                                    disabled={deleting === iq.id}
                                                    className="bg-transparent border-none cursor-pointer text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 p-1.5 rounded-md transition-colors"
                                                >
                                                    {deleting === iq.id
                                                        ? <Loader2 size={14} className="animate-spin" />
                                                        : <Trash2 size={14} />
                                                    }
                                                </button>
                                                <ChevronRight size={15} className="text-slate-300 dark:text-slate-600" />
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
    );
}
