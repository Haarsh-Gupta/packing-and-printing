import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
    LayoutDashboard, ShoppingCart, MessageSquare, Package,
    Wrench, Users, LifeBuoy, Bell, Mail, Star, Settings as SettingsIcon, LogOut, Calculator
} from "lucide-react";
import {
    Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
    SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail,
} from "@/components/ui/sidebar";

const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Orders", icon: ShoppingCart, path: "/orders" },
    { label: "Inquiries", icon: MessageSquare, path: "/inquiries" },
    { label: "Products", icon: Package, path: "/products" },
    { label: "Services", icon: Wrench, path: "/services" },
    { label: "Pricing Calculator", icon: Calculator, path: "/calculator" },
    { label: "Customers", icon: Users, path: "/users" },
    { label: "Tickets", icon: LifeBuoy, path: "/tickets" },
    { label: "Notifications & Email", icon: Bell, path: "/notifications" },
    { label: "Reviews", icon: Star, path: "/reviews" },
];

export function AppSidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path: string) => {
        if (path === "/") return location.pathname === "/";
        return location.pathname.startsWith(path);
    };

    return (
        <Sidebar collapsible="icon">
            {/* Logo — matches Stitch: blue circle "N" + Navart / Admin Portal */}
            <SidebarHeader style={{
                height: '56px', display: 'flex', flexDirection: 'row',
                alignItems: 'center', padding: '0 16px',
                borderBottom: '1px solid var(--sidebar-border)', gap: '10px',
            }}>
                <div style={{
                    width: '30px', height: '30px', borderRadius: '8px',
                    background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                    <span style={{ color: 'white', fontWeight: 800, fontSize: '15px', fontFamily: "'Inter', system-ui", letterSpacing: '-0.04em' }}>N</span>
                </div>
                <div className="group-data-[collapsible=icon]:hidden">
                    <span style={{
                        fontWeight: 700, fontSize: '15px', letterSpacing: '-0.03em',
                        color: 'var(--sidebar-foreground)', fontFamily: "'Inter', system-ui", display: 'block',
                    }}>Navart</span>
                    <span style={{
                        fontSize: '10px', fontWeight: 500, color: 'var(--sidebar-foreground)',
                        opacity: 0.45, fontFamily: "'Inter', system-ui",
                    }}>Admin Portal</span>
                </div>
            </SidebarHeader>

            {/* Navigation */}
            <SidebarContent style={{ padding: '10px 8px' }}>
                <SidebarMenu>
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <SidebarMenuItem key={item.path}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={active}
                                    tooltip={item.label}
                                    style={{
                                        height: '36px', borderRadius: '8px',
                                        fontFamily: "'Inter', system-ui",
                                        fontWeight: active ? 600 : 400,
                                        fontSize: '13px', gap: '10px',
                                        color: active ? 'var(--sidebar-foreground)' : 'var(--sidebar-foreground)',
                                        background: active ? 'var(--sidebar-accent)' : 'transparent',
                                        opacity: active ? 1 : 0.75,
                                    }}
                                >
                                    <Link to={item.path} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <item.icon size={15} />
                                        <span>{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarContent>

            {/* Footer */}
            <SidebarFooter style={{ borderTop: '1px solid var(--sidebar-border)', padding: '12px 8px' }}>
                {/* Settings link */}
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={location.pathname === '/settings'}
                            tooltip="Settings"
                            style={{
                                height: '36px', borderRadius: '8px',
                                fontFamily: "'Inter', system-ui",
                                fontWeight: location.pathname === '/settings' ? 600 : 400,
                                fontSize: '13px', opacity: 0.8,
                            }}
                        >
                            <Link to="/settings" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <SettingsIcon size={15} />
                                <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                {/* User info */}
                {user && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 6px', marginTop: '4px',
                    }} className="group-data-[collapsible=icon]:justify-center">
                        <div style={{
                            width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                            background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <span style={{ color: 'white', fontWeight: 700, fontSize: '13px' }}>
                                {(user.name || user.email || 'A')[0].toUpperCase()}
                            </span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }} className="group-data-[collapsible=icon]:hidden">
                            <p style={{
                                fontSize: '12px', fontWeight: 600, color: 'var(--sidebar-foreground)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0,
                            }}>{user.name || "Admin User"}</p>
                            <p style={{ fontSize: '10px', color: 'var(--sidebar-foreground)', opacity: 0.45, margin: 0 }}>
                                {user.email}
                            </p>
                        </div>
                        <button onClick={logout}
                            className="group-data-[collapsible=icon]:hidden"
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                                color: 'var(--sidebar-foreground)', opacity: 0.4, borderRadius: '5px',
                                display: 'flex', transition: 'opacity 0.15s',
                            }}
                            title="Sign out"
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.4'; (e.currentTarget as HTMLButtonElement).style.color = ''; }}
                        >
                            <LogOut size={14} />
                        </button>
                    </div>
                )}
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}