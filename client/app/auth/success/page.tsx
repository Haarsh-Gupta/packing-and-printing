"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoggedIn, isLoading } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");

    if (accessToken) {
      // Google OAuth flow — tokens came from the backend via URL params
      // Store refresh token too so cookies aren't the only persistence
      if (refreshToken) {
        localStorage.setItem("refresh_token", refreshToken);
      }
      // login() saves the access_token to localStorage, fetches user, then redirects to /dashboard
      login(accessToken);
    } else if (!isLoading) {
      // Fallback: no tokens in URL, check if already logged in via cookies
      if (isLoggedIn) {
        router.replace("/dashboard");
      } else {
        router.replace("/auth/login?error=GoogleAuthFailed");
      }
    }
  }, [searchParams, login, isLoggedIn, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center flex-col gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      <p>Logging you in...</p>
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