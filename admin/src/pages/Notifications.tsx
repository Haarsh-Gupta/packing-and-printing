import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Notification } from "@/types";
import {
    Bell, Send, Users, User, History,
    Trash2, Loader2, CheckCircle2, AlertCircle,
    Hash, Calendar, Info, Mail, Layout
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };

export default function Notifications() {
    const [history, setHistory] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [form, setForm] = useState({ title: "", message: "", user_id: "" });
    const [tab, setTab] = useState("history");

    const fetchHistory = () => {
        setLoading(true);
        api<Notification[]>("/notifications/history?limit=50")
            .then(setHistory)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchHistory(); }, []);

    const sendSingle = async () => {
        if (!form.user_id || !form.title || !form.message) return;
        setSending(true);
        try {
            await api(`/notifications/send?user_id=${form.user_id}`, {
                method: "POST",
                body: JSON.stringify({ title: form.title, message: form.message }),
            });
            setForm({ title: "", message: "", user_id: "" });
            setTab("history");
            fetchHistory();
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    const sendToAll = async () => {
        if (!form.title || !form.message) return;
        if (!confirm("Send this broadcast to ALL registered users?")) return;
        setSending(true);
        try {
            await api("/notifications/send-to-all", {
                method: "POST",
                body: JSON.stringify({ title: form.title, message: form.message }),
            });
            setForm({ title: "", message: "", user_id: "" });
            setTab("history");
            fetchHistory();
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

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
                    }}>Alert System</p>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>
                        Notifications
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted-foreground)', marginLeft: '12px', letterSpacing: 0, ...mono }}>
                            [BROADCAST CENTER]
                        </span>
                    </h1>
                </div>
                <div style={{ display: 'flex', background: 'var(--secondary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <button
                        onClick={() => setTab("history")}
                        style={{
                            padding: '6px 16px', borderRadius: '6px', fontSize: '11px', fontWeight: 800,
                            textTransform: 'uppercase', letterSpacing: '0.05em', ...mono,
                            background: tab === 'history' ? 'var(--background)' : 'transparent',
                            color: tab === 'history' ? 'var(--foreground)' : 'var(--muted-foreground)',
                            border: tab === 'history' ? '1px solid var(--border)' : '1px solid transparent',
                            boxShadow: tab === 'history' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.2s',
                        }}
                    >History</button>
                    <button
                        onClick={() => setTab("compose")}
                        style={{
                            padding: '6px 16px', borderRadius: '6px', fontSize: '11px', fontWeight: 800,
                            textTransform: 'uppercase', letterSpacing: '0.05em', ...mono,
                            background: tab === 'compose' ? 'var(--background)' : 'transparent',
                            color: tab === 'compose' ? 'var(--foreground)' : 'var(--muted-foreground)',
                            border: tab === 'compose' ? '1px solid var(--border)' : '1px solid transparent',
                            boxShadow: tab === 'compose' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.2s',
                        }}
                    >Composer</button>
                </div>
            </div>

            {tab === "history" ? (
                <div className="animate-fade-in" style={{ borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--card)' }}>
                    {loading ? (
                        <div style={{ padding: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                            <Loader2 size={32} className="animate-spin text-muted-foreground" />
                            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', ...mono, textTransform: 'uppercase' }}>Scanning logs...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div style={{ padding: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                            <Bell size={48} style={{ opacity: 0.1 }} />
                            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--muted-foreground)' }}>No notification history available</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {history.map((n, i) => (
                                <div key={n.id} style={{
                                    padding: '20px 24px',
                                    display: 'flex',
                                    gap: '20px',
                                    borderBottom: i === history.length - 1 ? 'none' : '1px solid var(--border)',
                                    background: i % 2 === 0 ? 'transparent' : 'var(--secondary)/20',
                                }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '10px',
                                        background: 'var(--secondary)', border: '1px solid var(--border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    }}>
                                        <Bell size={18} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <h3 style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.01em' }}>{n.title}</h3>
                                            <span style={{ fontSize: '10px', fontWeight: 800, ...mono, padding: '2px 6px', background: 'var(--foreground)', color: 'var(--background)', borderRadius: '4px', textTransform: 'uppercase' }}>
                                                Target: {n.user_id ? `UserID #${n.user_id}` : 'GLOBAL BROADCAST'}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', fontWeight: 500, lineHeight: 1.5, marginBottom: '12px' }}>
                                            {n.message}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <span style={{ fontSize: '10px', fontWeight: 800, ...mono, color: 'var(--muted-foreground)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Calendar size={12} /> {new Date(n.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                            <span style={{ fontSize: '10px', fontWeight: 800, ...mono, color: '#16a34a', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <CheckCircle2 size={12} /> Delivered Successfully
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="animate-fade-in grid md:grid-cols-2 gap-8 items-start">
                    {/* Composer Form */}
                    <div style={{
                        background: 'var(--card)', border: '1px solid var(--border)',
                        borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                    }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', background: 'var(--secondary)/50' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.02em' }}>Dispatch Configuration</h2>
                            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', ...mono }}>Set target and message parameters</p>
                        </div>
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '10px', fontWeight: 800, ...mono, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Dispatch Target</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Input
                                        placeholder="Enter User ID for single target..."
                                        value={form.user_id}
                                        onChange={e => setForm({ ...form, user_id: e.target.value })}
                                        style={{ height: '44px', fontWeight: 700, fontSize: '14px', flex: 1 }}
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => setForm({ ...form, user_id: "" })}
                                        style={{ height: '44px', fontWeight: 800, border: '2px solid var(--border)', ...mono, fontSize: '10px' }}
                                    >BROADCAST ALL</Button>
                                </div>
                                <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
                                    {form.user_id ? `Targeting specific user identity #${form.user_id}` : 'Global broadcast will be visible to all logged-in accounts'}
                                </p>
                            </div>

                            <Separator />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '10px', fontWeight: 800, ...mono, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Alert Subject</label>
                                <Input
                                    placeholder="Brief title for the alert..."
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    style={{ height: '44px', fontWeight: 800, fontSize: '15px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '10px', fontWeight: 800, ...mono, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Extended message</label>
                                <Textarea
                                    placeholder="Detailed information for the recipient..."
                                    value={form.message}
                                    onChange={e => setForm({ ...form, message: e.target.value })}
                                    style={{ minHeight: '140px', fontWeight: 500, fontSize: '14px', lineHeight: 1.6 }}
                                />
                            </div>
                        </div>
                        <div style={{ padding: '24px', borderTop: '1px solid var(--border)', background: 'var(--secondary)/30', display: 'flex', gap: '12px' }}>
                            {form.user_id ? (
                                <Button
                                    className="grow h-12"
                                    onClick={sendSingle}
                                    disabled={sending || !form.user_id || !form.title || !form.message}
                                    style={{ background: 'var(--foreground)', color: 'var(--background)', fontWeight: 900, fontSize: '13px' }}
                                >
                                    {sending ? <Loader2 className="mr-2 animate-spin" size={16} /> : <Send className="mr-2" size={16} />}
                                    DISPATCH TO USER
                                </Button>
                            ) : (
                                <Button
                                    className="grow h-12"
                                    onClick={sendToAll}
                                    disabled={sending || !form.title || !form.message}
                                    style={{ background: 'var(--foreground)', color: 'var(--background)', fontWeight: 900, fontSize: '13px' }}
                                >
                                    {sending ? <Loader2 className="mr-2 animate-spin" size={16} /> : <Users className="mr-2" size={16} />}
                                    EXECUTE GLOBAL BROADCAST
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Preview Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                            <label style={{ fontSize: '10px', fontWeight: 800, ...mono, color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Mobile UI Preview</label>
                            <div style={{
                                width: '100%',
                                minHeight: '320px',
                                background: 'white',
                                border: '1px dashed var(--border)',
                                borderRadius: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '40px',
                            }}>
                                {!form.title && !form.message ? (
                                    <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontWeight: 800, ...mono, textTransform: 'uppercase', opacity: 0.5 }}>Awaiting system input...</p>
                                ) : (
                                    <div className="animate-in slide-in-from-bottom-4" style={{
                                        width: '100%', maxWidth: '320px', background: 'black', color: 'white',
                                        borderRadius: '20px', padding: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #333' }}>
                                                <Bell size={14} style={{ color: 'white' }} />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666', ...mono }}>BookBind System</p>
                                                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{form.title || 'Notification Title'}</h4>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '12px', color: '#999', lineHeight: 1.5, fontWeight: 500 }}>
                                            {form.message || 'Notification content goes here...'}
                                        </p>
                                        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '9px', fontWeight: 800, color: '#444', ...mono }}>NOW</span>
                                            <span style={{ fontSize: '9px', fontWeight: 800, color: '#aaa', textTransform: 'uppercase', ...mono }}>Open App</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{
                            padding: '20px', background: 'var(--secondary)/30', border: '1px solid var(--border)', borderRadius: '12px',
                            display: 'flex', gap: '16px',
                        }}>
                            <Info size={20} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
                                <strong style={{ color: 'var(--foreground)' }}>ATTENTION:</strong> Global broadcasts are irrevocable and reach all endpoints simultaneously. Ensure subject and message are verified before execution.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
