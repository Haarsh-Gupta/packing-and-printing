import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Inquiry, InquiryMessage } from "@/types";
import {
    MessageSquare, Send, User, Calendar, Clock, CheckCircle2,
    AlertCircle, ChevronRight, Search, Loader2, ArrowRight,
    FileText, Mail, Phone, Hash
} from "lucide-react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter, SheetClose
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_FILTER = ["ALL", "NEW", "QUOTED", "CLOSED"];

const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
    NEW: { color: '#dc2626', bg: '#fef2f2', dot: '#dc2626' },
    QUOTED: { color: '#2563eb', bg: '#eff6ff', dot: '#2563eb' },
    CLOSED: { color: '#737373', bg: '#f5f5f5', dot: '#737373' },
};

const StatusPill = ({ status }: { status: string }) => {
    const cfg = STATUS_CONFIG[status] || { color: '#737373', bg: '#f5f5f5', dot: '#737373' };
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
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

export default function Inquiries() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("ALL");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Inquiry | null>(null);
    const [msgs, setMsgs] = useState<InquiryMessage[]>([]);
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);
    const [quote, setQuote] = useState({ amount: "", notes: "" });

    const fetchInquiries = () => {
        setLoading(true);
        let url = "/inquiries/admin/all";
        if (status !== "ALL") url += `?status_filter=${status}`;
        api<Inquiry[]>(url).then(setInquiries).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { fetchInquiries(); }, [status]);

    const selectInquiry = async (iq: Inquiry) => {
        setSelected(iq);
        try {
            const data = await api<Inquiry>(`/inquiries/${iq.id}`);
            setMsgs(data.messages || []);
        } catch (e) { console.error(e); }
    };

    const sendReply = async () => {
        if (!selected || !reply.trim()) return;
        setSending(true);
        try {
            await api(`/inquiries/${selected.id}/messages`, {
                method: "POST",
                body: JSON.stringify({ message: reply }),
            });
            setReply("");
            const data = await api<Inquiry>(`/inquiries/${selected.id}`);
            setMsgs(data.messages || []);
        } catch (e) { console.error(e); } finally { setSending(false); }
    };

    const sendQuote = async () => {
        if (!selected || !quote.amount) return;
        setSending(true);
        try {
            await api(`/inquiries/${selected.id}/quote`, {
                method: "POST",
                body: JSON.stringify({ quoted_amount: parseFloat(quote.amount), admin_notes: quote.notes }),
            });
            setQuote({ amount: "", notes: "" });
            fetchInquiries();
            setSelected(null);
        } catch (e) { console.error(e); } finally { setSending(false); }
    };

    const filtered = inquiries.filter(iq =>
        String(iq.id).includes(search) || iq.user_id.toString().includes(search)
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
                        Product Inquiries
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                        <Input
                            placeholder="Search inquiries..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ paddingLeft: '32px', height: '36px', width: '200px', fontSize: '13px' }}
                        />
                    </div>
                    <Select value={status} onValueChange={setStatus}>
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
                                {['ID', 'Status', 'Service/Product', 'Customer', 'Date', ''].map((h, i) => (
                                    <TableHead key={i} style={{
                                        fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em',
                                        textTransform: 'uppercase', color: 'var(--muted-foreground)',
                                        fontFamily: "'DM Mono', monospace", height: '36px',
                                        textAlign: i === 5 ? 'right' : 'left',
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
                                        IQ-{iq.id}
                                    </TableCell>
                                    <TableCell><StatusPill status={iq.status} /></TableCell>
                                    <TableCell style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                                        {iq.service_id ? `Service #${iq.service_id}` : `Product #${iq.product_id}`}
                                    </TableCell>
                                    <TableCell style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontFamily: "'DM Mono', monospace" }}>
                                        User #{iq.user_id}
                                    </TableCell>
                                    <TableCell style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontFamily: "'DM Mono', monospace" }}>
                                        {new Date(iq.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell style={{ textAlign: 'right' }}>
                                        <ChevronRight size={16} style={{ color: 'var(--muted-foreground)', display: 'inline' }} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Detail Sheet */}
            <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <SheetContent className="sm:max-w-xl flex flex-col p-0">
                    {selected && (
                        <>
                            <SheetHeader style={{ padding: '24px', borderBottom: '1px solid var(--border)', background: 'var(--secondary)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)', letterSpacing: '0.1em' }}>
                                        IQ-{selected.id}
                                    </span>
                                    <StatusPill status={selected.status} />
                                </div>
                                <SheetTitle style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.03em' }}>Inquiry Review</SheetTitle>
                                <SheetDescription style={{ fontSize: '13px' }}>Manage messages and send price quotations</SheetDescription>
                            </SheetHeader>

                            <ScrollArea className="flex-1">
                                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                                    {/* Info Cards */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        {[
                                            { label: 'Customer', value: `User #${selected.user_id}`, sub: 'Regular Client', icon: User },
                                            { label: 'Timestamp', value: new Date(selected.created_at).toLocaleDateString(), sub: new Date(selected.created_at).toLocaleTimeString(), icon: Calendar },
                                        ].map(item => (
                                            <div key={item.label} style={{
                                                padding: '16px',
                                                border: '1px solid var(--border)',
                                                borderRadius: '6px',
                                                background: 'var(--secondary)',
                                            }}>
                                                <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontFamily: "'DM Mono', monospace", marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <item.icon size={10} /> {item.label}
                                                </p>
                                                <p style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--foreground)' }}>{item.value}</p>
                                                <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontWeight: 500, marginTop: '2px' }}>{item.sub}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--card)' }}>
                                        <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontFamily: "'DM Mono', monospace", marginBottom: '12px' }}>Requirements</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {Object.entries(selected.requirements || {}).map(([k, v]) => (
                                                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                                                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted-foreground)', fontFamily: "'DM Mono', monospace" }}>{k.replace(/_/g, ' ')}</span>
                                                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--foreground)' }}>{typeof v === 'boolean' ? (v ? 'YES' : 'NO') : String(v)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Messages */}
                                    <div>
                                        <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontFamily: "'DM Mono', monospace", marginBottom: '16px' }}>Message History</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {msgs.map((m) => (
                                                <div key={m.id} style={{ alignSelf: m.is_admin ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                                    <div style={{
                                                        padding: '10px 14px',
                                                        borderRadius: '12px',
                                                        borderTopRightRadius: m.is_admin ? '2px' : '12px',
                                                        borderTopLeftRadius: m.is_admin ? '12px' : '2px',
                                                        background: m.is_admin ? 'var(--foreground)' : 'var(--secondary)',
                                                        color: m.is_admin ? 'var(--background)' : 'var(--foreground)',
                                                        fontSize: '13px',
                                                        fontWeight: 500,
                                                        lineHeight: 1.5,
                                                    }}>
                                                        {m.message}
                                                    </div>
                                                    <p style={{ fontSize: '9px', fontWeight: 700, color: 'var(--muted-foreground)', fontFamily: "'DM Mono', monospace", marginTop: '4px', textAlign: m.is_admin ? 'right' : 'left' }}>
                                                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {selected.status !== 'CLOSED' && (
                                        <>
                                            <Separator />
                                            <div>
                                                <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontFamily: "'DM Mono', monospace", marginBottom: '12px' }}>Quotation</p>
                                                <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--secondary)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '12px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                            <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)' }}>Base Amount (₹)</label>
                                                            <Input
                                                                type="number"
                                                                placeholder="5000"
                                                                value={quote.amount}
                                                                onChange={e => setQuote({ ...quote, amount: e.target.value })}
                                                                style={{ height: '40px', fontWeight: 800, fontSize: '16px' }}
                                                            />
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                                            <Button
                                                                onClick={sendQuote}
                                                                disabled={sending || !quote.amount}
                                                                style={{ width: '100%', height: '40px', fontWeight: 700, fontSize: '13px' }}
                                                            >
                                                                {sending ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : "Send Quote"}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)' }}>Service Notes</label>
                                                        <Textarea
                                                            placeholder="Describe terms, inclusions, etc..."
                                                            value={quote.notes}
                                                            onChange={e => setQuote({ ...quote, notes: e.target.value })}
                                                            style={{ minHeight: '80px', fontSize: '13px' }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </ScrollArea>

                            <SheetFooter style={{ padding: '16px', borderTop: '1px solid var(--border)', background: 'var(--secondary)' }}>
                                <div style={{ display: 'flex', width: '100%', gap: '10px' }}>
                                    <Input
                                        placeholder="Type a message..."
                                        value={reply}
                                        onChange={e => setReply(e.target.value)}
                                        style={{ flex: 1, height: '36px', fontSize: '13px' }}
                                    />
                                    <Button
                                        size="icon"
                                        onClick={sendReply}
                                        disabled={sending || !reply.trim()}
                                        style={{ height: '36px', width: '36px' }}
                                    >
                                        <Send size={16} />
                                    </Button>
                                </div>
                            </SheetFooter>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
