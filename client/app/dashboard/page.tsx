"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Loader2, Package, FileText, ArrowUpRight, ShoppingBag, Truck, Bell, MessageSquare, Settings, ChevronRight } from "lucide-react";

interface UserData {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  profile_picture: string | null;
}

interface Stats {
  totalOrders: number;
  pendingInquiries: number;
  inTransit: number;
}

import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, pendingInquiries: 0, inTransit: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) { router.replace("/auth/login"); return; }

      try {
        const [ordersRes, inquiriesRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/my`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include"
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/my`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include"
          }),
        ]);

        let ordersData: any[] = [];
        let inquiriesData: any[] = [];
        if (ordersRes.ok) ordersData = await ordersRes.json();
        if (inquiriesRes.ok) inquiriesData = await inquiriesRes.json();

        setStats({
          totalOrders: ordersData.length,
          pendingInquiries: inquiriesData.filter((i: any) => i.status === "PENDING").length,
          inTransit: ordersData.filter((o: any) => o.status === "SHIPPED" || o.status === "IN_PRODUCTION").length,
        });
      } catch (error) {
        console.error("Dashboard stats fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  if (isLoading) return <DashboardSkeleton />;

  const avatarUrl = user?.profile_picture
    ? user.profile_picture
    : `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user?.name || "")}&backgroundColor=fdf567`;

  const statCards = [
    {
      label: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingBag,
      bg: "bg-[#90e8ff]",
      href: "/dashboard/orders",
    },
    {
      label: "Pending Quotes",
      value: stats.pendingInquiries,
      icon: FileText,
      bg: "bg-[#ff90e8]",
      href: "/dashboard/inquiries",
    },
    {
      label: "In Transit",
      value: stats.inTransit,
      icon: Truck,
      bg: "bg-[#fdf567]",
      href: "/dashboard/orders",
    },
  ];

  const quickLinks = [
    { label: "Browse Products", href: "/products", icon: Package },
    { label: "My Inquiries", href: "/dashboard/inquiries", icon: MessageSquare },
    { label: "Support Tickets", href: "/dashboard/support", icon: Bell },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="p-8 md:p-12 space-y-12 bg-white min-h-screen">

      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-black pb-8">
        <div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-2">
            Hello, <span className="text-zinc-400 decoration-4 underline decoration-[#fdf567] underline-offset-8">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-xl font-bold text-zinc-500 max-w-xl leading-relaxed">
            Ready to bring your ideas to life? Manage your orders, track shipments, and update your profile here.
          </p>
        </div>
        <div className="flex gap-4">
          <Button asChild className="h-14 px-8 text-lg font-black uppercase border-4 border-black bg-[#fdf567] text-black hover:bg-black hover:text-white hover:border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-none">
            <Link href="/products">
              <Package className="mr-3 h-5 w-5" /> New Order
            </Link>
          </Button>
        </div>
      </header>

      {/* Live Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {statCards.map(({ label, value, icon: Icon, bg, href }) => (
          <Link key={label} href={href}>
            <div className={`${bg} border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-px hover:translate-y-px hover:shadow-sm transition-all cursor-pointer group rounded-xl`}>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-black text-white border-2 border-black rounded-lg">
                  <Icon className="h-6 w-6" />
                </div>
                <ArrowUpRight className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-5xl font-black mb-1">{value}</h3>
              <p className="font-bold text-lg uppercase tracking-wider">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content Split */}
      <div className="grid md:grid-cols-3 gap-8">

        {/* Quick Actions */}
        <div className="md:col-span-2 border-2 border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white rounded-xl">
          <div className="flex justify-between items-center mb-6 border-b-2 border-zinc-100 pb-4">
            <h2 className="text-2xl font-black uppercase tracking-tight">Quick Links</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickLinks.map(({ label, href, icon: Icon }) => (
              <Link key={label} href={href}>
                <div className="flex items-center justify-between p-4 border-2 border-black bg-zinc-50 hover:bg-[#fdf567] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-black text-white rounded-md">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-black uppercase tracking-tight text-lg">{label}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* User Card */}
        <div className="md:col-span-1 border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white text-center rounded-xl">
          <div className="h-32 w-32 mx-auto border-4 border-black rounded-full overflow-hidden mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <img src={avatarUrl} className="h-full w-full object-cover" alt="User Avatar" />
          </div>
          <h3 className="text-xl font-black uppercase">{user?.name}</h3>
          <p className="text-zinc-500 font-medium mb-2">{user?.email}</p>
          {user?.phone && <p className="text-zinc-500 font-medium mb-6">{user?.phone}</p>}
          <Button asChild variant="outline" className="w-full font-black border-2 border-black hover:bg-zinc-100 rounded-full h-12 mt-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all">
            <Link href="/dashboard/settings">Edit Profile</Link>
          </Button>
        </div>

      </div>
    </div>
  );
}