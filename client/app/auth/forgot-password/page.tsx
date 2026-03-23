"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PasswordInput } from "@/components/ui/password-input"
import { getFriendlyErrorMessage, validatePassword } from "@/lib/auth-utils";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<{ newPassword?: string }>({});

    // Form State
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const handleNewPasswordBlur = () => {
        const error = validatePassword(newPassword);
        setFieldErrors({ ...fieldErrors, newPassword: error || undefined });
    };

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || "Failed to send reset code.");
            }

            setStep(2); // Move to Step 2
        } catch (err: any) {
            setError(getFriendlyErrorMessage(err.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            setFieldErrors({ ...fieldErrors, newPassword: passwordError });
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp, new_password: newPassword }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || "Failed to reset password.");
            }

            // Automatically redirect to login on success
            router.push("/auth/login?reset=success");
        } catch (err: any) {
            setError(getFriendlyErrorMessage(err.message));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
            <Card className="w-full max-w-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/auth/login" className="text-zinc-500 hover:text-black transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <CardTitle>{step === 1 ? "Forgot Password" : "Reset Password"}</CardTitle>
                    </div>
                    <p className="text-sm text-zinc-500">
                        {step === 1
                            ? "Enter your email to receive a password reset code."
                            : `Enter the code sent to ${email} and your new password.`}
                    </p>
                </CardHeader>
                <CardContent>
                    {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-md border border-red-200">{error}</p>}

                    {step === 1 ? (
                        <form onSubmit={handleRequestOTP} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    name="email"
                                    type="email"
                                    required
                                    value={email}
                                    placeholder="name@example.com"
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="w-full bg-black" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 animate-spin" /> : "Send Reset Code"}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Reset Code (OTP)</Label>
                                <Input
                                    name="otp"
                                    type="text"
                                    required
                                    value={otp}
                                    placeholder="123456"
                                    maxLength={6}
                                    onChange={(e) => setOtp(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className={fieldErrors.newPassword ? "text-red-500" : ""}>New Password</Label>
                                <PasswordInput
                                    name="newPassword"
                                    required
                                    value={newPassword}
                                    placeholder="Enter new password"
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        if (fieldErrors.newPassword) setFieldErrors({ ...fieldErrors, newPassword: undefined });
                                    }}
                                    onBlur={handleNewPasswordBlur}
                                    className={fieldErrors.newPassword ? "border-red-500 focus-visible:ring-red-500/50" : ""}
                                />
                                {fieldErrors.newPassword ? (
                                    <p className="text-[10px] text-red-500 font-medium leading-tight">{fieldErrors.newPassword}</p>
                                ) : (
                                    <p className="text-[10px] text-zinc-500 leading-tight">Must be at least 6 characters and contain one uppercase letter, one lowercase letter, and one number.</p>
                                )}
                            </div>
                            <Button type="submit" className="w-full bg-black" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 animate-spin" /> : "Reset & Sign In"}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
