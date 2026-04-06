"use client";

import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { useAuth } from "@/context/AuthContext";
import { PasswordInput } from "@/components/ui/password-input";
import { getFriendlyErrorMessage } from "@/lib/auth-utils";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google/login`;
  };

  return (
    <Card className="w-full max-w-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader><CardTitle>Welcome back</CardTitle></CardHeader>
      <CardContent>
        {searchParams.get("reset") === "success" && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-md text-sm mb-4 text-center font-medium">
            Password reset successfully! Please sign in with your new password.
          </div>
        )}
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" required onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Password</Label>
              <Link href="/auth/forgot-password" className="text-sm text-zinc-600 hover:text-black underline-offset-4 hover:underline">
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              name="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full bg-black" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 animate-spin" /> : "Sign In"}
          </Button>
          <Button type="button" variant="outline" className="w-full border-2 border-black" onClick={handleGoogleLogin}>
            <FcGoogle className="mr-2 h-5 w-5" /> Sign in with Google
          </Button>
        </form>
        <div className="mt-6 text-center text-sm">
          Don't have an account? <Link href="/auth/signup" className="underline font-medium">Sign up</Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
      <Suspense fallback={
        <Card className="w-full max-w-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader><CardTitle>Welcome back</CardTitle></CardHeader>
          <CardContent className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </CardContent>
        </Card>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}