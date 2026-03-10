"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface Notification {
    id: number;
    title: string;
    message: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL;
            if (!baseUrl) return;

            const token = localStorage.getItem("access_token");
            if (!token) return;

            // Removing trailing slash for consistency
            const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            const res = await fetch(`${cleanUrl}/notifications`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unread || 0);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Refresh every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id: number) => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL;
            if (!baseUrl) return;

            const token = localStorage.getItem("access_token");
            const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            await fetch(`${cleanUrl}/notifications/${id}/read`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                credentials: "include"
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const markAllRead = async () => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL;
            if (!baseUrl) return;

            const token = localStorage.getItem("access_token");
            const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            await fetch(`${cleanUrl}/notifications/read-all`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                credentials: "include"
            });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-zinc-100 rounded-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse ring-2 ring-white"></span>
                )}
            </Button>

            {isOpen && (
                <>
                    {/* Backdrop to close on click outside */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>

                    <div className="absolute right-0 top-full mt-2 w-80 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50">
                        <div className="p-3 border-b-2 border-black flex justify-between items-center bg-zinc-50">
                            <h3 className="font-bold uppercase text-sm">Notifications</h3>
                            {unreadCount > 0 && (
                                <button onClick={markAllRead} className="text-xs underline text-zinc-500 hover:text-black">
                                    Mark all read
                                </button>
                            )}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-6 text-center text-zinc-400 text-sm">
                                    No notifications
                                </div>
                            ) : (
                                <ul>
                                    {notifications.map(notification => (
                                        <li key={notification.id} className={`border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors ${!notification.is_read ? 'bg-blue-50/50' : ''}`}>
                                            <Link
                                                href={notification.link || "#"}
                                                className="block p-4"
                                                onClick={() => {
                                                    if (!notification.is_read) markAsRead(notification.id);
                                                    setIsOpen(false);
                                                }}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notification.is_read ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                                                    <div>
                                                        <h4 className={`text-sm ${!notification.is_read ? 'font-bold' : 'font-medium'}`}>{notification.title}</h4>
                                                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{notification.message}</p>
                                                        <p className="text-[10px] text-zinc-400 mt-2">{new Date(notification.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="p-2 border-t-2 border-black bg-zinc-50 text-center">
                            <Link href="/dashboard/notifications" className="text-xs font-bold uppercase hover:underline" onClick={() => setIsOpen(false)}>
                                View All
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
