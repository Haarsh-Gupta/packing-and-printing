"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle2, Info, Loader2, X, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAlert } from "@/components/CustomAlert";

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

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const { showAlert } = useAlert();

    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

    const fetchNotifications = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/notifications/?limit=10`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unread || 0);
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        } finally {
            setLoading(false);
        }
    };

    // SSE for real-time updates
    useEffect(() => {
        if (!token) return;

        // Initial unread count
        fetch(`${apiUrl}/notifications/unread-count`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.ok ? r.json() : null)
          .then(d => d && setUnreadCount(d.unread || 0))
          .catch(() => {});

        const eventSource = new EventSource(`${apiUrl}/notifications/stream?token=${token}`);

        const handleEvent = (event: MessageEvent) => {
            try {
                const payload = JSON.parse(event.data);
                
                // Show toast/alert
                if (event.type === "inquiry_quoted") {
                    showAlert(`You received a quote! ₹${payload.total_price?.toLocaleString()}`, "success");
                } else if (event.type === "inquiry_new_message") {
                    showAlert("New message from our studio", "info" as any);
                }

                // Increment count and refresh list if open
                setUnreadCount(prev => prev + 1);
                if (isOpen) fetchNotifications();
            } catch (err) {
                console.error("SSE Parse Error", err);
            }
        };

        eventSource.addEventListener("inquiry_status_changed", handleEvent);
        eventSource.addEventListener("inquiry_status_updated", handleEvent);
        eventSource.addEventListener("inquiry_quoted", handleEvent);
        eventSource.addEventListener("inquiry_new_message", handleEvent);

        return () => eventSource.close();
    }, [token, isOpen]);

    const markAsRead = async (id: number) => {
        if (!token) return;
        try {
            const res = await fetch(`${apiUrl}/notifications/${id}/read`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error("Failed to mark read", err);
        }
    };

    const markAllRead = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${apiUrl}/notifications/read-all`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
            }
        } catch (err) {
            console.error("Failed to mark all read", err);
        }
    };

    const toggleOpen = () => {
        const next = !isOpen;
        setIsOpen(next);
        if (next) fetchNotifications();
    };

    const getNotificationLink = (n: Notification) => {
        if (!n.metadata) return null;
        if (n.metadata.type.startsWith("inquiry_")) {
            return `/dashboard/inquiries/${n.metadata.id}`;
        }
        return null;
    };

    if (!token) return null;

    return (
        <div className="relative" ref={panelRef}>
            <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-zinc-100 rounded-none border-2 border-transparent hover:border-black"
                onClick={toggleOpen}
            >
                <Bell className="w-5 h-5 text-black" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff90e8] text-[10px] font-black text-black border border-black animate-in fade-in zoom-in">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </Button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>

                    <div className="absolute right-0 top-full mt-2 w-80 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-50 animate-in slide-in-from-top-2">
                        <div className="p-4 border-b-2 border-black flex justify-between items-center bg-zinc-50">
                            <h3 className="font-black uppercase text-sm tracking-tight flex items-center gap-2">
                                <Bell className="w-4 h-4" /> Notifications
                            </h3>
                            {unreadCount > 0 && (
                                <button onClick={markAllRead} className="text-[10px] font-bold uppercase underline text-zinc-500 hover:text-black">
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[350px] overflow-y-auto">
                            {loading && notifications.length === 0 ? (
                                <div className="p-12 flex justify-center items-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-10 text-center flex flex-col items-center gap-2">
                                    <Bell className="w-8 h-8 text-zinc-200" />
                                    <p className="font-black uppercase text-xs text-zinc-400 tracking-wider">No notifications</p>
                                </div>
                            ) : (
                                <ul className="divide-y-2 divide-zinc-100">
                                    {notifications.map(n => {
                                        const link = getNotificationLink(n);
                                        const Comp = link ? Link : "div";
                                        
                                        return (
                                            <li key={n.id}>
                                                <Comp 
                                                    href={link || "#"}
                                                    className={`transition-colors flex flex-col cursor-pointer ${!n.is_read ? 'bg-[#fdf567]/10 hover:bg-[#fdf567]/20 border-l-4 border-l-black' : 'hover:bg-zinc-50'}`}
                                                    onClick={async () => {
                                                        if (!n.is_read) await markAsRead(n.id);
                                                        setIsOpen(false);
                                                    }}
                                                >
                                                    <div className="p-4">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h4 className={`text-xs uppercase tracking-tight ${!n.is_read ? 'font-black' : 'font-bold text-zinc-600'}`}>
                                                                {n.title}
                                                            </h4>
                                                            {!n.is_read && <span className="w-1.5 h-1.5 bg-black rounded-full mt-1"></span>}
                                                        </div>
                                                        <p className="text-xs font-medium text-zinc-500 line-clamp-2 leading-relaxed">
                                                            {n.message}
                                                        </p>
                                                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-2 block">
                                                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </Comp>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        <div className="p-3 border-t-2 border-black bg-zinc-50 text-center">
                            <Link 
                                href="/dashboard/inquiries" 
                                className="text-[10px] font-black uppercase tracking-widest hover:underline" 
                                onClick={() => setIsOpen(false)}
                            >
                                View My Inquiries
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
