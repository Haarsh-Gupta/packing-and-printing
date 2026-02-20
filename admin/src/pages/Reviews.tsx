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

const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };

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
        } catch (e) { console.error(e); }
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
                    }}>Moderation</p>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>
                        Product Reviews
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted-foreground)', marginLeft: '12px', letterSpacing: 0, ...mono }}>
                            [ID SEARCH MODE]
                        </span>
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ position: 'relative' }}>
                        <Package size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                        <Input
                            placeholder="PRODUCT ID..."
                            value={pid}
                            onChange={e => setPid(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchReviews()}
                            style={{ width: '180px', height: '40px', paddingLeft: '36px', ...mono, fontSize: '11px', fontWeight: 700 }}
                        />
                    </div>
                    <Button onClick={fetchReviews} disabled={loading || !pid} style={{ height: '40px', fontWeight: 800 }}>
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} className="mr-2" />}
                        FETCH FEEDBACK
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <div style={{ borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--card)' }}>
                {loading ? (
                    <div style={{ padding: '100px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <Loader2 size={32} className="animate-spin text-muted-foreground" />
                        <p style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', ...mono, color: 'var(--muted-foreground)' }}>Synchronizing Database...</p>
                    </div>
                ) : !hasSearched ? (
                    <div style={{ padding: '120px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MessageSquare size={32} style={{ opacity: 0.1 }} />
                        </div>
                        <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', ...mono, color: 'var(--muted-foreground)' }}>Search by Product ID to begin moderation</p>
                    </div>
                ) : reviews.length === 0 ? (
                    <div style={{ padding: '120px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        <AlertCircle size={48} style={{ opacity: 0.1 }} />
                        <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted-foreground)' }}>No reviews found for product #{pid}</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '16px 24px', background: 'var(--secondary)/50', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', ...mono, color: 'var(--muted-foreground)' }}>
                                {reviews.length} ENTRIES FOUND FOR PRODUCT #{pid}
                            </span>
                            <Select defaultValue="newest">
                                <SelectTrigger style={{ height: '32px', width: '160px', fontSize: '10px', fontWeight: 800, ...mono }}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest" style={{ fontWeight: 600 }}>SORT: NEWEST FIRST</SelectItem>
                                    <SelectItem value="rating" style={{ fontWeight: 600 }}>SORT: HIGHEST RATING</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {reviews.map((r, i) => (
                                <div key={r.id} style={{
                                    padding: '24px',
                                    display: 'flex',
                                    gap: '24px',
                                    borderBottom: i === reviews.length - 1 ? 'none' : '1px solid var(--border)',
                                    transition: 'background 0.2s',
                                }} className="group hover:bg-zinc-50/50">
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border)' }}>
                                        <User size={20} style={{ opacity: 0.3 }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <h3 style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '-0.01em' }}>USER_ID::{r.user_id}</h3>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    padding: '2px 8px', background: 'white', border: '1px solid var(--border)',
                                                    borderRadius: '4px', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', ...mono
                                                }}>
                                                    <BadgeCheck size={10} style={{ color: '#16a34a' }} /> VERIFIED
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star
                                                        key={s}
                                                        size={12}
                                                        className={s <= r.rating ? "fill-zinc-900 text-zinc-900" : "text-zinc-200"}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '14px', fontWeight: 500, lineHeight: 1.6, color: 'var(--foreground)', marginBottom: '16px' }}>
                                            "{r.comment || "No comment content provided."}"
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)', ...mono }}>
                                                <Calendar size={12} /> {new Date(r.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)', ...mono }}>
                                                <ShieldAlert size={12} /> REPORTS::0
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            style={{ color: '#dc2626' }}
                                            className="opacity-0 group-hover:opacity-100 transition-all"
                                            onClick={() => deleteReview(r.id)}
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Warning Footer */}
            <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', display: 'flex', gap: '12px' }}>
                <ShieldAlert size={16} style={{ color: '#dc2626', marginTop: '2px' }} />
                <div>
                    <p style={{ fontSize: '11px', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em', ...mono }}>Moderator Advisory</p>
                    <p style={{ fontSize: '11px', fontWeight: 500, color: '#991b1b', opacity: 0.8, lineHeight: 1.5 }}>
                        Deletion requests are immediate and cannot be reversed. Ensure reviews violate community standards (spam, hate speech, or off-topic content) before proceeding with removal.
                    </p>
                </div>
            </div>
        </div>
    );
}
