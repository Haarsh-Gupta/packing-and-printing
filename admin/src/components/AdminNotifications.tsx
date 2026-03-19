import { useEffect, useRef, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import api, { TOKEN_KEY } from "@/lib/api";

interface Notification {
  id: number; title: string; message: string;
  is_read: boolean; created_at: string;
}

export function AdminNotifications() {
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
    const token = localStorage.getItem(TOKEN_KEY); // FIX: TOKEN_KEY not "access_token"
    if (!token) return;

    if (sourceRef.current) sourceRef.current.close(); // FIX: close previous before new

    const source = new EventSource(`${import.meta.env.VITE_API_URL}/admin/notifications/stream?token=${token}`);
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
          <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 360, maxHeight: 480, overflowY: "auto", background: "var(--color-background-primary)", border: "1px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", zIndex: 50 }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border-tertiary)", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Notifications</span>
              {unreadCount > 0 && <button onClick={markAllRead} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--color-text-info)" }}>Mark all read</button>}
            </div>
            {notifications.length === 0
              ? <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: "var(--color-text-secondary)" }}>No notifications</div>
              : notifications.map(n => (
                <div key={n.id} style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border-tertiary)", background: n.is_read ? "transparent" : "var(--color-background-info)" }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
                </div>
              ))
            }
          </div>
        </>
      )}
    </div>
  );
}