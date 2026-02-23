"use client";

import { useEffect, useState } from "react";
import { Star, Loader2, CheckCircle2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/components/CustomAlert";

interface Review {
    id: number;
    rating: number;
    comment: string | null;
    is_verified: boolean;
    created_at: string;
    user?: { name: string; profile_picture: string | null };
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
                <button
                    key={s}
                    type="button"
                    onClick={() => onChange?.(s)}
                    onMouseEnter={() => onChange && setHovered(s)}
                    onMouseLeave={() => onChange && setHovered(0)}
                    className={onChange ? "cursor-pointer" : "cursor-default"}
                >
                    <Star
                        className={`h-6 w-6 transition-colors ${s <= (hovered || value) ? "text-[#fdf567] fill-[#fdf567] stroke-black" : "text-zinc-300"}`}
                    />
                </button>
            ))}
        </div>
    );
}

export default function ProductReviews({ productId }: { productId: number }) {
    const { showAlert } = useAlert();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    useEffect(() => {
        setIsLoggedIn(!!token);
        fetchReviews();
    }, [productId]);

    const fetchReviews = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/reviews/${productId}?limit=20`);
            if (res.ok) setReviews(await res.json());
        } catch (e) { /* silent */ } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) { showAlert("Please log in to leave a review.", "error"); return; }
        if (comment.length < 10) { showAlert("Comment must be at least 10 characters long.", "error"); setIsSubmitting(false); return; }
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/review?product_id=${productId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ rating, comment }),
            });
            if (res.ok) {
                showAlert("Review submitted!", "success");
                setShowForm(false);
                setComment("");
                setRating(5);
                fetchReviews();
            } else {
                const err = await res.json();
                showAlert(err.detail || "Failed to submit review.", "error");
            }
        } catch (e) {
            showAlert("Network error.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric"
    });

    return (
        <div className="space-y-8 mt-16">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t-4 border-black pt-10">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Customer Reviews</h2>
                    {reviews.length > 0 && (
                        <div className="flex items-center gap-3 mt-2">
                            <StarRating value={Math.round(avgRating)} />
                            <span className="font-black text-lg">{avgRating.toFixed(1)}</span>
                            <span className="text-zinc-500 font-medium">({reviews.length} review{reviews.length !== 1 && "s"})</span>
                        </div>
                    )}
                </div>
                {isLoggedIn && !showForm && (
                    <Button
                        onClick={() => setShowForm(true)}
                        className="h-12 px-6 font-black uppercase border-2 border-black bg-black text-white hover:bg-[#fdf567] hover:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all rounded-none"
                    >
                        Write a Review
                    </Button>
                )}
            </div>

            {/* Review Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="border-4 border-black p-6 bg-zinc-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-4">
                    <h3 className="font-black uppercase tracking-tight text-xl">Your Review</h3>
                    <div>
                        <p className="font-black text-sm uppercase tracking-widest mb-2">Rating</p>
                        <StarRating value={rating} onChange={setRating} />
                    </div>
                    <div>
                        <p className="font-black text-sm uppercase tracking-widest mb-2">Comment <span className="text-red-500">*</span></p>
                        <Textarea
                            required
                            minLength={10}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience with this product..."
                            className="min-h-[120px] border-2 border-black rounded-none focus:ring-0 focus:border-black"
                        />
                    </div>
                    <div className="flex gap-3">
                        <Button type="submit" disabled={isSubmitting} className="h-12 px-8 bg-[#4be794] hover:bg-[#3cd083] text-black font-black uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all rounded-none">
                            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Submit Review"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="h-12 px-6 border-2 border-black font-black uppercase rounded-none">
                            Cancel
                        </Button>
                    </div>
                </form>
            )}

            {/* Reviews List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : reviews.length === 0 ? (
                <div className="border-2 border-dashed border-black p-12 text-center bg-zinc-50">
                    <Star className="h-10 w-10 mx-auto text-zinc-300 mb-3" />
                    <p className="font-black uppercase text-lg">No reviews yet</p>
                    <p className="text-zinc-500 font-medium">Be the first to review this product!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review.id} className="border-2 border-black bg-white p-6 rounded-xl shadow-sm">
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 border-2 border-black rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center shrink-0">
                                        {review.user?.profile_picture ? (
                                            <img src={review.user.profile_picture} alt={review.user.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-5 w-5 text-zinc-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-black text-sm uppercase tracking-tight">{review.user?.name || "Customer"}</p>
                                        {review.is_verified && (
                                            <p className="flex items-center gap-1 text-[10px] font-bold text-green-700 uppercase tracking-widest">
                                                <CheckCircle2 className="h-3 w-3" /> Verified Purchase
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <StarRating value={review.rating} />
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">{formatDate(review.created_at)}</p>
                                </div>
                            </div>
                            {review.comment && <p className="text-zinc-700 font-medium leading-relaxed">{review.comment}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
