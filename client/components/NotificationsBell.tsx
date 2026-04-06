"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { Bell, X, CheckCheck, Loader2, Trash2 } from "lucide-react";
import { useAlert } from "@/components/CustomAlert";
import { useAuth } from "@/context/AuthContext";

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

export default function NotificationsBell() {
    const [open, setOpen] = useState(false);
    const openRef = useRef(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const { showAlert } = useAlert();

    const { isLoggedIn } = useAuth();

    // Keep ref in sync
    useEffect(() => { openRef.current = open; }, [open]);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

    const fetcher = (url: string) => fetch(url, { credentials: "include" }).then(r => r.ok ? r.json() : null);
    
    useSWR(
        isLoggedIn ? `${apiUrl}/notifications/unread-count` : null,
        fetcher,
        {
            onSuccess: (data: { unread: number } | null) => {
                if (data) setUnread(data.unread || 0);
            },
            revalidateOnFocus: false,
            dedupingInterval: 10000
        }
    );

    // ── SSE stream for real-time notifications ──────────────────────────────
    useEffect(() => {
        if (!isLoggedIn) return;

        const eventSource = new EventSource(`${apiUrl}/notifications/stream`, {
            withCredentials: true,
        });

        // Handle incoming events
        const handleEvent = (event: MessageEvent) => {
            try {
                const payload = JSON.parse(event.data);

                if (event.type === "inquiry_status_changed" || event.type === "inquiry_status_updated") {
                    const label = payload.status?.replace(/_/g, " ") ?? "updated";
                    showAlert(`Inquiry ${label}`, "info" as any);
                    setUnread(prev => prev + 1);
                }

                if (event.type === "inquiry_quoted") {
                    showAlert(`You received a quote! ₹${payload.total_price?.toLocaleString()}`, "success");
                    setUnread(prev => prev + 1);
                }

                if (event.type === "inquiry_new_message") {
                    showAlert("New message from our studio", "info" as any);
                    setUnread(prev => prev + 1);
                }

                if (event.type === "ticket_reply") {
                    showAlert("New reply to your support ticket!", "info" as any);
                    setUnread(prev => prev + 1);
                }

                // Refresh list if open
                if (openRef.current) fetchNotifications();
            } catch { /* silent */ }
        };

        const handleRawMessage = (event: MessageEvent) => {
             // Handle generic messages if needed
        };

        eventSource.addEventListener("inquiry_status_changed", handleEvent);
        eventSource.addEventListener("inquiry_status_updated", handleEvent);
        eventSource.addEventListener("inquiry_quoted", handleEvent);
        eventSource.addEventListener("inquiry_new_message", handleEvent);
        eventSource.addEventListener("ticket_reply", handleEvent);

        eventSource.onerror = () => {
            // SSE auto-reconnects; this is normal on idle disconnect
        };

        return () => eventSource.close();
    }, [isLoggedIn]); 

    // ── Close on outside click ─────────────────────────────────────────────
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
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
            const url = `${apiUrl}/notifications/?limit=15`;
            const res = await fetch(url, {
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnread(data.unread || 0);
            } else {
                console.error("Notifications fetch failed:", res.status);
            }
        } catch (err) {
            console.error("Notifications fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = () => {
        const next = !open;
        setOpen(next);
        if (next) fetchNotifications();
    };

    const handleNotificationClick = async (n: Notification) => {
        if (!n.is_read) await markRead(n.id);
        
        if (n.metadata) {
            if (n.metadata.type.startsWith("inquiry_")) {
                window.location.href = `/dashboard/inquiries/${n.metadata.id}`;
            } else if (n.metadata.type === "ticket") {
                window.location.href = `/dashboard/support/${n.metadata.id}`;
            }
        }
        setOpen(false);
    };

    const markRead = async (id: number) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
            await fetch(`${apiUrl}/notifications/${id}/read`, {
                method: "PATCH",
                credentials: "include",
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnread(prev => Math.max(0, prev - 1));
        } catch { /* silent */ }
    };

    const markAllRead = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
            await fetch(`${apiUrl}/notifications/read-all`, {
                method: "PATCH",
                credentials: "include",
            });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnread(0);
        } catch { /* silent */ }
    };

    const deleteAll = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
            await fetch(`${apiUrl}/notifications/all`, {
                method: "DELETE",
                credentials: "include",
            });
            setNotifications([]);
            setUnread(0);
        } catch { /* silent */ }
    };

    const deleteNotification = async (id: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
            await fetch(`${apiUrl}/notifications/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            setNotifications(prev => prev.filter(n => n.id !== id));
            fetchNotifications();
        } catch { /* silent */ }
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const diff = (now.getTime() - d.getTime()) / 1000;
        if (diff < 60) return "Just now";
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return d.toLocaleDateString();
    };

    if (!isLoggedIn) return null;

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                onClick={handleOpen}
                className="relative p-2 hover:bg-zinc-800 rounded-full transition-colors"
                aria-label="Notifications"
            >
                <Bell className="h-6 w-6 text-white" />
                {unread > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#ff90e8] border-2 border-black rounded-full flex items-center justify-center text-[10px] font-black text-black">
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div className="absolute right-0 top-12 w-96 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-[1000]">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b-4 border-black bg-black text-white">
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            <span className="font-black uppercase tracking-tight">Notifications</span>
                            {unread > 0 && (
                                <span className="bg-[#ff90e8] text-black text-xs font-black px-2 py-0.5 border border-black">
                                    {unread} new
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                {unread > 0 && (
                                    <button onClick={markAllRead} className="text-xs font-bold hover:text-[#fdf567] flex items-center gap-1">
                                        <CheckCheck className="h-4 w-4" /> All
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button onClick={deleteAll} className="text-xs font-bold hover:text-[#fdf567] flex items-center gap-1 ml-2 text-zinc-400">
                                        <Trash2 className="h-4 w-4" /> Clear
                                    </button>
                                )}
                            </div>
                            <button onClick={() => setOpen(false)}>
                                <X className="h-5 w-5 ml-2" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="max-h-[420px] overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-16 text-center text-zinc-500">
                                <Bell className="h-10 w-10 mx-auto mb-3 text-zinc-300" />
                                <p className="font-black uppercase tracking-tight">No notifications yet</p>
                                <p className="text-sm font-medium">You&apos;re all caught up!</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`p-4 border-b-2 border-zinc-100 cursor-pointer transition-colors ${n.is_read ? "bg-white hover:bg-zinc-50" : "bg-[#fdf567]/30 hover:bg-[#fdf567]/50 border-l-4 border-l-black"}`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <p className="font-black text-sm uppercase tracking-tight">{n.title}</p>
                                            <p className="text-sm text-zinc-600 font-medium mt-1">{n.message}</p>
                                        </div>
                                        {!n.is_read && (
                                            <span className="h-2 w-2 bg-black rounded-full mt-1 shrink-0" />
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center mt-3">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                            {formatTime(n.created_at)}
                                        </p>
                                        <button 
                                            onClick={(e) => deleteNotification(n.id, e)} 
                                            className="p-1 hover:bg-zinc-200 rounded-md text-zinc-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
