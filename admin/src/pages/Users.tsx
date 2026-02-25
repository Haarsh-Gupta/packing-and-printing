import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AuthUser } from "@/types";
import {
    Users, Trash2, Search, User, Mail, Phone,
    Calendar, Shield, ShieldAlert, MoreVertical,
    CheckCircle2, XCircle, Loader2, Filter, ExternalLink
} from "lucide-react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };

const RoleBadge = ({ admin }: { admin: boolean }) => (
    <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 8px',
        background: admin ? 'var(--foreground)' : 'var(--secondary)',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: 700,
        color: admin ? 'var(--background)' : 'var(--foreground)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        ...mono,
        border: '1px solid var(--border)',
    }}>
        {admin ? <Shield size={10} /> : <User size={10} />}
        {admin ? 'Admin' : 'Customer'}
    </span>
);

export default function UsersPage() {
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [adminFilter, setAdminFilter] = useState<boolean | null>(null);

    const fetchUsers = () => {
        setLoading(true);
        let url = `/users/all?skip=0&limit=100`;
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
            await api(`/users/delete?user_id=${id}`, { method: "DELETE" });
            fetchUsers();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: "'DM Sans', system-ui" }}>

            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                paddingBottom: '24px',
                borderBottom: '1px solid var(--border)',
            }}>
                <div>
                    <p style={{
                        fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em',
                        textTransform: 'uppercase', color: 'var(--muted-foreground)',
                        ...mono, marginBottom: '4px',
                    }}>Access Control</p>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>
                        Account Registry
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted-foreground)', marginLeft: '12px', letterSpacing: 0, ...mono }}>
                            [{users.length} SEEDERS]
                        </span>
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Filter by name/email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ height: '36px', paddingLeft: '34px', width: '240px', fontSize: '13px', fontWeight: 600 }}
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" style={{ height: '36px', gap: '8px', fontWeight: 700, fontSize: '13px' }}>
                                <Filter size={14} />
                                {adminFilter === null ? "All Roles" : adminFilter ? "Admins" : "Customers"}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px]">
                            <DropdownMenuLabel style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', ...mono }}>Role Filter</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setAdminFilter(null)} style={{ fontWeight: 600 }}>All Accounts</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setAdminFilter(true)} style={{ fontWeight: 600 }}>Administrators</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setAdminFilter(false)} style={{ fontWeight: 600 }}>Customers</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Table */}
            <div style={{ borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--card)' }}>
                <Table>
                    <TableHeader style={{ background: 'var(--secondary)/50' }}>
                        <TableRow className="hover:bg-transparent border-b border-border">
                            <TableHead style={{ height: '44px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', ...mono, color: 'var(--muted-foreground)' }}>Identity</TableHead>
                            <TableHead style={{ height: '44px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', ...mono, color: 'var(--muted-foreground)' }}>Privilege</TableHead>
                            <TableHead style={{ height: '44px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', ...mono, color: 'var(--muted-foreground)' }}>Communications</TableHead>
                            <TableHead style={{ height: '44px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', ...mono, color: 'var(--muted-foreground)' }}>Registration</TableHead>
                            <TableHead style={{ height: '44px' }}></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && users.length === 0 ? (
                            [1, 2, 3, 4, 5].map(i => (
                                <TableRow key={i}>
                                    <TableCell colSpan={5} style={{ height: '64px', padding: '0 20px' }}>
                                        <div style={{ height: '24px', background: 'var(--secondary)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} style={{ height: '300px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                        <Users size={48} style={{ opacity: 0.1 }} />
                                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--muted-foreground)' }}>No matching accounts found in registry</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((u) => (
                                <TableRow key={u.id} className="group border-b border-border hover:bg-zinc-50/50">
                                    <TableCell style={{ padding: '16px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <Avatar style={{ border: '2px solid var(--border)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                                <AvatarImage src={u.profile_picture || ""} />
                                                <AvatarFallback style={{ fontWeight: 800, background: 'var(--foreground)', color: 'var(--background)' }}>{u.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '-0.01em' }}>{u.name}</p>
                                                <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)', ...mono }}>{u.id.slice(0, 8).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <RoleBadge admin={u.admin} />
                                    </TableCell>
                                    <TableCell>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <p style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Mail size={12} className="text-muted-foreground" /> {u.email}
                                            </p>
                                            {u.phone && (
                                                <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Phone size={11} /> {u.phone}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', ...mono }}>
                                            {new Date(u.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </TableCell>
                                    <TableCell style={{ textAlign: 'right', paddingRight: '20px' }}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical size={16} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[200px]">
                                                <DropdownMenuLabel style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', ...mono }}>Account Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive" style={{ fontWeight: 700 }} onClick={() => deleteUser(u.id)}>
                                                    <Trash2 size={14} className="mr-2" /> Purge Account
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
