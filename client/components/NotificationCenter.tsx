"use client";

import { useState } from "react";
import { Bell, CheckCircle2, Info } from "lucide-react";
import { MOCK_NOTIFICATIONS } from "../lib/mockData";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id: number) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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
                                        <li key={notification.id} className={`border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors ${!notification.read ? 'bg-blue-50/50' : ''}`}>
                                            <Link
                                                href={notification.link}
                                                className="block p-4"
                                                onClick={() => {
                                                    markAsRead(notification.id);
                                                    setIsOpen(false);
                                                }}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notification.read ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                                                    <div>
                                                        <h4 className={`text-sm ${!notification.read ? 'font-bold' : 'font-medium'}`}>{notification.title}</h4>
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
