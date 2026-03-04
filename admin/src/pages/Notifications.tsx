import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Notification } from "@/types";
import {
    Bell, Send, User, MoreHorizontal, ChevronDown,
    Bold, Italic, Underline, List, ListOrdered, Link,
    ArrowRight, Eye, MonitorSmartphone
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
        <div className="min-h-screen w-full bg-[#f9f9f9] dark:bg-[#18181a] font-['Inter',system-ui] text-base text-slate-900 dark:text-slate-100 flex flex-col items-center py-8 overflow-x-hidden">

            {/* Expanded to max-w-[1400px] for a true "Full Screen" feel */}
            <div className="flex flex-col w-full max-w-[1400px] px-6 lg:px-12">

                {/* Page Title & Subtitle */}
                <div className="flex flex-wrap justify-between gap-3 pb-8">
                    <div className="flex min-w-72 flex-col gap-3">
                        <h1 className="text-slate-900 dark:text-white tracking-tight text-4xl font-extrabold leading-tight">
                            Notifications & Email
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-base font-medium">
                            Manage system notifications and broadcast emails.
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-10 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex gap-10">
                        <button
                            onClick={() => setTab("notifications")}
                            className={`flex flex-col items-center justify-center border-b-[3px] pb-4 pt-2 transition-colors ${tab === "notifications"
                                ? "border-b-[#18181b] dark:border-b-white text-[#18181b] dark:text-white"
                                : "border-b-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                                }`}
                        >
                            <span className="text-sm font-bold tracking-wide">Notifications</span>
                        </button>
                        <button
                            onClick={() => setTab("email")}
                            className={`flex flex-col items-center justify-center border-b-[3px] pb-4 pt-2 transition-colors ${tab === "email"
                                ? "border-b-[#18181b] dark:border-b-white text-[#18181b] dark:text-white"
                                : "border-b-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                                }`}
                        >
                            <span className="text-sm font-bold tracking-wide">Email Center</span>
                        </button>
                    </div>
                </div>

                {/* Email Center Tab Content */}
                {tab === "email" && (
                    <div className="flex flex-col gap-12 w-full pb-20">

                        {/* 1. FULL SCREEN RECENT EMAILS */}
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden w-full">
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-tight">Recent Email Logs</h2>
                                <button className="text-sm font-bold text-slate-500 hover:text-[#18181b] dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-2">
                                    View All Logs <ArrowRight size={16} />
                                </button>
                            </div>
                            <div className="overflow-x-auto p-4">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800">
                                            {['To', 'Subject', 'Status', 'Date Sent'].map(h => (
                                                <th key={h} className="py-5 px-6 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                        {emailLogs.map((log, i) => (
                                            <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                                                <td className="py-5 px-6 text-sm font-medium text-slate-600 dark:text-slate-300">{log.to}</td>
                                                <td className="py-5 px-6 text-sm font-bold text-slate-900 dark:text-white">{log.subject}</td>
                                                <td className="py-5 px-6">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${log.status === 'Sent' ? 'bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                        log.status === 'Failed' ? 'bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                            'bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                        }`}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td className="py-5 px-6 text-sm text-slate-400 dark:text-slate-500">{log.date}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 2. THE 70/30 SPLIT GRID */}
                        <div className="grid grid-cols-1 xl:grid-cols-10 gap-8 items-start w-full">

                            {/* LEFT SIDE: 70% COMPOSER FORM */}
                            <div className="xl:col-span-7 bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 p-8 lg:p-10">
                                <div className="flex flex-col gap-8">
                                    <div>
                                        <h2 className="text-slate-900 dark:text-white text-2xl font-extrabold leading-tight tracking-tight mb-2">Broadcast Email</h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Compose and send emails using your predefined backend templates.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-3">
                                            <label className="text-sm font-bold text-slate-800 dark:text-slate-200">To</label>
                                            <div className="relative">
                                                <select
                                                    className="py-3.5 pl-5 pr-10 block w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:border-[#18181b] focus:ring-[#18181b] sm:text-sm appearance-none outline-none transition-colors"
                                                    value={form.to} onChange={e => setForm({ ...form, to: e.target.value })}
                                                >
                                                    <option>All Users</option>
                                                    <option>Admins Only</option>
                                                    <option>Active Customers</option>
                                                    <option>Newsletter Subscribers</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                                    <ChevronDown size={20} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Template</label>
                                            <div className="relative">
                                                <select
                                                    className="py-3.5 pl-5 pr-10 block w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:border-[#18181b] focus:ring-[#18181b] sm:text-sm appearance-none outline-none transition-colors"
                                                    value={form.template} onChange={e => setForm({ ...form, template: e.target.value })}
                                                >
                                                    <option value="admin_notice">Admin Notice</option>
                                                    <option value="custom_greeting">Custom Greeting</option>
                                                    <option value="reminder">Payment Reminder</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                                    <ChevronDown size={20} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Subject</label>
                                        <input
                                            type="text" placeholder="Enter email subject"
                                            className="py-3.5 px-5 block w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:border-[#18181b] focus:ring-[#18181b] sm:text-sm outline-none transition-colors"
                                            value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <label className="text-sm font-bold text-slate-800 dark:text-slate-200">Message</label>
                                        <div className="border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/50 focus-within:border-[#18181b] focus-within:ring-1 focus-within:ring-[#18181b] transition-colors">
                                            <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 px-4 py-3 bg-white dark:bg-slate-800/80">
                                                {[Bold, Italic, Underline].map((Icon, i) => (
                                                    <button key={i} className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" type="button">
                                                        <Icon size={18} strokeWidth={2.5} />
                                                    </button>
                                                ))}
                                                <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-2"></div>
                                                {[List, ListOrdered].map((Icon, i) => (
                                                    <button key={i} className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" type="button">
                                                        <Icon size={18} strokeWidth={2.5} />
                                                    </button>
                                                ))}
                                                <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-2"></div>
                                                <button className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" type="button">
                                                    <Link size={18} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                            <textarea
                                                rows={12} placeholder="Compose your email here..."
                                                className="py-5 px-6 block w-full border-0 bg-transparent text-slate-900 dark:text-white focus:ring-0 sm:text-base resize-y outline-none leading-relaxed"
                                                value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            onClick={sendEmail} disabled={sending || !form.subject || !form.message}
                                            type="button"
                                            className="inline-flex items-center justify-center rounded-full bg-[#18181b] px-8 py-4 text-sm font-bold text-white shadow-lg hover:bg-zinc-800 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed gap-2"
                                        >
                                            <Send size={18} />
                                            {sending ? "Sending Email..." : "Send Broadcast"}
                                        </button>
                                    </div>

                                </div>
                            </div>

                            {/* RIGHT SIDE: 30% LIVE PREVIEW */}
                            {/* 'sticky top-8' keeps the preview visible even if the form is long */}
                            <div className="xl:col-span-3 flex flex-col gap-6 sticky top-8">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Eye size={16} /> Live Preview
                                    </h3>
                                    <MonitorSmartphone size={16} className="text-slate-400" />
                                </div>

                                {/* Simulated Email Client Window */}
                                <div className="bg-[#f3f4f6] dark:bg-[#0f0f11] rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col h-[700px]">

                                    {/* Email Header Info */}
                                    <div className="bg-white dark:bg-slate-900 p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-1">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">From: <span className="text-slate-900 dark:text-white">Navart System &lt;hello@navart.in&gt;</span></p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">To: <span className="text-slate-900 dark:text-white">{form.to}</span></p>
                                        <h4 className="text-base font-bold text-slate-900 dark:text-white mt-2 leading-tight">
                                            {form.subject || "Email Subject Line"}
                                        </h4>
                                    </div>

                                    {/* Rendered HTML Email Body mimicking preview_templates.py */}
                                    <div className="flex-1 overflow-y-auto p-4 md:p-6 flex justify-center bg-[#f9fafb] dark:bg-black/50">
                                        <div className="bg-white dark:bg-slate-900 w-full max-w-[400px] h-fit rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">

                                            {/* Mock Email Brand Header */}
                                            <div className="bg-slate-900 px-6 py-4 flex justify-center">
                                                <span className="text-white font-extrabold tracking-widest text-sm">NAVART.IN</span>
                                            </div>

                                            {/* Mock Email Content Area */}
                                            <div className="p-6 md:p-8 flex flex-col gap-6">
                                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                                    Hello <span className="font-bold text-slate-900 dark:text-white">Customer</span>,
                                                </p>

                                                <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap font-medium">
                                                    {form.message || (
                                                        <span className="text-slate-300 dark:text-slate-600 italic">Your email content will be rendered here...</span>
                                                    )}
                                                </div>

                                                {/* Mock Action Button based on Python Template logic */}
                                                {form.template === 'admin_notice' && form.message && (
                                                    <div className="pt-2">
                                                        <div className="inline-block bg-blue-600 text-white text-xs font-bold px-6 py-3 rounded-lg w-full text-center">
                                                            View Order Details
                                                        </div>
                                                    </div>
                                                )}

                                                {form.template === 'custom_greeting' && form.message && (
                                                    <div className="pt-2">
                                                        <div className="inline-block bg-slate-900 text-white text-xs font-bold px-6 py-3 rounded-lg w-full text-center">
                                                            Shop Now 🎁
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Mock Email Footer */}
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 text-center border-t border-slate-100 dark:border-slate-800">
                                                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                                    © 2026 Navart Packing & Printing.<br />All rights reserved.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}