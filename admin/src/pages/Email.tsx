import { useState } from "react";
import { api } from "@/lib/api";
import {
    Mail, Send, Users, User, FileText,
    Paperclip, Eye, History, Loader2,
    CheckCircle2, AlertCircle, Trash2,
    Image as ImageIcon, FileJson, Info
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Email() {
    const [form, setForm] = useState({
        subject: "",
        message: "",
        user_id: "",
        attachments: [] as File[]
    });
    const [sending, setSending] = useState(false);
    const [tab, setTab] = useState("compose");

    const sendEmail = async (global = false) => {
        if (!form.subject || !form.message) return;
        if (!global && !form.user_id) return;

        setSending(true);
        const formData = new FormData();
        formData.append("subject", form.subject);
        formData.append("message", form.message);
        if (form.user_id && !global) formData.append("user_id", form.user_id);
        form.attachments.forEach(file => formData.append("files", file));

        const path = global ? "/admin/send-custom-email-to-all" : "/admin/send-custom-email-to-user";

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
                body: formData,
            });
            if (!res.ok) throw new Error();
            alert("Email dispatched successfully!");
            setForm({ subject: "", message: "", user_id: "", attachments: [] });
        } catch (e) {
            alert("Failed to send email");
        } finally {
            setSending(false);
        }
    };

    const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setForm(f => ({ ...f, attachments: [...f.attachments, ...Array.from(e.target.files!)] }));
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-foreground">Email Dispatcher</h1>
                <p className="text-muted-foreground font-medium mt-1">Direct communication with customer base</p>
            </div>

            <div className="grid lg:grid-cols-5 gap-8">
                {/* Editor Side */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="border-border shadow-2xl">
                        <CardHeader className="bg-secondary/30 border-b">
                            <CardTitle className="text-lg font-black tracking-tight">Compose Message</CardTitle>
                            <CardDescription className="text-xs font-semibold uppercase tracking-widest">Construct your professional email outgoing</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Recipient Target</Label>
                                    <div className="relative">
                                        <User size={14} className="absolute left-3 top-3 text-muted-foreground" />
                                        <Input
                                            placeholder="User ID (Required for single)"
                                            value={form.user_id}
                                            onChange={e => setForm({ ...form, user_id: e.target.value })}
                                            className="pl-9 h-10 font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Subject Header</Label>
                                    <Input
                                        placeholder="Important Update Regarding Your Order..."
                                        value={form.subject}
                                        onChange={e => setForm({ ...form, subject: e.target.value })}
                                        className="font-bold h-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground">HTML Content Body</Label>
                                <Textarea
                                    placeholder="Enter your email message here. Standard HTML tags are supported for formatting."
                                    value={form.message}
                                    onChange={e => setForm({ ...form, message: e.target.value })}
                                    className="min-h-[250px] font-medium leading-relaxed"
                                />
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground">File Attachments</Label>
                                <div className="flex flex-wrap gap-2">
                                    {form.attachments.map((file, i) => (
                                        <Badge key={i} variant="secondary" className="pl-2 pr-1 font-bold h-7 flex items-center gap-2 border border-border">
                                            <Paperclip size={12} /> {file.name.slice(0, 15)}...
                                            <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full" onClick={() => setForm(f => ({ ...f, attachments: f.attachments.filter((_, j) => j !== i) }))}>
                                                <Trash2 size={10} className="text-destructive" />
                                            </Button>
                                        </Badge>
                                    ))}
                                    <div className="relative">
                                        <Input
                                            type="file"
                                            multiple
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={addFiles}
                                        />
                                        <Button variant="outline" size="sm" className="font-bold h-7 border-dashed border-2">
                                            <Paperclip size={12} className="mr-2" /> Attach Files
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="p-6 border-t bg-secondary/10 flex gap-3">
                            <Button className="flex-1 font-black" onClick={() => sendEmail(false)} disabled={sending || !form.user_id || !form.subject}>
                                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Send to User
                            </Button>
                            <Button variant="outline" className="flex-1 font-black border-2" onClick={() => sendEmail(true)} disabled={sending || !form.subject}>
                                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                                Send to Everyone
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Preview Side */}
                <div className="lg:col-span-2 space-y-6">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <Eye size={14} /> Live Preview (External Client Simulation)
                    </Label>
                    <Card className="border-border shadow-lg overflow-hidden flex flex-col min-h-[500px] bg-white text-zinc-900 border-zinc-200">
                        <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-200">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                            </div>
                            <div className="flex flex-col gap-1.5 pt-2">
                                <p className="text-[10px] text-zinc-400 font-bold uppercase">To: <span className="text-zinc-600 italic">customer@bookbind.com</span></p>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase">From: <span className="text-zinc-600">administrator@bookbind.com</span></p>
                                <p className="text-sm font-black text-zinc-800 tracking-tight">{form.subject || "No Subject Defined"}</p>
                            </div>
                        </div>
                        <ScrollArea className="flex-1 p-8 bg-white">
                            <div className="prose prose-sm max-w-none">
                                {form.message ? (
                                    <div dangerouslySetInnerHTML={{ __html: form.message.replace(/\n/g, '<br/>') }} className="text-sm font-medium leading-relaxed text-zinc-700" />
                                ) : (
                                    <div className="h-40 flex flex-col items-center justify-center gap-4 opacity-10">
                                        <Mail size={48} />
                                        <p className="text-xs font-black uppercase tracking-widest text-center px-10">Compose message to reveal content preview</p>
                                    </div>
                                )}
                            </div>
                            {form.attachments.length > 0 && (
                                <div className="mt-12 pt-6 border-t border-zinc-100">
                                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-3">Attachments ({form.attachments.length})</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {form.attachments.map((file, i) => (
                                            <div key={i} className="flex items-center gap-2 p-2 rounded bg-zinc-50 border border-zinc-200">
                                                <FileJson size={14} className="text-zinc-400" />
                                                <span className="text-[10px] font-bold text-zinc-600 truncate">{file.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </ScrollArea>
                    </Card>
                    <div className="p-4 rounded-xl border-border bg-secondary/50 flex gap-3">
                        <Info size={16} className="text-zinc-600 shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold text-muted-foreground leading-normal uppercase">
                            You can use HTML tags like <b>&lt;b&gt;</b>, <i>&lt;i&gt;</i>, and lists for professional formatting. Custom CSS is not supported in most email clients.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
