import { useState, useEffect, useRef } from "react";
import { api, apiFormData } from "@/lib/api";
import type { AuthUser } from "@/types";
import { 
    Send, Users, User, Mail, Image as ImageIcon, Link as LinkIcon, 
    Type, Loader2, Eye, Search, Layout
} from "lucide-react";

type TemplateType = "custom" | "reminder" | "invoice";

export default function Emails() {
    const [mode, setMode] = useState<"SINGLE" | "BULK">("SINGLE");
    const [templateId, setTemplateId] = useState<TemplateType>("custom");
    const [toEmail, setToEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [heading, setHeading] = useState("");
    const [message, setMessage] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [actionUrl, setActionUrl] = useState("");
    const [actionLabel, setActionLabel] = useState("Learn More");
    
    // User Selection
    const [availableUsers, setAvailableUsers] = useState<AuthUser[]>([]);
    const [userSearch, setUserSearch] = useState("");
    const [fetchingUsers, setFetchingUsers] = useState(false);
    
    const [previewHtml, setPreviewHtml] = useState("");
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch users (customers only)
    useEffect(() => {
        setFetchingUsers(true);
        api<AuthUser[]>("/admin/users/all?admin=false&limit=200")
            .then(setAvailableUsers)
            .catch(console.error)
            .finally(() => setFetchingUsers(false));
    }, []);

    // Fetch preview from backend
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPreview();
        }, 500); // Debounce 500ms
        return () => clearTimeout(timer);
    }, [templateId, heading, message, imageUrl, actionUrl, actionLabel]);

    const fetchPreview = async () => {
        // Only fetch if we have some content OR it's a fixed template
        if (!heading && !message && templateId === "custom") {
            setPreviewHtml("");
            return;
        }

        setLoadingPreview(true);
        try {
            const formData = new FormData();
            formData.append("template_id", templateId);
            formData.append("heading", heading || "");
            formData.append("message", message || "");
            if (imageUrl) formData.append("image_url", imageUrl);
            if (actionUrl) formData.append("action_url", actionUrl);
            formData.append("action_label", actionLabel || "Learn More");

            const res = await apiFormData<{ html: string }>("/admin/email/preview-custom-email", formData);
            setPreviewHtml(res.html);
        } catch (e: any) {
            console.error("Preview failed", e);
            // Don't set error state for preview to avoid flickering, just log
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleSend = async () => {
        if (!subject) {
            setError("Subject is required");
            return;
        }
        if (templateId === "custom" && (!heading || !message)) {
            setError("Heading and Message are required for the Custom template");
            return;
        }
        if (mode === "SINGLE" && !toEmail) {
            setError("Recipient email is required");
            return;
        }

        setSending(true);
        setSuccess(null);
        setError(null);
        try {
            const formData = new FormData();
            formData.append("template_id", templateId);
            formData.append("subject", subject);
            formData.append("heading", heading || "");
            formData.append("message", message || "");
            if (imageUrl) formData.append("image_url", imageUrl);
            if (actionUrl) formData.append("action_url", actionUrl);
            formData.append("action_label", actionLabel || "Learn More");

            let endpoint = "/admin/email/send-custom-email";
            if (mode === "BULK") {
                endpoint = "/admin/email/send-bulk-email";
            } else {
                formData.append("to_email", toEmail);
            }

            const res = await apiFormData<any>(endpoint, formData);
            setSuccess(res.message);
        } catch (e: any) {
            setError(e.message || "Failed to send email");
        } finally {
            setSending(false);
        }
    };

    const filteredUsers = availableUsers.filter(u => 
        u.email.toLowerCase().includes(userSearch.toLowerCase()) || 
        (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase()))
    );

    const placeholderHtml = `<!DOCTYPE html><html><body style='font-family:sans-serif; color:#71717a; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; background:#f9f9f9;'>
        <div style='text-align:center;'>
            <p style='font-size:14px; font-weight:500;'>Live Preview Area</p>
            <p style='font-size:12px; opacity:0.7;'>Enter a heading or message to see the template</p>
        </div>
    </body></html>`;

    return (
        <div className="animate-fade-in flex flex-col gap-5 font-sans h-[calc(100vh-[100px])]">
            
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white m-0">
                        Email Center
                    </h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 m-0">
                        Compose and send beautiful HTML emails.
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button 
                            onClick={() => setMode("SINGLE")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer transition-all ${
                                mode === "SINGLE" 
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
                                    : 'bg-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                            }`}
                        >
                            <User size={14} /> Single User
                        </button>
                        <button 
                            onClick={() => setMode("BULK")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer transition-all ${
                                mode === "BULK" 
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
                                    : 'bg-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                            }`}
                        >
                            <Users size={14} /> Bulk
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-[400px_1fr] gap-5 flex-1 min-h-0">
                
                {/* Editor Block */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex flex-col overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-2">
                        <Type size={16} className="text-slate-400 dark:text-slate-500" />
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white m-0">Composer</h2>
                    </div>
                    
                    <div className="p-5 overflow-y-auto flex flex-col gap-4">
                        
                        {/* Template Picker */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Email Template</label>
                            <select 
                                value={templateId} onChange={e => setTemplateId(e.target.value as TemplateType)}
                                className="w-full h-9.5 rounded-lg border border-slate-200 dark:border-slate-800 px-2.5 text-[13px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                            >
                                <option value="custom">Announcement / Marketing</option>
                                <option value="reminder">Payment Reminder (Mock)</option>
                                <option value="invoice">Invoice Receipt (Mock)</option>
                            </select>
                        </div>

                        {mode === "SINGLE" && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Select Recipient</label>
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                                    <input 
                                        type="text" placeholder="Search customer..."
                                        value={userSearch} onChange={e => setUserSearch(e.target.value)}
                                        className="w-full h-9.5 rounded-t-lg border-b-0 border border-slate-200 dark:border-slate-800 pl-8 pr-3 text-[13px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                                    />
                                    <div className="border border-slate-200 dark:border-slate-800 border-t-slate-100 dark:border-t-slate-700/50 max-h-[120px] overflow-y-auto rounded-b-lg bg-white dark:bg-slate-900">
                                        {fetchingUsers ? <div className="p-2 text-[11px] text-slate-400">Loading...</div> : 
                                         filteredUsers.length === 0 ? <div className="p-2 text-[11px] text-slate-400">No customers</div> :
                                         filteredUsers.map(u => (
                                            <div 
                                                key={u.id}
                                                onClick={() => { setToEmail(u.email); setUserSearch(u.name || u.email); }}
                                                className={`p-1.5 px-3 text-xs cursor-pointer ${
                                                    toEmail === u.email 
                                                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-900 dark:text-blue-100' 
                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white'
                                                }`}
                                            >
                                                <div className="font-semibold">{u.name || 'Anonymous'}</div>
                                                <div className="text-[10px] opacity-60">{u.email}</div>
                                            </div>
                                         ))}
                                    </div>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-1">Selected: <span className="text-blue-600 dark:text-blue-400 font-medium">{toEmail || 'None'}</span></div>
                            </div>
                        )}

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Subject Line</label>
                            <input 
                                type="text" placeholder="Updates regarding your order"
                                value={subject} onChange={e => setSubject(e.target.value)}
                                className="w-full h-9.5 rounded-lg border border-slate-200 dark:border-slate-800 px-3 text-[13px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {templateId === "custom" && (
                            <>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Banner Heading</label>
                                    <input 
                                        type="text" placeholder="Exciting News!"
                                        value={heading} onChange={e => setHeading(e.target.value)}
                                        className="w-full h-9.5 rounded-lg border border-slate-200 dark:border-slate-800 px-3 text-[13px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Message Body</label>
                                    <textarea 
                                        placeholder="Write your message here..."
                                        value={message} onChange={e => setMessage(e.target.value)}
                                        className="w-full min-h-[80px] rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-[13px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none resize-y focus:border-blue-500 transition-colors"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Banner Image URL</label>
                                    <input 
                                        type="url" placeholder="https://..."
                                        value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                                        className="w-full h-9.5 rounded-lg border border-slate-200 dark:border-slate-800 px-3 text-[13px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2.5">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Button Text</label>
                                        <input 
                                            type="text" value={actionLabel} onChange={e => setActionLabel(e.target.value)}
                                            className="w-full h-9.5 rounded-lg border border-slate-200 dark:border-slate-800 px-3 text-[13px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Button Link</label>
                                        <input 
                                            type="url" placeholder="https://..."
                                            value={actionUrl} onChange={e => setActionUrl(e.target.value)}
                                            className="w-full h-9.5 rounded-lg border border-slate-200 dark:border-slate-800 px-3 text-[13px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="mt-auto pt-2.5">
                            {success && <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-xs mb-2.5">{success}</div>}
                            {error && <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs mb-2.5">{error}</div>}
                            <button 
                                onClick={handleSend}
                                disabled={sending}
                                className={`w-full h-10.5 rounded-lg bg-slate-900 dark:bg-blue-600 text-white border-none font-semibold flex items-center justify-center gap-2 transition-all ${
                                    sending ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-slate-800 dark:hover:bg-blue-500'
                                }`}
                            >
                                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                {mode === "BULK" ? "Broadcast Email" : "Send Email"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Block */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex flex-col overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Eye size={16} className="text-slate-400 dark:text-slate-500" />
                            <h2 className="text-sm font-semibold text-slate-900 dark:text-white m-0">Live Preview</h2>
                        </div>
                        {loadingPreview && <Loader2 size={14} className="animate-spin text-slate-400" />}
                    </div>
                    <div className="flex-1 p-6 bg-slate-100 dark:bg-slate-950/50 overflow-hidden flex items-center justify-center">
                        <div className="bg-white w-full h-full max-w-[600px] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
                             <iframe 
                                title="Email Preview"
                                className="w-full h-full border-none"
                                srcDoc={previewHtml || placeholderHtml}
                             />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
