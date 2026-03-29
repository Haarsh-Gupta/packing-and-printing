"use client";

import React, { useState, useEffect } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Phone, ShieldCheck } from "lucide-react";
import { toast } from "sonner"; // If they have it, if not I'll use simple alert

export function FirebaseOTP() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isOTPSent, setIsOTPSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Need to initialize reCAPTCHA on component mount
    if (typeof window !== "undefined") {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
            size: "invisible",
            callback: (response: any) => {
                // reCAPTCHA solved, allow signInWithPhoneNumber.
            },
        });
    }
  }, []);

  const onSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    setIsLoading(true);
    try {
      const appVerifier = (window as any).recaptchaVerifier;
      // Add +91 for India if not already present
      const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setIsOTPSent(true);
      alert("OTP Sent successfully!");
    } catch (error: any) {
      console.error("Error sending OTP", error);
      alert(`Error sending OTP: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      alert("Please enter a valid 6-digit OTP.");
      return;
    }

    setIsLoading(true);
    try {
      if (confirmationResult) {
        const result = await confirmationResult.confirm(otp);
        const user = result.user;
        console.log("Firebase user verified:", user);
        setIsVerified(true);
        alert("Phone number verified successfully!");
      }
    } catch (error: any) {
      console.error("Error verifying OTP", error);
      alert(`Invalid OTP: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerified) {
    return (
      <div className="p-6 bg-green-50/50 border border-green-200 rounded-2xl flex flex-col items-center gap-4 animate-in fade-in duration-500">
        <CheckCircle2 className="w-12 h-12 text-green-500" />
        <div className="text-center">
          <h3 className="text-xl font-bold text-green-900">Phone Verified!</h3>
          <p className="text-green-700">Phone: {phoneNumber}</p>
        </div>
        <Button variant="outline" onClick={() => { setIsVerified(false); setIsOTPSent(false); setPhoneNumber(""); setOtp(""); }} className="mt-2 border-green-200 hover:bg-green-100 text-green-800">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100/50 rounded-lg text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h3 className="font-bold text-lg dark:text-zinc-100">Firebase OTP</h3>
          <p className="text-sm text-zinc-500">Universal SMS Verification</p>
        </div>
      </div>

      {!isOTPSent ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">+91</span>
              <Input 
                id="phone"
                placeholder="9876543210" 
                value={phoneNumber} 
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="pl-12 h-11 border-zinc-200 focus:ring-blue-500"
              />
            </div>
          </div>
          <Button 
            onClick={onSendOTP} 
            disabled={isLoading}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white transition-all font-semibold"
          >
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Phone className="mr-2 w-4 h-4" />}
            Send OTP
          </Button>
          <div id="recaptcha-container"></div>
        </div>
      ) : (
        <div className="space-y-4 animate-in slide-in-from-right duration-300">
          <div className="space-y-2">
            <Label htmlFor="otp">Enter 6-digit OTP</Label>
            <Input 
                id="otp"
                placeholder="000000" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="h-11 text-center text-xl tracking-widest font-bold border-zinc-200 focus:ring-blue-500"
              />
            <p className="text-xs text-center text-zinc-500">Code sent to +91 {phoneNumber}</p>
          </div>
          <Button 
            onClick={onVerifyOTP} 
            disabled={isLoading}
            className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 transition-all font-semibold"
          >
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Verify OTP"}
          </Button>
          <Button variant="ghost" className="w-full text-zinc-500 text-sm h-8" onClick={() => setIsOTPSent(false)}>
            Change Phone Number
          </Button>
        </div>
      )}
    </div>
  );
}
