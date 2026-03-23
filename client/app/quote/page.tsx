"use client";

import QuoteForm from "@/components/QuoteForm";
import WaveDivider from "@/components/WaveDivider";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function QuotePage() {
  return (
    <main className="min-h-screen bg-site-bg">
      {/* Small Header */}
      <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-zinc-500 hover:text-black transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
        </Link>
        <div className="text-xl font-black tracking-tighter">
          {process.env.NEXT_PUBLIC_COMPANY_NAME}<span className="text-[#FF90E8]">.</span>
        </div>
      </div>

      <section className="px-6 pb-24 relative">
        <div className="max-w-3xl mx-auto">
          {/* Headline Container */}
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-black leading-none">
              Get a custom <br />
              <span className="text-[#A78BFA]">estimate.</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-600 font-medium max-w-lg mx-auto leading-relaxed">
              Upload your specs, choose your materials, and get a professional quote within 2 hours.
            </p>
          </div>

          <QuoteForm />

          {/* Trust indicators */}
          <div className="mt-16 text-center text-zinc-400 font-bold uppercase text-xs tracking-[0.2em]">
            Trusted by 500+ local businesses in Delhi NCR
          </div>
        </div>
      </section>

      <WaveDivider topColor="var(--site-bg)" bottomColor="#FF90E8" variant="blob" />
    </main>
  );
}
