"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  /**
   * Use a specific seed ("LostPage") to generate a consistent 
   * Notion-style face that fits the "missing page" theme.
   */
  const avatarUrl = "https://api.dicebear.com/7.x/notionists/svg?seed=LostPage&backgroundColor=ffffff";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center p-6">
        <CardContent className="flex flex-col items-center gap-6 pt-6">
          
          {/* Notion-Style Avatar Frame */}
          <div className="h-32 w-32 rounded-full border-4 border-black bg-white flex items-center justify-center overflow-hidden shadow-sm">
            <img 
              src={avatarUrl} 
              alt="Confused Avatar" 
              className="h-full w-full object-cover" 
            />
          </div>

          {/* Text Content */}
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter text-black">404</h1>
            <h2 className="text-xl font-bold text-black">Page not found</h2>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto">
              Oops! It looks like the printing press lost this page. Let's get you back to safety.
            </p>
          </div>

          {/* Action Buttons: Uses sm:flex-row to stay inside the box */}
          <div className="flex flex-col sm:flex-row w-full gap-4 mt-4">
            <Button 
              variant="outline" 
              className="w-full border-2 border-black hover:bg-zinc-100" 
              asChild
            >
              <button onClick={() => window.history.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
              </button>
            </Button>
            
            <Button 
              className="w-full bg-black text-white hover:bg-zinc-800" 
              asChild
            >
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" /> Dashboard
              </Link>
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}