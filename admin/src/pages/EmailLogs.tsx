import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
    Mail, Search, Loader2, CheckCircle2, AlertCircle, Eye, Info, Clock
} from "lucide-react";

interface EmailLog {
    id: number;
    recipient: string;
    subject: string;
    status: string;
    message_id: string;
    sent_at: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
    delivered: { color: '#16a34a', bg: '#f0fdf4', icon: CheckCircle2 },
    opened: { color: '#2563eb', bg: '#eff6ff', icon: Eye },
    click: { color: '#8b5cf6', bg: '#f5f3ff', icon: Info },
    bounce: { color: '#dc2626', bg: '#fef2f2', icon: AlertCircle },
    soft_bounce: { color: '#ea580c', bg: '#fff7ed', icon: AlertCircle },
    failed: { color: '#991b1b', bg: '#fef2f2', icon: AlertCircle },
    pending: { color: '#71717a', bg: '#f4f4f5', icon: Clock },
};

const StatusPill = ({ status }: { status: string }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    const label = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
    
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px',
            background: cfg.bg, borderRadius: '999px', fontSize: '11px', fontWeight: 600,
            color: cfg.color, fontFamily: "'Inter', sans-serif",
        }}>
            <Icon size={12} strokeWidth={2.5} />
            {label}
        </span>
    );
};

export default function EmailLogs() {
    const [logs, setLogs] = useState<EmailLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await api<EmailLog[]>("/admin/notifications/email-logs");
            setLogs(data);
        } catch (err) {
            console.error("Failed to fetch email logs", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filtered = logs.filter(log => 
        log.recipient.toLowerCase().includes(search.toLowerCase()) ||
        log.subject.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="animate-fade-in" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '24px', 
            fontFamily: "'Inter', sans-serif" 
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: '#18181b', margin: 0 }}>
                        Email Logs
                    </h1>
                    <p style={{ fontSize: '14px', color: '#71717a', marginTop: '4px' }}>
                        Track delivery status, opens, and bounces for all outgoing emails.
                    </p>
                </div>
                
                <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
                    <input
                        type="text" 
                        placeholder="Search recipient or subject..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            height: '40px', paddingLeft: '36px', paddingRight: '12px', width: '280px',
                            border: '1px solid #e4e4e7', borderRadius: '10px', fontSize: '14px',
                            color: '#18181b', background: 'white', outline: 'none',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                    />
                </div>
            </div>

            {/* Table */}
            <div style={{ 
                background: 'white', 
                borderRadius: '12px', 
                border: '1px solid #e4e4e7',
                overflow: 'hidden',
                boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e4e4e7' }}>
                        <tr>
                            <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sent At</th>
                            <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recipient</th>
                            <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</th>
                            <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} style={{ padding: '60px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                        <Loader2 size={24} className="animate-spin" style={{ color: '#2563eb' }} />
                                        <span style={{ fontSize: '14px', color: '#71717a' }}>Loading logs...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: '60px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <Mail size={32} style={{ color: '#e4e4e7', marginBottom: '8px' }} />
                                        <span style={{ fontSize: '15px', fontWeight: 600, color: '#27272a' }}>No emails found</span>
                                        <span style={{ fontSize: '13px', color: '#71717a' }}>Try searching for something else or check back later.</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filtered.map((log) => (
                            <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                                <td style={{ padding: '16px 20px', fontSize: '13px', color: '#71717a' }}>
                                    {new Date(log.sent_at).toLocaleString('en-IN', {
                                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                    })}
                                </td>
                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{log.recipient}</div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '2px' }}>{log.message_id}</div>
                                </td>
                                <td style={{ padding: '16px 20px', fontSize: '14px', color: '#334155' }}>
                                    {log.subject}
                                </td>
                                <td style={{ padding: '16px 20px' }}>
                                    <StatusPill status={log.status} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
