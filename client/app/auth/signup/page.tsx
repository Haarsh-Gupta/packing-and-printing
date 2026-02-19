"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "", otp: "" });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to send OTP.");
      
      setStep(2); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          password: formData.password,
          otp: formData.otp,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Registration failed.");
      
      router.push("/login?registered=true"); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // The Google Sign Up Trigger
  const handleGoogleSignUp = () => {
    // This routes to the exact same FastAPI endpoint as login
    // FastAPI will handle creating the user if they don't exist yet!
    window.location.href = `${API_URL}/auth/google/login`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            {step === 1 ? "Enter your details to get started" : `Enter the 6-digit code sent to ${formData.email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{error}</p>}

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input name="name" required value={formData.name} onChange={handleInputChange} placeholder="Harsh Kumar Gupta" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" type="email" required value={formData.email} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>Phone (Optional)</Label>
                <Input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input name="password" type="password" required value={formData.password} onChange={handleInputChange} />
              </div>
              <Button type="submit" className="w-full bg-black" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Continue with Email"}
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-300" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-zinc-500">Or</span></div>
              </div>

              {/* Explicit Google Sign Up Button */}
              <Button type="button" variant="outline" className="w-full border-2 border-black" onClick={handleGoogleSignUp}>
                <FcGoogle className="mr-2 h-5 w-5" /> Sign up with Google
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6 flex flex-col items-center">
              <InputOTP maxLength={6} value={formData.otp} onChange={(val) => setFormData({ ...formData, otp: val })}>
                <InputOTPGroup>
                  {[0,1,2,3,4,5].map((i) => <InputOTPSlot key={i} index={i} className="border-black" />)}
                </InputOTPGroup>
              </InputOTP>
              <Button type="submit" className="w-full bg-black" disabled={isLoading || formData.otp.length !== 6}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify OTP & Register"}
              </Button>
              <button type="button" onClick={() => setStep(1)} className="text-sm text-zinc-500 underline">
                Back to details
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            Already have an account? <Link href="/login" className="underline font-medium">Sign in</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}