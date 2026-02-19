"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const formBody = new URLSearchParams();
      formBody.append("username", formData.email); 
      formBody.append("password", formData.password);

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Invalid credentials");
      
      // Save the access token
      localStorage.setItem("access_token", data.access_token);
      
      // The refresh token is automatically set in HttpOnly cookies by your backend!
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google/login`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader><CardTitle>Welcome back</CardTitle></CardHeader>
        <CardContent>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" required onChange={(e) => setFormData({...formData, email: e.target.value})} /></div>
            <div className="space-y-2"><Label>Password</Label><Input name="password" type="password" required onChange={(e) => setFormData({...formData, password: e.target.value})} /></div>
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
    </div>
  );
}