import { useState } from "react";
import {
    Mail, Send, Users, User, Paperclip, Eye,
    Loader2, Trash2, Info
} from "lucide-react";

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-[#c3c5d8] mb-2 font-['Inter']">
        {children}
    </label>
);

const Chip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#434655]/30 border border-slate-200 dark:border-[#434655]/40 rounded-lg text-[11px] font-bold text-slate-900 dark:text-[#dae2fd] transition-colors hover:border-[#434655] group">
        <Paperclip size={12} className="text-slate-500 dark:text-[#8d90a1]" />
        {label.length > 24 ? label.slice(0, 24) + '…' : label}
        <button onClick={onRemove} className="opacity-50 hover:opacity-100 hover:text-[#ffb4ab] transition-all p-0.5 ml-1">
            <Trash2 size={12} />
        </button>
    </div>
);

export default function Email() {
    const [form, setForm] = useState({
        subject: "", message: "", user_id: "", attachments: [] as File[]
    });
    const [sending, setSending] = useState(false);
    const [mode, setMode] = useState<'single' | 'broadcast'>('single');

    const sendEmail = async (global = false) => {
        if (!form.subject || !form.message) return;
        if (!global && !form.user_id) return;
        setSending(true);
        const formData = new FormData();
        formData.append("subject", form.subject);
        formData.append("message", form.message);
        if (form.user_id && !global) formData.append("user_id", form.user_id);
        form.attachments.forEach(file => formData.append("files", file));
        const path = global ? "/admin/send-custom-email-to-all" : "/admin/send-custom-email-to-user";
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
                body: formData,
            });
            if (!res.ok) throw new Error();
            alert("Email dispatched successfully!");
            setForm({ subject: "", message: "", user_id: "", attachments: [] });
        } catch { alert("Failed to send email."); } finally { setSending(false); }
    };

    const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setForm(f => ({ ...f, attachments: [...f.attachments, ...Array.from(e.target.files!)] }));
    };

    const canSend = form.subject && form.message && (mode === 'broadcast' || form.user_id);

    return (
        <div className="flex flex-col h-full font-['Inter'] bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] px-2 pb-12 animate-fade-in">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                    <nav className="flex items-center gap-2 text-[10px] font-bold text-blue-600 dark:text-[#adc6ff] mb-2 tracking-widest uppercase">
                        <span>Communications</span>
                        <span>/</span>
                        <span className="text-slate-600 dark:text-[#c3c5d8]/60">Compiler (Legacy)</span>
                    </nav>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-[#dae2fd] m-0">
                        Raw Dispatcher
                        <span className="text-[10px] font-bold text-[#1f70e3] bg-[#1f70e3]/10 px-2 py-1 rounded ml-3 tracking-widest uppercase align-middle">
                            MTA Service Ready
                        </span>
                    </h1>
                </div>
                <div className="flex p-1 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/30 rounded-lg shrink-0 h-fit">
                    <button
                        onClick={() => setMode('single')}
                        className={`flex items-center gap-2 px-5 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${
                            mode === 'single'
                                ? 'bg-[#1f70e3] text-white shadow-sm'
                                : 'bg-transparent text-slate-500 dark:text-[#8d90a1] hover:text-slate-900 dark:hover:text-[#dae2fd]'
                        }`}
                    ><User size={14} /> Direct</button>
                    <button
                        onClick={() => setMode('broadcast')}
                        className={`flex items-center gap-2 px-5 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${
                            mode === 'broadcast'
                                ? 'bg-[#1f70e3] text-white shadow-sm'
                                : 'bg-transparent text-slate-500 dark:text-[#8d90a1] hover:text-slate-900 dark:hover:text-[#dae2fd]'
                        }`}
                    ><Users size={14} /> Broadcast</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-6 flex-1 min-h-[600px] items-start">

                {/* Composition Terminal */}
                <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/20 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-[#434655]/20 bg-slate-100 dark:bg-[#0b1326]/50 flex items-center gap-3">
                        <Mail size={16} className="text-blue-600 dark:text-[#adc6ff]" />
                        <div>
                            <h2 className="text-[11px] uppercase tracking-widest font-extrabold text-slate-900 dark:text-[#dae2fd] m-0">Compose Terminal</h2>
                            <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-slate-500 dark:text-[#8d90a1] m-0 mt-0.5">Ready for dispatch</p>
                        </div>
                        {mode === 'broadcast' && (
                            <div className="ml-auto px-2 py-1 bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 text-[#ffb4ab] rounded text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]" />
                                Broadcast Active
                            </div>
                        )}
                    </div>

                    <div className="p-6 flex flex-col gap-6">
                        {mode === 'single' && (
                            <div className="flex flex-col">
                                <FieldLabel>Target Recipient</FieldLabel>
                                <div className="relative">
                                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#434655]" />
                                    <input
                                        placeholder="Enter numeric User ID..."
                                        value={form.user_id}
                                        onChange={e => setForm({ ...form, user_id: e.target.value })}
                                        className="w-full h-11 pl-9 pr-3 rounded-lg border border-slate-200 dark:border-[#434655]/40 bg-slate-50 dark:bg-[#0b1326] text-sm font-bold text-slate-900 dark:text-[#dae2fd] outline-none focus:border-blue-400 dark:border-[#adc6ff] transition-colors placeholder:text-[#434655]"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col">
                            <FieldLabel>Subject Line</FieldLabel>
                            <input
                                placeholder="Formal subject of the communication..."
                                value={form.subject}
                                onChange={e => setForm({ ...form, subject: e.target.value })}
                                className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-[#434655]/40 bg-slate-50 dark:bg-[#0b1326] text-sm font-bold text-slate-900 dark:text-[#dae2fd] outline-none focus:border-blue-400 dark:border-[#adc6ff] transition-colors placeholder:text-[#434655]"
                            />
                        </div>

                        <div className="flex flex-col">
                            <FieldLabel>Message Content (HTML Allowed)</FieldLabel>
                            <textarea
                                placeholder="Write your message here. Basic HTML supported for rich formatting."
                                value={form.message}
                                onChange={e => setForm({ ...form, message: e.target.value })}
                                className="w-full min-h-[320px] p-4 rounded-lg border border-slate-200 dark:border-[#434655]/40 bg-slate-50 dark:bg-[#0b1326] text-sm text-slate-900 dark:text-[#dae2fd] outline-none resize-y focus:border-blue-400 dark:border-[#adc6ff] transition-colors placeholder:text-[#434655]"
                            />
                        </div>

                        <div className="flex flex-col">
                            <FieldLabel>Binary Attachments</FieldLabel>
                            <div className={`flex flex-wrap gap-2 ${form.attachments.length > 0 ? 'mb-3' : ''}`}>
                                {form.attachments.map((file, i) => (
                                    <Chip key={i} label={file.name} onRemove={() => setForm(f => ({ ...f, attachments: f.attachments.filter((_, j) => j !== i) }))} />
                                ))}
                            </div>
                            <div className="relative inline-flex">
                                <input type="file" multiple onChange={addFiles} className="absolute inset-0 opacity-0 cursor-pointer z-10" title="" />
                                <button className="h-10 px-6 bg-transparent hover:bg-white dark:hover:bg-[#131b2e] border border-dashed border-[#434655] rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-[#8d90a1] hover:text-blue-600 dark:hover:text-[#adc6ff] hover:border-blue-400 dark:hover:border-[#adc6ff]/50 transition-all flex items-center gap-2">
                                    <Paperclip size={14} /> Select Files
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-200 dark:border-[#434655]/20 bg-slate-100 dark:bg-[#0b1326]/50">
                        <button
                            onClick={() => sendEmail(mode === 'broadcast')}
                            disabled={sending || !canSend}
                            className={`w-full h-12 rounded-xl text-[11px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_4px_12px_rgba(173,198,255,0.2)] ${
                                (sending || !canSend)
                                    ? 'bg-[#434655]/30 text-slate-500 dark:text-[#8d90a1] cursor-not-allowed shadow-none'
                                    : 'bg-[#adc6ff] hover:bg-white text-[#001a42]'
                            }`}
                        >
                            {sending ? (
                                <><Loader2 size={16} className="animate-spin" /> Transmitting...</>
                            ) : mode === 'single' ? (
                                <><Send size={16} /> Dispatch To Node</>
                            ) : (
                                <><Users size={16} /> Commit Global Broadcast</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Live Output Preview */}
                <div className="flex flex-col gap-5 sticky top-6">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-600 dark:text-[#c3c5d8] m-0">Live Render Terminal</p>
                        <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-[#ffb4ab]" />
                            <div className="w-2 h-2 rounded-full bg-[#fcd34d]" />
                            <div className="w-2 h-2 rounded-full bg-[#34d399]" />
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 dark:border-[#434655]/40 rounded-xl overflow-hidden shadow-xl flex flex-col min-h-[600px] text-black isolate">
                        {/* Headers */}
                        <div className="p-6 border-b border-[#e5e7eb] bg-[#f8fafc]">
                            <div className="flex flex-col gap-3">
                                <div className="grid grid-cols-[80px_1fr] gap-2 text-[11px] font-['Inter']">
                                    <span className="font-bold text-[#94a3b8] tracking-widest uppercase">From:</span>
                                    <span className="font-semibold text-[#0f172a]">no-reply@bookbind.in</span>

                                    <span className="font-bold text-[#94a3b8] tracking-widest uppercase">To:</span>
                                    <span className="font-bold text-[#2563eb]">
                                        {mode === 'broadcast' ? 'all-active-users@bookbind.in' : form.user_id ? `UserID #${form.user_id}` : '...'}
                                    </span>

                                    <span className="font-bold text-[#94a3b8] tracking-widest uppercase mt-3">Subject:</span>
                                    <span className="font-extrabold text-[#020617] text-sm tracking-tight mt-3">
                                        {form.subject || 'UNLISTED SUBJECT'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 p-8 bg-white overflow-y-auto">
                            {form.message ? (
                                <div className="text-[14px] leading-relaxed text-[#334155] font-serif break-words">
                                    <div dangerouslySetInnerHTML={{ __html: form.message }} />
                                </div>
                            ) : (
                                <div className="h-[300px] flex flex-col items-center justify-center text-[#94a3b8]/40">
                                    <Mail size={48} className="mb-4" />
                                    <p className="text-[10px] font-bold tracking-widest uppercase font-mono">Awaiting Input Stream</p>
                                </div>
                            )}

                            {form.attachments.length > 0 && (
                                <div className="mt-10 pt-6 border-t-2 border-[#f1f5f9]">
                                    <p className="text-[10px] font-bold text-[#94a3b8] tracking-widest uppercase mb-4">
                                        Manifested Assets ({form.attachments.length})
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        {form.attachments.map((f, i) => (
                                            <div key={i} className="px-3 py-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] flex items-center gap-3">
                                                <Paperclip size={14} className="text-[#94a3b8]" />
                                                <span className="text-xs font-bold text-[#475569] truncate flex-1">{f.name}</span>
                                                <span className="text-[10px] font-bold text-[#cbd5e1] uppercase tracking-wider shrink-0 font-mono">{(f.size / 1024).toFixed(1)} KB</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-[#f1f5f9] bg-[#f8fafc] text-center">
                            <p className="text-[9px] font-bold text-[#cbd5e1] tracking-widest uppercase font-mono">
                                © 2026 Navart Automated Envelope Service
                            </p>
                        </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/30 rounded-xl flex gap-3 shadow-sm">
                        <Info size={16} className="text-slate-500 dark:text-[#8d90a1] shrink-0 mt-0.5" />
                        <p className="text-[11px] font-medium text-slate-500 dark:text-[#8d90a1] leading-relaxed m-0">
                            The visual render terminal simulates standard client interpretation. Use inline styles for cross-client reliability. Dark mode overrides may vary by client.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}