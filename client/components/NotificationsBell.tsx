"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, X, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Notification {
    id: number;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export default function NotificationsBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    // Fetch unread count periodically
    useEffect(() => {
        if (!token) return;

        let stopped = false;
        const doFetch = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/unread-count`, {
                    headers: { Authorization: `Bearer ${token}` },
                    credentials: "include",
                });
                if (res.ok) {
                    const data = await res.json();
                    setUnread(data.unread || 0);
                } else if (res.status === 401) {
                    // Token is invalid/expired — stop polling
                    stopped = true;
                }
            } catch (e) { /* silent */ }
        };

        doFetch();
        const interval = setInterval(() => {
            if (!stopped) doFetch();
            else clearInterval(interval);
        }, 60000);
        return () => clearInterval(interval);
    }, [token]);

    // Close on outside click
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/?limit=15`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnread(data.unread || 0);
            }
        } catch (e) { /* silent */ } finally {
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
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${id}/read`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
            setUnread((prev) => Math.max(0, prev - 1));
        } catch (e) { /* silent */ }
    };

    const markAllRead = async () => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/read-all`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnread(0);
        } catch (e) { /* silent */ }
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

    if (!token) return null;

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
                <div className="absolute right-0 top-12 w-96 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-200">
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
                        <div className="flex items-center gap-2">
                            {unread > 0 && (
                                <button onClick={markAllRead} className="text-xs font-bold hover:text-[#fdf567] flex items-center gap-1">
                                    <CheckCheck className="h-4 w-4" /> All
                                </button>
                            )}
                            <button onClick={() => setOpen(false)}>
                                <X className="h-5 w-5" />
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
                                    onClick={() => !n.is_read && markRead(n.id)}
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
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">
                                        {formatTime(n.created_at)}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
