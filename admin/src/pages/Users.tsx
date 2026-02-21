import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AuthUser } from "@/types";
import {
    Users, Trash2, Search, User, Mail, Phone,
    Calendar, Shield, ShieldAlert, MoreVertical,
    Loader2, Filter, ExternalLink, UserCheck, UserX, Copy
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };

const RoleBadge = ({ admin }: { admin: boolean }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px', background: admin ? 'var(--foreground)' : 'var(--secondary)', borderRadius: '4px', fontSize: '10px', fontWeight: 700, color: admin ? 'var(--background)' : 'var(--foreground)', letterSpacing: '0.06em', textTransform: 'uppercase', ...mono, border: '1px solid var(--border)' }}>
        {admin ? <Shield size={10} /> : <User size={10} />}
        {admin ? 'Admin' : 'Customer'}
    </span>
);

export default function UsersPage() {
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [adminFilter, setAdminFilter] = useState<boolean | null>(null);
    const [selected, setSelected] = useState<AuthUser | null>(null);

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

    const deleteUser = async (id: number) => {
        if (!confirm("Permanently delete this user account? This action is irreversible.")) return;
        try { await api(`/users/delete?user_id=${id}`, { method: "DELETE" }); fetchUsers(); setSelected(null); } catch (e) { console.error(e); }
    };

    const totalAdmins = users.filter(u => u.admin).length;
    const totalCustomers = users.filter(u => !u.admin).length;

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: "'DM Sans', system-ui" }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                <div>
                    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted-foreground)', ...mono, marginBottom: '4px' }}>Access Control</p>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>
                        Account Registry
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted-foreground)', marginLeft: '12px', letterSpacing: 0, ...mono }}>[{users.length} USERS]</span>
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                        <Input placeholder="Filter by name/email..." value={search} onChange={e => setSearch(e.target.value)} style={{ height: '36px', paddingLeft: '32px', width: '240px', fontSize: '13px', fontWeight: 600 }} />
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

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                {[
                    { label: 'Total Users', value: users.length, color: '#2563eb' },
                    { label: 'Administrators', value: totalAdmins, color: 'var(--foreground)' },
                    { label: 'Customers', value: totalCustomers, color: '#16a34a' },
                ].map((s, i) => (
                    <div key={i} style={{ padding: '16px 20px', borderRight: i < 2 ? '1px solid var(--border)' : 'none', background: 'var(--card)' }}>
                        <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', ...mono, marginBottom: '6px' }}>{s.label}</p>
                        <p style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', color: s.color }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div style={{ borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--card)' }}>
                <Table>
                    <TableHeader style={{ background: 'var(--secondary)' }}>
                        <TableRow className="hover:bg-transparent border-b border-border">
                            {['Identity', 'Privilege', 'Communications', 'Registration', ''].map((h, i) => (
                                <TableHead key={i} style={{ height: '44px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', ...mono, color: 'var(--muted-foreground)' }}>{h}</TableHead>
                            ))}
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
                                        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--muted-foreground)' }}>No matching accounts found</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : users.map((u) => (
                            <TableRow key={u.id} className="group border-b border-border cursor-pointer"
                                onClick={() => setSelected(u)}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--secondary)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <TableCell style={{ padding: '16px 20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Avatar style={{ border: '2px solid var(--border)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', flexShrink: 0 }}>
                                            <AvatarImage src={u.profile_picture || ""} />
                                            <AvatarFallback style={{ fontWeight: 800, background: 'var(--foreground)', color: 'var(--background)' }}>{u.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '-0.01em' }}>{u.name}</p>
                                            <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)', ...mono }}>ID: #{u.id.toString().padStart(4, '0')}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell><RoleBadge admin={u.admin} /></TableCell>
                                <TableCell>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <p style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Mail size={12} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} /> {u.email}
                                        </p>
                                        {u.phone && <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={11} /> {u.phone}</p>}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', ...mono }}>
                                        {new Date(u.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                </TableCell>
                                <TableCell style={{ textAlign: 'right', paddingRight: '20px' }} onClick={e => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical size={16} /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-[200px]">
                                            <DropdownMenuLabel style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', ...mono }}>Account Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setSelected(u)} style={{ fontWeight: 600 }}><ExternalLink size={14} className="mr-2" /> View Details</DropdownMenuItem>
                                            <DropdownMenuItem style={{ fontWeight: 600 }} onClick={() => { navigator.clipboard.writeText(u.email); }}><Copy size={14} className="mr-2" /> Copy Email</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive" style={{ fontWeight: 700 }} onClick={() => deleteUser(u.id)}>
                                                <Trash2 size={14} className="mr-2" /> Purge Account
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* User Detail Sheet */}
            <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <SheetContent className="sm:max-w-md flex flex-col p-0">
                    {selected && (
                        <>
                            <SheetHeader style={{ padding: '24px', borderBottom: '1px solid var(--border)', background: 'var(--secondary)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                                    <Avatar style={{ width: '52px', height: '52px', border: '2px solid var(--border)' }}>
                                        <AvatarImage src={selected.profile_picture || ""} />
                                        <AvatarFallback style={{ fontWeight: 900, fontSize: '20px', background: 'var(--foreground)', color: 'var(--background)' }}>{selected.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <SheetTitle style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.03em' }}>{selected.name}</SheetTitle>
                                        <RoleBadge admin={selected.admin} />
                                    </div>
                                </div>
                                <SheetDescription style={{ fontSize: '12px', ...mono }}>User ID: #{selected.id.toString().padStart(4, '0')}</SheetDescription>
                            </SheetHeader>

                            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto' }}>
                                <div>
                                    <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', ...mono, marginBottom: '12px' }}>Contact Information</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {[
                                            { icon: Mail, label: 'Email', value: selected.email },
                                            { icon: Phone, label: 'Phone', value: selected.phone || 'Not provided' },
                                            { icon: Calendar, label: 'Registered', value: new Date(selected.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' }) },
                                        ].map(item => (
                                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                                <item.icon size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                                                <div>
                                                    <p style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted-foreground)', ...mono, marginBottom: '2px' }}>{item.label}</p>
                                                    <p style={{ fontSize: '13px', fontWeight: 700 }}>{item.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', ...mono, marginBottom: '12px' }}>Danger Zone</p>
                                    <Button onClick={() => deleteUser(selected.id)} style={{ width: '100%', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 700, gap: '8px' }} variant="outline">
                                        <Trash2 size={14} /> Permanently Delete Account
                                    </Button>
                                </div>
                            </div>

                            <SheetFooter style={{ padding: '16px', borderTop: '1px solid var(--border)', background: 'var(--secondary)' }}>
                                <SheetClose asChild><Button variant="outline" style={{ width: '100%', fontWeight: 600 }}>Close</Button></SheetClose>
                            </SheetFooter>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
