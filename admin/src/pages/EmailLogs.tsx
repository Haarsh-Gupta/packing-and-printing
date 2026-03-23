import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
    Mail, Search, Loader2, CheckCircle2, AlertCircle, Eye, Info, Clock, ArrowUpRight
} from "lucide-react";

interface EmailLog {
    id: number;
    recipient: string;
    subject: string;
    status: string;
    message_id: string;
    sent_at: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any }> = {
    delivered: { color: '#34d399', bg: '#34d399/10', border: '#34d399/20', icon: CheckCircle2 },
    opened: { color: '#adc6ff', bg: '#1f70e3/10', border: '#1f70e3/20', icon: Eye },
    click: { color: '#c4b5fd', bg: '#8b5cf6/10', border: '#8b5cf6/20', icon: Info },
    bounce: { color: '#ffb4ab', bg: '#ffb4ab/10', border: '#ffb4ab/20', icon: AlertCircle },
    soft_bounce: { color: '#fcd34d', bg: '#f59e0b/10', border: '#f59e0b/20', icon: AlertCircle },
    failed: { color: '#ffb4ab', bg: '#ffb4ab/10', border: '#ffb4ab/20', icon: AlertCircle },
    pending: { color: '#c3c5d8', bg: '#434655/20', border: '#434655/40', icon: Clock },
};

const StatusPill = ({ status }: { status: string }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    const label = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
    
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[9px] font-bold uppercase tracking-widest border`}
            style={{ color: cfg.color, backgroundColor: `rgba(${cfg.bg})`, borderColor: `rgba(${cfg.border})` }}
        >
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
        <div className="flex flex-col h-full font-['Inter'] bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] px-2 pb-12 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                    <nav className="flex items-center gap-2 text-[10px] font-bold text-blue-600 dark:text-[#adc6ff] mb-2 tracking-widest uppercase">
                        <span>Communications</span>
                        <span>/</span>
                        <span className="text-slate-600 dark:text-[#c3c5d8]/60">Dispatch Log</span>
                    </nav>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-[#dae2fd] m-0">
                        Email Telemetry
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-[#c3c5d8] mt-1 m-0">
                        Track delivery status, opens, and bounces for all outbound nodes.
                    </p>
                </div>
                
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#434655]" />
                    <input
                        type="text" 
                        placeholder="Query target or subject vector..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="h-10 pl-9 pr-3 w-72 border border-slate-200 dark:border-[#434655]/40 rounded-lg text-xs font-mono text-blue-600 dark:text-[#adc6ff] bg-white dark:bg-[#131b2e] outline-none focus:border-blue-400 dark:border-[#adc6ff] placeholder:text-[#434655]/70 transition-colors"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 flex flex-col flex-1 overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto custom-scrollbar flex-1">
                    <table className="w-full border-collapse text-left">
                        <thead className="bg-slate-100 dark:bg-[#0b1326]/50 border-b border-slate-200 dark:border-[#434655]/20">
                            <tr>
                                <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-600 dark:text-[#c3c5d8]">Epoch</th>
                                <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-600 dark:text-[#c3c5d8]">Target Node</th>
                                <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-600 dark:text-[#c3c5d8]">Payload Subject</th>
                                <th className="px-6 py-4 text-[10px] uppercase font-bold tracking-[0.2em] text-slate-600 dark:text-[#c3c5d8]">Event State</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#434655]/10">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-16 text-center text-slate-600 dark:text-[#c3c5d8] font-bold tracking-widest text-[10px] uppercase">
                                        <Loader2 size={16} className="animate-spin text-blue-600 dark:text-[#adc6ff] mx-auto mb-2" />
                                        Querying Telemetry...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-16 text-center text-slate-600 dark:text-[#c3c5d8]/50 font-bold tracking-widest text-[10px] uppercase">
                                        <Mail size={32} className="opacity-20 mx-auto mb-3 block" />
                                        <p>No dispatch events matching query parameters.</p>
                                    </td>
                                </tr>
                            ) : filtered.map((log) => (
                                <tr key={log.id} className="group hover:bg-slate-50 dark:hover:bg-[#171f33]/80 transition-colors">
                                    <td className="px-6 py-5">
                                        <span className="text-[11px] font-bold text-slate-500 dark:text-[#8d90a1] uppercase tracking-wider">
                                            {new Date(log.sent_at).toLocaleString('en-IN', {
                                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-sm font-extrabold text-slate-900 dark:text-[#dae2fd] flex items-center gap-2">
                                            {log.recipient}
                                            <button className="text-[#434655] hover:text-blue-600 dark:hover:text-[#adc6ff] p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowUpRight size={14} />
                                            </button>
                                        </div>
                                        <div className="text-[10px] text-blue-600 dark:text-[#adc6ff] bg-[#adc6ff]/5 px-1.5 py-0.5 rounded border border-blue-400 dark:border-[#adc6ff]/10 font-mono tracking-widest inline-block mt-1.5">
                                            MSG_{log.message_id.slice(0, 12)}...
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-[13px] text-slate-600 dark:text-[#c3c5d8] font-medium max-w-sm truncate">
                                        {log.subject}
                                    </td>
                                    <td className="px-6 py-5">
                                        <StatusPill status={log.status} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
