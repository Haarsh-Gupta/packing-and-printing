"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

function AuthSuccessContent() {
    const router = useRouter();
    const { refreshUser, isLoggedIn } = useAuth();
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const initializeGoogleAuth = async () => {
             // Since the backend already set the HttpOnly cookies, 
             // we just need to tell our AuthContext to re-fetch the user data.
             await refreshUser(); 
        };

        initializeGoogleAuth();
    }, [refreshUser]);

    useEffect(() => {
        if (isLoggedIn) {
            router.push("/dashboard"); // Redirect once auth state is confirmed
        }
    }, [isLoggedIn, router]);

    return (
        <div className="flex min-h-screen items-center justify-center flex-col gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            <p>Authenticating securely... Please wait.</p>
        </div>
    );
}

export default function AuthSuccessPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center flex-col gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                <p>Loading...</p>
            </div>
        }>
            <AuthSuccessContent />
        </Suspense>
    );
}