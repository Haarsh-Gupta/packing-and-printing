"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardSkeleton } from "./DashboardSkeleton";
import {
  FileText,
  ShoppingBag,
  Wallet,
  CalendarClock,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  Package,
  MessageSquare,
  Settings,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Order, Inquiry } from "@/types/dashboard";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  totalInquiries: number;
  pendingInquiries: number;
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  totalExpenditure: number;
  totalPaid: number;
  totalRemaining: number;
  upcomingPayments: number;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalInquiries: 0, pendingInquiries: 0,
    totalOrders: 0, activeOrders: 0, completedOrders: 0,
    totalExpenditure: 0, totalPaid: 0, totalRemaining: 0, upcomingPayments: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentInquiries, setRecentInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) { router.replace("/auth/login"); return; }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/dashboard-stats`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch dashboard stats");
        const data = await res.json();

        setStats(data.stats);
        setRecentOrders(data.recentOrders);
        setRecentInquiries(data.recentInquiries);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (authLoading || loading) return <DashboardSkeleton />;

  const avatarUrl = user?.profile_picture
    ? user.profile_picture
    : `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user?.name || "")}&backgroundColor=fdf567`;

  const statCards = [
    { label: "Total Inquiries", value: stats.totalInquiries, sub: `${stats.pendingInquiries} pending`, icon: FileText, bg: "bg-[#90e8ff]", href: "/dashboard/inquiries" },
    { label: "Total Orders", value: stats.totalOrders, sub: `${stats.activeOrders} active`, icon: ShoppingBag, bg: "bg-[#ff90e8]", href: "/dashboard/orders" },
    { label: "Expenditure", value: formatCurrency(stats.totalExpenditure), sub: `${formatCurrency(stats.totalPaid)} paid`, icon: Wallet, bg: "bg-[#4be794]", href: "/dashboard/orders" },
    { label: "Upcoming Dues", value: formatCurrency(stats.upcomingPayments), sub: `${stats.activeOrders} orders`, icon: CalendarClock, bg: "bg-[#fdf567]", href: "/dashboard/orders" },
    { label: "Remaining", value: formatCurrency(stats.totalRemaining), sub: "balance due", icon: CreditCard, bg: "bg-[#a788fa]", href: "/dashboard/orders" },
    { label: "Completed", value: stats.completedOrders, sub: `of ${stats.totalOrders} total`, icon: TrendingUp, bg: "bg-white", href: "/dashboard/orders" },
  ];

  const getOrderStatusBadge = (status: string) => {
    const map: Record<string, { label: string; bg: string }> = {
      WAITING_PAYMENT: { label: "Awaiting", bg: "bg-[#fdf567]" },
      PARTIALLY_PAID: { label: "Partial", bg: "bg-[#ff90e8]" },
      PAID: { label: "Paid", bg: "bg-[#4be794]" },
      PROCESSING: { label: "Processing", bg: "bg-[#90e8ff]" },
      READY: { label: "Ready", bg: "bg-[#4be794]" },
      COMPLETED: { label: "Done", bg: "bg-[#4be794]" },
      CANCELLED: { label: "Cancelled", bg: "bg-red-200" },
    };
    const badge = map[status] || { label: status, bg: "bg-zinc-200" };
    return (
      <span className={`text-xs font-black uppercase px-3 py-1 border-2 border-black rounded-full ${badge.bg}`}>
        {badge.label}
      </span>
    );
  };

  const getInquiryStatusBadge = (status: string) => {
    const map: Record<string, { label: string; bg: string }> = {
      DRAFT: { label: "Draft", bg: "bg-zinc-200" },
      SUBMITTED: { label: "Sent", bg: "bg-[#90e8ff]" },
      UNDER_REVIEW: { label: "Review", bg: "bg-[#a788fa]" },
      NEGOTIATING: { label: "Negotiating", bg: "bg-[#ff90e8]" },
      QUOTED: { label: "Quoted", bg: "bg-[#fdf567]" },
      ACCEPTED: { label: "Accepted", bg: "bg-[#4be794]" },
      REJECTED: { label: "Rejected", bg: "bg-red-200" },
      PENDING: { label: "Pending", bg: "bg-[#fdf567]" },
    };
    const badge = map[status] || { label: status, bg: "bg-zinc-200" };
    return (
      <span className={`text-xs font-black uppercase px-3 py-1 border-2 border-black rounded-full ${badge.bg}`}>
        {badge.label}
      </span>
    );
  };

  const quickLinks = [
    { label: "Browse Products", href: "/products", icon: Package },
    { label: "My Inquiries", href: "/dashboard/inquiries", icon: MessageSquare },
    { label: "Support Tickets", href: "/dashboard/support", icon: FileText },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-16">

      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-4 border-black pb-8">
        <div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-2">
            Hello, <span className="text-zinc-400 decoration-4 underline decoration-[#fdf567] underline-offset-8">{user?.name?.split(" ")[0]}</span>
          </h1>
          <p className="text-xl font-bold text-zinc-500 max-w-xl leading-relaxed">
            Manage your orders, track shipments, and keep an eye on your finances.
          </p>
        </div>
        <Button asChild className="h-14 px-8 text-lg font-black uppercase border-4 border-black bg-[#fdf567] text-black hover:bg-black hover:text-white hover:border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all rounded-xl">
          <Link href="/products">
            <Package className="mr-3 h-5 w-5" /> New Order
          </Link>
        </Button>
      </header>

      {/* ── Stat Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map(({ label, value, sub, icon: Icon, bg, href }) => (
          <Link key={label} href={href}>
            <div className={`${bg} border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group rounded-xl`}>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-black text-white border-2 border-black rounded-lg">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-4xl font-black mb-1">{value}</h3>
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm uppercase tracking-wider">{label}</p>
                <p className="text-xs font-medium text-black/50">{sub}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Recent Activity ── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Recent Orders */}
        <div className="border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white rounded-xl">
          <div className="flex justify-between items-center mb-5 border-b-2 border-zinc-100 pb-4">
            <h2 className="text-xl font-black uppercase tracking-tight">Recent Orders</h2>
            <Link href="/dashboard/orders" className="text-sm font-bold text-zinc-400 hover:text-black flex items-center gap-1 transition-colors">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="w-16 h-16 bg-[#ff90e8] border-2 border-black rounded-full flex items-center justify-center mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <Package className="h-7 w-7" />
              </div>
              <p className="font-bold text-zinc-500">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                  <div className="flex items-center justify-between p-3 border-2 border-black bg-zinc-50 hover:bg-[#fdf567] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all rounded-lg group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-[#ff90e8] border-2 border-black rounded-lg flex items-center justify-center shrink-0">
                        <ShoppingBag className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">
                          {order.product_name || `Order #${order.order_number || order.id.slice(0, 8)}`}
                        </p>
                        <p className="text-xs font-medium text-zinc-400">{formatCurrency(order.total_amount)}</p>
                      </div>
                    </div>
                    {getOrderStatusBadge(order.status)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Inquiries */}
        <div className="border-2 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white rounded-xl">
          <div className="flex justify-between items-center mb-5 border-b-2 border-zinc-100 pb-4">
            <h2 className="text-xl font-black uppercase tracking-tight">Recent Inquiries</h2>
            <Link href="/dashboard/inquiries" className="text-sm font-bold text-zinc-400 hover:text-black flex items-center gap-1 transition-colors">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {recentInquiries.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="w-16 h-16 bg-[#90e8ff] border-2 border-black rounded-full flex items-center justify-center mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <FileText className="h-7 w-7" />
              </div>
              <p className="font-bold text-zinc-500">No inquiries yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentInquiries.map((inquiry) => (
                <Link key={inquiry.id} href={`/dashboard/inquiries/${inquiry.id}`}>
                  <div className="flex items-center justify-between p-3 border-2 border-black bg-zinc-50 hover:bg-[#90e8ff] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all rounded-lg group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-[#90e8ff] border-2 border-black rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">
                          Inquiry #{inquiry.display_id || inquiry.id.slice(0, 8)}
                        </p>
                        <p className="text-xs font-medium text-zinc-400">
                          {new Date(inquiry.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    {getInquiryStatusBadge(inquiry.status)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Links + Profile ── */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* Quick Links */}
        <div className="md:col-span-2 border-2 border-black p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white rounded-xl">
          <div className="flex justify-between items-center mb-6 border-b-2 border-zinc-100 pb-4">
            <h2 className="text-xl font-black uppercase tracking-tight">Quick Links</h2>
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
          <div className="h-28 w-28 mx-auto border-4 border-black rounded-full overflow-hidden mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <img src={avatarUrl} className="h-full w-full object-cover" alt="User Avatar" />
          </div>
          <h3 className="text-xl font-black uppercase">{user?.name}</h3>
          <p className="text-zinc-500 font-medium mb-1">{user?.email}</p>
          {user?.phone && <p className="text-zinc-500 font-medium mb-4">{user?.phone}</p>}
          <Button asChild variant="outline" className="w-full font-black border-2 border-black hover:bg-zinc-100 rounded-full h-12 mt-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all">
            <Link href="/dashboard/settings">Edit Profile</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}