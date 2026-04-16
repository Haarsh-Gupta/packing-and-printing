"use client";

import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Phone, Mail } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { PasswordInput } from "@/components/ui/password-input";
import { getFriendlyErrorMessage } from "@/lib/auth-utils";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithPhone } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  
  // Email Auth State
  const [emailData, setEmailData] = useState({ email: "", password: "" });
  
  // Phone Auth State
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [canResend, setCanResend] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(emailData.email, emailData.password);
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/otps/send-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to send OTP");
      }

      setOtpSent(true);
      setCanResend(false);
      toast.success("OTP sent to your WhatsApp!");
      
      // Allow resend after 60 seconds
      setTimeout(() => setCanResend(true), 60000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      await loginWithPhone(phone, otp);
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
    <Card className="w-full max-w-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
        <div className="flex gap-2 mt-2">
            <Button 
                variant={authMethod === "email" ? "default" : "outline"} 
                size="sm" 
                className={`flex-1 ${authMethod === "email" ? "bg-black text-white" : "border-black border-2"}`}
                onClick={() => { setAuthMethod("email"); setError(""); }}
            >
                <Mail className="w-4 h-4 mr-2" /> Email
            </Button>
            <Button 
                variant={authMethod === "phone" ? "default" : "outline"} 
                size="sm" 
                className={`flex-1 ${authMethod === "phone" ? "bg-black text-white" : "border-black border-2"}`}
                onClick={() => { setAuthMethod("phone"); setError(""); }}
            >
                <Phone className="w-4 h-4 mr-2" /> Phone
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {searchParams.get("reset") === "success" && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-md text-sm mb-4 text-center font-medium">
            Password reset successfully! Please sign in with your new password.
          </div>
        )}
        
        {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm mb-4 font-medium">{error}</div>}

        {authMethod === "email" ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                name="email" 
                type="email" 
                placeholder="you@example.com"
                required 
                onChange={(e) => setEmailData({ ...emailData, email: e.target.value })} 
              />
            </div>
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
                value={emailData.password}
                onChange={(e) => setEmailData({ ...emailData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full bg-black hover:bg-zinc-800" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 animate-spin" /> : "Sign In"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handlePhoneLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <div className="flex gap-2">
                <Input 
                  name="phone" 
                  type="tel" 
                  placeholder="+91 XXXXX XXXXX"
                  disabled={otpSent && isLoading}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1"
                />
                {!otpSent && (
                  <Button 
                    type="button" 
                    onClick={handleSendOtp} 
                    disabled={isLoading || !phone}
                    className="bg-black text-xs h-10 px-3"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
                  </Button>
                )}
              </div>
            </div>

            {otpSent && (
              <div className="space-y-3 pt-2">
                <Label>Verification Code (OTP)</Label>
                <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={(val) => setOtp(val)}>
                    <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                    </InputOTPGroup>
                    </InputOTP>
                </div>
                <p className="text-xs text-center text-zinc-500">
                    Enter the 6-digit code sent to your WhatsApp. 
                    {canResend ? (
                        <button type="button" onClick={handleSendOtp} className="text-black underline ml-1 font-medium">Resend</button>
                    ) : (
                        <span className="ml-1 italic">Resend in 60s</span>
                    )}
                </p>
                <Button type="submit" className="w-full bg-black hover:bg-zinc-800 mt-4" disabled={isLoading || otp.length < 6}>
                  {isLoading ? <Loader2 className="mr-2 h-4 animate-spin" /> : "Verify & Sign In"}
                </Button>
                <Button 
                    type="button" 
                    variant="link" 
                    className="w-full text-zinc-500 text-xs"
                    onClick={() => { setOtpSent(false); setOtp(""); }}
                >
                    Change Phone Number
                </Button>
              </div>
            )}
          </form>
        )}

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-zinc-500 font-medium">Or continue with</span></div>
        </div>

        <Button type="button" variant="outline" className="w-full border-2 border-black font-medium" onClick={handleGoogleLogin}>
          <FcGoogle className="mr-2 h-5 w-5" /> Sign in with Google
        </Button>

        <div className="mt-8 text-center text-sm">
          Don't have an account? <Link href="/auth/signup" className="underline font-bold hover:text-zinc-600 transition-colors">Create account</Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#f8fafc]">
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