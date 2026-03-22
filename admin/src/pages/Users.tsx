import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import type { AuthUser } from "@/types";
import { Search, Shield, User, Trash2, Loader2, Users, ChevronRight } from "lucide-react";

const RoleBadge = ({ admin }: { admin: boolean }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[9px] uppercase tracking-widest font-bold font-['Inter'] ${
        admin 
            ? 'text-[#fcd34d] bg-[#f59e0b]/10 border border-[#f59e0b]/20' 
            : 'text-blue-600 dark:text-[#adc6ff] bg-[#1f70e3]/10 border border-[#1f70e3]/20'
    }`}>
        {admin ? <Shield size={10} /> : <User size={10} />}
        {admin ? 'System Admin' : 'Customer Asset'}
    </span>
);

const OnlineDot = ({ isOnline }: { isOnline: boolean }) => {
    if (!isOnline) return null;
    return (
        <div className="absolute -bottom-px -right-px w-2.5 h-2.5 rounded-full bg-[#34d399] border-2 border-[#131b2e] shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
    );
};

export default function UsersPage() {
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [adminFilter, setAdminFilter] = useState<boolean | null>(null);

    const fetchUsers = () => {
        setLoading(true);
        let url = `/admin/users/all?skip=0&limit=100`;
        if (adminFilter !== null) url += `&admin=${adminFilter}`;
        if (search) url += `&query=${search}`;
        api<AuthUser[]>(url).then(setUsers).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => {
        const timer = setTimeout(() => fetchUsers(), 300);
        return () => clearTimeout(timer);
    }, [search, adminFilter]);

    const deleteUser = async (id: string) => {
        if (!confirm("Permanently delete this user account? This action is irreversible.")) return;
        try {
            await api(`/admin/users/${id}`, { method: "DELETE" });
            fetchUsers();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="flex flex-col h-full font-['Inter'] bg-slate-50 dark:bg-[#0b1326] text-slate-900 dark:text-[#dae2fd] px-2">

            {/* Header */}
            <div className="flex items-end justify-between mb-8">
                <div>
                    <nav className="flex items-center gap-2 text-[10px] font-bold text-blue-600 dark:text-[#adc6ff] mb-2 tracking-widest uppercase">
                        <span>Directory</span>
                        <span>/</span>
                        <span className="text-slate-600 dark:text-[#c3c5d8]/60">Accounts</span>
                    </nav>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-[#dae2fd] m-0">
                        Global User Registry
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-[#c3c5d8] mt-1 m-0">
                        {users.length} {users.length === 1 ? 'account node' : 'account nodes'} indexed globally
                    </p>
                </div>
                <div className="flex gap-3 items-center">
                    {/* Search */}
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#434655]" />
                        <input
                            type="text" placeholder="Query by string vector..." value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="h-10 pl-9 pr-3 w-64 border border-slate-200 dark:border-[#434655]/40 rounded-lg text-xs font-mono text-blue-600 dark:text-[#adc6ff] bg-white dark:bg-[#131b2e] outline-none focus:border-blue-400 dark:border-[#adc6ff] placeholder:text-[#434655]/70 transition-colors"
                        />
                    </div>
                    {/* Role filter */}
                    <select
                        onChange={e => setAdminFilter(e.target.value === 'all' ? null : e.target.value === 'admin')}
                        className="h-10 px-3 border border-slate-200 dark:border-[#434655]/40 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-[#c3c5d8] bg-white dark:bg-[#131b2e] cursor-pointer outline-none focus:border-blue-400 dark:border-[#adc6ff] transition-colors"
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">System Admins</option>
                        <option value="customer">Customers</option>
                    </select>
                </div>
            </div>

            {/* Table card */}
            <div className="bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-[#434655]/20 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto custom-scrollbar flex-1">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="bg-slate-100 dark:bg-[#0b1326]/50 text-slate-600 dark:text-[#c3c5d8] uppercase text-[10px] tracking-[0.2em] font-bold border-b border-slate-200 dark:border-[#434655]/20">
                                {['Identity Protocol', 'Privilege State', 'Contact Vector', 'Registration Epoch', ''].map((h, i) => (
                                    <th key={i} className="px-6 py-4">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#434655]/10">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-16 text-center text-slate-600 dark:text-[#c3c5d8] font-bold tracking-widest text-[10px] uppercase">
                                        <Loader2 size={16} className="animate-spin text-blue-600 dark:text-[#adc6ff] mx-auto mb-2" />
                                        Querying node directory...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-16 text-center text-slate-600 dark:text-[#c3c5d8]/50 font-bold tracking-widest text-[10px] uppercase">
                                        <Users size={32} className="opacity-20 mx-auto mb-3 block" />
                                        <p>No matching accounts found in local shard.</p>
                                    </td>
                                </tr>
                            ) : users.map(user => (
                                <tr key={user.id} className="group hover:bg-slate-50 dark:hover:bg-[#171f33]/80 transition-colors">
                                    {/* Identity */}
                                    <td className="px-6 py-5 flex items-center gap-4">
                                        <Link to={`/users/${user.id}`} className="flex items-center gap-4 group/link">
                                            <div className="relative shrink-0">
                                                <div className={`w-12 h-12 rounded-xl border border-slate-200 dark:border-[#434655]/30 shrink-0 flex items-center justify-center text-lg font-black transition-colors group-hover/link:border-blue-400 dark:border-[#adc6ff]/50 ${
                                                    user.admin 
                                                        ? 'bg-[#1f70e3]/10 text-blue-600 dark:text-[#adc6ff]' 
                                                        : 'bg-slate-50 dark:bg-[#0b1326] text-slate-600 dark:text-[#c3c5d8]'
                                                }`}>
                                                    {(user.name || user.email || 'U')[0].toUpperCase()}
                                                </div>
                                                <OnlineDot isOnline={(user as any).is_online} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-extrabold text-slate-900 dark:text-[#dae2fd] mb-1 group-hover/link:text-blue-600 dark:text-[#adc6ff] transition-colors">
                                                    {user.name || 'Anonymous Node'}
                                                </p>
                                                <p className="text-[10px] text-blue-600 dark:text-[#adc6ff] bg-[#adc6ff]/5 px-1.5 py-0.5 rounded border border-blue-400 dark:border-[#adc6ff]/10 font-mono tracking-widest inline-block transition-colors group-hover/link:bg-[#adc6ff]/10">
                                                    {user.id.toString().slice(0, 16)}…
                                                </p>
                                            </div>
                                        </Link>
                                    </td>

                                    {/* Privilege */}
                                    <td className="px-6 py-5">
                                        <RoleBadge admin={user.admin || false} />
                                    </td>

                                    {/* Contact */}
                                    <td className="px-6 py-5">
                                        <p className="text-xs font-mono text-slate-600 dark:text-[#c3c5d8] flex items-center gap-2 mb-1.5">
                                            {user.email}
                                            {(user as any).email_bounced && (
                                                <span className="text-[9px] font-black text-[#ffb4ab] bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 px-1.5 py-0.5 rounded-sm uppercase tracking-widest">
                                                    Dead Link
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-[11px] font-mono text-slate-500 dark:text-[#8d90a1]">
                                            CCOM: {(user as any).phone || 'UNREGISTERED'}
                                        </p>
                                    </td>

                                    {/* Registered */}
                                    <td className="px-6 py-5">
                                        <span className="text-[11px] font-bold text-slate-500 dark:text-[#8d90a1] uppercase tracking-wider">
                                            {user.created_at
                                                ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                                                : 'Epoch 0'}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link
                                                to={`/users/${user.id}`}
                                                className="p-2 text-slate-600 dark:text-[#c3c5d8] hover:text-blue-600 dark:hover:text-[#adc6ff] hover:bg-[#1f70e3]/10 rounded-lg transition-colors border border-transparent hover:border-blue-400 dark:hover:border-[#adc6ff]/20"
                                                title="View profile"
                                            >
                                                <ChevronRight size={18} />
                                            </Link>
                                            <button
                                                onClick={() => deleteUser(user.id)}
                                                className="p-2 text-[#434655] hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/10 rounded-lg transition-colors border border-transparent hover:border-[#ffb4ab]/20"
                                                title="Purge node"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
