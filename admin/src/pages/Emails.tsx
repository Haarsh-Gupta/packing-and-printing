import { useState, useEffect } from "react";
import { apiFormData, api } from "@/lib/api";
import type { AuthUser } from "@/types";
import { Send, Users, User, Type, Link as LinkIcon, Image as ImageIcon, CheckCircle2, AlertCircle } from "lucide-react";

type TemplateType = "custom" | "reminder" | "admin_notice";

export default function Emails() {
    const [mode, setMode] = useState<"SINGLE" | "BULK">("SINGLE");
    const [templateId, setTemplateId] = useState<TemplateType>("custom");
    
    // Form State
    const [subject, setSubject] = useState("");
    const [toEmail, setToEmail] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    
    // Custom template fields
    const [heading, setHeading] = useState("");
    const [message, setMessage] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [actionUrl, setActionUrl] = useState("");
    const [actionLabel, setActionLabel] = useState("Learn More");
    
    // Reminder template fields
    const [orderId, setOrderId] = useState("");
    const [dueAmount, setDueAmount] = useState("");
    const [dueDate, setDueDate] = useState("");
    
    // Users state
    const [availableUsers, setAvailableUsers] = useState<AuthUser[]>([]);
    
    // Submission state
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api<AuthUser[]>("/admin/users/all?admin=false&limit=200")
            .then(setAvailableUsers)
            .catch(console.error);
    }, []);

    const generatePreviewHtml = () => {
        const company_name = "NavArt"; // Default fallback
        const support_email = "navart.official@gmail.com";
        const recipientName = "Customer";
        const greeting = `Hi ${recipientName},`;
        let content = "";
        
        if (templateId === "reminder") {
            const dueDateRow = dueDate ? `<tr><td style="padding: 6px 0; color: #555;">Due Date:</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${dueDate}</td></tr>` : "";
            const customMessage = message ? `<div style="margin: 20px 0; padding: 14px 16px; background-color: #fff8e1; border-left: 4px solid #f39c12; border-radius: 4px;"><p style="margin: 0; font-size: 14px; color: #555;">${message}</p></div>` : "";
            
            content = `
            <p style="font-size: 16px; margin-bottom: 8px;">${greeting}</p>
            <p style="font-size: 15px; color: #555;">This is a friendly reminder about your pending payment for <strong>Order #${orderId || "..."}</strong>.</p>
            <div style="text-align: center; margin: 24px 0; padding: 20px; background-color: #fff3e0; border-radius: 8px; border: 1px solid #ffcc80;">
              <p style="margin: 0 0 4px; font-size: 13px; color: #888; text-transform: uppercase;">Amount Due</p>
              <span style="font-size: 32px; font-weight: 700; color: #e65100;">&#8377;${dueAmount || "0.00"}</span>
            </div>
            <table style="width: 100%; font-size: 14px; margin: 16px 0;">
              <tr><td style="padding: 6px 0; color: #555;">Order ID:</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">#${orderId || "..."}</td></tr>
              ${dueDateRow}
            </table>
            ${customMessage}
            <p style="font-size: 13px; color: #888;">Please complete your payment at your earliest convenience.</p>
            `;
        } else if (templateId === "admin_notice") {
            const cta = actionUrl ? `<div style="text-align: center; margin: 28px 0;"><a href="${actionUrl}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600;">${actionLabel || "View Details"}</a></div>` : "";
            content = `
            <p style="font-size: 16px; margin-bottom: 8px;">${greeting}</p>
            <h2 style="font-size: 18px; color: #2c3e50; margin: 20px 0 12px;">${subject || "Notice Subject Line"}</h2>
            <div style="font-size: 15px; color: #555; line-height: 1.6;">${message || "Notification message content goes here..."}</div>
            ${cta}
            <p style="font-size: 13px; color: #888; margin-top: 24px;">This is an automated notification from the admin team.</p>
            `;
        } else {
            const banner = imageUrl ? `<div style="text-align: center; margin: 0 -32px 24px -32px;"><img src="${imageUrl}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 0;" /></div>` : "";
            const cta = actionUrl ? `<div style="text-align: center; margin: 28px 0;"><a href="${actionUrl}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600;">${actionLabel || "Learn More"}</a></div>` : "";
            
            content = `
            ${banner}
            <p style="font-size: 16px; margin-bottom: 8px;">${greeting}</p>
            <h2 style="font-size: 22px; color: #2c3e50; margin: 20px 0 16px; text-align: center; line-height: 1.4;">${heading || "Heading here..."}</h2>
            <div style="font-size: 15px; color: #555; line-height: 1.7; text-align: center;">${message || "Message here..."}</div>
            ${cta}
            `;
        }
        
        return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f7; color: #333333; }
            .email-wrapper { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); }
            .email-header { background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%); padding: 24px 32px; text-align: center; }
            .email-header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; }
            .email-body { padding: 32px; }
            .email-footer { background-color: #f8f9fa; padding: 20px 32px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #eaeaea; }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-header">
              <h1>${company_name}</h1>
            </div>
            <div class="email-body">${content}</div>
            <div class="email-footer">
              <p>&copy; ${company_name}. All rights reserved.</p>
              <p>Need help? <a href="mailto:${support_email}" style="color: #3498db;">${support_email}</a></p>
            </div>
          </div>
        </body>
        </html>
        `;
    };

    const handleSend = async () => {
        if (!subject) return setError("Subject is required");
        if (mode === "SINGLE" && !toEmail) return setError("Recipient email is required");
        if (templateId === "custom" && !heading) return setError("Heading is required for the Custom template");
        
        setSending(true);
        setSuccess(null);
        setError(null);
        
        try {
            const formData = new FormData();
            formData.append("template_id", templateId);
            formData.append("subject", subject);
            formData.append("message", message || "");
            
            if (templateId === "custom") {
                formData.append("heading", heading || "");
                if (imageUrl) formData.append("image_url", imageUrl);
                if (actionUrl) formData.append("action_url", actionUrl);
                formData.append("action_label", actionLabel || "Learn More");
            } else if (templateId === "reminder") {
                formData.append("heading", "Reminder");
                formData.append("order_id", orderId);
                formData.append("due_amount", dueAmount);
                formData.append("due_date", dueDate);
            } else if (templateId === "admin_notice") {
                formData.append("heading", subject); 
                if (actionUrl) formData.append("action_url", actionUrl);
                formData.append("action_label", actionLabel || "View Details");
            }
            
            let endpoint = "/admin/email/send-custom-email";
            if (mode === "BULK") {
                endpoint = "/admin/email/send-bulk-email";
                if (selectedUsers.length > 0) {
                    formData.append("user_emails", selectedUsers.join(","));
                }
            } else {
                formData.append("to_email", toEmail);
            }
            
            const res = await apiFormData<any>(endpoint, formData);
            setSuccess(res.message);
            
            if (mode === "SINGLE") setToEmail("");
            setSubject("");
            setMessage("");
            setHeading("");
        } catch (e: any) {
            setError(e.message || "Failed to send email");
        } finally {
            setSending(false);
        }
    };

    const toggleSelectedUser = (email: string) => {
        setSelectedUsers(prev => 
            prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0b1326] p-6 md:p-8 animate-fade-in font-sans text-slate-800 dark:text-[#dae2fd]">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Email Dispatch</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Send customized communications directly to your customers.</p>
                </div>
                <div className="flex bg-white dark:bg-[#131b2e] p-1 rounded-lg border border-slate-200 dark:border-[#434655]/40 shadow-sm mt-4 md:mt-0">
                    <button
                        onClick={() => setMode("SINGLE")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === "SINGLE" ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                    >
                        <User size={16} /> Individual
                    </button>
                    <button
                        onClick={() => setMode("BULK")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === "BULK" ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                    >
                        <Users size={16} /> Bulk Send
                    </button>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-6">
                {/* Editor Block */}
                <div className="w-full xl:w-[500px] bg-white dark:bg-[#131b2e] rounded-xl border border-slate-200 dark:border-[#434655]/40 shadow-sm overflow-hidden flex flex-col shrink-0">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-[#434655]/40 bg-slate-50/50 dark:bg-black/20 flex flex-col gap-4">
                        
                        {/* Who are we sending to? */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Recipient</label>
                            {mode === "SINGLE" ? (
                                <div className="flex flex-col gap-2">
                                    <input
                                        type="email"
                                        placeholder="user@example.com"
                                        value={toEmail}
                                        onChange={e => setToEmail(e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/40 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                                        list="user-emails"
                                    />
                                    <datalist id="user-emails">
                                        {availableUsers.map(u => <option key={u.id} value={u.email}>{u.name || "Customer"}</option>)}
                                    </datalist>
                                </div>
                            ) : (
                                <div className="border border-slate-200 dark:border-[#434655]/40 rounded-lg max-h-[160px] overflow-y-auto bg-white dark:bg-[#0b1326] custom-scrollbar">
                                    <div 
                                        className={`px-3 py-2 border-b border-slate-100 dark:border-[#434655]/20 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2 ${selectedUsers.length === 0 ? 'bg-blue-50/50 dark:bg-blue-900/20 font-medium text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}
                                        onClick={() => setSelectedUsers([])}
                                    >
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedUsers.length === 0 ? 'border-blue-500 bg-blue-500' : 'border-slate-300 dark:border-[#434655]'}`}>
                                            {selectedUsers.length === 0 && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                                        </div>
                                        All Customers ({availableUsers.length})
                                    </div>
                                    {availableUsers.map(u => (
                                        <div 
                                            key={u.id}
                                            className="px-3 py-2 border-b border-slate-100 dark:border-[#434655]/20 last:border-0 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2 text-slate-600 dark:text-slate-300"
                                            onClick={() => toggleSelectedUser(u.email)}
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selectedUsers.includes(u.email) ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300 dark:border-[#434655]'}`}>
                                                {selectedUsers.includes(u.email) && <CheckCircle2 size={12} />}
                                            </div>
                                            {u.name || (u.email.split("@")[0])} <span className="text-slate-400 dark:text-slate-500 text-xs text-ellipsis overflow-hidden ml-auto max-w-[120px]">{u.email}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Template Type</label>
                                <select
                                    value={templateId}
                                    onChange={e => setTemplateId(e.target.value as TemplateType)}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/40 rounded-lg text-sm font-medium text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                >
                                    <option value="custom">General Announcement / Custom</option>
                                    <option value="reminder">Payment Reminder</option>
                                    <option value="admin_notice">Admin Notification / Notice</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Subject Line <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    placeholder="Enter subject line..."
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/40 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                />
                            </div>

                            {templateId === "admin_notice" ? (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Notice Board Message</label>
                                        <textarea
                                            placeholder="Type your notification message here..."
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                            rows={6}
                                            className="w-full px-3 py-2 bg-white dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/40 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-y"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-[#434655]/20">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Button Label</label>
                                            <input
                                                type="text"
                                                value={actionLabel}
                                                placeholder="View Details"
                                                onChange={e => setActionLabel(e.target.value)}
                                                className="w-full px-3 py-2 bg-white dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/40 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><LinkIcon size={14}/> Action Link</label>
                                            <input
                                                type="url"
                                                placeholder="https://..."
                                                value={actionUrl}
                                                onChange={e => setActionUrl(e.target.value)}
                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-[#434655]/40 rounded-lg text-xs font-mono text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : templateId === "custom" ? (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Heading <span className="text-red-400">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="Big bold heading..."
                                            value={heading}
                                            onChange={e => setHeading(e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/40 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Body Message</label>
                                        <textarea
                                            placeholder="Type your message here. Basic HTML is supported."
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                            rows={4}
                                            className="w-full px-3 py-2 bg-white dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/40 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-y"
                                        />
                                    </div>
                                    
                                    <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-[#434655]/20">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><ImageIcon size={14}/> Banner Image URL</label>
                                            <input
                                                type="url"
                                                placeholder="https://example.com/image.jpg"
                                                value={imageUrl}
                                                onChange={e => setImageUrl(e.target.value)}
                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-[#434655]/40 rounded-lg text-xs font-mono text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Action Label</label>
                                                <input
                                                    type="text"
                                                    value={actionLabel}
                                                    onChange={e => setActionLabel(e.target.value)}
                                                    className="w-full px-3 py-2 bg-white dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/40 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><LinkIcon size={14}/> Action Link</label>
                                                <input
                                                    type="url"
                                                    placeholder="https://..."
                                                    value={actionUrl}
                                                    onChange={e => setActionUrl(e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-[#434655]/40 rounded-lg text-xs font-mono text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Order ID</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 1024"
                                                value={orderId}
                                                onChange={e => setOrderId(e.target.value)}
                                                className="w-full px-3 py-2 bg-white dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/40 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Amount Due</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 2500"
                                                value={dueAmount}
                                                onChange={e => setDueAmount(e.target.value)}
                                                className="w-full px-3 py-2 bg-white dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/40 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Due Date</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 24 Oct, 2026"
                                            value={dueDate}
                                            onChange={e => setDueDate(e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/40 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Add Note (Optional)</label>
                                        <textarea
                                            placeholder="Add an optional message..."
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                            rows={2}
                                            className="w-full px-3 py-2 bg-white dark:bg-[#0b1326] border border-slate-200 dark:border-[#434655]/40 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-y"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-slate-50 dark:bg-black/20 border-t border-slate-200 dark:border-[#434655]/40 mt-auto">
                        {error && (
                            <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-3 py-2.5 rounded-lg text-sm font-medium border border-red-100 dark:border-red-900/30 flex items-start gap-2">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        {success && (
                            <div className="mb-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-2.5 rounded-lg text-sm font-medium border border-emerald-100 dark:border-emerald-900/30 flex items-start gap-2">
                                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                                <span>{success}</span>
                            </div>
                        )}
                        <button
                            onClick={handleSend}
                            disabled={sending}
                            className={`w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${sending ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'}`}
                        >
                            <Send size={16} />
                            {sending ? "Sending..." : "Send Email"}
                        </button>
                    </div>
                </div>

                {/* Live Preview Pane */}
                <div className="w-full flex-1 bg-white dark:bg-[#131b2e] rounded-xl border border-slate-200 dark:border-[#434655]/40 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-[#434655]/40 bg-slate-50/50 dark:bg-black/20 flex items-center gap-2">
                        <Type size={16} className="text-slate-400 dark:text-slate-500" />
                        <h2 className="text-sm font-bold text-slate-700 dark:text-white">Real-Time HTML Preview</h2>
                    </div>
                    <div className="flex-1 bg-[#f4f4f7] dark:bg-[#0b1326] p-4 flex items-center justify-center overflow-y-auto">
                        <div className="w-full max-w-[600px] bg-white rounded-lg min-h-[500px] shadow-sm transform-gpu overflow-hidden relative border border-slate-200/50 dark:border-none">
                            <iframe
                                title="Email Preview"
                                className="w-full h-full border-none absolute inset-0 bg-white"
                                srcDoc={generatePreviewHtml()}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
