import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "./Sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "react-router-dom";

const PAGE_LABELS: Record<string, string> = {
    "/": "Overview",
    "/orders": "Orders",
    "/inquiries": "Inquiries",
    "/products": "Products",
    "/services": "Services",
    "/users": "Users",
    "/tickets": "Support Tickets",
    "/notifications": "Notifications",
    "/email": "Email Dispatcher",
    "/reviews": "Reviews",
};

export default function Layout() {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--background)',
                fontFamily: "'DM Mono', monospace",
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        border: '2px solid var(--border)',
                        borderTopColor: 'var(--foreground)',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto 16px',
                    }} />
                    <p style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: 'var(--muted-foreground)',
                    }}>
                        Initialising system...
                    </p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const pageLabel = PAGE_LABELS[location.pathname] || "Dashboard";

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-background">
                <header style={{
                    height: '52px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 20px',
                    borderBottom: '1px solid var(--border)',
                    gap: '12px',
                    flexShrink: 0,
                    background: 'var(--background)',
                }}>
                    <SidebarTrigger style={{ color: 'var(--muted-foreground)' }} />
                    <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
                    <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--muted-foreground)',
                        fontFamily: "'DM Mono', monospace",
                    }}>
                        {pageLabel}
                    </span>
                    <div style={{ flex: 1 }} />
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        background: 'var(--secondary)',
                        borderRadius: '4px',
                        border: '1px solid var(--border)',
                    }}>
                        <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#16a34a',
                        }} />
                        <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'var(--muted-foreground)',
                            fontFamily: "'DM Mono', monospace",
                        }}>
                            Production
                        </span>
                    </div>
                </header>
                <main style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '28px 32px',
                    overflowX: 'hidden',
                    maxWidth: '1400px',
                }}>
                    <Outlet />
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}