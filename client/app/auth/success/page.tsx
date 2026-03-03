"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import { useAuth } from "@/context/AuthContext";

function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const accessToken = searchParams.get("access_token");

    if (accessToken) {
      // Use AuthContext login — fetches user data before navigating
      login(accessToken);
    } else {
      router.replace("/login?error=GoogleAuthFailed");
    }
  }, [router, searchParams, login]);

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