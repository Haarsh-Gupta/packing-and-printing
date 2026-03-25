"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import { useAuth } from "@/context/AuthContext";

function AuthSuccessContent() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isLoggedIn) {
        router.replace("/dashboard");
      } else {
        router.replace("/login?error=GoogleAuthFailed");
      }
    }
  }, [router, isLoggedIn, isLoading]);

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