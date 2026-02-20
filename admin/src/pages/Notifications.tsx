import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Notification } from "@/types";
import {
    Bell, Send, Users, User, History,
    Trash2, Loader2, CheckCircle2, AlertCircle,
    Hash, Calendar, Info, Mail, Layout
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

export default function Notifications() {
    const [history, setHistory] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [form, setForm] = useState({ title: "", message: "", user_id: "" });
    const [tab, setTab] = useState("history");

    const fetchHistory = () => {
        setLoading(true);
        api<Notification[]>("/notifications/history?limit=50")
            .then(setHistory)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchHistory(); }, []);

    const sendSingle = async () => {
        if (!form.user_id || !form.title || !form.message) return;
        setSending(true);
        try {
            await api(`/notifications/send?user_id=${form.user_id}`, {
                method: "POST",
                body: JSON.stringify({ title: form.title, message: form.message }),
            });
            setForm({ title: "", message: "", user_id: "" });
            setTab("history");
            fetchHistory();
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    const sendToAll = async () => {
        if (!form.title || !form.message) return;
        if (!confirm("Send this broadcast to ALL registered users?")) return;
        setSending(true);
        try {
            await api("/notifications/send-to-all", {
                method: "POST",
                body: JSON.stringify({ title: form.title, message: form.message }),
            });
            setForm({ title: "", message: "", user_id: "" });
            setTab("history");
            fetchHistory();
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-black tracking-tight">Notification Center</h1>
                <p className="text-muted-foreground font-medium mt-1">Manage system alerts and broadcasts</p>
            </div>

            <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="mb-6 h-auto p-1 bg-secondary border border-border">
                    <TabsTrigger value="history" className="font-bold text-xs uppercase py-2 px-6">
                        <History size={14} className="mr-2" /> History
                    </TabsTrigger>
                    <TabsTrigger value="compose" className="font-bold text-xs uppercase py-2 px-6">
                        <Send size={14} className="mr-2" /> Dispatcher
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="history" className="animate-fade-in">
                    <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
                        {loading ? (
                            <div className="p-20 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Retrieving logs...</p>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="p-20 flex flex-col items-center justify-center gap-3">
                                <Bell size={48} className="text-muted-foreground opacity-10" />
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No notifications dispatched yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {history.map((n) => (
                                    <div key={n.id} className="p-5 flex items-start gap-4 hover:bg-secondary/30 transition-colors group">
                                        <div className="h-10 w-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-200">
                                            <Bell size={18} className="text-zinc-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-black text-sm">{n.title}</h3>
                                                <Badge variant="outline" className="text-[10px] font-bold uppercase border-2">
                                                    User #{n.user_id}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-2">{n.message}</p>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5"><Calendar size={10} /> {new Date(n.created_at).toLocaleDateString()}</span>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5"><CheckCircle2 size={10} className="text-green-600" /> Delivered</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="compose" className="animate-fade-in">
                    <div className="grid md:grid-cols-2 gap-8">
                        <Card className="border-border shadow-xl">
                            <CardHeader className="bg-secondary/30 border-b">
                                <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2"><Send size={18} /> Configuration</CardTitle>
                                <CardDescription className="text-xs font-medium uppercase tracking-tight">Set up your alert parameters</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Dispatch Method</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button variant={form.user_id ? "default" : "outline"} className="font-bold h-9">Single Target</Button>
                                            <Button variant={!form.user_id ? "default" : "outline"} className="font-bold h-9" onClick={() => setForm({ ...form, user_id: "" })}>Global Broadcast</Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Target Recipient</Label>
                                        <div className="relative">
                                            <Hash size={14} className="absolute left-3 top-3 text-muted-foreground" />
                                            <Input
                                                placeholder="User ID (Leave empty for ALL)"
                                                value={form.user_id}
                                                onChange={e => setForm({ ...form, user_id: e.target.value })}
                                                className="pl-9 h-10 font-bold"
                                            />
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Alert Title</Label>
                                        <Input
                                            placeholder="Internal System Alert..."
                                            value={form.title}
                                            onChange={e => setForm({ ...form, title: e.target.value })}
                                            className="font-bold"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Message Body</Label>
                                        <Textarea
                                            placeholder="Type your notification message here..."
                                            value={form.message}
                                            onChange={e => setForm({ ...form, message: e.target.value })}
                                            className="min-h-[120px]"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-6 border-t bg-secondary/10 flex gap-3">
                                <Button className="flex-1 font-black" onClick={sendSingle} disabled={sending || !form.user_id || !form.title}>
                                    {sending ? <Loader2 size={16} className="animate-spin" /> : <User size={16} className="mr-2" />}
                                    Dispatch to User
                                </Button>
                                <Button variant="outline" className="flex-1 font-black border-2" onClick={sendToAll} disabled={sending || !form.title}>
                                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} className="mr-2" />}
                                    Broadcast to All
                                </Button>
                            </CardFooter>
                        </Card>

                        <div className="space-y-6">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Visual Preview</Label>
                            <Card className="border-border border-dashed bg-zinc-50 flex items-center justify-center p-12 overflow-hidden">
                                {!form.title && !form.message ? (
                                    <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest text-center">Configure alert to see real-time preview</p>
                                ) : (
                                    <div className="w-full max-w-sm bg-zinc-900 rounded-2xl p-4 shadow-2xl animate-pulse-glow">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700">
                                                <Bell size={14} className="text-zinc-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">BookBind Service Alert</p>
                                                <h4 className="text-xs font-bold text-zinc-100 truncate">{form.title || 'Untitled Notification'}</h4>
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                                            {form.message || 'The actual message content will appear in this section. You can use this to communicate system updates, order changes or maintenance windows.'}
                                        </p>
                                        <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-between">
                                            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Just Now</span>
                                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest hover:text-zinc-200 cursor-pointer">Open App</span>
                                        </div>
                                    </div>
                                )}
                            </Card>
                            <div className="p-4 rounded-xl border border-border bg-secondary/50 flex gap-3">
                                <Info size={16} className="text-zinc-600 shrink-0 mt-0.5" />
                                <p className="text-[10px] font-bold text-muted-foreground leading-normal uppercase">
                                    Global broadcasts will reach every registered user immediately via their in-app notification center. Please use with caution for critical announcements only.
                                </p>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
