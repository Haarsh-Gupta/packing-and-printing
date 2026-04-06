"use client";

import { useEffect, useState } from "react";
import { Users, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface OnlineUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function OnlineUsersCard() {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/online`, {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setCount(data.count || 0);
          setUsers(data.users || []);
        }
      } catch (err) {
        console.error("Failed to fetch online users:", err);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchOnlineUsers();

    // Poll every 15 seconds
    const interval = setInterval(fetchOnlineUsers, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl relative overflow-hidden group">
      {/* Decorative top pulse */}
      <div className="absolute top-0 left-0 w-full h-1 bg-[#ff90e8]">
        <div className="h-full bg-black w-1/3 animate-[pulse_2s_ease-in-out_infinite]" />
      </div>

      <div className="flex justify-between items-start mb-4 mt-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-black text-white relative border-2 border-black rounded-lg">
            <Users className="h-6 w-6" />
            <span className="absolute -top-2 -right-2 h-4 w-4 bg-[#fdf567] rounded-full border-2 border-black animate-pulse" />
          </div>
          <h3 className="font-black text-xl uppercase tracking-tighter">Live Traffic</h3>
        </div>
      </div>

      <div className="my-6">
        {loading ? (
          <div className="flex items-center gap-2 text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="font-bold uppercase tracking-widest text-sm">Calculating...</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black">{count}</span>
            <span className="text-zinc-500 font-bold uppercase tracking-widest">Active Users</span>
          </div>
        )}
      </div>

      {count > 0 && (
        <div className="mt-4 border-t-2 border-zinc-100 pt-4">
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="w-full flex justify-between items-center text-xs font-black uppercase text-black hover:text-[#ff90e8] transition-colors"
          >
            View Directory {expanded ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
          </button>
          
          {expanded && (
            <div className="mt-4 max-h-48 overflow-y-auto pr-2 space-y-3">
              {users.map((u) => (
                <div key={u.id} className="flex justify-between items-center p-3 bg-zinc-50 border-2 border-black rounded-lg">
                  <div>
                    <h4 className="font-black text-sm uppercase">{u.name || "Unknown"}</h4>
                    <span className="text-xs font-bold text-zinc-500">{u.email}</span>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-1 border border-black ${u.role === "admin" ? "bg-[#ff90e8]" : "bg-[#fdf567]"}`}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
