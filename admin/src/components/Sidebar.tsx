import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
    LayoutDashboard,
    ShoppingCart,
    MessageSquare,
    Package,
    Wrench,
    Users,
    LifeBuoy,
    Bell,
    Mail,
    Star,
    LogOut,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Orders", icon: ShoppingCart, path: "/orders" },
    { label: "Inquiries", icon: MessageSquare, path: "/inquiries" },
    { label: "Products", icon: Package, path: "/products" },
    { label: "Services", icon: Wrench, path: "/services" },
    { label: "Users", icon: Users, path: "/users" },
    { label: "Tickets", icon: LifeBuoy, path: "/tickets" },
    { label: "Notifications", icon: Bell, path: "/notifications" },
    { label: "Email", icon: Mail, path: "/email" },
    { label: "Reviews", icon: Star, path: "/reviews" },
];

export function AppSidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    return (
        <Sidebar collapsible="icon">
            {/* Logo */}
            <SidebarHeader style={{
                height: '52px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: '0 16px',
                borderBottom: '1px solid var(--sidebar-border)',
                gap: '10px',
            }}>
                <div style={{
                    width: '28px',
                    height: '28px',
                    background: 'var(--sidebar-foreground)',
                    borderRadius: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <span style={{
                        color: 'var(--sidebar)',
                        fontWeight: 900,
                        fontSize: '14px',
                        letterSpacing: '-0.05em',
                        fontFamily: "'DM Sans', system-ui",
                    }}>B</span>
                </div>
                <div className="group-data-[collapsible=icon]:hidden">
                    <span style={{
                        fontWeight: 900,
                        fontSize: '16px',
                        letterSpacing: '-0.04em',
                        color: 'var(--sidebar-foreground)',
                        fontFamily: "'DM Sans', system-ui",
                    }}>BookBind</span>
                    <span style={{
                        display: 'block',
                        fontSize: '9px',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--sidebar-foreground)',
                        opacity: 0.4,
                        fontFamily: "'DM Mono', monospace",
                        marginTop: '-2px',
                    }}>Admin</span>
                </div>
            </SidebarHeader>

            {/* Navigation */}
            <SidebarContent style={{ padding: '8px' }}>
                <SidebarMenu>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <SidebarMenuItem key={item.path}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive}
                                    tooltip={item.label}
                                    style={{
                                        height: '36px',
                                        borderRadius: '6px',
                                        fontFamily: "'DM Sans', system-ui",
                                        fontWeight: isActive ? 700 : 500,
                                        fontSize: '13px',
                                        gap: '10px',
                                        letterSpacing: '-0.01em',
                                    }}
                                >
                                    <Link to={item.path} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <item.icon size={16} style={{ opacity: isActive ? 1 : 0.65 }} />
                                        <span>{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarContent>

            {/* Footer */}
            <SidebarFooter style={{
                borderTop: '1px solid var(--sidebar-border)',
                padding: '12px',
            }}>
                {user && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px',
                        borderRadius: '6px',
                        marginBottom: '4px',
                    }}
                        className="group-data-[collapsible=icon]:justify-center"
                    >
                        <Avatar style={{ width: '32px', height: '32px', border: '1px solid var(--sidebar-border)', flexShrink: 0 }}>
                            <AvatarImage src={user.profile_picture || ""} alt={user.name} />
                            <AvatarFallback style={{
                                fontWeight: 800,
                                fontSize: '13px',
                                background: 'var(--sidebar-accent)',
                                color: 'var(--sidebar-accent-foreground)',
                            }}>
                                {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div style={{ flex: 1, minWidth: 0 }} className="group-data-[collapsible=icon]:hidden">
                            <p style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                letterSpacing: '-0.02em',
                                color: 'var(--sidebar-foreground)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>{user.name}</p>
                            <p style={{
                                fontSize: '9px',
                                fontWeight: 700,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                color: 'var(--sidebar-foreground)',
                                opacity: 0.4,
                                fontFamily: "'DM Mono', monospace",
                            }}>Administrator</p>
                        </div>
                    </div>
                )}
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={logout}
                            style={{
                                height: '34px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#ef4444',
                                gap: '10px',
                            }}
                        >
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