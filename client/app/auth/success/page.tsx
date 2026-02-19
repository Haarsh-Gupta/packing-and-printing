"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("access_token");

    if (accessToken) {
      // Save the token from the URL query params
      localStorage.setItem("access_token", accessToken);
      // Clean up the URL and go to dashboard
      router.replace("/dashboard");
    } else {
      router.replace("/login?error=GoogleAuthFailed");
    }
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center flex-col gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      <p>Logging you in...</p>
    </div>
  );
}