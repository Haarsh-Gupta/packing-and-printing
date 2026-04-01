"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Loader2, Check } from "lucide-react";

export function ContactDetailsModal({
    existingPhone,
    existingAddress,
    onSave,
    onClose,
}: {
    existingPhone: string | null;
    existingAddress: string | null;
    onSave: () => void;
    onClose: () => void;
}) {
    const [phone, setPhone] = useState(existingPhone || "");
    const [address, setAddress] = useState(existingAddress || "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const needsPhone = !existingPhone;
    const needsAddress = !existingAddress;

    const handleSave = async () => {
        setError("");
        if (needsPhone && (!phone.trim() || !/^\d{10}$/.test(phone.trim()))) {
            setError("Please enter a valid 10-digit phone number.");
            return;
        }
        if (needsAddress && !address.trim()) {
            setError("Please enter your delivery address.");
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem("access_token");
            const body: Record<string, string> = {};
            if (needsPhone) body.phone = phone.trim();
            if (needsAddress) body.address = address.trim();

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/update`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                onSave();
            } else {
                const err = await res.json();
                setError(typeof err.detail === "string" ? err.detail : "Failed to save. Please try again.");
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10005] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full sm:w-[440px] p-6 space-y-5 sm:rounded-xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="border-b-2 border-black pb-3">
                    <h3 className="font-black text-xl uppercase">Contact Details Required</h3>
                    <p className="text-sm font-medium text-zinc-500 mt-1">
                        We need your contact info to process your inquiry.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border-2 border-red-300 text-red-700 text-sm font-bold px-3 py-2 rounded-lg">
                        {error}
                    </div>
                )}

                {needsPhone && (
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest">Phone Number *</Label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            placeholder="10-digit mobile number"
                            className="w-full border-2 border-black p-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#fdf567] rounded-lg"
                            maxLength={10}
                        />
                    </div>
                )}

                {needsAddress && (
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest">Delivery Address *</Label>
                        <textarea
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            rows={3}
                            placeholder="Full address including city, state, and PIN code"
                            className="w-full border-2 border-black p-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#fdf567] resize-none rounded-lg"
                        />
                    </div>
                )}

                <div className="flex gap-3 pt-1">
                    <button onClick={onClose} className="flex-1 border-2 border-black py-2.5 font-black text-sm uppercase hover:bg-zinc-100 transition-colors rounded-lg">Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-accent-green border-2 border-black py-2.5 font-black text-sm uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all flex items-center justify-center gap-1 disabled:opacity-50 rounded-lg"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {saving ? "Saving..." : "Save & Continue"}
                    </button>
                </div>
            </div>
        </div>
    );
}
