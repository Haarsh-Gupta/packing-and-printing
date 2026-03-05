"use client";

import { useEffect, useState } from "react";
import { Star, Loader2, CheckCircle2, User } from "lucide-react";
import { Label } from "@/components/ui/label";
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
                        className={`h-6 w-6 transition-colors ${s <= (hovered || value) ? "text-[#fdf567] fill-[#fdf567] stroke-black stroke-2" : "text-zinc-200 fill-zinc-200"}`}
                    />
                </button>
            ))}
        </div>
    );
}

export default function ServiceReviews({ serviceId, serviceSlug }: { serviceId: number; serviceSlug: string }) {
    const { showAlert } = useAlert();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch reviews & check login status cleanly on the client side
    useEffect(() => {
        const checkToken = localStorage.getItem("access_token");
        setIsLoggedIn(!!checkToken);

        const fetchReviews = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/service/${serviceSlug}`);
                if (res.ok) {
                    const data = await res.json();
                    setReviews(data);
                }
            } catch (error) {
                console.error("Failed to fetch reviews:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReviews();
    }, [serviceSlug]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Grab token fresh when they click submit
        let currentToken = localStorage.getItem("access_token");
        if (!currentToken) {
            showAlert("Please log in to leave a review.", "error");
            return;
        }

        // Ensure literal quotes are stripped since localstorage JSON strings can wrap it
        currentToken = currentToken.replace(/^"(.*)"$/, '$1');

        if (comment.length < 10) {
            showAlert("Comment must be at least 10 characters long.", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentToken}` },
                body: JSON.stringify({ service_id: serviceId, rating, comment }),
            });
            if (res.ok) {
                showAlert("Review submitted!", "success");
                setShowForm(false);
                setComment("");
                setRating(5);

                // Refetch reviews
                const fetchRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/service/${serviceSlug}`);
                if (fetchRes.ok) {
                    const data = await fetchRes.json();
                    setReviews(data);
                }
            } else {
                const err = await res.json();
                const errorMessage = Array.isArray(err.detail)
                    ? err.detail.map((e: any) => e.msg).join(", ")
                    : err.detail || "Failed to submit review.";
                showAlert(errorMessage, "error");
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
        <div className="space-y-10 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tight">Reviews</h2>
                    {reviews.length > 0 ? (
                        <div className="flex items-center gap-3 mt-2">
                            <StarRating value={Math.round(avgRating)} />
                            <span className="font-black text-xl">{avgRating.toFixed(1)}</span>
                            <span className="text-zinc-500 font-bold text-sm uppercase tracking-widest">({reviews.length})</span>
                        </div>
                    ) : (
                        <p className="text-zinc-500 font-medium mt-1">No reviews yet.</p>
                    )}
                </div>

                {isLoggedIn && !showForm && (
                    <Button
                        onClick={() => setShowForm(true)}
                        className="h-12 px-6 font-black uppercase border-2 border-black bg-white text-black hover:bg-zinc-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all rounded-md"
                    >
                        Write a Review
                    </Button>
                )}
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="border-2 border-black rounded-md p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
                    <h3 className="font-black uppercase tracking-tight text-xl">Your Experience</h3>

                    <div className="space-y-2">
                        <Label className="font-bold text-sm uppercase tracking-widest">Rating</Label>
                        <StarRating value={rating} onChange={setRating} />
                    </div>

                    <div className="space-y-2">
                        <Label className="font-bold text-sm uppercase tracking-widest">Comment <span className="text-red-500">*</span></Label>
                        <Textarea
                            required
                            minLength={10}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience with this service..."
                            className="min-h-[120px] border-2 border-black rounded-md focus-visible:ring-0 focus-visible:border-black text-base"
                        />
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <Button type="submit" disabled={isSubmitting} className="h-12 px-8 bg-[#4be794] text-black font-black uppercase border-2 border-black rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Submit Review"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="h-12 px-6 border-2 border-zinc-200 text-zinc-500 hover:border-black hover:text-black font-black uppercase rounded-md transition-colors">
                            Cancel
                        </Button>
                    </div>
                </form>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-black" /></div>
            ) : reviews.length === 0 ? (
                <div className="border-2 border-dashed border-zinc-300 rounded-md p-16 text-center bg-zinc-50 flex flex-col items-center">
                    <Star className="h-12 w-12 text-zinc-300 mb-4" />
                    <p className="font-black uppercase text-xl text-zinc-800">No reviews yet</p>
                    <p className="text-zinc-500 font-medium mt-2">Be the first to share your thoughts!</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {reviews.map((review) => (
                        <div key={review.id} className="border-2 border-black bg-white p-6 rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 border-2 border-black rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center shrink-0">
                                        {review.user?.profile_picture ? (
                                            <img src={review.user.profile_picture} alt={review.user.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-6 w-6 text-zinc-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-black text-base uppercase tracking-tight">{review.user?.name || "Customer"}</p>
                                        {review.is_verified && (
                                            <p className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase tracking-widest mt-0.5">
                                                <CheckCircle2 className="h-3 w-3" /> Verified Purchase
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="sm:text-right flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                                    <StarRating value={review.rating} />
                                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">{formatDate(review.created_at)}</p>
                                </div>
                            </div>
                            {review.comment && <p className="text-zinc-800 font-medium leading-relaxed">{review.comment}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
