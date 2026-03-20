import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AuthUser } from "@/types";
import { Search, Shield, User, Trash2, Loader2, Users } from "lucide-react";

const RoleBadge = ({ admin }: { admin: boolean }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold font-sans ${
        admin 
            ? 'text-blue-500 bg-blue-50 dark:bg-blue-500/10' 
            : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
    }`}>
        {admin ? <Shield size={10} /> : <User size={10} />}
        {admin ? 'Admin' : 'Customer'}
    </span>
);

const OnlineDot = ({ isOnline }: { isOnline: boolean }) => {
    if (!isOnline) return null;
    return (
        <div className="absolute -bottom-px -right-px w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white dark:border-slate-900 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
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
        <div className="animate-fade-in flex flex-col gap-5 font-sans h-full">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white m-0">
                        Account Registry
                    </h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                        {users.length} {users.length === 1 ? 'account' : 'accounts'} registered
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    {/* Search */}
                    <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input
                            type="text" placeholder="Search by name or email…" value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="h-9 pl-8 pr-3 w-60 border border-slate-200 dark:border-slate-800 rounded-lg text-[13px] text-slate-900 dark:text-white bg-white dark:bg-slate-900 font-sans outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    {/* Role filter */}
                    <select
                        onChange={e => setAdminFilter(e.target.value === 'all' ? null : e.target.value === 'admin')}
                        className="h-9 px-2.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[13px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 font-sans cursor-pointer outline-none focus:border-blue-500 transition-colors"
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admins</option>
                        <option value="customer">Customers</option>
                    </select>
                    {/* Add button */}
                    <button className="h-9 px-4 bg-blue-500 hover:bg-blue-600 text-white border-none rounded-lg text-[13px] font-semibold cursor-pointer font-sans transition-colors">
                        + Add Account
                    </button>
                </div>
            </div>

            {/* Table card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="p-16 text-center text-slate-400 dark:text-slate-500">
                        <Loader2 size={24} className="animate-spin text-blue-500 mx-auto" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-16 text-center text-slate-400 dark:text-slate-500">
                        <Users size={32} className="opacity-30 mx-auto mb-2.5 block" />
                        <p className="text-sm font-medium">No accounts found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800/60">
                                    {['IDENTITY', 'PRIVILEGE', 'CONTACT', 'REGISTERED', ''].map((h, i) => (
                                        <th key={i} className="px-5 py-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 text-left tracking-wider">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="border-b border-slate-50 dark:border-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        {/* Identity */}
                                        <td className="px-5 py-3.5 flex items-center gap-3">
                                            <div className="relative shrink-0">
                                                <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-bold ${
                                                    user.admin 
                                                        ? 'bg-blue-500 text-white' 
                                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                                }`}>
                                                    {(user.name || user.email || 'U')[0].toUpperCase()}
                                                </div>
                                                <OnlineDot isOnline={(user as any).is_online} />
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-semibold text-slate-900 dark:text-white m-0">
                                                    {user.name || 'Unknown'}
                                                </p>
                                                <p className="text-[11px] text-slate-400 dark:text-slate-500 m-0 tracking-tight font-sans">
                                                    ID: {user.id.toString().slice(0, 8)}…
                                                </p>
                                            </div>
                                        </td>

                                        {/* Privilege */}
                                        <td className="px-5 py-3.5">
                                            <RoleBadge admin={user.admin || false} />
                                        </td>

                                        {/* Contact */}
                                        <td className="px-5 py-3.5">
                                            <p className="text-[13px] text-slate-600 dark:text-slate-300 m-0 flex items-center gap-1.5">
                                                {user.email}
                                                {(user as any).email_bounced && (
                                                    <span className="text-[9px] font-extrabold text-red-500 bg-red-100 dark:bg-red-500/10 px-1.5 rounded uppercase">
                                                        Bounced
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500 m-0">
                                                {(user as any).phone || '—'}
                                            </p>
                                        </td>

                                        {/* Registered */}
                                        <td className="px-5 py-3.5">
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {user.created_at
                                                    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                    : '—'}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-5 py-3.5 text-right">
                                            <button
                                                onClick={() => deleteUser(user.id)}
                                                className="bg-transparent border-none cursor-pointer text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 p-1.5 rounded-md transition-colors"
                                                title="Delete user"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
