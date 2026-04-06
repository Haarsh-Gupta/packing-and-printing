"use client";

import React from "react";
import { FirebaseOTP } from "@/components/Verification/FirebaseOTP";
import { Truecaller } from "@/components/Verification/Truecaller";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Terminal, Smartphone, UserCheck } from "lucide-react";

export default function VerifyTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 py-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <Badge variant="outline" className="px-4 py-1 border-blue-200 text-blue-600 dark:text-blue-400 bg-blue-50/50">
            Developer Sandbox
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
            Verification Lab
          </h1>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
            Test and compare different phone verification methods for the <span className="font-bold text-zinc-900 dark:text-zinc-100">Book_bind</span> platform.
          </p>
        </header>

        <section className="bg-amber-50/50 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/30 p-6 rounded-2xl flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-900 dark:text-amber-400">Environment Setup Required</h4>
            <p className="text-sm text-amber-800 dark:text-amber-500/80 leading-relaxed">
              To use <span className="font-semibold">Firebase</span>, please add your keys to <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded text-amber-900">.env.local</code>. <br />
              To use <span className="font-semibold">Truecaller</span> on production, register your app at the Truecaller Developer Portal and replace the mock Partner Key.
            </p>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <Truecaller />
            <Card className="border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-sm shadow-sm overflow-hidden border-t-4 border-t-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-500" />
                  Truecaller Experience
                </CardTitle>
                <CardDescription>Performance & UX review</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center text-sm p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <span className="text-zinc-500">Speed:</span>
                  <span className="font-bold text-green-600 italic">Excellent (1-Tap)</span>
                </div>
                <div className="flex justify-between items-center text-sm p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <span className="text-zinc-500">Cost:</span>
                  <span className="font-bold text-green-600 uppercase">FREE</span>
                </div>
                <div className="flex justify-between items-center text-sm p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <span className="text-zinc-500">Pros:</span>
                  <span className="text-right leading-tight max-w-[150px]">No typing needed for users. Higher conversion.</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <FirebaseOTP />
            <Card className="border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40 backdrop-blur-sm shadow-sm overflow-hidden border-t-4 border-t-zinc-900 dark:border-t-zinc-100">
               <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                  Firebase Experience
                </CardTitle>
                <CardDescription>Reliability & Universal reach</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center text-sm p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <span className="text-zinc-500">Speed:</span>
                  <span className="font-bold text-amber-600">SMS Latency (5-15s)</span>
                </div>
                <div className="flex justify-between items-center text-sm p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <span className="text-zinc-500">Cost:</span>
                  <span className="font-bold text-red-500 uppercase">Pay per SMS</span>
                </div>
                <div className="flex justify-between items-center text-sm p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                  <span className="text-zinc-500">Pros:</span>
                  <span className="text-right leading-tight max-w-[150px]">Works on all devices even if they don't have Truecaller.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <section className="pt-8">
            <div className="flex items-center gap-2 mb-6 text-zinc-400">
                <Terminal size={18} />
                <h3 className="font-mono text-sm uppercase tracking-widest">Implementation Details</h3>
            </div>
            <div className="grid grid-cols-1 gap-6">
                <div className="p-6 bg-zinc-900 text-zinc-300 rounded-2xl font-mono text-xs overflow-x-auto shadow-2xl brightness-110">
                    <pre className="whitespace-pre-wrap">
{`// src/lib/firebase-config.ts
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Flow Comparison
- Firebase: Phone -> recaptchaVerifier -> signInWithPhoneNumber -> confirmationResult.confirm(otp)
- Truecaller: window.Truecaller.authenticate() -> handleResponse(requestId, accessToken)`}
                    </pre>
                </div>
            </div>
        </section>
      </div>
    </div>
  );
}
