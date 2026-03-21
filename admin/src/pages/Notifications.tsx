import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Notification } from "@/types";
import {
    Bell, Send, User, MoreHorizontal, ChevronDown,
    Bold, Italic, Underline, List, ListOrdered, Link,
    ArrowRight, Eye, MonitorSmartphone, Loader2
} from "lucide-react";

type TabId = "notifications" | "email";

export default function NotificationsEmailPage() {
    const [tab, setTab] = useState<TabId>("email");
    const [history, setHistory] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Added template type to align with your Python backend templates
    const [form, setForm] = useState({
        to: "All Users",
        subject: "Your Order is Ready for Pickup!",
        message: "Your order #1042 has been completed and is ready for pickup at our workshop.\n\nPlease bring your order confirmation when you visit.",
        template: "admin_notice"
    });

    const emailLogs = [
        { to: 'admin@example.com', subject: 'System Update Scheduled', status: 'Sent', date: 'Oct 24, 10:00 AM' },
        { to: 'user1@example.com', subject: 'Your Order is Shipped', status: 'Sent', date: 'Oct 24, 09:15 AM' },
        { to: 'user2@example.com', subject: 'Payment Failed', status: 'Failed', date: 'Oct 23, 16:30 PM' },
        { to: 'all_users@example.com', subject: 'New Feature Announcement', status: 'Pending', date: 'Oct 25, 12:00 PM' },
    ];

    const fetchHistory = () => {
        setLoading(true);
        setTimeout(() => {
            setHistory([]);
            setLoading(false);
        }, 500);
    };

    useEffect(() => { fetchHistory(); }, []);

    const sendEmail = async () => {
        if (!form.subject || !form.message) return;
        setSending(true);
        setTimeout(() => {
            setForm({ ...form, subject: "", message: "" });
            setSending(false);
            alert("Broadcast email sent!");
        }, 1500);
    };

    return (
        <div className="flex flex-col h-full font-['Inter'] bg-[#0b1326] text-[#dae2fd] px-2 pb-12 animate-fade-in">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                    <nav className="flex items-center gap-2 text-[10px] font-bold text-[#adc6ff] mb-2 tracking-widest uppercase">
                        <span>Communications</span>
                        <span>/</span>
                        <span className="text-[#c3c5d8]/60">Alerts & Dispatch</span>
                    </nav>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#dae2fd] m-0">
                        Notifications Center
                    </h1>
                </div>
                
                <div className="flex bg-[#131b2e] border border-[#434655]/30 rounded-lg p-1 shrink-0 h-fit">
                    <button
                        onClick={() => setTab("notifications")}
                        className={`px-5 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${
                            tab === "notifications"
                                ? 'bg-[#1f70e3] text-white shadow-sm' 
                                : 'bg-transparent text-[#8d90a1] hover:text-[#dae2fd]'
                        }`}
                    >
                        App Notifications
                    </button>
                    <button
                        onClick={() => setTab("email")}
                        className={`px-5 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${
                            tab === "email"
                                ? 'bg-[#1f70e3] text-white shadow-sm' 
                                : 'bg-transparent text-[#8d90a1] hover:text-[#dae2fd]'
                        }`}
                    >
                        Email Broadcast
                    </button>
                </div>
            </div>

            {/* Email Center Tab Content */}
            {tab === "email" && (
                <div className="flex flex-col gap-6 w-full pb-20">

                    {/* 1. RECENT EMAILS */}
                    <div className="bg-[#131b2e] rounded-2xl border border-[#434655]/20 shadow-sm flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#434655]/20 bg-[#060e20]/50 flex justify-between items-center">
                            <h2 className="text-[11px] uppercase tracking-widest font-extrabold text-[#dae2fd] m-0">Recent Dispatch Events</h2>
                            <button className="text-[10px] font-bold uppercase tracking-widest text-[#adc6ff] hover:text-white transition-colors flex items-center gap-2 border-none bg-transparent cursor-pointer">
                                Audit Logs <ArrowRight size={14} />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#0b1326] border-b border-[#434655]/10">
                                    <tr>
                                        {['Target Node', 'Payload Subject', 'State', 'Epoch'].map(h => (
                                            <th key={h} className="px-6 py-4 text-[10px] uppercase font-bold tracking-[0.2em] text-[#c3c5d8]">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#434655]/10">
                                    {emailLogs.map((log, i) => (
                                        <tr key={i} className="group hover:bg-[#171f33]/80 transition-colors">
                                            <td className="px-6 py-4 text-xs font-mono text-[#adc6ff]">{log.to}</td>
                                            <td className="px-6 py-4 text-[13px] font-extrabold text-[#dae2fd]">{log.subject}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[9px] font-bold uppercase tracking-widest border ${
                                                    log.status === 'Sent' 
                                                        ? 'bg-[#34d399]/10 text-[#34d399] border-[#34d399]/20' :
                                                    log.status === 'Failed' 
                                                        ? 'bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/20' :
                                                          'bg-[#f59e0b]/10 text-[#fcd34d] border-[#f59e0b]/20'
                                                    }`}>
                                                    {log.status === 'Sent' && <div className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />}
                                                    {log.status === 'Failed' && <div className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]" />}
                                                    {log.status === 'Pending' && <div className="w-1.5 h-1.5 rounded-full bg-[#fcd34d] animate-pulse" />}
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-[11px] font-bold text-[#8d90a1] uppercase tracking-wider">{log.date}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 2. THE 70/30 SPLIT GRID */}
                    <div className="grid grid-cols-1 xl:grid-cols-10 gap-6 items-start w-full min-h-[600px]">

                        {/* LEFT SIDE: 70% COMPOSER FORM */}
                        <div className="xl:col-span-7 bg-[#131b2e] rounded-2xl border border-[#434655]/20 shadow-sm flex flex-col overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#434655]/20 bg-[#060e20]/50">
                                <h2 className="text-[11px] uppercase tracking-widest font-extrabold text-[#dae2fd] m-0">Payload Composer</h2>
                            </div>

                            <div className="p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#c3c5d8]">Target Group</label>
                                        <div className="relative">
                                            <select
                                                className="w-full h-11 rounded-lg border border-[#434655]/40 px-3 text-sm font-bold bg-[#0b1326] text-[#dae2fd] outline-none focus:border-[#adc6ff] transition-colors appearance-none"
                                                value={form.to} onChange={e => setForm({ ...form, to: e.target.value })}
                                            >
                                                <option>All Users</option>
                                                <option>Admins Only</option>
                                                <option>Active Customers</option>
                                                <option>Newsletter Subscribers</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#434655]">
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-[#c3c5d8]">Base Structure</label>
                                        <div className="relative">
                                            <select
                                                className="w-full h-11 rounded-lg border border-[#434655]/40 px-3 text-sm font-bold bg-[#0b1326] text-[#dae2fd] outline-none focus:border-[#adc6ff] transition-colors appearance-none"
                                                value={form.template} onChange={e => setForm({ ...form, template: e.target.value })}
                                            >
                                                <option value="admin_notice">Admin Notice</option>
                                                <option value="custom_greeting">Custom Greeting</option>
                                                <option value="reminder">Payment Reminder</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#434655]">
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#c3c5d8]">Subject Line</label>
                                    <input
                                        type="text" placeholder="Enter transmission subject"
                                        className="w-full h-11 rounded-lg border border-[#434655]/40 px-3 text-sm font-bold bg-[#0b1326] text-[#dae2fd] outline-none focus:border-[#adc6ff] transition-colors placeholder:text-[#434655]"
                                        value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#c3c5d8]">Message Body</label>
                                    <div className="border border-[#434655]/40 rounded-lg overflow-hidden bg-[#0b1326] focus-within:border-[#adc6ff] transition-colors">
                                        <div className="flex items-center gap-1 border-b border-[#434655]/40 px-3 py-2 bg-[#131b2e]">
                                            {[Bold, Italic, Underline].map((Icon, i) => (
                                                <button key={i} className="p-1.5 text-[#8d90a1] hover:text-[#dae2fd] rounded-md hover:bg-[#171f33] transition-colors border-none bg-transparent cursor-pointer" type="button">
                                                    <Icon size={16} strokeWidth={2.5} />
                                                </button>
                                            ))}
                                            <div className="w-px h-5 bg-[#434655]/40 mx-2"></div>
                                            {[List, ListOrdered].map((Icon, i) => (
                                                <button key={i} className="p-1.5 text-[#8d90a1] hover:text-[#dae2fd] rounded-md hover:bg-[#171f33] transition-colors border-none bg-transparent cursor-pointer" type="button">
                                                    <Icon size={16} strokeWidth={2.5} />
                                                </button>
                                            ))}
                                            <div className="w-px h-5 bg-[#434655]/40 mx-2"></div>
                                            <button className="p-1.5 text-[#8d90a1] hover:text-[#dae2fd] rounded-md hover:bg-[#171f33] transition-colors border-none bg-transparent cursor-pointer" type="button">
                                                <Link size={16} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                        <textarea
                                            rows={12} placeholder="Compile your payload here..."
                                            className="w-full p-4 bg-transparent text-sm text-[#dae2fd] outline-none resize-y min-h-[200px] placeholder:text-[#434655]"
                                            value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Footer Submit */}
                            <div className="p-6 border-t border-[#434655]/20 bg-[#060e20]/50 shrink-0">
                                <button
                                    onClick={sendEmail} disabled={sending || !form.subject || !form.message}
                                    type="button"
                                    className={`w-full h-12 rounded-xl text-[11px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_4px_12px_rgba(173,198,255,0.2)] ${
                                        (sending || !form.subject || !form.message)
                                            ? 'bg-[#434655]/30 text-[#8d90a1] cursor-not-allowed shadow-none'
                                            : 'bg-[#adc6ff] hover:bg-white text-[#001a42]'
                                    }`}
                                >
                                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    {sending ? "Transmitting payload..." : "Initiate Sequence"}
                                </button>
                            </div>
                        </div>

                        {/* RIGHT SIDE: 30% LIVE PREVIEW */}
                        <div className="xl:col-span-3 flex flex-col gap-6 sticky top-6">
                            <div className="bg-[#131b2e] rounded-2xl border border-[#434655]/20 shadow-sm flex flex-col overflow-hidden h-[600px]">
                                <div className="px-6 py-4 border-b border-[#434655]/20 bg-[#060e20]/50 flex items-center justify-between">
                                    <h3 className="text-[11px] font-extrabold text-[#dae2fd] uppercase tracking-widest flex items-center gap-2 m-0">
                                        <Eye size={16} className="text-[#adc6ff]" /> Output Render
                                    </h3>
                                </div>

                                {/* Simulated Email Client Window */}
                                <div className="flex flex-col flex-1 isolate">
                                    {/* Email Header Info */}
                                    <div className="bg-white p-5 border-b border-[#e5e7eb] flex flex-col gap-2 relative z-10 shadow-sm">
                                        <div className="grid grid-cols-[50px_1fr] gap-x-2 text-[10px] font-sans">
                                            <span className="font-bold text-[#94a3b8] uppercase tracking-wider text-right">From:</span>
                                            <span className="font-semibold text-[#0f172a]">Navart System &lt;hello@navart.in&gt;</span>
                                            <span className="font-bold text-[#94a3b8] uppercase tracking-wider text-right">To:</span>
                                            <span className="font-semibold text-[#2563eb]">{form.to}</span>
                                        </div>
                                        <h4 className="text-sm font-extrabold text-[#020617] mt-2 leading-tight tracking-tight">
                                            {form.subject || "UNLISTED SUBJECT"}
                                        </h4>
                                    </div>

                                    {/* Rendered HTML Email Body */}
                                    <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-[#f8fafc]">
                                        <div className="bg-white w-full max-w-[400px] h-fit rounded-xl border border-[#e2e8f0] overflow-hidden flex flex-col shadow-sm">

                                            {/* Mock Email Brand Header */}
                                            <div className="bg-[#0f172a] px-6 py-4 flex justify-center">
                                                <span className="text-white font-extrabold tracking-[0.2em] text-[10px]">NAVART.IN</span>
                                            </div>

                                            {/* Mock Email Content Area */}
                                            <div className="p-6 md:p-8 flex flex-col gap-5">
                                                <p className="text-[13px] text-[#334155] font-serif m-0">
                                                    Hello <span className="font-bold text-[#0f172a]">Customer Identity</span>,
                                                </p>

                                                <div className="text-[13px] text-[#475569] leading-relaxed whitespace-pre-wrap font-serif m-0 min-h-[100px]">
                                                    {form.message || (
                                                        <span className="text-[#cbd5e1] italic tracking-widest uppercase font-mono text-[10px] font-bold">Awaiting Input Stream...</span>
                                                    )}
                                                </div>

                                                {/* Mock Action Button based on Python Template logic */}
                                                {form.template === 'admin_notice' && form.message && (
                                                    <div className="pt-2">
                                                        <div className="inline-block bg-[#2563eb] text-white text-[10px] uppercase tracking-widest font-extrabold px-6 py-3 rounded-lg w-full text-center">
                                                            Acknowledge Receipt
                                                        </div>
                                                    </div>
                                                )}

                                                {form.template === 'custom_greeting' && form.message && (
                                                    <div className="pt-2">
                                                        <div className="inline-block bg-[#0f172a] text-white text-[10px] uppercase tracking-widest font-extrabold px-6 py-3 rounded-lg w-full text-center">
                                                            View Catalog 🎁
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Mock Email Footer */}
                                            <div className="bg-[#f8fafc] p-5 text-center border-t border-[#f1f5f9]">
                                                <p className="text-[9px] text-[#94a3b8] font-bold uppercase tracking-widest m-0 font-mono">
                                                    © 2026 Navart Automated Systems.<br />All rights reserved.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {tab === "notifications" && (
                <div className="flex flex-col items-center justify-center p-20 bg-[#131b2e] rounded-2xl border border-[#434655]/20 shadow-sm text-[#434655] min-h-[400px]">
                    <Bell size={48} className="mb-4 opacity-50" />
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#8d90a1] m-0 mb-2">Notification System Disabled</p>
                    <p className="text-[10px] text-[#434655] font-medium m-0 max-w-sm text-center">App notifications are currently not recorded in this environment. Use Email Broadcast for user communication.</p>
                </div>
            )}
        </div>
    );
}