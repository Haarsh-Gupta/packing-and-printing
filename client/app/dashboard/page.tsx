"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, Package, FileText, Settings, LayoutDashboard } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  profile_picture: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error("Session expired");

        const data = await res.json();
        setUser(data);
      } catch (error: any) {
        console.error("Dashboard fetch error:", error);
        // localStorage.removeItem("access_token");
        // router.replace("/login");
        alert("Failed to load dashboard: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
    } finally {
      localStorage.removeItem("access_token");
      router.replace("/login");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  // THE AVATAR LOGIC:
  // Use the Google picture if it exists. Otherwise, generate a Notion face using their name!
  const avatarUrl = user?.profile_picture
    ? user.profile_picture
    : `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user?.name || "")}&backgroundColor=ffffff`;

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* Sidebar Navigation */}
      <aside className="w-64 border-r-2 border-black bg-white p-6 hidden md:flex flex-col">
        <div className="font-bold text-2xl mb-8 tracking-tighter">PrintPack.</div>
        <nav className="space-y-2 flex-1">
          <Button variant="secondary" className="w-full justify-start bg-zinc-100 hover:bg-zinc-200 text-black">
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start hover:bg-zinc-100">
            <Package className="mr-2 h-4 w-4" /> My Orders
          </Button>
          <Button variant="ghost" className="w-full justify-start hover:bg-zinc-100">
            <FileText className="mr-2 h-4 w-4" /> Invoices
          </Button>
          <Button variant="ghost" className="w-full justify-start hover:bg-zinc-100">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Button>
        </nav>
        <Button variant="outline" className="w-full justify-start border-2 border-black text-red-600 hover:bg-red-50" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-8">

          <header className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name?.split(' ')[0]}</h1>
              <p className="text-zinc-500 mt-1">Manage your printing orders and packaging details.</p>
            </div>
          </header>

          <div className="grid gap-6 md:grid-cols-2">

            {/* Profile Card */}
            <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>Your personal information</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-6">
                <div className="h-24 w-24 rounded-full border-2 border-black bg-white flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                  <img
                    src={avatarUrl}
                    alt="Profile Avatar"
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">{user?.name}</h2>
                  <p className="text-zinc-600">{user?.email}</p>
                  <p className="text-sm text-zinc-500 font-mono mt-2">
                    {user?.phone ? `Phone: ${user.phone}` : "No phone number added"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats / Action Card */}
            <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Overview of your printing account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-zinc-200">
                  <span className="text-zinc-600">Active Orders</span>
                  <span className="font-bold text-lg">0</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-200">
                  <span className="text-zinc-600">Pending Invoices</span>
                  <span className="font-bold text-lg">0</span>
                </div>
                <Button className="w-full mt-4 bg-black text-white hover:bg-zinc-800">
                  <Package className="mr-2 h-4 w-4" /> Start New Order
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}