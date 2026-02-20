import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Ticket, TicketMessage } from "@/types";
import {
    LifeBuoy, Send, User, Clock,
    ChevronRight, Loader2, Filter, AlertCircle
} from "lucide-react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter, SheetClose
} from "@/components/ui/sheet";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };

const STATUS_FILTER = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const PRIORITY_FILTER = ["ALL", "LOW", "MEDIUM", "HIGH", "URGENT"];

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
    LOW: { color: '#737373', bg: '#f5f5f5', border: '#e5e5e5' },
    MEDIUM: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
    HIGH: { color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    URGENT: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

const STATUS_CONFIG: Record<string, { dot: string; label: string }> = {
    OPEN: { dot: '#dc2626', label: 'Open' },
    IN_PROGRESS: { dot: '#2563eb', label: 'In Progress' },
    RESOLVED: { dot: '#16a34a', label: 'Resolved' },
    CLOSED: { dot: '#a3a3a3', label: 'Closed' },
};

const PriorityBadge = ({ priority }: { priority: string }) => {
    const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.LOW;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '3px 8px', borderRadius: '4px',
            fontSize: '9px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
            ...mono,
        }}>{priority}</span>
    );
};

const StatusDot = ({ status }: { status: string }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--foreground)' }}>{cfg.label}</span>
        </div>
    );
};

export default function Tickets() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("ALL");
    const [priority, setPriority] = useState("ALL");
    const [selected, setSelected] = useState<Ticket | null>(null);
    const [msgs, setMsgs] = useState<TicketMessage[]>([]);
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);
    const [newStatus, setNewStatus] = useState("");

    const fetchTickets = () => {
        setLoading(true);
        let url = "/support/tickets/admin/all";
        const params = new URLSearchParams();
        if (status !== "ALL") params.append("status", status);
        if (priority !== "ALL") params.append("priority", priority);
        if (params.toString()) url += `?${params.toString()}`;
        api<Ticket[]>(url).then(setTickets).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { fetchTickets(); }, [status, priority]);

    const selectTicket = async (t: Ticket) => {
        setSelected(t);
        setNewStatus(t.status);
        try {
            const data = await api<Ticket>(`/support/tickets/${t.id}`);
            setMsgs(data.messages || []);
        } catch (e) { console.error(e); }
    };

    const sendReply = async () => {
        if (!selected || !reply.trim()) return;
        setSending(true);
        try {
            await api(`/support/tickets/${selected.id}/messages`, {
                method: "POST", body: JSON.stringify({ message: reply }),
            });
            setReply("");
            const data = await api<Ticket>(`/support/tickets/${selected.id}`);
            setMsgs(data.messages || []);
        } catch (e) { console.error(e); } finally { setSending(false); }
    };

    const updateStatus = async (val: string) => {
        if (!selected) return;
        setNewStatus(val);
        try {
            await api(`/support/tickets/${selected.id}/status`, {
                method: "PATCH", body: JSON.stringify({ status: val }),
            });
            fetchTickets();
        } catch (e) { console.error(e); }
    };

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
                        ...mono, marginBottom: '4px',
                    }}>Customer Support</p>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>
                        Support Tickets
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted-foreground)', marginLeft: '12px', letterSpacing: 0, ...mono }}>
                            [{tickets.length} OPEN ISSUES]
                        </span>
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger style={{ height: '36px', width: '150px', fontSize: '11px', ...mono, fontWeight: 700 }}>
                            <Filter size={14} className="mr-2" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            {STATUS_FILTER.map(s => <SelectItem key={s} value={s} style={{ fontWeight: 600 }}>{s === 'ALL' ? 'All Statuses' : s.replace('_', ' ')}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger style={{ height: '36px', width: '150px', fontSize: '11px', ...mono, fontWeight: 700 }}>
                            <AlertCircle size={14} className="mr-2" />
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            {PRIORITY_FILTER.map(p => <SelectItem key={p} value={p} style={{ fontWeight: 600 }}>{p === 'ALL' ? 'All Priorities' : p}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Tickets Table */}
            <div style={{ borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--card)' }}>
                <Table>
                    <TableHeader style={{ background: 'var(--secondary)/50' }}>
                        <TableRow className="hover:bg-transparent border-b border-border">
                            <TableHead style={{ height: '44px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', ...mono, color: 'var(--muted-foreground)' }}>Ticket ID</TableHead>
                            <TableHead style={{ height: '44px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', ...mono, color: 'var(--muted-foreground)' }}>Priority</TableHead>
                            <TableHead style={{ height: '44px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', ...mono, color: 'var(--muted-foreground)' }}>Inquiry Subject</TableHead>
                            <TableHead style={{ height: '44px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', ...mono, color: 'var(--muted-foreground)' }}>Current Status</TableHead>
                            <TableHead style={{ height: '44px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', ...mono, color: 'var(--muted-foreground)' }}>Last Activity</TableHead>
                            <TableHead style={{ height: '44px' }}></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && tickets.length === 0 ? (
                            [1, 2, 3, 4, 5].map(i => (
                                <TableRow key={i}>
                                    <TableCell colSpan={6} style={{ height: '64px', padding: '0 20px' }}>
                                        <div style={{ height: '24px', background: 'var(--secondary)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : tickets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} style={{ height: '300px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                        <LifeBuoy size={48} style={{ opacity: 0.1 }} />
                                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--muted-foreground)' }}>No active tickets matched your criteria</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            tickets.map((t) => (
                                <TableRow
                                    key={t.id}
                                    className="group border-b border-border hover:bg-zinc-50/50 cursor-pointer"
                                    onClick={() => selectTicket(t)}
                                >
                                    <TableCell style={{ padding: '16px 20px', ...mono, fontSize: '12px', fontWeight: 800 }}>
                                        #{t.id.toString().padStart(4, '0')}
                                    </TableCell>
                                    <TableCell>
                                        <PriorityBadge priority={t.priority} />
                                    </TableCell>
                                    <TableCell>
                                        <p style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '-0.01em', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {t.subject}
                                        </p>
                                        <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontWeight: 500 }}>Customer #{t.user_id}</p>
                                    </TableCell>
                                    <TableCell>
                                        <StatusDot status={t.status} />
                                    </TableCell>
                                    <TableCell>
                                        <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', ...mono }}>
                                            {new Date(t.updated_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })} · {new Date(t.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </TableCell>
                                    <TableCell style={{ textAlign: 'right', paddingRight: '20px' }}>
                                        <ChevronRight size={18} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all transform translate-x-0 group-hover:translate-x-1" />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Ticket Detail Sheet */}
            <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <SheetContent className="sm:max-w-xl flex flex-col p-0 border-l border-border shadow-2xl">
                    {selected && (
                        <>
                            <SheetHeader style={{ padding: '24px', background: 'var(--secondary)', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ padding: '3px 8px', background: 'var(--foreground)', color: 'var(--background)', borderRadius: '4px', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', ...mono }}>
                                        TICKET #{selected.id.toString().padStart(4, '0')}
                                    </span>
                                    <PriorityBadge priority={selected.priority} />
                                </div>
                                <SheetTitle style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                                    {selected.subject}
                                </SheetTitle>
                                <SheetDescription style={{ fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <User size={12} /> Requester ID: {selected.user_id} · <Clock size={12} /> Filed {new Date(selected.created_at).toLocaleDateString()}
                                </SheetDescription>
                            </SheetHeader>

                            <ScrollArea style={{ flex: 1 }}>
                                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                                    {/* Quick Actions */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '16px', border: '1px solid var(--border)', borderRadius: '10px',
                                        background: 'var(--secondary)/50',
                                    }}>
                                        <div>
                                            <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', ...mono, color: 'var(--muted-foreground)' }}>Lifecycle Status</p>
                                            <p style={{ fontSize: '13px', fontWeight: 600 }}>Modify ticket state</p>
                                        </div>
                                        <Select value={newStatus} onValueChange={updateStatus}>
                                            <SelectTrigger style={{ height: '34px', width: '160px', fontSize: '12px', ...mono, fontWeight: 700 }}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {STATUS_FILTER.filter(s => s !== 'ALL').map(s => (
                                                    <SelectItem key={s} value={s} style={{ fontWeight: 600 }}>{s.replace('_', ' ')}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Original Description */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <p style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted-foreground)', ...mono }}>Incident Report</p>
                                        <div style={{
                                            padding: '16px', background: 'var(--secondary)/20',
                                            border: '1px solid var(--border)', borderRadius: '10px',
                                            fontSize: '14px', lineHeight: 1.6, color: 'var(--foreground)',
                                            fontWeight: 500, fontStyle: 'italic',
                                        }}>
                                            "{selected.description}"
                                        </div>
                                    </div>

                                    <div style={{ height: '1px', background: 'var(--border)' }} />

                                    {/* Conversation thread */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <p style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted-foreground)', ...mono }}>Activity Log · {msgs.length} Events</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {msgs.length === 0 ? (
                                                <div style={{ padding: '32px', border: '1px dashed var(--border)', borderRadius: '10px', textAlign: 'center' }}>
                                                    <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', fontWeight: 500 }}>No communication history found.</p>
                                                </div>
                                            ) : msgs.map((m) => (
                                                <div key={m.id} style={{
                                                    display: 'flex',
                                                    justifyContent: m.is_admin ? 'flex-end' : 'flex-start',
                                                }}>
                                                    <div style={{
                                                        maxWidth: '85%',
                                                        padding: '12px 16px',
                                                        borderRadius: m.is_admin ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                                                        background: m.is_admin ? 'var(--foreground)' : 'var(--secondary)',
                                                        color: m.is_admin ? 'var(--background)' : 'var(--foreground)',
                                                        border: m.is_admin ? 'none' : '1px solid var(--border)',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                                    }}>
                                                        <p style={{ fontSize: '13.5px', fontWeight: 500, lineHeight: 1.5 }}>{m.message}</p>
                                                        <div style={{
                                                            display: 'flex', alignItems: 'center', gap: '6px',
                                                            marginTop: '6px', opacity: 0.6, ...mono, fontSize: '9px', fontWeight: 700,
                                                            justifyContent: m.is_admin ? 'flex-end' : 'flex-start',
                                                        }}>
                                                            <span>{m.is_admin ? 'STAFF RESPONSE' : 'CLIENT MESSAGE'}</span>
                                                            <span>•</span>
                                                            <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>

                            {/* Response terminal */}
                            <SheetFooter style={{
                                padding: '24px', borderTop: '1px solid var(--border)',
                                background: 'var(--secondary)',
                            }}>
                                <div style={{ display: 'flex', gap: '10px', width: '100%', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '10px', fontWeight: 800, ...mono, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Compose Dispatch</label>
                                        <Input
                                            placeholder="Enter communication to sender..."
                                            value={reply}
                                            onChange={e => setReply(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                                            style={{ height: '44px', fontSize: '14px', fontWeight: 600, background: 'var(--background)' }}
                                            disabled={sending}
                                        />
                                    </div>
                                    <Button
                                        onClick={sendReply}
                                        disabled={sending || !reply.trim()}
                                        style={{
                                            width: '44px', height: '44px', padding: 0,
                                            background: 'var(--foreground)', color: 'var(--background)',
                                            fontWeight: 800,
                                        }}
                                    >
                                        {sending
                                            ? <Loader2 size={18} className="animate-spin" />
                                            : <Send size={18} />
                                        }
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