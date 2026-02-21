import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
    LayoutDashboard, ShoppingCart, MessageSquare, Package, Wrench,
    Users, LifeBuoy, Bell, Mail, Star, LogOut, Settings,
} from "lucide-react";
import {
    Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu,
    SidebarMenuButton, SidebarMenuItem, SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navGroups = [
    {
        label: "Overview",
        items: [
            { label: "Dashboard", icon: LayoutDashboard, path: "/" },
        ]
    },
    {
        label: "Management",
        items: [
            { label: "Orders", icon: ShoppingCart, path: "/orders" },
            { label: "Inquiries", icon: MessageSquare, path: "/inquiries" },
        ]
    },
    {
        label: "Catalog",
        items: [
            { label: "Products", icon: Package, path: "/products" },
            { label: "Services", icon: Wrench, path: "/services" },
        ]
    },
    {
        label: "Admin",
        items: [
            { label: "Users", icon: Users, path: "/users" },
            { label: "Tickets", icon: LifeBuoy, path: "/tickets" },
        ]
    },
    {
        label: "Communication",
        items: [
            { label: "Notifications", icon: Bell, path: "/notifications" },
            { label: "Email", icon: Mail, path: "/email" },
        ]
    },
    {
        label: "Content",
        items: [
            { label: "Reviews", icon: Star, path: "/reviews" },
        ]
    },
    {
        label: "System",
        items: [
            { label: "Settings", icon: Settings, path: "/settings" },
        ]
    },
];

export function AppSidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    return (
        <Sidebar collapsible="icon">
            {/* Logo */}
            <SidebarHeader style={{ height: '52px', display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid var(--sidebar-border)', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', background: 'var(--sidebar-foreground)', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: 'var(--sidebar)', fontWeight: 900, fontSize: '14px', letterSpacing: '-0.05em', fontFamily: "'DM Sans', system-ui" }}>B</span>
                </div>
                <div className="group-data-[collapsible=icon]:hidden">
                    <span style={{ fontWeight: 900, fontSize: '16px', letterSpacing: '-0.04em', color: 'var(--sidebar-foreground)', fontFamily: "'DM Sans', system-ui" }}>BookBind</span>
                    <span style={{ display: 'block', fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sidebar-foreground)', opacity: 0.4, fontFamily: "'DM Mono', monospace", marginTop: '-2px' }}>Admin Console</span>
                </div>
            </SidebarHeader>

            {/* Navigation */}
            <SidebarContent style={{ padding: '8px' }}>
                {navGroups.map((group) => (
                    <div key={group.label} style={{ marginBottom: '4px' }}>
                        <div className="group-data-[collapsible=icon]:hidden" style={{ padding: '10px 8px 4px', fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sidebar-foreground)', opacity: 0.35, fontFamily: "'DM Mono', monospace" }}>
                            {group.label}
                        </div>
                        <SidebarMenu>
                            {group.items.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <SidebarMenuItem key={item.path}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={item.label}
                                            style={{ height: '36px', borderRadius: '6px', fontFamily: "'DM Sans', system-ui", fontWeight: isActive ? 700 : 500, fontSize: '13px', gap: '10px', letterSpacing: '-0.01em' }}
                                        >
                                            <Link to={item.path} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <item.icon size={16} style={{ opacity: isActive ? 1 : 0.6 }} />
                                                <span>{item.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </div>
                ))}
            </SidebarContent>

            {/* Footer */}
            <SidebarFooter style={{ borderTop: '1px solid var(--sidebar-border)', padding: '12px' }}>
                {user && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '6px', marginBottom: '4px' }} className="group-data-[collapsible=icon]:justify-center">
                        <Avatar style={{ width: '32px', height: '32px', border: '1px solid var(--sidebar-border)', flexShrink: 0 }}>
                            <AvatarImage src={user.profile_picture || ""} alt={user.name} />
                            <AvatarFallback style={{ fontWeight: 800, fontSize: '13px', background: 'var(--sidebar-accent)', color: 'var(--sidebar-accent-foreground)' }}>
                                {(user.name || user.email || "A").charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div style={{ flex: 1, minWidth: 0 }} className="group-data-[collapsible=icon]:hidden">
                            <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--sidebar-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || user.email}</p>
                            <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sidebar-foreground)', opacity: 0.4, fontFamily: "'DM Mono', monospace" }}>Administrator</p>
                        </div>
                    </div>
                )}
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={logout} style={{ height: '34px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#ef4444', gap: '10px' }}>
                            <LogOut size={15} />
                            <span className="group-data-[collapsible=icon]:hidden">Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
