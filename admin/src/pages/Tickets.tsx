import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Ticket, TicketMessage } from "@/types";
import {
    LifeBuoy, MessageSquare, Send, User, Calendar,
    Clock, CheckCircle2, AlertCircle, ChevronRight,
    Search, Loader2, ArrowRight, ShieldAlert,
    Hash, MoreVertical, Flag
} from "lucide-react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
    Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import {
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose
} from "@/components/ui/sheet";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const STATUS_FILTER = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const PRIORITY_FILTER = ["ALL", "LOW", "MEDIUM", "HIGH", "URGENT"];

const priorityBadge: Record<string, string> = {
    LOW: "secondary",
    MEDIUM: "default",
    HIGH: "destructive",
    URGENT: "destructive",
};

export default function Tickets() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("ALL");
    const [priority, setPriority] = useState("ALL");
    const [selected, setSelected] = useState<Ticket | null>(null);
    const [msgs, setMsgs] = useState<TicketMessage[]>([]);
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);
    const [newStatus, setNewStatus] = useState("");

    const fetchTickets = () => {
        setLoading(true);
        let url = "/support/tickets/admin/all";
        const params = new URLSearchParams();
        if (status !== "ALL") params.append("status", status);
        if (priority !== "ALL") params.append("priority", priority);
        if (params.toString()) url += `?${params.toString()}`;

        api<Ticket[]>(url).then(setTickets).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { fetchTickets(); }, [status, priority]);

    const selectTicket = async (t: Ticket) => {
        setSelected(t);
        setNewStatus(t.status);
        try {
            const data = await api<Ticket>(`/support/tickets/${t.id}`);
            setMsgs(data.messages || []);
        } catch (e) {
            console.error(e);
        }
    };

    const sendReply = async () => {
        if (!selected || !reply.trim()) return;
        setSending(true);
        try {
            await api(`/support/tickets/${selected.id}/messages`, {
                method: "POST",
                body: JSON.stringify({ message: reply }),
            });
            setReply("");
            const data = await api<Ticket>(`/support/tickets/${selected.id}`);
            setMsgs(data.messages || []);
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    const updateStatus = async (val: string) => {
        if (!selected) return;
        setNewStatus(val);
        try {
            await api(`/support/tickets/${selected.id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: val }),
            });
            fetchTickets();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Support Tickets</h1>
                    <p className="text-muted-foreground font-medium mt-1">Resolution center for customer technical issues</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-40 border-2 font-bold uppercase text-[10px] tracking-widest">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            {STATUS_FILTER.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger className="w-40 border-2 font-bold uppercase text-[10px] tracking-widest">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            {PRIORITY_FILTER.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading Tickets...</p>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <LifeBuoy size={64} className="text-muted-foreground opacity-10" />
                        <p className="text-sm font-bold text-muted-foreground text-center">No tickets found matching current filters</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-secondary/50">
                            <TableRow>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">ID</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Priority</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Subject</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Status</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Last Update</TableHead>
                                <TableHead className="text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tickets.map((t) => (
                                <TableRow key={t.id} className="cursor-pointer group" onClick={() => selectTicket(t)}>
                                    <TableCell className="font-bold tracking-tighter text-xs">TK-{t.id}</TableCell>
                                    <TableCell>
                                        <Badge variant={priorityBadge[t.priority] as any} className="font-black text-[9px] uppercase tracking-tighter px-1.5 py-0">
                                            {t.priority}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-bold text-sm max-w-[200px] truncate">{t.subject}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase">
                                            <div className={`h-2 w-2 rounded-full ${t.status === 'RESOLVED' ? 'bg-green-500' :
                                                t.status === 'OPEN' ? 'bg-red-500' :
                                                    t.status === 'IN_PROGRESS' ? 'bg-zinc-500' : 'bg-zinc-200'
                                                }`} />
                                            {t.status.replace('_', ' ')}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground font-bold text-[10px] uppercase">
                                        {new Date(t.updated_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                                            <ChevronRight size={18} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Ticket Sheet */}
            <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <SheetContent className="sm:max-w-xl flex flex-col p-0 border-l border-border">
                    {selected && (
                        <>
                            <SheetHeader className="p-6 border-b bg-secondary/30">
                                <div className="flex items-center justify-between mb-2">
                                    <Badge variant="outline" className="font-black border-2 text-[10px] tracking-widest uppercase">TK-{selected.id}</Badge>
                                    <Badge variant={priorityBadge[selected.priority] as any} className="font-black uppercase tracking-wider text-[10px]">{selected.priority}</Badge>
                                </div>
                                <SheetTitle className="text-2xl font-black tracking-tight">{selected.subject}</SheetTitle>
                                <SheetDescription className="font-medium text-sm">Review interaction logs and resolve ticket</SheetDescription>
                            </SheetHeader>

                            <ScrollArea className="flex-1">
                                <div className="p-6 space-y-8">
                                    <div className="grid grid-cols-2 gap-3">
                                        <Card className="bg-secondary/20 border-border p-4">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2 mb-2"><User size={12} /> Originator</p>
                                            <p className="text-sm font-black">User ID: {selected.user_id}</p>
                                        </Card>
                                        <Card className="bg-secondary/20 border-border p-4">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2 mb-2"><Clock size={12} /> Current Status</p>
                                            <Select value={newStatus} onValueChange={updateStatus}>
                                                <SelectTrigger className="h-7 text-[10px] font-black uppercase mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {STATUS_FILTER.filter(s => s !== 'ALL').map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </Card>
                                    </div>

                                    <Separator />

                                    {/* Initial Description */}
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Original Ticket Content</Label>
                                        <div className="p-4 rounded-xl border border-border bg-zinc-50 text-sm font-medium leading-relaxed italic text-zinc-600">
                                            "{selected.description}"
                                        </div>
                                    </div>

                                    {/* Thread */}
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Communication Log</Label>
                                        <div className="space-y-4">
                                            {msgs.map((m) => (
                                                <div key={m.id} className={`flex ${m.is_admin ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${m.is_admin
                                                        ? 'bg-zinc-900 text-zinc-50 border border-zinc-700 font-medium rounded-tr-none shadow-lg'
                                                        : 'bg-zinc-100 text-zinc-900 font-medium rounded-tl-none border border-zinc-200'
                                                        }`}>
                                                        {m.message}
                                                        <p className={`text-[8px] mt-1 font-black uppercase tracking-wider opacity-50 ${m.is_admin ? 'text-right' : 'text-left'}`}>
                                                            {new Date(m.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>

                            <SheetFooter className="p-4 border-t bg-secondary/10">
                                <div className="flex w-full gap-2">
                                    <Input
                                        placeholder="Enter support response..."
                                        value={reply}
                                        onChange={e => setReply(e.target.value)}
                                        className="flex-1 bg-background"
                                    />
                                    <Button size="icon" onClick={sendReply} disabled={sending || !reply.trim()}>
                                        <Send size={18} />
                                    </Button>
                                </div>
                            </SheetFooter>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
