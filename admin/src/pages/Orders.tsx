import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Order } from "@/types";
import {
    FileText, Download, Trash2, IndianRupee, CreditCard,
    Calendar, Package, User, Clock, CheckCircle2, AlertCircle,
    ChevronRight, Filter, Search, Loader2, ArrowRight
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
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const STATUS_OPTIONS = ["ALL", "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const statusBadge: Record<string, any> = {
    PENDING: { variant: "destructive", icon: Clock },
    PROCESSING: { variant: "default", icon: Loader2 },
    SHIPPED: { variant: "outline", icon: Package },
    DELIVERED: { variant: "secondary", icon: CheckCircle2 },
    CANCELLED: { variant: "outline", icon: AlertCircle },
};

export default function Orders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("ALL");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Order | null>(null);
    const [updating, setUpdating] = useState(false);
    const [newStatus, setNewStatus] = useState("");

    const fetchOrders = () => {
        setLoading(true);
        let url = "/orders/admin/all?skip=0&limit=100";
        if (status !== "ALL") url += `&status_filter=${status}`;
        api<Order[]>(url).then(setOrders).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { fetchOrders(); }, [status]);

    const updateStatus = async () => {
        if (!selected || !newStatus) return;
        setUpdating(true);
        try {
            await api(`/orders/admin/${selected.id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus }),
            });
            fetchOrders();
            setSelected(null);
        } catch (e) {
            console.error(e);
        } finally {
            setUpdating(false);
        }
    };

    const recordPayment = async () => {
        if (!selected) return;
        if (!confirm("Confirm cash payment receipt? This will move status to PROCESSING.")) return;
        setUpdating(true);
        try {
            await api(`/orders/admin/${selected.id}/cash-payment`, { method: "POST" });
            fetchOrders();
            setSelected(null);
        } catch (e) {
            console.error(e);
        } finally {
            setUpdating(false);
        }
    };

    const deleteOrder = async (id: number) => {
        if (!confirm("Permanently delete this order?")) return;
        try {
            await api(`/orders/admin/${id}`, { method: "DELETE" });
            fetchOrders();
            setSelected(null);
        } catch (e) {
            console.error(e);
        }
    };

    const downloadInvoice = async (id: number) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/orders/${id}/invoice`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
            });
            if (!res.ok) throw new Error();
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `invoice-order-${id}.pdf`;
            a.click();
        } catch {
            alert("Failed to download invoice");
        }
    };

    const filteredOrders = orders.filter(o =>
        String(o.id).includes(search) ||
        o.user_id.toString().includes(search)
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Orders</h1>
                    <p className="text-muted-foreground font-medium mt-1">Manage customer purchases and shipments</p>
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
                <TabsList className="grid grid-cols-3 md:grid-cols-6 h-auto p-1 bg-secondary border border-border">
                    {STATUS_OPTIONS.map(s => (
                        <TabsTrigger key={s} value={s} className="font-bold text-[10px] md:text-xs uppercase py-2">
                            {s}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="mt-6 border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Fetching Orders...</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Package size={48} className="text-muted-foreground opacity-20" />
                            <p className="text-sm font-bold text-muted-foreground">No orders found matching criteria</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-secondary/50">
                                <TableRow>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Order ID</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Status</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Amount</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Customer</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Date</TableHead>
                                    <TableHead className="text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.map((order) => (
                                    <TableRow key={order.id} className="cursor-pointer group" onClick={() => { setSelected(order); setNewStatus(order.status); }}>
                                        <TableCell className="font-bold">ORD-{order.id}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusBadge[order.status]?.variant || "outline"} className="font-bold text-[10px] uppercase tracking-wide">
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-black text-sm">₹{order.total_amount.toLocaleString()}</TableCell>
                                        <TableCell className="text-muted-foreground font-medium text-xs">User #{order.user_id}</TableCell>
                                        <TableCell className="text-muted-foreground font-medium text-xs whitespace-nowrap">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
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

            {/* Order Detail Sheet */}
            <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <SheetContent className="sm:max-w-md flex flex-col p-0 border-l border-border">
                    {selected && (
                        <>
                            <SheetHeader className="p-6 border-b bg-secondary/30">
                                <div className="flex items-center justify-between mb-2">
                                    <Badge variant="outline" className="font-black border-2 text-[10px] tracking-widest uppercase">ORD-{selected.id}</Badge>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                        <Calendar size={10} /> {new Date(selected.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <SheetTitle className="text-2xl font-black tracking-tight">Order Details</SheetTitle>
                                <SheetDescription className="font-medium text-sm">Manage status and review order information</SheetDescription>
                            </SheetHeader>

                            <ScrollArea className="flex-1 px-6">
                                <div className="py-6 space-y-8">
                                    {/* Status Section */}
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Update Status</Label>
                                        <div className="flex gap-2">
                                            <Select value={newStatus} onValueChange={setNewStatus}>
                                                <SelectTrigger className="flex-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {STATUS_OPTIONS.filter(s => s !== "ALL").map(s => (
                                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button onClick={updateStatus} disabled={updating || newStatus === selected.status} className="font-bold">
                                                {updating ? <Loader2 size={16} className="animate-spin" /> : "Update"}
                                            </Button>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Financial Section */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl border border-border bg-secondary/20">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Total Amount</p>
                                            <p className="text-xl font-black">₹{selected.total_amount.toLocaleString()}</p>
                                        </div>
                                        <div className="p-4 rounded-xl border border-border bg-secondary/20">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Paid Amount</p>
                                            <p className="text-xl font-black text-green-600">₹{selected.amount_paid.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Actions Section */}
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Admin Actions</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button variant="outline" className="w-full font-bold justify-start" onClick={() => downloadInvoice(selected.id)}>
                                                <Download className="mr-2 h-4 w-4" /> Invoice
                                            </Button>
                                            <Button variant="outline" className="w-full font-bold justify-start" onClick={recordPayment} disabled={selected.amount_paid >= selected.total_amount}>
                                                <CreditCard className="mr-2 h-4 w-4" /> Mark Paid
                                            </Button>
                                            <Button variant="outline" className="w-full font-bold justify-start text-destructive hover:bg-destructive/10" onClick={() => deleteOrder(selected.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Order
                                            </Button>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Info Section */}
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Transaction ID</Label>
                                        <div className="p-3 rounded-lg bg-secondary/50 font-mono text-xs border border-border">
                                            {selected.payment_id || "No active transaction ID found"}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>

                            <SheetFooter className="p-6 border-t bg-secondary/10">
                                <SheetClose asChild>
                                    <Button variant="outline" className="w-full font-bold">Close Panel</Button>
                                </SheetClose>
                            </SheetFooter>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
