import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import api from "@/lib/api";

interface Notification {
  id: number; title: string; message: string;
  is_read: boolean; created_at: string;
  metadata_?: Record<string, any>; 
  metadata?: Record<string, any>; 
}

export function AdminNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [open, setOpen]                   = useState(false);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    api<Notification[]>("/admin/notifications").then(data => {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    });
  }, []);

  useEffect(() => {
    if (sourceRef.current) sourceRef.current.close();
    
    const source = new EventSource(`${import.meta.env.VITE_API_URL}/notifications/stream`, {
      withCredentials: true
    });
    sourceRef.current = source;

    source.addEventListener("new_notification", (e) => {
      try {
        const data: Notification = JSON.parse(e.data);
        setNotifications(prev => [data, ...prev]);
        setUnreadCount(c => c + 1);
      } catch { /* ignore */ }
    });

    return () => { source.close(); sourceRef.current = null; }; // FIX: always clean up
  }, []);

  const markAllRead = async () => {
    await api("/admin/notifications/mark-all-read", { method: "PATCH" });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = async (n: Notification) => {
    // 1. Mark as read optimistically if unread
    if (!n.is_read) {
      setNotifications(prev => prev.map(old => old.id === n.id ? { ...old, is_read: true } : old));
      setUnreadCount(c => Math.max(0, c - 1));
      api(`/admin/notifications/${n.id}/read`, { method: "PATCH" }).catch(console.error);
    }
    setOpen(false);

    // 2. Redirect based on metadata
    const meta = n.metadata || n.metadata_;
    if (meta) {
        const type = meta.type || '';
        const id = meta.id || meta.inquiry_id || meta.ticket_id || meta.order_id;

        if (type === 'new_order' || type === 'payment_declared' || type === 'payment_received') {
            if (id) navigate(`/orders/${id}`);
            else navigate('/orders');
        } else if (type === 'ticket' || type === 'ticket_reply') {
            if (id) navigate(`/tickets/${id}`);
            else navigate('/tickets');
        } else if (type === 'email_bounce') {
            const email = meta.email;
            if (email) navigate(`/users?search=${encodeURIComponent(email)}`);
            else navigate('/users');
        } else if (type.startsWith('inquiry_') || type === 'new_inquiry' || type === 'quote_accepted') {
            if (id) navigate(`/inquiries/${id}`);
            else navigate('/inquiries');
        } else if (type === 'new_review') {
            navigate('/reviews'); // App.tsx shows /reviews route exists
        }
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", position: "relative", padding: 8 }}>
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{ position: "absolute", top: 2, right: 2, background: "#E24B4A", color: "#fff", borderRadius: "50%", width: 16, height: 16, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-[calc(100%+8px)] w-80 sm:w-96 max-h-[480px] overflow-y-auto bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-[#434655]/40 rounded-xl z-50 shadow-2xl flex flex-col font-['Inter']">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-[#434655]/20 flex justify-between items-center bg-slate-50 dark:bg-[#0b1326]/50">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-[#dae2fd]">Incoming Nodes</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[10px] font-bold uppercase tracking-widest text-[#1f70e3] dark:text-[#adc6ff] hover:underline bg-transparent border-none cursor-pointer">
                  Clear Queue
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-100 dark:divide-[#434655]/10">
              {notifications.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#0b1326] flex items-center justify-center mb-1">
                    <Bell size={16} className="text-slate-400" />
                  </div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 m-0">Zero Activity</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-[#171f33]/80 ${n.is_read ? '' : 'bg-blue-50/50 dark:bg-[#1f70e3]/5 border-l-2 border-l-[#1f70e3]'}`}
                  >
                    <div className="text-[12px] font-extrabold text-slate-900 dark:text-[#dae2fd] mb-0.5 leading-tight">{n.title}</div>
                    <p className="text-[11px] text-slate-600 dark:text-[#c3c5d8] line-clamp-2 m-0 leading-relaxed font-medium">{n.message}</p>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-2 flex items-center gap-1.5 leadin-none">
                      <div className={`w-1 h-1 rounded-full ${n.is_read ? 'bg-slate-300' : 'bg-[#1f70e3]'}`} />
                      {new Date(n.created_at).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
            {notifications.length > 5 && (
              <div className="p-3 border-t border-slate-200 dark:border-[#434655]/20 text-center">
                <button className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-[#1f70e3] transition-colors bg-transparent border-none cursor-pointer">
                  View Data History
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}