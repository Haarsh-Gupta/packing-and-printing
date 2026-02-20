import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AuthUser } from "@/types";
import {
    Users, Trash2, Search, User, Mail, Phone,
    Calendar, Shield, ShieldAlert, MoreVertical,
    CheckCircle2, XCircle, Loader2
} from "lucide-react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

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

    const deleteUser = async (id: number) => {
        if (!confirm("Permanently delete this user account?")) return;
        try {
            await api(`/users/delete?user_id=${id}`, { method: "DELETE" });
            fetchUsers();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Users</h1>
                    <p className="text-muted-foreground font-medium mt-1">Manage customer base and administrator privileges</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-64">
                        <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="font-bold border-2">
                                Filter: {adminFilter === null ? "All" : adminFilter ? "Admins" : "Customers"}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setAdminFilter(null)}>All Roles</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setAdminFilter(true)}>Admins Only</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setAdminFilter(false)}>Customers Only</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                {loading && users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Accessing records...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <Users size={64} className="text-muted-foreground opacity-10" />
                        <p className="text-sm font-bold text-muted-foreground">No users found matching search criteria</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-secondary/50">
                            <TableRow>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Client</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Status</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Contact</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Joined</TableHead>
                                <TableHead className="text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((u) => (
                                <TableRow key={u.id} className="group">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border-2 border-border shadow-sm">
                                                <AvatarImage src={u.profile_picture || ""} />
                                                <AvatarFallback className="font-bold bg-secondary">{u.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-black tracking-tight">{u.name}</p>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                                    {u.admin ? <Shield size={10} className="text-primary" /> : <User size={10} />}
                                                    {u.admin ? 'Administrator' : 'Standard User'}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={u.admin ? "default" : "outline"} className="font-bold text-[10px] uppercase tracking-wide">
                                            {u.admin ? 'Admin' : 'Customer'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-medium flex items-center gap-2"><Mail size={12} className="text-muted-foreground" /> {u.email}</p>
                                            <p className="text-xs font-medium flex items-center gap-2"><Phone size={12} className="text-muted-foreground" /> {u.phone || 'N/A'}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground font-bold text-[10px] uppercase">
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical size={16} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-52">
                                                <DropdownMenuLabel className="font-black text-xs uppercase tracking-widest text-muted-foreground">Manage Account</DropdownMenuLabel>
                                                <DropdownMenuItem className="font-bold text-xs">View Full Profile</DropdownMenuItem>
                                                <DropdownMenuItem className="font-bold text-xs">Toggle Admin Privileges</DropdownMenuItem>
                                                <DropdownMenuItem className="font-bold text-xs">Reset User Password</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive font-bold text-xs" onClick={() => deleteUser(u.id)}>
                                                    <Trash2 size={14} className="mr-2" /> Delete Account
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
}
