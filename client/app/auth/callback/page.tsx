"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { useAuth } from "@/context/AuthContext";

function CallbackHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshUser } = useAuth();

    useEffect(() => {
        const access_token = searchParams.get("access_token");
        const error = searchParams.get("error");

        if (error) {
            router.replace(`/auth/login?error=${encodeURIComponent(error)}`);
            return;
        }

        if (access_token) {
            localStorage.setItem("access_token", access_token);
            // Sync the global auth state
            refreshUser().then(() => {
                router.replace("/dashboard");
            });
        } else {
            router.replace("/auth/login?error=no_token");
        }
    }, [searchParams, router, refreshUser]);

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
            <div className="border-4 border-black p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-[#fdf567] inline-block">
                <Loader2 className="w-12 h-12 animate-spin" />
            </div>
            <div className="text-center">
                <h2 className="text-3xl font-black uppercase tracking-tighter">Signing you in...</h2>
                <p className="text-zinc-600 font-bold mt-2">Completing Google authentication.</p>
            </div>
        </div>
    );
}

export default function CallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin" />
            </div>
        }>
            <CallbackHandler />
        </Suspense>
    );
}
