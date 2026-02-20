import { useState } from "react";
import {
    Mail, Send, Users, User, Paperclip, Eye,
    Loader2, Trash2, Info
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <label style={{
        display: 'block', fontSize: '10px', fontWeight: 800,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'var(--muted-foreground)', ...mono, marginBottom: '8px',
    }}>{children}</label>
);

const Chip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
    <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '5px 10px', background: 'var(--foreground)',
        borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--background)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }}>
        <Paperclip size={11} />
        {label.length > 24 ? label.slice(0, 24) + '…' : label}
        <button onClick={onRemove} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer',
            color: 'white', display: 'flex', padding: '2px', borderRadius: '4px',
        }}><Trash2 size={10} /></button>
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
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: "'DM Sans', system-ui" }}>

            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                paddingBottom: '24px',
                borderBottom: '1px solid var(--border)',
            }}>
                <div>
                    <p style={{
                        fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em',
                        textTransform: 'uppercase', color: 'var(--muted-foreground)',
                        ...mono, marginBottom: '4px',
                    }}>Communication</p>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>
                        Email Dispatcher
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted-foreground)', marginLeft: '12px', letterSpacing: 0, ...mono }}>
                            [MTA SERVICE READY]
                        </span>
                    </h1>
                </div>
                <div style={{ display: 'flex', background: 'var(--secondary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <button
                        onClick={() => setMode('single')}
                        style={{
                            padding: '6px 16px', borderRadius: '6px', fontSize: '11px', fontWeight: 800,
                            textTransform: 'uppercase', letterSpacing: '0.05em', ...mono,
                            background: mode === 'single' ? 'var(--background)' : 'transparent',
                            color: mode === 'single' ? 'var(--foreground)' : 'var(--muted-foreground)',
                            border: mode === 'single' ? '1px solid var(--border)' : '1px solid transparent',
                            boxShadow: mode === 'single' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    ><User size={13} /> Direct</button>
                    <button
                        onClick={() => setMode('broadcast')}
                        style={{
                            padding: '6px 16px', borderRadius: '6px', fontSize: '11px', fontWeight: 800,
                            textTransform: 'uppercase', letterSpacing: '0.05em', ...mono,
                            background: mode === 'broadcast' ? 'var(--background)' : 'transparent',
                            color: mode === 'broadcast' ? 'var(--foreground)' : 'var(--muted-foreground)',
                            border: mode === 'broadcast' ? '1px solid var(--border)' : '1px solid transparent',
                            boxShadow: mode === 'broadcast' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    ><Users size={13} /> Broadcast</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: '32px', alignItems: 'start' }}>

                {/* Composition Terminal */}
                <div style={{
                    background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--secondary)/50', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Mail size={18} />
                        <div>
                            <h2 style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>Compose Terminal</h2>
                            <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', ...mono }}>Ready for dispatch</p>
                        </div>
                        {mode === 'broadcast' && (
                            <div style={{ marginLeft: 'auto', padding: '3px 8px', background: '#dc2626', color: 'white', borderRadius: '4px', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', ...mono }}>
                                BROADCAST ACTIVE
                            </div>
                        )}
                    </div>

                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {mode === 'single' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <FieldLabel>Target Recipient</FieldLabel>
                                <div style={{ position: 'relative' }}>
                                    <User size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                                    <Input
                                        placeholder="Enter numeric User ID..."
                                        value={form.user_id}
                                        onChange={e => setForm({ ...form, user_id: e.target.value })}
                                        style={{ height: '44px', paddingLeft: '36px', fontWeight: 700, fontSize: '14px', ...mono }}
                                    />
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <FieldLabel>Subject Line</FieldLabel>
                            <Input
                                placeholder="Formal subject of the communication..."
                                value={form.subject}
                                onChange={e => setForm({ ...form, subject: e.target.value })}
                                style={{ height: '44px', fontWeight: 800, fontSize: '15px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <FieldLabel>Message Content (HTML Allowed)</FieldLabel>
                            <Textarea
                                placeholder="Write your message here. Basic HTML supported for rich formatting."
                                value={form.message}
                                onChange={e => setForm({ ...form, message: e.target.value })}
                                style={{ minHeight: '320px', fontSize: '14px', fontWeight: 500, lineHeight: 1.6 }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <FieldLabel>Attachments</FieldLabel>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: form.attachments.length > 0 ? '8px' : '0' }}>
                                {form.attachments.map((file, i) => (
                                    <Chip key={i} label={file.name} onRemove={() => setForm(f => ({ ...f, attachments: f.attachments.filter((_, j) => j !== i) }))} />
                                ))}
                            </div>
                            <div style={{ position: 'relative', display: 'inline-flex' }}>
                                <input type="file" multiple onChange={addFiles} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }} title="" />
                                <Button variant="outline" style={{ height: '36px', fontWeight: 800, border: '2px dashed var(--border)', ...mono, fontSize: '10px' }}>
                                    <Paperclip size={12} className="mr-2" /> SELECT FILES
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '24px', borderTop: '1px solid var(--border)', background: 'var(--secondary)/30' }}>
                        <Button
                            onClick={() => sendEmail(mode === 'broadcast')}
                            disabled={sending || !canSend}
                            style={{
                                width: '100%', height: '48px',
                                background: 'var(--foreground)', color: 'var(--background)',
                                fontWeight: 900, fontSize: '14px', letterSpacing: '0.05em',
                            }}
                        >
                            {sending ? (
                                <><Loader2 size={18} className="mr-2 animate-spin" /> DISPATCHING...</>
                            ) : mode === 'single' ? (
                                <><Send size={18} className="mr-2" /> DISPATCH TO RECIPIENT</>
                            ) : (
                                <><Users size={18} className="mr-2" /> COMMIT GLOBAL BROADCAST</>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Live Output Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase', ...mono }}>Live Render Terminal</p>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f57' }} />
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#febc2e' }} />
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#28c840' }} />
                        </div>
                    </div>

                    <div style={{
                        background: 'white', border: '1px solid var(--border)',
                        borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                        display: 'flex', flexDirection: 'column', minHeight: '600px',
                    }}>
                        {/* Headers */}
                        <div style={{ padding: '24px', borderBottom: '1px solid #eee', background: '#fafafa' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px', fontSize: '11px', color: '#666' }}>
                                    <span style={{ fontWeight: 800, color: '#999', ...mono }}>FROM:</span>
                                    <span style={{ fontWeight: 600, color: '#111' }}>no-reply@bookbind.in</span>

                                    <span style={{ fontWeight: 800, color: '#999', ...mono }}>TO:</span>
                                    <span style={{ fontWeight: 800, color: '#2563eb' }}>
                                        {mode === 'broadcast' ? 'all-active-users@bookbind.in' : form.user_id ? `UserID #${form.user_id}` : '...'}
                                    </span>

                                    <span style={{ fontWeight: 800, color: '#999', ...mono }}>SUBJECT:</span>
                                    <span style={{ fontWeight: 900, color: '#000', fontSize: '14px', letterSpacing: '-0.02em' }}>
                                        {form.subject || 'UNLISTED SUBJECT'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <ScrollArea style={{ flex: 1, padding: '24px', background: '#fff' }}>
                            {form.message ? (
                                <div style={{
                                    fontSize: '14px', lineHeight: 1.7, color: '#333',
                                    fontFamily: 'serif', whiteSpace: 'pre-wrap'
                                }}>
                                    <div dangerouslySetInnerHTML={{ __html: form.message }} />
                                </div>
                            ) : (
                                <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                                    <Mail size={48} />
                                    <p style={{ fontSize: '12px', fontWeight: 800, ...mono, marginTop: '12px' }}>AWAITING INPUT</p>
                                </div>
                            )}

                            {form.attachments.length > 0 && (
                                <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '2px solid #f0f0f0' }}>
                                    <p style={{ fontSize: '10px', fontWeight: 900, color: '#999', ...mono, marginBottom: '12px' }}>MANIFESTED ATTACHMENTS ({form.attachments.length})</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {form.attachments.map((f, i) => (
                                            <div key={i} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #eee', background: '#fcfcfc', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Paperclip size={12} style={{ color: '#aaa' }} />
                                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#444' }}>{f.name}</span>
                                                <span style={{ marginLeft: 'auto', fontSize: '9px', fontWeight: 700, color: '#ccc', ...mono }}>{(f.size / 1024).toFixed(1)} KB</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </ScrollArea>

                        {/* Footer */}
                        <div style={{ padding: '20px', borderTop: '1px solid #f0f0f0', background: '#fafafa', textAlign: 'center' }}>
                            <p style={{ fontSize: '9px', fontWeight: 800, color: '#bbb', ...mono, letterSpacing: '0.1em' }}>
                                © 2026 BOOKBIND AUTOMATED DISPATCH SERVICE
                            </p>
                        </div>
                    </div>

                    <div style={{ padding: '16px', background: 'var(--secondary)/30', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', gap: '12px' }}>
                        <Info size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                        <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                            The live render terminal uses standard serif fonts to simulate common email client interpretation. Use inline styles for cross-client reliability.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}