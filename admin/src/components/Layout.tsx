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
    "/settings": "Settings",
};

export default function Layout() {
    const { user, loading } = useAuth();
    const location = useLocation();
    const [search, setSearch] = useState("");

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#f2f2f7', fontFamily: "'Inter', system-ui",
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '30px', height: '30px',
                        border: '2px solid #e4e4e7', borderTopColor: '#3b82f6',
                        borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
                    }} />
                    <p style={{ fontSize: '12px', fontWeight: 500, color: '#71717a' }}>Loading…</p>
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
    else pageLabel = PAGE_LABELS[location.pathname] || "Dashboard";

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset style={{ background: '#f9f9f9', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                {/* Header */}
                <header style={{
                    height: '56px', display: 'flex', alignItems: 'center',
                    padding: '0 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', gap: '12px',
                    flexShrink: 0, background: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    position: 'sticky', top: 0, zIndex: 20,
                }}>
                    {/* Hamburger */}
                    <SidebarTrigger style={{ color: '#71717a' }} />
                    <div style={{ width: '1px', height: '18px', background: '#f0f0f0' }} />

                    {/* Breadcrumb */}
                    <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12.5px', color: '#a1a1aa', fontFamily: "'Inter', system-ui", fontWeight: 400 }}>
                            Admin
                        </span>
                        <ChevronRight size={12} style={{ color: '#d4d4d8' }} />
                        <span style={{ fontSize: '12.5px', color: '#18181b', fontWeight: 600, fontFamily: "'Inter', system-ui" }}>
                            {pageLabel}
                        </span>
                    </nav>

                    <div style={{ flex: 1 }} />

                    {/* Search */}
                    <div style={{ position: 'relative' }}>
                        <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
                        <input
                            type="text" placeholder="Search…"
                            value={search} onChange={e => setSearch(e.target.value)}
                            style={{
                                height: '34px', paddingLeft: '30px', paddingRight: '12px', width: '180px',
                                border: '1px solid #e4e4e7', borderRadius: '9px', fontSize: '13px',
                                color: '#18181b', background: '#f9f9f9', fontFamily: "'Inter', system-ui", outline: 'none',
                            }}
                        />
                    </div>

                    {/* Bell */}
                    <AdminNotifications />

                    {/* Avatar */}
                    <div style={{
                        width: '34px', height: '34px', borderRadius: '50%',
                        background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', flexShrink: 0,
                    }} title={user.email}>
                        <span style={{ color: 'white', fontWeight: 700, fontSize: '13px', fontFamily: "'Inter', system-ui" }}>
                            {(user.name || user.email || 'A')[0].toUpperCase()}
                        </span>
                    </div>
                </header>

                {/* Page content */}
                <main style={{
                    flex: 1, padding: '28px 32px', overflowX: 'clip',
                }}>
                    <Outlet />
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}