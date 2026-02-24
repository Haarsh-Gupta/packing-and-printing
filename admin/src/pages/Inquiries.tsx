import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { InquiryGroupList, InquiryGroup, InquiryMessage } from "@/types";
import {
    MessageSquare, Send, User, Calendar, Package, Layers,
    ChevronRight, Search, Loader2, Trash2, IndianRupee,
    FileText, Hash, Clock, CheckCircle2, XCircle, AlertCircle
} from "lucide-react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

const STATUS_FILTER = ["ALL", "PENDING", "QUOTED", "ACCEPTED", "REJECTED"];

const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string; icon: typeof AlertCircle }> = {
    PENDING: { color: '#f59e0b', bg: '#fffbeb', dot: '#f59e0b', icon: Clock },
    QUOTED: { color: '#2563eb', bg: '#eff6ff', dot: '#2563eb', icon: IndianRupee },
    ACCEPTED: { color: '#16a34a', bg: '#f0fdf4', dot: '#16a34a', icon: CheckCircle2 },
    REJECTED: { color: '#dc2626', bg: '#fef2f2', dot: '#dc2626', icon: XCircle },
};

const StatusPill = ({ status }: { status: string }) => {
    const cfg = STATUS_CONFIG[status] || { color: '#737373', bg: '#f5f5f5', dot: '#737373', icon: AlertCircle };
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 10px',
            background: cfg.bg,
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 700,
            color: cfg.color,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontFamily: "'DM Mono', monospace",
        }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
            {status}
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
    const [selected, setSelected] = useState<InquiryGroup | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);
    const [quoteForm, setQuoteForm] = useState({ amount: "", notes: "", validDays: "7" });
    const [deleting, setDeleting] = useState<string | null>(null);

    const fetchInquiries = () => {
        setLoading(true);
        let url = "/inquiries/admin";
        if (statusFilter !== "ALL") url += `?status_filter=${statusFilter}`;
        api<InquiryGroupList[]>(url)
            .then(setInquiries)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchInquiries(); }, [statusFilter]);

    const selectInquiry = (iq: InquiryGroupList) => {
        navigate(`/inquiries/${iq.id}`);
    };

    const deleteInquiry = async (id: string) => {
        if (!confirm("Delete this inquiry? This cannot be undone.")) return;
        setDeleting(id);
        try {
            await api(`/inquiries/admin/${id}`, { method: "DELETE" });
            fetchInquiries();
            if (selected?.id === id) setSelected(null);
        } catch (e) { console.error(e); } finally { setDeleting(null); }
    };

    const filtered = inquiries.filter(iq =>
        shortId(iq.id).includes(search.toUpperCase()) ||
        iq.user_id.includes(search)
    );

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: "'DM Sans', system-ui" }}>

            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                paddingBottom: '24px',
                borderBottom: '1px solid var(--border)',
            }}>
                <div>
                    <p style={{
                        fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em',
                        textTransform: 'uppercase', color: 'var(--muted-foreground)',
                        fontFamily: "'DM Mono', monospace", marginBottom: '4px',
                    }}>Customer Requests</p>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>
                        Inquiries
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                        <Input
                            placeholder="Search by ID..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ paddingLeft: '32px', height: '36px', width: '200px', fontSize: '13px' }}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger style={{ height: '36px', width: '140px', fontSize: '12px', fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {STATUS_FILTER.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div style={{
                border: '1px solid var(--border)',
                borderRadius: '8px',
                overflow: 'hidden',
                background: 'var(--card)',
            }}>
                {loading ? (
                    <div style={{ padding: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <Loader2 size={24} style={{ color: 'var(--muted-foreground)', animation: 'spin 0.8s linear infinite' }} />
                        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontFamily: "'DM Mono', monospace" }}>Fetching inquiries...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <MessageSquare size={40} style={{ color: 'var(--border)' }} />
                        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted-foreground)' }}>No inquiries found</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow style={{ background: 'var(--secondary)', borderBottom: '1px solid var(--border)' }}>
                                {['ID', 'Status', 'Items', 'Quoted Price', 'Date', ''].map((h, i) => (
                                    <TableHead key={i} style={{
                                        fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em',
                                        textTransform: 'uppercase', color: 'var(--muted-foreground)',
                                        fontFamily: "'DM Mono', monospace", height: '36px',
                                        textAlign: i >= 4 ? 'right' : 'left',
                                    }}>{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((iq) => (
                                <TableRow
                                    key={iq.id}
                                    style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                                    onClick={() => selectInquiry(iq)}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--secondary)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    <TableCell style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', fontWeight: 700, color: 'var(--muted-foreground)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Hash size={12} />
                                            {shortId(iq.id)}
                                        </div>
                                    </TableCell>
                                    <TableCell><StatusPill status={iq.status} /></TableCell>
                                    <TableCell style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Layers size={14} style={{ color: 'var(--muted-foreground)' }} />
                                            {iq.item_count} {iq.item_count === 1 ? 'item' : 'items'}
                                        </div>
                                    </TableCell>
                                    <TableCell style={{ fontSize: '13px', fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>
                                        {iq.total_quoted_price ? `₹${iq.total_quoted_price.toLocaleString()}` : '—'}
                                    </TableCell>
                                    <TableCell style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontFamily: "'DM Mono', monospace", textAlign: 'right' }}>
                                        {new Date(iq.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </TableCell>
                                    <TableCell style={{ textAlign: 'right', width: '80px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteInquiry(iq.id); }}
                                                disabled={deleting === iq.id}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                                                    color: 'var(--muted-foreground)', borderRadius: '4px',
                                                    opacity: deleting === iq.id ? 0.3 : 0.5,
                                                    transition: 'opacity 0.15s',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#dc2626'; }}
                                                onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = 'var(--muted-foreground)'; }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            <ChevronRight size={16} style={{ color: 'var(--muted-foreground)' }} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

        </div>
    );
}
