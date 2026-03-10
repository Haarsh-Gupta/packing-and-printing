import { useEffect, useState } from "react";
import { api, apiFormData } from "@/lib/api";
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
        customRecipient: "",
        subject: "Your Order is Ready for Pickup!",
        message: "Your order #1042 has been completed and is ready for pickup at our workshop.\n\nPlease bring your order confirmation when you visit.",
        template: "admin_notice"
    });

    const [emailLogs, setEmailLogs] = useState<any[]>([]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const data = await api<Notification[]>('/notifications/admin/all');
            setHistory(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 30000);
        return () => clearInterval(interval);
    }, []);

    const sendEmail = async () => {
        if (!form.subject || !form.message) return;
        if (form.to === "Specific User (Email)" && !form.customRecipient) {
            alert("Please enter a recipient email.");
            return;
        }

        setSending(true);
        try {
            const formData = new FormData();
            formData.append("subject", form.subject);
            formData.append("heading", "System Message");
            formData.append("message", form.message);
            formData.append("action_label", "Visit Dashboard");
            formData.append("action_url", "http://localhost:3000/dashboard");

            let endpoint = "/admin/email/send-bulk-email";
            if (form.to === "Specific User (Email)") {
                endpoint = "/admin/email/send-custom-email";
                formData.append("to_email", form.customRecipient);
            } else if (form.to === "Specific User (User ID)") {
                endpoint = "/admin/email/send-custom-email";
                formData.append("user_id", form.customRecipient);
            }

            await apiFormData(endpoint, formData);

            setForm({ ...form, subject: "", message: "", customRecipient: "" });
            alert(form.to === "Specific User (Email)" ? `Email sent to ${form.customRecipient}` : "Broadcast email sent successfully!");
        } catch (e) {
            console.error(e);
            alert("Failed to send email.");
        } finally {
            setSending(false);
        }
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

                        {/* Recent Email Logs section removed as per user request to remove hardcoded data */}

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
                                                    <option>Specific User (Email)</option>
                                                    <option>Specific User (User ID)</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                                    <ChevronDown size={20} />
                                                </div>
                                            </div>
                                        </div>

                                        {(form.to === "Specific User (Email)" || form.to === "Specific User (User ID)") && (
                                            <div className="flex flex-col gap-3">
                                                <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                                    {form.to === "Specific User (Email)" ? "Recipient Email" : "Recipient User ID"}
                                                </label>
                                                <input
                                                    type="text" placeholder={form.to === "Specific User (Email)" ? "user@example.com" : "UUID..."}
                                                    className="py-3.5 px-5 block w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:border-[#18181b] focus:ring-[#18181b] sm:text-sm outline-none transition-colors"
                                                    value={form.customRecipient} onChange={e => setForm({ ...form, customRecipient: e.target.value })}
                                                />
                                            </div>
                                        )}

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
                                            {sending ? "Sending Email..." : (form.to === "All Users" ? "Send Broadcast" : "Send Email")}
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

                {/* Notifications Tab Content */}
                {tab === "notifications" && (
                    <div className="flex flex-col gap-6 w-full pb-20 animate-fade-in">
                        {loading ? (
                            <p className="text-slate-500 font-medium">Loading notifications...</p>
                        ) : history.length === 0 ? (
                            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-16 text-center border border-slate-100 dark:border-slate-800">
                                <Bell size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-6" />
                                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">No Notifications</h3>
                                <p className="text-slate-500 font-medium">You're all caught up! No recent system notifications.</p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 p-8">
                                <div className="flex flex-col gap-4">
                                    {history.map((notif: any) => (
                                        <div key={notif.id} className="p-6 border border-slate-100 dark:border-slate-800 rounded-2xl flex gap-5 items-start bg-slate-50/50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                                            <div className="bg-[#18181b] text-white p-3 rounded-2xl flex-shrink-0 shadow-md">
                                                <Bell size={22} />
                                            </div>
                                            <div className="flex flex-col gap-1 w-full">
                                                <div className="flex justify-between items-start gap-4">
                                                    <h4 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">{notif.title}</h4>
                                                    <span className="text-xs font-bold text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full whitespace-nowrap shadow-sm">
                                                        {new Date(notif.created_at).toLocaleDateString('en-IN')} • {new Date(notif.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mt-1 font-medium">{notif.message}</p>
                                                {!notif.is_read && (
                                                    <span className="mt-3 inline-block bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1.5 rounded-lg w-fit">
                                                        NEW ALERT
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}