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
        <div className="animate-fade-in" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: "'Inter', system-ui" }}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.025em', color: '#18181b', margin: 0 }}>
                        Email Center
                    </h1>
                    <p style={{ fontSize: '13px', color: '#71717a', marginTop: '3px' }}>
                        Compose and send beautiful HTML emails.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ display: 'flex', background: '#f4f4f5', padding: '3px', borderRadius: '10px' }}>
                        <button 
                            onClick={() => setMode("SINGLE")}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', 
                                fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer',
                                background: mode === "SINGLE" ? 'white' : 'transparent',
                                color: mode === "SINGLE" ? '#18181b' : '#71717a',
                                boxShadow: mode === "SINGLE" ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            <User size={14} /> Single User
                        </button>
                        <button 
                            onClick={() => setMode("BULK")}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', 
                                fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer',
                                background: mode === "BULK" ? 'white' : 'transparent',
                                color: mode === "BULK" ? '#18181b' : '#71717a',
                                boxShadow: mode === "BULK" ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Users size={14} /> Bulk
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '20px', flex: 1, minHeight: 0 }}>
                
                {/* Editor Block */}
                <div style={{ 
                    background: 'white', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden'
                }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f4f4f5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Type size={16} style={{ color: '#a1a1aa' }} />
                        <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#18181b', margin: 0 }}>Composer</h2>
                    </div>
                    
                    <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        
                        {/* Template Picker */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#52525b' }}>Email Template</label>
                            <select 
                                value={templateId} onChange={e => setTemplateId(e.target.value as TemplateType)}
                                style={{ 
                                    width: '100%', height: '38px', borderRadius: '9px', border: '1px solid #e4e4e7',
                                    padding: '0 10px', fontSize: '13px', outline: 'none', background: 'white'
                                }}
                            >
                                <option value="custom">Announcement / Marketing</option>
                                <option value="reminder">Payment Reminder (Mock)</option>
                                <option value="invoice">Invoice Receipt (Mock)</option>
                            </select>
                        </div>

                        {mode === "SINGLE" && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#52525b' }}>Select Recipient</label>
                                <div style={{ position: 'relative' }}>
                                    <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa', zIndex: 1 }} />
                                    <input 
                                        type="text" placeholder="Search customer..."
                                        value={userSearch} onChange={e => setUserSearch(e.target.value)}
                                        style={{ 
                                            width: '100%', height: '38px', borderRadius: '9px 9px 0 0', border: '1px solid #e4e4e7',
                                            padding: '0 12px 0 34px', fontSize: '13px', outline: 'none',
                                            borderBottom: 'none'
                                        }}
                                    />
                                    <div style={{ 
                                        border: '1px solid #e4e4e7', borderTop: '1px solid #f4f4f5', maxHeight: '120px', 
                                        overflowY: 'auto', borderRadius: '0 0 9px 9px', background: '#fff'
                                    }}>
                                        {fetchingUsers ? <div style={{ padding: '8px', fontSize: '11px', color: '#a1a1aa' }}>Loading...</div> : 
                                         filteredUsers.length === 0 ? <div style={{ padding: '8px', fontSize: '11px', color: '#a1a1aa' }}>No customers</div> :
                                         filteredUsers.map(u => (
                                            <div 
                                                key={u.id}
                                                onClick={() => { setToEmail(u.email); setUserSearch(u.name || u.email); }}
                                                style={{ 
                                                    padding: '6px 12px', fontSize: '12px', cursor: 'pointer',
                                                    background: toEmail === u.email ? '#eff6ff' : 'transparent'
                                                }}
                                            >
                                                <div style={{ fontWeight: 600 }}>{u.name || 'Anonymous'}</div>
                                                <div style={{ fontSize: '10px', opacity: 0.6 }}>{u.email}</div>
                                            </div>
                                         ))}
                                    </div>
                                </div>
                                <div style={{ fontSize: '11px', color: '#71717a' }}>Selected: <span className="text-blue-600 font-medium">{toEmail || 'None'}</span></div>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#52525b' }}>Subject Line</label>
                            <input 
                                type="text" placeholder="Updates regarding your order"
                                value={subject} onChange={e => setSubject(e.target.value)}
                                style={{ width: '100%', height: '38px', borderRadius: '9px', border: '1px solid #e4e4e7', padding: '0 12px', fontSize: '13px', outline: 'none' }}
                            />
                        </div>

                        {templateId === "custom" && (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#52525b' }}>Banner Heading</label>
                                    <input 
                                        type="text" placeholder="Exciting News!"
                                        value={heading} onChange={e => setHeading(e.target.value)}
                                        style={{ width: '100%', height: '38px', borderRadius: '9px', border: '1px solid #e4e4e7', padding: '0 12px', fontSize: '13px', outline: 'none' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#52525b' }}>Message Body</label>
                                    <textarea 
                                        placeholder="Write your message here..."
                                        value={message} onChange={e => setMessage(e.target.value)}
                                        style={{ width: '100%', minHeight: '80px', borderRadius: '9px', border: '1px solid #e4e4e7', padding: '12px', fontSize: '13px', outline: 'none', resize: 'vertical' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#52525b' }}>Banner Image URL</label>
                                    <input 
                                        type="url" placeholder="https://..."
                                        value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                                        style={{ width: '100%', height: '38px', borderRadius: '9px', border: '1px solid #e4e4e7', padding: '0 12px', fontSize: '13px', outline: 'none' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#52525b' }}>Button Text</label>
                                        <input 
                                            type="text" value={actionLabel} onChange={e => setActionLabel(e.target.value)}
                                            style={{ width: '100%', height: '38px', borderRadius: '9px', border: '1px solid #e4e4e7', padding: '0 12px', fontSize: '13px', outline: 'none' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#52525b' }}>Button Link</label>
                                        <input 
                                            type="url" placeholder="https://..."
                                            value={actionUrl} onChange={e => setActionUrl(e.target.value)}
                                            style={{ width: '100%', height: '38px', borderRadius: '9px', border: '1px solid #e4e4e7', padding: '0 12px', fontSize: '13px', outline: 'none' }}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                            {success && <div style={{ padding: '10px', borderRadius: '8px', background: '#f0fdf4', color: '#16a34a', fontSize: '12px', marginBottom: '10px' }}>{success}</div>}
                            {error && <div style={{ padding: '10px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', fontSize: '12px', marginBottom: '10px' }}>{error}</div>}
                            <button 
                                onClick={handleSend}
                                disabled={sending}
                                style={{ 
                                    width: '100%', height: '42px', borderRadius: '10px', background: '#18181b', color: 'white',
                                    border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', 
                                    justifyContent: 'center', gap: '8px', cursor: sending ? 'not-allowed' : 'pointer',
                                    opacity: sending ? 0.7 : 1
                                }}
                            >
                                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                {mode === "BULK" ? "Broadcast Email" : "Send Email"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Block */}
                <div style={{ 
                    background: 'white', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden'
                }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Eye size={16} style={{ color: '#a1a1aa' }} />
                            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#18181b', margin: 0 }}>Live Preview</h2>
                        </div>
                        {loadingPreview && <Loader2 size={14} className="animate-spin" style={{ color: '#a1a1aa' }} />}
                    </div>
                    <div style={{ flex: 1, padding: '24px', background: '#f3f4f6', overflow: 'hidden' }}>
                        <div style={{ 
                            background: 'white', width: '100%', height: '100%', borderRadius: '12px', 
                            border: '1px solid #e4e4e7', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
                        }}>
                             <iframe 
                                title="Email Preview"
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                srcDoc={previewHtml || placeholderHtml}
                             />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
