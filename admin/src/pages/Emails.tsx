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
        <div className="flex flex-col h-full font-['Inter'] bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] px-2 pb-12 animate-fade-in">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                    <nav className="flex items-center gap-2 text-[10px] font-bold text-blue-600 dark:text-[#adc6ff] mb-2 tracking-widest uppercase">
                        <span>Communications</span>
                        <span>/</span>
                        <span className="text-slate-600 dark:text-[#c3c5d8]/60">Compiler</span>
                    </nav>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-[#dae2fd] m-0">
                        Dispatch Console
                    </h1>
                </div>
                <div className="flex p-1 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/30 rounded-lg">
                    <button 
                        onClick={() => setMode("SINGLE")}
                        className={`flex items-center gap-2 px-5 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${
                            mode === "SINGLE" 
                                ? 'bg-[#1f70e3] text-white shadow-sm' 
                                : 'bg-transparent text-slate-500 dark:text-[#8d90a1] hover:text-slate-900 dark:hover:text-[#dae2fd]'
                        }`}
                    >
                        <User size={14} /> Directed
                    </button>
                    <button 
                        onClick={() => setMode("BULK")}
                        className={`flex items-center gap-2 px-5 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${
                            mode === "BULK" 
                                ? 'bg-[#1f70e3] text-white shadow-sm' 
                                : 'bg-transparent text-slate-500 dark:text-[#8d90a1] hover:text-slate-900 dark:hover:text-[#dae2fd]'
                        }`}
                    >
                        <Users size={14} /> Global Broadcast
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-6 flex-1 min-h-[600px]">
                
                {/* Editor Block */}
                <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 flex flex-col overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-[#434655]/20 bg-slate-100 dark:bg-[#0b1326]/50 flex items-center gap-3">
                        <Type size={16} className="text-blue-600 dark:text-[#adc6ff]" />
                        <h2 className="text-[11px] uppercase tracking-widest font-extrabold text-slate-900 dark:text-[#dae2fd] m-0">Payload Composer</h2>
                    </div>
                    
                    <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-5">
                        
                        {/* Template Picker */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-[#c3c5d8]">Base Structure</label>
                            <select 
                                value={templateId} onChange={e => setTemplateId(e.target.value as TemplateType)}
                                className="w-full h-11 rounded-lg border border-slate-200 dark:border-[#434655]/40 px-3 text-sm font-bold bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] outline-none focus:border-blue-400 dark:border-[#adc6ff] transition-colors"
                            >
                                <option value="custom">Announcement / Action Request</option>
                                <option value="reminder">Payment Reminder (Mock)</option>
                                <option value="invoice">Invoice Receipt (Mock)</option>
                            </select>
                        </div>

                        {mode === "SINGLE" && (
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-[#c3c5d8]">Target Identity</label>
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#434655]" />
                                    <input 
                                        type="text" placeholder="Query nodes..."
                                        value={userSearch} onChange={e => setUserSearch(e.target.value)}
                                        className="w-full h-11 rounded-t-lg border-b-0 border border-slate-200 dark:border-[#434655]/40 pl-9 pr-3 text-xs font-mono bg-slate-50 dark:bg-[#0b1326] text-blue-600 dark:text-[#adc6ff] outline-none focus:border-blue-400 dark:border-[#adc6ff] transition-colors placeholder:text-[#434655]"
                                    />
                                    <div className="border border-slate-200 dark:border-[#434655]/40 border-t-[#434655]/20 max-h-[160px] overflow-y-auto custom-scrollbar rounded-b-lg bg-slate-50 dark:bg-[#0b1326]">
                                        {fetchingUsers ? <div className="p-3 text-[10px] uppercase font-bold text-[#434655] tracking-widest">Scanning network...</div> : 
                                         filteredUsers.length === 0 ? <div className="p-3 text-[10px] uppercase font-bold text-[#434655] tracking-widest">No nodes match signature</div> :
                                         filteredUsers.map(u => (
                                            <div 
                                                key={u.id}
                                                onClick={() => { setToEmail(u.email); setUserSearch(u.name || u.email); }}
                                                className={`p-2 px-4 text-xs cursor-pointer border-b border-slate-200 dark:border-[#434655]/10 last:border-0 ${
                                                    toEmail === u.email 
                                                        ? 'bg-[#1f70e3]/10 text-blue-600 dark:text-[#adc6ff]' 
                                                        : 'hover:bg-slate-50 dark:hover:bg-[#171f33] text-slate-600 dark:text-[#c3c5d8]'
                                                }`}
                                            >
                                                <div className="font-bold">{u.name || 'Anonymous Node'}</div>
                                                <div className="text-[10px] opacity-70 font-mono mt-0.5">{u.email}</div>
                                            </div>
                                         ))}
                                    </div>
                                </div>
                                <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#8d90a1] tracking-widest mt-1">
                                    Locked Target: <span className="text-blue-600 dark:text-[#adc6ff]">{toEmail || 'NONE'}</span>
                                </div>
                            </div>
                        )}

                        <div className="h-px bg-[#434655]/20 my-1" />

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-[#c3c5d8]">Subject Line <span className="text-[#ffb4ab]">*</span></label>
                            <input 
                                type="text" placeholder="Transmission subject..."
                                value={subject} onChange={e => setSubject(e.target.value)}
                                className="w-full h-11 rounded-lg border border-slate-200 dark:border-[#434655]/40 px-3 text-sm font-bold bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] outline-none focus:border-blue-400 dark:border-[#adc6ff] transition-colors placeholder:text-[#434655]"
                            />
                        </div>

                        {templateId === "custom" && (
                            <>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-[#c3c5d8]">H1 Block <span className="text-[#ffb4ab]">*</span></label>
                                    <input 
                                        type="text" placeholder="Primary greeting..."
                                        value={heading} onChange={e => setHeading(e.target.value)}
                                        className="w-full h-11 rounded-lg border border-slate-200 dark:border-[#434655]/40 px-3 text-sm font-bold bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] outline-none focus:border-blue-400 dark:border-[#adc6ff] transition-colors placeholder:text-[#434655]"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-[#c3c5d8]">Body Paragraph <span className="text-[#ffb4ab]">*</span></label>
                                    <textarea 
                                        placeholder="Enter core transmission text..."
                                        value={message} onChange={e => setMessage(e.target.value)}
                                        className="w-full min-h-[100px] rounded-lg border border-slate-200 dark:border-[#434655]/40 p-3 text-sm bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] outline-none resize-y focus:border-blue-400 dark:border-[#adc6ff] transition-colors placeholder:text-[#434655]"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-[#c3c5d8] flex items-center gap-2"><ImageIcon size={12} /> Graphics Vector</label>
                                    <input 
                                        type="url" placeholder="https://..."
                                        value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                                        className="w-full h-11 rounded-lg border border-slate-200 dark:border-[#434655]/40 px-3 text-xs font-mono bg-slate-50 dark:bg-[#0b1326] text-blue-600 dark:text-[#adc6ff] outline-none focus:border-blue-400 dark:border-[#adc6ff] transition-colors placeholder:text-[#434655]"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-[#c3c5d8]">CTA Label</label>
                                        <input 
                                            type="text" value={actionLabel} onChange={e => setActionLabel(e.target.value)}
                                            className="w-full h-11 rounded-lg border border-slate-200 dark:border-[#434655]/40 px-3 text-sm font-bold bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] outline-none focus:border-blue-400 dark:border-[#adc6ff] transition-colors"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-[#c3c5d8] flex items-center gap-2"><LinkIcon size={12} /> CTA Link</label>
                                        <input 
                                            type="url" placeholder="https://..."
                                            value={actionUrl} onChange={e => setActionUrl(e.target.value)}
                                            className="w-full h-11 rounded-lg border border-slate-200 dark:border-[#434655]/40 px-3 text-xs font-mono bg-slate-50 dark:bg-[#0b1326] text-blue-600 dark:text-[#adc6ff] outline-none focus:border-blue-400 dark:border-[#adc6ff] transition-colors placeholder:text-[#434655]"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-[#434655]/20">
                            {success && (
                                <div className="p-3 rounded-lg bg-[#34d399]/10 border border-[#34d399]/20 text-[#34d399] text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#34d399]" /> {success}
                                </div>
                            )}
                            {error && (
                                <div className="p-3 rounded-lg bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 text-[#ffb4ab] text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]" /> {error}
                                </div>
                            )}
                            <button 
                                onClick={handleSend}
                                disabled={sending}
                                className={`w-full h-12 rounded-xl text-[11px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_4px_12px_rgba(173,198,255,0.2)] ${
                                    sending 
                                        ? 'bg-[#434655]/40 text-slate-500 dark:text-[#8d90a1] cursor-not-allowed shadow-none' 
                                        : 'bg-[#adc6ff] hover:bg-white text-[#001a42]'
                                }`}
                            >
                                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                {mode === "BULK" ? "Initiate Sequence" : "Dispatch Payload"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Block */}
                <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 flex flex-col overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-[#434655]/20 bg-slate-100 dark:bg-[#0b1326]/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Eye size={16} className="text-slate-500 dark:text-[#8d90a1]" />
                            <h2 className="text-[11px] uppercase tracking-widest font-extrabold text-slate-900 dark:text-[#dae2fd] m-0">Output Test Render</h2>
                        </div>
                        {loadingPreview && <Loader2 size={16} className="animate-spin text-blue-600 dark:text-[#adc6ff]" />}
                    </div>
                    <div className="flex-1 p-8 bg-slate-50 dark:bg-[#0b1326] flex items-center justify-center">
                        <div className="bg-white w-full max-w-[600px] h-full min-h-[500px] rounded-xl overflow-hidden shadow-2xl border border-slate-200 dark:border-[#434655]/40 relative">
                             <iframe 
                                title="Email Preview"
                                className="w-full h-full border-none absolute inset-0"
                                srcDoc={previewHtml || placeholderHtml}
                             />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
