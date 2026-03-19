import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { InquiryGroupList } from "@/types";
import {
    MessageSquare, Search, Loader2, Trash2, ChevronRight, Layers, Hash
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const STATUS_TABS = ["ALL", "DRAFT", "SUBMITTED", "UNDER_REVIEW", "QUOTED", "ACCEPTED", "REJECTED"];

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
    DRAFT: { color: '#71717a', bg: '#f4f4f5' },
    SUBMITTED: { color: '#d97706', bg: '#fffbeb' },
    UNDER_REVIEW: { color: '#8b5cf6', bg: '#f5f3ff' },
    NEGOTIATING: { color: '#0891b2', bg: '#ecfeff' },
    QUOTED: { color: '#2563eb', bg: '#eff6ff' },
    ACCEPTED: { color: '#16a34a', bg: '#f0fdf4' },
    REJECTED: { color: '#dc2626', bg: '#fef2f2' },
    CANCELLED: { color: '#737373', bg: '#f5f5f5' },
    EXPIRED: { color: '#a1a1aa', bg: '#f4f4f5' },
};

const StatusPill = ({ status }: { status: string }) => {
    const cfg = STATUS_CONFIG[status] || { color: '#71717a', bg: '#f4f4f5' };
    const label = status.charAt(0) + status.slice(1).toLowerCase();
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px',
            background: cfg.bg, borderRadius: '999px', fontSize: '11px', fontWeight: 600,
            color: cfg.color, fontFamily: "'Inter', system-ui",
        }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
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
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: "'Inter', system-ui" }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.025em', color: '#18181b', margin: 0 }}>
                        Inquiries
                    </h1>
                    <p style={{ fontSize: '13px', color: '#71717a', marginTop: '3px' }}>
                        {inquiries.length} customer {inquiries.length === 1 ? 'inquiry' : 'inquiries'}
                    </p>
                </div>
                <div style={{ position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
                    <input
                        type="text" placeholder="Search by ID…" value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            height: '36px', paddingLeft: '30px', paddingRight: '12px', width: '220px',
                            border: '1px solid #e4e4e7', borderRadius: '9px', fontSize: '13px',
                            color: '#18181b', background: 'white', fontFamily: "'Inter', system-ui", outline: 'none',
                        }}
                    />
                </div>
            </div>

            {/* Status tabs */}
            <div style={{ display: 'flex', gap: '2px' }}>
                {STATUS_TABS.map(tab => (
                    <button key={tab} onClick={() => setStatusFilter(tab)} style={{
                        padding: '6px 14px', border: 'none', borderRadius: '9px',
                        fontSize: '12.5px', fontWeight: statusFilter === tab ? 600 : 400,
                        color: statusFilter === tab ? '#18181b' : '#71717a',
                        background: statusFilter === tab ? '#f4f4f5' : 'transparent',
                        cursor: 'pointer', transition: 'all 0.12s', fontFamily: "'Inter', system-ui",
                    }}>
                        {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div style={{
                background: 'white', borderRadius: '16px',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
                overflow: 'hidden',
            }}>
                {loading ? (
                    <div style={{ padding: '64px', textAlign: 'center' }}>
                        <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', color: '#3b82f6', margin: '0 auto' }} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '64px', textAlign: 'center' }}>
                        <MessageSquare size={32} style={{ opacity: 0.3, margin: '0 auto 10px', display: 'block' }} />
                        <p style={{ fontSize: '14px', fontWeight: 500, color: '#71717a' }}>No inquiries found</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #f4f4f5' }}>
                                {['ID', 'STATUS', 'ITEMS', 'QUOTED PRICE', 'DATE', ''].map((h, i) => (
                                    <th key={i} style={{
                                        padding: '12px 20px', fontSize: '10px', fontWeight: 600,
                                        color: '#a1a1aa', textAlign: 'left', letterSpacing: '0.06em',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(iq => (
                                <tr key={iq.id}
                                    onClick={() => navigate(`/inquiries/${iq.id}`)}
                                    style={{ borderBottom: '1px solid #f9f9f9', cursor: 'pointer', transition: 'background 0.1s' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#f9f9f9')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <td style={{ padding: '13px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Hash size={11} style={{ color: '#a1a1aa' }} />
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6', letterSpacing: '0.02em' }}>
                                                {shortId(iq.id)}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '13px 20px' }}><StatusPill status={iq.status} /></td>
                                    <td style={{ padding: '13px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Layers size={13} style={{ color: '#a1a1aa' }} />
                                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#52525b' }}>
                                                {iq.item_count} {iq.item_count === 1 ? 'item' : 'items'}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '13px 20px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#18181b' }}>
                                            {iq.active_quote?.total_price ? `₹${iq.active_quote.total_price.toLocaleString()}` : '—'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '13px 20px' }}>
                                        <span style={{ fontSize: '12px', color: '#71717a' }}>
                                            {new Date(iq.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </td>
                                    <td style={{ padding: '13px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                            <button
                                                onClick={e => deleteInquiry(iq.id, e)}
                                                disabled={deleting === iq.id}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: '#d4d4d8', padding: '4px', borderRadius: '6px',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
                                                onMouseLeave={e => { e.currentTarget.style.color = '#d4d4d8'; e.currentTarget.style.background = 'none'; }}
                                            >
                                                {deleting === iq.id
                                                    ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                                                    : <Trash2 size={14} />
                                                }
                                            </button>
                                            <ChevronRight size={15} style={{ color: '#d4d4d8' }} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
