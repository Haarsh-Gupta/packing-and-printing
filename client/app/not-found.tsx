"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, MoveLeft } from "lucide-react";

export default function NotFound() {
  const [seed, setSeed] = useState("default");

  // Generate a random seed on mount to get a "random character"
  useEffect(() => {
    setSeed(Math.random().toString(36).substring(7));
  }, []);

  // DiceBear Open Peeps - reliable and randomized
  const avatarUrl = `https://api.dicebear.com/7.x/open-peeps/svg?seed=${seed}&backgroundColor=ffffff`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-6 md:p-12 overflow-hidden relative">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      <div className="relative z-10 flex flex-col items-center max-w-2xl w-full">
        <div className="relative mb-8 flex h-32 w-32 items-center justify-center">
          {/* Decorative Neubrutalist Backdrop */}
          <div className="absolute top-1/2 left-1/2 -z-10 h-32 w-32 md:h-32 md:w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d2d9f7] opacity-60 blur-3xl" />

          {/* The Open Peep Avatar */}
          <img
            src={avatarUrl}
            alt="Random Character"
            className="h-full w-full object-contain border-4 border-black rounded-full bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-500 hover:rotate-6 cursor-pointer"
          />
        </div>

        <div className="text-center space-y-4">
          <div className="inline-block px-4 py-1 border-2 border-black bg-[#d2d9f7] font-black text-sm uppercase tracking-widest mb-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            404 Lost
          </div>

          <h1 className="text-6xl md:text-6xl font-black italic tracking-tighter text-black">
            WHOOPS!
          </h1>

          <p className="mx-auto max-w-md text-lg md:text-xl font-medium text-zinc-600 leading-relaxed">
            This character is just as lost as you are. Even our hardest working printing press couldn't find what you were looking for.
          </p>

          <div className="flex flex-col items-center justify-center gap-6 pt-8 sm:flex-row">
            <Button
              className="group relative h-14 min-w-[200px] border-2 border-black bg-black text-lg font-bold text-white transition-all hover:bg-black hover:shadow-[8px_8px_0px_0px_rgba(210,217,247,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
              asChild
            >
              <Link href="/">
                <Home className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                Return Home
              </Link>
            </Button>

            <Button
              variant="outline"
              className="relative h-14 min-w-[200px] border-2 border-black bg-white text-lg font-bold text-black transition-all hover:bg-zinc-50 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
              onClick={() => window.history.back()}
            >
              <MoveLeft className="mr-2 h-5 w-5" />
              Go Back
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Neubrutalist shapes */}
      <div className="absolute top-10 left-10 hidden md:block w-16 h-16 border-4 border-black rotate-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white"></div>
      <div className="absolute bottom-20 left-20 hidden md:block w-12 h-12 rounded-full border-4 border-black bg-[#d2d9f7]"></div>
      <div className="absolute top-20 right-20 hidden md:block w-20 h-20 bg-black/5 rounded-2xl rotate-45 border-2 border-black/10"></div>
    </div>
  );
}
