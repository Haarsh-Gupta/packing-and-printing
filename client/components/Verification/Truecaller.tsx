"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Zap, PhoneOutgoing } from "lucide-react";

export function Truecaller() {
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    // Inject Truecaller SDK script
    const script = document.createElement("script");
    script.src = "https://sdk.truecaller.com/auth-sdk.js";
    script.async = true;
    script.onload = () => {
      console.log("Truecaller SDK Loaded");
      // Initializa configuration for SDK if needed
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const onTruecallerClick = async () => {
    setIsLoading(true);
    try {
      // THIS IS A MOCK IMPLEMENTATION AS IT REQUIRES YOUR REAL PARTNER KEY
      console.log("Initiating Truecaller Verification...");
      
      // In reality, this would call: window.Truecaller.authenticate()
      // For this test page, we'll simulate a 2-second verification delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockUser = {
        phoneNumber: "9876543210",
        firstName: "Test",
        lastName: "User",
        request_id: "TC_MOCK_" + Date.now()
      };
      
      setUserData(mockUser);
      setIsVerified(true);
      alert("Truecaller 1-tap verification successful (Mock)");
    } catch (error: any) {
      console.error("Truecaller Error:", error);
      alert("Truecaller verification failed. Make sure you are on a mobile device or have configured your partner key.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerified) {
    return (
      <div className="p-6 bg-blue-50/50 border border-blue-200 rounded-2xl flex flex-col items-center gap-4 animate-in fade-in duration-500">
        <CheckCircle2 className="w-12 h-12 text-blue-500" />
        <div className="text-center">
          <h3 className="text-xl font-bold text-blue-900">Verified with Truecaller!</h3>
          <p className="text-blue-700">Phone: {userData.phoneNumber}</p>
          <p className="text-sm text-blue-500">Name: {userData.firstName} {userData.lastName}</p>
        </div>
        <Button variant="outline" onClick={() => setIsVerified(false)} className="mt-2 border-blue-200 hover:bg-blue-100 text-blue-800">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500 rounded-lg text-white">
          <Zap size={24} />
        </div>
        <div>
          <h3 className="font-bold text-lg dark:text-zinc-100">Truecaller 1-Tap</h3>
          <p className="text-sm text-zinc-500">Instant Verification (No OTP)</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 text-center mb-4">
          <p className="text-xs text-zinc-500 italic">
            "One-tap verification for 150M+ users. 
            No manual input required on Android."
          </p>
        </div>

        <Button 
          onClick={onTruecallerClick} 
          disabled={isLoading}
          className="w-full h-11 bg-[#0087FF] hover:bg-[#0070D1] text-white transition-all font-bold shadow-lg shadow-blue-500/10"
        >
          {isLoading ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <PhoneOutgoing className="mr-2 w-4 h-4" />
          )}
          Verify with Truecaller
        </Button>

        <p className="text-[10px] text-zinc-400 text-center uppercase tracking-wider font-semibold">
          High Conversion • Instant • Free
        </p>
      </div>
    </div>
  );
}
