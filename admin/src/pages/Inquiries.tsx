import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Inquiry, InquiryMessage } from "@/types";
import {
    MessageSquare, Send, User, Calendar, Clock, CheckCircle2,
    AlertCircle, ChevronRight, Search, Loader2, ArrowRight,
    FileText, Mail, Phone, Hash
} from "lucide-react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter
} from "@/components/ui/card";
import {
    Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import {
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const STATUS_FILTER = ["ALL", "NEW", "QUOTED", "CLOSED"];
const statusBadge: Record<string, any> = {
    NEW: { variant: "destructive", icon: Clock },
    QUOTED: { variant: "default", icon: CheckCircle2 },
    CLOSED: { variant: "secondary", icon: AlertCircle },
};

export default function Inquiries() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("ALL");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Inquiry | null>(null);
    const [msgs, setMsgs] = useState<InquiryMessage[]>([]);
    const [reply, setReply] = useState("");
    const [sending, setSending] = useState(false);
    const [quote, setQuote] = useState({ amount: "", notes: "" });

    const fetchInquiries = () => {
        setLoading(true);
        let url = "/inquiries/admin/all";
        if (status !== "ALL") url += `?status_filter=${status}`;
        api<Inquiry[]>(url).then(setInquiries).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { fetchInquiries(); }, [status]);

    const selectInquiry = async (iq: Inquiry) => {
        setSelected(iq);
        try {
            const data = await api<Inquiry>(`/inquiries/${iq.id}`);
            setMsgs(data.messages || []);
        } catch (e) {
            console.error(e);
        }
    };

    const sendReply = async () => {
        if (!selected || !reply.trim()) return;
        setSending(true);
        try {
            await api(`/inquiries/${selected.id}/messages`, {
                method: "POST",
                body: JSON.stringify({ message: reply }),
            });
            setReply("");
            const data = await api<Inquiry>(`/inquiries/${selected.id}`);
            setMsgs(data.messages || []);
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    const sendQuote = async () => {
        if (!selected || !quote.amount) return;
        setSending(true);
        try {
            await api(`/inquiries/${selected.id}/quote`, {
                method: "POST",
                body: JSON.stringify({ quoted_amount: parseFloat(quote.amount), admin_notes: quote.notes }),
            });
            setQuote({ amount: "", notes: "" });
            fetchInquiries();
            setSelected(null);
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    const filtered = inquiries.filter(iq =>
        String(iq.id).includes(search) ||
        iq.user_id.toString().includes(search)
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Inquiries</h1>
                    <p className="text-muted-foreground font-medium mt-1">Manage customer requests and price quotations</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-64">
                        <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
                        <Input
                            placeholder="Search ID..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>
            </div>

            <Tabs value={status} onValueChange={setStatus} className="w-full">
                <TabsList className="grid grid-cols-4 h-auto p-1 bg-secondary border border-border">
                    {STATUS_FILTER.map(s => (
                        <TabsTrigger key={s} value={s} className="font-bold text-xs uppercase py-2">
                            {s}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="mt-6 border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading Inquiries...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <MessageSquare size={48} className="text-muted-foreground opacity-20" />
                            <p className="text-sm font-bold text-muted-foreground">No inquiries found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-secondary/50">
                                <TableRow>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">ID</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Status</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Service/Product</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Customer</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Date</TableHead>
                                    <TableHead className="text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((iq) => (
                                    <TableRow key={iq.id} className="cursor-pointer group" onClick={() => selectInquiry(iq)}>
                                        <TableCell className="font-bold tracking-tighter">IQ-{iq.id}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusBadge[iq.status]?.variant || "outline"} className="font-bold text-[10px] uppercase tracking-wide">
                                                {iq.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-bold text-sm">
                                            {iq.service_id ? `Service #${iq.service_id}` : `Product #${iq.product_id}`}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground font-medium text-xs">User #{iq.user_id}</TableCell>
                                        <TableCell className="text-muted-foreground font-medium text-xs whitespace-nowrap">{new Date(iq.created_at).toLocaleDateString()}</TableCell>
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
            </Tabs>

            {/* Inquiry Detail Sheet */}
            <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <SheetContent className="sm:max-w-xl flex flex-col p-0 border-l border-border">
                    {selected && (
                        <>
                            <SheetHeader className="p-6 border-b bg-secondary/30">
                                <div className="flex items-center justify-between mb-2">
                                    <Badge variant="outline" className="font-black border-2 text-[10px] tracking-widest uppercase">IQ-{selected.id}</Badge>
                                    <Badge variant={statusBadge[selected.status]?.variant || "outline"} className="font-bold uppercase tracking-wider text-[10px]">{selected.status}</Badge>
                                </div>
                                <SheetTitle className="text-2xl font-black tracking-tight">Review Inquiry</SheetTitle>
                                <SheetDescription className="font-medium text-sm">Manage messages and send price quotations</SheetDescription>
                            </SheetHeader>

                            <ScrollArea className="flex-1">
                                <div className="p-6 space-y-8">
                                    {/* Info Cards */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <Card className="bg-secondary/20 border-border p-4">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2 mb-2"><User size={12} /> Customer Info</p>
                                            <p className="text-sm font-black">User ID: {selected.user_id}</p>
                                            <p className="text-xs text-muted-foreground font-medium mt-1">Status: Regular Client</p>
                                        </Card>
                                        <Card className="bg-secondary/20 border-border p-4">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2 mb-2"><Calendar size={12} /> Timeframe</p>
                                            <p className="text-sm font-black">{new Date(selected.created_at).toLocaleDateString()}</p>
                                            <p className="text-xs text-muted-foreground font-medium mt-1">{new Date(selected.created_at).toLocaleTimeString()}</p>
                                        </Card>
                                    </div>

                                    <Separator />

                                    {/* Config Card */}
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Requirements</Label>
                                        <Card className="border-border p-4 bg-zinc-50 border-dashed">
                                            <div className="space-y-2">
                                                {Object.entries(selected.requirements || {}).map(([k, v]) => (
                                                    <div key={k} className="flex justify-between items-center text-xs">
                                                        <span className="font-bold text-muted-foreground uppercase">{k.replace(/_/g, ' ')}</span>
                                                        <span className="font-black text-zinc-900">{typeof v === 'boolean' ? (v ? 'YES' : 'NO') : String(v)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    </div>

                                    {/* Message Thread */}
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Message History</Label>
                                        <div className="space-y-4">
                                            {msgs.map((m) => (
                                                <div key={m.id} className={`flex ${m.is_admin ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${m.is_admin
                                                        ? 'bg-primary text-primary-foreground font-medium rounded-tr-none'
                                                        : 'bg-secondary text-secondary-foreground font-medium rounded-tl-none border border-border'
                                                        }`}>
                                                        {m.message}
                                                        <p className={`text-[9px] mt-1 font-bold uppercase tracking-tighter opacity-60 ${m.is_admin ? 'text-right' : 'text-left'}`}>
                                                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Send Quote Section */}
                                    {selected.status !== 'CLOSED' && (
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Send Price Quotation</Label>
                                            <Card className="border-border p-5 bg-zinc-50">
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="quote-amount" className="text-[10px] font-bold">Base Amount (₹)</Label>
                                                            <Input
                                                                id="quote-amount"
                                                                type="number"
                                                                placeholder="e.g. 5000"
                                                                value={quote.amount}
                                                                onChange={e => setQuote({ ...quote, amount: e.target.value })}
                                                                className="bg-background font-black"
                                                            />
                                                        </div>
                                                        <div className="flex items-end">
                                                            <Button className="w-full font-bold h-10" onClick={sendQuote} disabled={sending || !quote.amount}>
                                                                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Quote"}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="quote-notes" className="text-[10px] font-bold">Notes for Customer</Label>
                                                        <Textarea
                                                            id="quote-notes"
                                                            placeholder="Describe your quote, terms, etc..."
                                                            value={quote.notes}
                                                            onChange={e => setQuote({ ...quote, notes: e.target.value })}
                                                            className="bg-background min-h-[80px]"
                                                        />
                                                    </div>
                                                </div>
                                            </Card>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>

                            <SheetFooter className="p-4 border-t bg-secondary/10">
                                <div className="flex w-full gap-2">
                                    <Input
                                        placeholder="Type a quick reply..."
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
