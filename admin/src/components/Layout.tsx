import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "./Sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Search, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { AdminNotifications } from "./AdminNotifications";

const PAGE_LABELS: Record<string, string> = {
    "/": "Dashboard",
    "/orders": "Orders",
    "/inquiries": "Inquiries",
    "/products": "Products",
    "/services": "Services",
    "/users": "Customers",
    "/tickets": "Tickets",
    "/notifications": "Notifications & Email",
    "/reviews": "Reviews",
    "/offline-payment": "Record Offline Payment",
    "/settings": "Settings",
};

export default function Layout() {
    const { admin: user, isLoading: loading } = useAuth();
    const location = useLocation();
    const [search, setSearch] = useState("");

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 font-sans">
                <div className="text-center flex flex-col items-center">
                    <Loader2 size={30} className="text-blue-500 animate-spin mb-3" />
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading…</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Compute breadcrumb label
    let pageLabel = "Dashboard";
    if (location.pathname.startsWith("/inquiries/")) pageLabel = "Inquiry Details";
    else if (location.pathname.startsWith("/orders/")) pageLabel = "Order Details";
    else if (location.pathname.startsWith("/products/")) pageLabel = "Product Details";
    else if (location.pathname.startsWith("/services/")) pageLabel = "Service Details";
    else if (location.pathname.startsWith("/tickets/")) pageLabel = "Ticket Details";
    else pageLabel = PAGE_LABELS[location.pathname] || "Dashboard";

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-slate-50 dark:bg-[#0a0a0a] flex flex-col min-h-screen transition-colors">
                {/* Header */}
                <header className="h-14 flex items-center px-4 md:px-5 gap-3 shrink-0 bg-white dark:bg-slate-900 border-b border-black/5 dark:border-white/5 shadow-sm sticky top-0 z-20 transition-colors">
                    {/* Hamburger */}
                    <SidebarTrigger className="text-slate-500 dark:text-slate-400" />
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />

                    {/* Breadcrumb */}
                    <nav className="hidden sm:flex items-center gap-1.5">
                        <span className="text-[12.5px] text-slate-400 dark:text-slate-500 font-sans font-normal">
                            Admin
                        </span>
                        <ChevronRight size={12} className="text-slate-300 dark:text-slate-600" />
                        <span className="text-[12.5px] text-slate-900 dark:text-slate-100 font-semibold font-sans">
                            {pageLabel}
                        </span>
                    </nav>

                    <div className="flex-1" />

                    {/* Search */}
                    <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input
                            type="text" placeholder="Search…"
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="h-8 pl-8 pr-3 w-32 md:w-44 border border-slate-200 dark:border-slate-800 rounded-lg text-[13px] text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950/50 font-sans outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
                        />
                    </div>

                    {/* Bell */}
                    <AdminNotifications />

                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center cursor-pointer shrink-0" title={user.email}>
                        <span className="text-white font-bold text-[13px] font-sans">
                            {(user.name || user.email || 'A')[0].toUpperCase()}
                        </span>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 md:p-8 overflow-x-clip text-slate-900 dark:text-slate-100">
                    <Outlet />
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}