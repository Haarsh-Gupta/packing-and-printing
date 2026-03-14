import { useEffect, useRef, useState } from "react";
import { Bell, X, CheckCheck, Loader2, MessageSquare, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Notification {
    id: number;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    metadata?: {
        type: string;
        id: string;
    };
}

export function AdminNotifications() {
    const [open, setOpen] = useState(false);
    const openRef = useRef(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => { openRef.current = open; }, [open]);

    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

    useEffect(() => {
        if (!token) return;

        // SSE for Admin
        const eventSource = new EventSource(`${apiUrl}/notifications/stream?token=${token}`);

        const fetchCount = () => {
             fetch(`${apiUrl}/notifications/unread-count`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then(r => r.ok ? r.json() : null)
              .then(d => d && setUnread(d.unread || 0))
              .catch(() => {});
        };

        fetchCount();

        const handleEvent = (event: MessageEvent) => {
            try {
                // Refresh unread count on any admin-relevant event
                setUnread(prev => prev + 1);
                if (openRef.current) fetchNotifications();
            } catch { /* silent */ }
        };

        eventSource.addEventListener("new_inquiry", handleEvent);
        eventSource.addEventListener("admin_inquiry_new_message", handleEvent);
        eventSource.addEventListener("admin_inquiry_updated", handleEvent);
        eventSource.addEventListener("new_ticket", handleEvent);
        eventSource.addEventListener("ticket_reply", handleEvent);

        eventSource.onerror = () => {};
        return () => eventSource.close();
    }, [token, apiUrl]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/notifications/?limit=15`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnread(data.unread || 0);
            }
        } catch (err) {
            console.error("Admin Notifications fetch failed", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = () => {
        const next = !open;
        setOpen(next);
        if (next) fetchNotifications();
    };

    const markRead = async (id: number) => {
        try {
            await fetch(`${apiUrl}/notifications/${id}/read`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnread(prev => Math.max(0, prev - 1));
        } catch { /* silent */ }
    };

    const handleNotificationClick = async (n: Notification) => {
        if (!n.is_read) await markRead(n.id);
        
        if (n.metadata) {
            if (n.metadata.type.startsWith("inquiry_") || n.metadata.type === "new_inquiry") {
                navigate(`/inquiries/${n.metadata.id}`);
            } else if (n.metadata.type === "ticket") {
                navigate(`/tickets/${n.metadata.id}`);
            }
        }
        setOpen(false);
    };

    useEffect(() => {
        console.log("AdminNotifications mounted, token present:", !!token);
    }, [token]);

    return (
        <div className="relative" ref={panelRef} style={{ display: 'flex', alignItems: 'center' }}>
            <button
                onClick={handleOpen}
                style={{
                    width: '34px', height: '34px', border: '1px solid #e4e4e7', borderRadius: '9px',
                    background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', position: 'relative', color: '#71717a',
                }}
            >
                <Bell size={15} />
                {!token && <span style={{fontSize: '8px', position: 'absolute'}}>!</span>}
                {unread > 0 && (
                    <span style={{
                        position: 'absolute', top: '-5px', right: '-5px',
                        minWidth: '18px', height: '18px', borderRadius: '10px',
                        background: '#ef4444', border: '2px solid white',
                        color: 'white', fontSize: '10px', fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 4px', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                    }}>
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div style={{
                    position: 'absolute', right: 0, top: '44px', width: '320px',
                    background: 'white', border: '1px solid #e4e4e7', borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                    zIndex: 100, overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '12px 16px', borderBottom: '1px solid #f1f5f9',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: '#f8fafc'
                    }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Notifications</span>
                        {unread > 0 && (
                            <span style={{
                                fontSize: '11px', background: '#fee2e2', color: '#ef4444',
                                padding: '1px 6px', borderRadius: '4px', fontWeight: 600
                            }}>
                                {unread} new
                            </span>
                        )}
                    </div>

                    <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                        {loading && notifications.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center' }}>
                                <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto', color: '#94a3b8' }} />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8' }}>
                                <Bell size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                                <p style={{ fontSize: '12px', fontWeight: 500 }}>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    style={{
                                        padding: '12px 16px', borderBottom: '1px solid #f1f5f9',
                                        cursor: 'pointer', transition: 'background 0.2s',
                                        background: n.is_read ? 'white' : '#f0f9ff'
                                    }}
                                    className="hover:bg-slate-50"
                                >
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ 
                                            width: '32px', height: '32px', borderRadius: '8px',
                                            background: n.is_read ? '#f1f5f9' : '#e0f2fe',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            {n.metadata?.type?.includes('message') || n.metadata?.type === 'ticket_reply' ? (
                                                <MessageSquare size={14} style={{ color: n.is_read ? '#94a3b8' : '#0369a1' }} />
                                            ) : (
                                                <FileText size={14} style={{ color: n.is_read ? '#94a3b8' : '#0369a1' }} />
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ 
                                                fontSize: '12px', fontWeight: n.is_read ? 600 : 700,
                                                color: '#1e293b', marginBottom: '2px', lineClamp: 1
                                            }}>{n.title}</p>
                                            <p style={{ 
                                                fontSize: '11px', color: '#64748b', 
                                                lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                            }}>{n.message}</p>
                                            <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', fontWeight: 500 }}>
                                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <div style={{ padding: '10px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                         <button 
                            onClick={() => { navigate('/notifications'); setOpen(false); }}
                            style={{ fontSize: '11px', fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            View All Notifications
                         </button>
                    </div>
                </div>
            )}
        </div>
    );
}

