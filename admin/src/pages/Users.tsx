import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AuthUser } from "@/types";
import { Search, Shield, User, Trash2, Loader2, Users } from "lucide-react";

const RoleBadge = ({ admin }: { admin: boolean }) => (
    <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px',
        borderRadius: '999px', fontSize: '11px', fontWeight: 600,
        color: admin ? '#3b82f6' : '#52525b',
        background: admin ? '#eff6ff' : '#f4f4f5',
        fontFamily: "'Inter', system-ui",
    }}>
        {admin ? <Shield size={10} /> : <User size={10} />}
        {admin ? 'Admin' : 'Customer'}
    </span>
);

const OnlineDot = ({ isOnline }: { isOnline: boolean }) => {
    if (!isOnline) return null;
    return (
        <div style={{
            position: 'absolute', bottom: '-1px', right: '-1px',
            width: '11px', height: '11px', borderRadius: '50%',
            background: '#22c55e', border: '2px solid white',
            boxShadow: '0 0 8px rgba(34, 197, 94, 0.4)'
        }} />
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
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: "'Inter', system-ui" }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.025em', color: '#18181b', margin: 0 }}>
                        Account Registry
                    </h1>
                    <p style={{ fontSize: '13px', color: '#71717a', marginTop: '3px' }}>
                        {users.length} {users.length === 1 ? 'account' : 'accounts'} registered
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Search */}
                    <div style={{ position: 'relative' }}>
                        <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
                        <input
                            type="text" placeholder="Search by name or email…" value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                height: '36px', paddingLeft: '32px', paddingRight: '12px', width: '240px',
                                border: '1px solid #e4e4e7', borderRadius: '9px', fontSize: '13px',
                                color: '#18181b', background: 'white', fontFamily: "'Inter', system-ui", outline: 'none',
                            }}
                        />
                    </div>
                    {/* Role filter */}
                    <select
                        onChange={e => setAdminFilter(e.target.value === 'all' ? null : e.target.value === 'admin')}
                        style={{
                            height: '36px', padding: '0 10px', border: '1px solid #e4e4e7', borderRadius: '9px',
                            fontSize: '13px', color: '#52525b', background: 'white',
                            fontFamily: "'Inter', system-ui", cursor: 'pointer', outline: 'none',
                        }}
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admins</option>
                        <option value="customer">Customers</option>
                    </select>
                    {/* Add button */}
                    <button style={{
                        height: '36px', padding: '0 16px',
                        background: '#3b82f6', color: 'white', border: 'none', borderRadius: '9px',
                        fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                        fontFamily: "'Inter', system-ui",
                    }}>
                        + Add Account
                    </button>
                </div>
            </div>

            {/* Table card */}
            <div style={{
                background: 'white', borderRadius: '16px',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
                overflow: 'hidden',
            }}>
                {loading ? (
                    <div style={{ padding: '64px', textAlign: 'center' }}>
                        <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', color: '#3b82f6', margin: '0 auto' }} />
                    </div>
                ) : users.length === 0 ? (
                    <div style={{ padding: '64px', textAlign: 'center' }}>
                        <Users size={32} style={{ opacity: 0.3, margin: '0 auto 10px', display: 'block' }} />
                        <p style={{ fontSize: '14px', fontWeight: 500, color: '#71717a' }}>No accounts found</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #f4f4f5' }}>
                                {['IDENTITY', 'PRIVILEGE', 'CONTACT', 'REGISTERED', ''].map((h, i) => (
                                    <th key={i} style={{
                                        padding: '12px 20px', fontSize: '10px', fontWeight: 600,
                                        color: '#a1a1aa', textAlign: 'left', letterSpacing: '0.06em',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} style={{ borderBottom: '1px solid #f9f9f9', transition: 'background 0.1s' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#f9f9f9')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                    {/* Identity */}
                                    <td style={{ padding: '14px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ position: 'relative' }}>
                                                <div style={{
                                                    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                                                    background: user.admin ? '#3b82f6' : '#e4e4e7',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '14px', fontWeight: 700,
                                                    color: user.admin ? 'white' : '#52525b',
                                                }}>
                                                    {(user.name || user.email || 'U')[0].toUpperCase()}
                                                </div>
                                                <OnlineDot isOnline={(user as any).is_online} />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#18181b', margin: 0 }}>
                                                    {user.name || 'Unknown'}
                                                </p>
                                                <p style={{ fontSize: '11px', color: '#a1a1aa', margin: 0, fontFamily: "'Inter',system-ui", letterSpacing: '0' }}>
                                                    ID: {user.id.toString().slice(0, 8)}…
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Privilege */}
                                    <td style={{ padding: '14px 20px' }}>
                                        <RoleBadge admin={user.admin || false} />
                                    </td>

                                    {/* Contact */}
                                    <td style={{ padding: '14px 20px' }}>
                                        <p style={{ fontSize: '13px', color: '#52525b', margin: 0 }}>{user.email}</p>
                                        <p style={{ fontSize: '11px', color: '#a1a1aa', margin: 0 }}>
                                            {(user as any).phone || '—'}
                                        </p>
                                    </td>

                                    {/* Registered */}
                                    <td style={{ padding: '14px 20px' }}>
                                        <span style={{ fontSize: '12px', color: '#71717a' }}>
                                            {user.created_at
                                                ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                : '—'}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td style={{ padding: '14px 20px' }}>
                                        <button
                                            onClick={() => deleteUser(user.id)}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: '#d4d4d8', padding: '4px', borderRadius: '6px', transition: 'all 0.1s',
                                            }}
                                            title="Delete user"
                                            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = '#d4d4d8'; e.currentTarget.style.background = 'none'; }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
