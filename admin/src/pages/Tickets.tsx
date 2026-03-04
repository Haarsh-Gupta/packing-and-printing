import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Ticket, TicketMessage } from "@/types";
import { Send, Search, Loader2, ChevronDown, MoreHorizontal, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PRIORITY_CONFIG: Record<string, { color: string; bg: string }> = {
    LOW: { color: '#16a34a', bg: '#f0fdf4' },
    MEDIUM: { color: '#2563eb', bg: '#eff6ff' },
    HIGH: { color: '#d97706', bg: '#fffbeb' },
    URGENT: { color: '#dc2626', bg: '#fef2f2' },
};

const PriorityBadge = ({ priority }: { priority: string }) => {
    const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.LOW;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
            borderRadius: '5px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.04em', color: cfg.color, background: cfg.bg,
            fontFamily: "'Inter', system-ui",
        }}>
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
        let url = `/tickets/admin/all?skip=0&limit=100`;
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
            await api(`/tickets/admin/${selected.id}/status`, {
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
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0', fontFamily: "'Inter', system-ui", height: '100%' }}>

            {/* Top bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.025em', color: '#18181b', margin: 0 }}>
                        Support Tickets
                    </h1>
                    <p style={{ fontSize: '13px', color: '#71717a', marginTop: '3px' }}>{tickets.length} tickets total</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                        value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        style={{
                            height: '34px', padding: '0 10px', border: '1px solid #e4e4e7', borderRadius: '9px',
                            fontSize: '12.5px', color: '#52525b', background: 'white',
                            fontFamily: "'Inter', system-ui", cursor: 'pointer', outline: 'none',
                        }}
                    >
                        {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(s => (
                            <option key={s} value={s}>{s === 'ALL' ? 'Status: All' : s.replace('_', ' ')}</option>
                        ))}
                    </select>
                    <select
                        value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
                        style={{
                            height: '34px', padding: '0 10px', border: '1px solid #e4e4e7', borderRadius: '9px',
                            fontSize: '12.5px', color: '#52525b', background: 'white',
                            fontFamily: "'Inter', system-ui", cursor: 'pointer', outline: 'none',
                        }}
                    >
                        {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => (
                            <option key={p} value={p}>{p === 'ALL' ? 'Priority: All' : p}</option>
                        ))}
                    </select>
                    <button style={{
                        height: '34px', padding: '0 14px',
                        background: '#18181b', color: 'white', border: 'none', borderRadius: '9px',
                        fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                        fontFamily: "'Inter', system-ui",
                    }}>
                        + New Ticket
                    </button>
                </div>
            </div>

            {/* Split view */}
            <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0, height: 'calc(100vh - 180px)' }}>

                {/* Left: Ticket list */}
                <div style={{
                    width: '320px', flexShrink: 0, background: 'white', borderRadius: '16px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                }}>
                    <div style={{ padding: '14px 14px 0' }}>
                        <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#18181b', margin: '0 0 12px' }}>Support Tickets</h2>
                        {/* Search */}
                        <div style={{ position: 'relative', marginBottom: '12px' }}>
                            <Search size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
                            <input
                                type="text" placeholder="Search tickets..."
                                value={search} onChange={e => setSearch(e.target.value)}
                                style={{
                                    width: '100%', height: '34px', paddingLeft: '28px', paddingRight: '10px',
                                    border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '12.5px',
                                    color: '#18181b', background: '#f9f9f9', fontFamily: "'Inter', system-ui",
                                    outline: 'none', boxSizing: 'border-box',
                                }}
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <Loader2 size={20} style={{ animation: 'spin 0.8s linear infinite', color: '#3b82f6', margin: '0 auto' }} />
                            </div>
                        ) : filtered.map(ticket => (
                            <div key={ticket.id}
                                onClick={() => selectTicket(ticket)}
                                style={{
                                    padding: '12px 14px', borderBottom: '1px solid #f4f4f5', cursor: 'pointer',
                                    background: selected?.id === ticket.id ? '#eff6ff' : 'transparent',
                                    borderLeft: selected?.id === ticket.id ? '3px solid #3b82f6' : '3px solid transparent',
                                    transition: 'all 0.1s',
                                }}
                                onMouseEnter={e => { if (selected?.id !== ticket.id) e.currentTarget.style.background = '#f9f9f9'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = selected?.id === ticket.id ? '#eff6ff' : 'transparent'; }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#3b82f6' }}>#{ticket.id}</span>
                                    <MoreHorizontal size={13} style={{ color: '#d4d4d8' }} />
                                </div>
                                <p style={{
                                    fontSize: '13px', fontWeight: 600, color: '#18181b',
                                    margin: '0 0 3px', lineHeight: 1.3,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                    {ticket.subject || 'Support Request'}
                                </p>
                                <p style={{ fontSize: '11px', color: '#71717a', margin: '0 0 8px' }}>
                                    {(ticket as any).user_name || 'Customer'}
                                </p>
                                <PriorityBadge priority={ticket.priority || 'LOW'} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Chat thread */}
                {selected ? (
                    <div style={{
                        flex: 1, background: 'white', borderRadius: '16px',
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
                        display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    }}>
                        {/* Chat header */}
                        <div style={{
                            padding: '16px 20px', borderBottom: '1px solid #f4f4f5',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <div>
                                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#18181b', margin: 0 }}>
                                    {selected.subject || 'Support Request'}
                                </h2>
                                <p style={{ fontSize: '12px', color: '#71717a', margin: '3px 0 0' }}>
                                    #{selected.id} &bull; {(selected as any).user_name || 'Customer'} &bull; Created {new Date(selected.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {selected.status !== 'RESOLVED' && (
                                    <button
                                        onClick={markResolved}
                                        style={{
                                            height: '34px', padding: '0 14px',
                                            background: '#f4f4f5', color: '#52525b', border: 'none', borderRadius: '9px',
                                            fontSize: '12.5px', fontWeight: 600, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            fontFamily: "'Inter', system-ui",
                                        }}
                                    >
                                        <CheckCircle size={13} /> Mark Resolved
                                        <ChevronDown size={12} />
                                    </button>
                                )}
                                {selected.status === 'RESOLVED' && (
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px',
                                        background: '#f0fdf4', color: '#16a34a', borderRadius: '9px', fontSize: '12px', fontWeight: 600,
                                    }}>
                                        <CheckCircle size={12} /> Resolved
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* First message (customer request) */}
                            {selected.description && (
                                <div style={{
                                    padding: '14px 16px', background: '#f9f9f9', borderRadius: '12px',
                                    border: '1px solid #f0f0f0',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <p style={{ fontSize: '11px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                                            INCIDENT REPORT
                                        </p>
                                    </div>
                                    <p style={{ fontSize: '13px', color: '#3f3f46', lineHeight: 1.6, margin: 0 }}>
                                        "{selected.description}"
                                    </p>
                                    {(selected as any).order_id && (
                                        <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                                            <span style={{ fontSize: '11px', background: '#f4f4f5', padding: '3px 8px', borderRadius: '6px', color: '#52525b', fontWeight: 500 }}>
                                                PO-{(selected as any).order_id}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Thread messages */}
                            {msgs.map((msg, i) => {
                                const isAdmin = (msg as any).sender_type === 'admin' || (msg as any).is_admin;
                                return (
                                    <div key={i} style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start' }}>
                                        <div style={{
                                            maxWidth: '70%', padding: '12px 14px', borderRadius: '14px',
                                            background: isAdmin ? '#3b82f6' : '#f4f4f5',
                                            color: isAdmin ? 'white' : '#18181b',
                                        }}>
                                            <p style={{ fontSize: '13px', lineHeight: 1.5, margin: 0 }}>{msg.message}</p>
                                            <p style={{ fontSize: '10px', opacity: 0.6, marginTop: '6px', margin: '6px 0 0' }}>
                                                {isAdmin ? 'Admin' : (selected as any).user_name} &bull; {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}

                            {msgs.length === 0 && !selected.description && (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#a1a1aa' }}>
                                    <p style={{ fontSize: '13px', fontWeight: 500 }}>No messages yet</p>
                                </div>
                            )}
                        </div>

                        {/* Reply input */}
                        <div style={{ padding: '14px 20px', borderTop: '1px solid #f4f4f5', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                            <input
                                type="text"
                                placeholder={`Type a message to ${(selected as any).user_name || 'customer'}…`}
                                value={reply}
                                onChange={e => setReply(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                                style={{
                                    flex: 1, height: '40px', padding: '0 14px',
                                    border: '1px solid #e4e4e7', borderRadius: '10px', fontSize: '13px',
                                    color: '#18181b', background: '#f9f9f9', fontFamily: "'Inter', system-ui",
                                    outline: 'none',
                                }}
                            />
                            <button
                                onClick={sendReply}
                                disabled={sending || !reply.trim()}
                                style={{
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    background: reply.trim() ? '#3b82f6' : '#e4e4e7',
                                    border: 'none', cursor: reply.trim() ? 'pointer' : 'default',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'background 0.12s',
                                }}>
                                {sending
                                    ? <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite', color: 'white' }} />
                                    : <Send size={15} style={{ color: reply.trim() ? 'white' : '#a1a1aa' }} />
                                }
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{
                        flex: 1, background: 'white', borderRadius: '16px',
                        border: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                        color: '#d4d4d8', gap: '10px',
                    }}>
                        <div style={{ fontSize: '32px' }}>💬</div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#71717a', margin: 0 }}>Select a ticket</p>
                            <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '4px 0 0' }}>Choose a ticket from the list to view the conversation</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}