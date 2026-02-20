import { useState } from "react";
import { api } from "@/lib/api";
import type { Review } from "@/types";
import {
    Star, Search, Trash2, Package, User,
    Calendar, Loader2, X, MessageSquare,
    AlertCircle, ShieldAlert, BadgeCheck
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Reviews() {
    const [pid, setPid] = useState("");
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const fetchReviews = () => {
        if (!pid) return;
        setLoading(true);
        setHasSearched(true);
        api<Review[]>(`/reviews/product/${pid}`)
            .then(setReviews)
            .catch((e) => {
                console.error(e);
                setReviews([]);
            })
            .finally(() => setLoading(false));
    };

    const deleteReview = async (id: number) => {
        if (!confirm("Permanently remove this review from the product page?")) return;
        try {
            await api(`/reviews/${id}`, { method: "DELETE" });
            fetchReviews();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Product Reviews</h1>
                    <p className="text-muted-foreground font-medium mt-1">Monitor and moderate customer feedback</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-64">
                        <Package size={16} className="absolute left-3 top-3 text-muted-foreground" />
                        <Input
                            placeholder="Enter Product ID (e.g. 1)"
                            value={pid}
                            onChange={e => setPid(e.target.value)}
                            className="pl-9 h-10 font-bold"
                            onKeyDown={(e) => e.key === 'Enter' && fetchReviews()}
                        />
                    </div>
                    <Button onClick={fetchReviews} className="font-black" disabled={loading || !pid}>
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} className="mr-2" />}
                        Find Reviews
                    </Button>
                </div>
            </div>

            <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-24 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mt-2">Connecting to review database...</p>
                    </div>
                ) : !hasSearched ? (
                    <div className="p-24 flex flex-col items-center justify-center gap-4">
                        <div className="p-4 rounded-full bg-secondary">
                            <MessageSquare size={48} className="text-muted-foreground opacity-20" />
                        </div>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest text-center">
                            Search via Product ID to moderate reviews
                        </p>
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="p-24 flex flex-col items-center justify-center gap-3">
                        <AlertCircle size={48} className="text-muted-foreground opacity-10" />
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No reviews found for this target</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        <div className="p-4 bg-secondary/50 border-b flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Found {reviews.length} feedback entries</span>
                            <div className="flex items-center gap-2">
                                <Select defaultValue="newest">
                                    <SelectTrigger className="h-8 w-40 text-[10px] font-bold uppercase tracking-widest">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newest">Sort By: Newest</SelectItem>
                                        <SelectItem value="rating">Sort By: Rating</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {reviews.map((r) => (
                            <div key={r.id} className="p-6 flex items-start gap-6 hover:bg-secondary/20 transition-colors group">
                                <div className="shrink-0 pt-1">
                                    <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center border-2 border-border shadow-sm">
                                        <User size={20} className="text-zinc-400" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-black text-sm tracking-tight text-foreground">User ID: {r.user_id}</h3>
                                            <Badge variant="outline" className="text-[9px] font-bold uppercase border-2 flex items-center gap-1">
                                                <BadgeCheck size={10} className="text-green-600" /> Verified Purchase
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star
                                                    key={s}
                                                    size={12}
                                                    className={s <= r.rating ? "fill-zinc-900 text-zinc-900" : "text-zinc-200"}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium leading-relaxed text-muted-foreground mb-4">
                                        "{r.comment || "No comment provided."}"
                                    </p>
                                    <div className="flex items-center gap-6">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                                            <Calendar size={12} /> Published {new Date(r.created_at).toLocaleDateString()}
                                        </span>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                                            <ShieldAlert size={12} /> Reported: 0
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => deleteReview(r.id)}
                                >
                                    <Trash2 size={18} />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
