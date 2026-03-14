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
            <SidebarHeader className="h-14 flex flex-row items-center px-4 gap-2.5 border-b border-sidebar-border group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
                <div className="w-[30px] h-[30px] rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                    <span className="text-white font-extrabold text-[15px] font-sans tracking-tight">N</span>
                </div>
                <div className="group-data-[collapsible=icon]:hidden flex flex-col justify-center">
                    <span className="font-bold text-[15px] tracking-tight text-sidebar-foreground font-sans block leading-tight">Navart</span>
                    <span className="text-[10px] font-medium text-sidebar-foreground/45 font-sans leading-tight">Admin Portal</span>
                </div>
            </SidebarHeader>

            {/* Navigation */}
            <SidebarContent className="p-2.5 group-data-[collapsible=icon]:px-2">
                <SidebarMenu>
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <SidebarMenuItem key={item.path}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={active}
                                    tooltip={item.label}
                                    className={`h-9 rounded-lg font-sans text-[13px] gap-2.5 ${
                                        active
                                            ? 'font-semibold text-sidebar-foreground bg-sidebar-accent opacity-100'
                                            : 'font-normal text-sidebar-foreground bg-transparent opacity-75 hover:opacity-100'
                                    }`}
                                >
                                    <Link className="flex items-center gap-2.5 w-full" to={item.path}>
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
            <SidebarFooter className="border-t border-sidebar-border py-3 px-2 group-data-[collapsible=icon]:px-2">
                {/* Settings link */}
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            isActive={location.pathname === '/settings'}
                            tooltip="Settings"
                            className={`h-9 rounded-lg font-sans text-[13px] ${
                                location.pathname === '/settings' ? 'font-semibold opacity-100' : 'font-normal opacity-80'
                            }`}
                        >
                            <Link to="/settings" className="flex items-center gap-2.5 w-full">
                                <SettingsIcon size={15} />
                                <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>

                {/* User info */}
                {user && (
                    <div className="flex items-center gap-2.5 py-2 px-1.5 mt-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:mx-auto">
                        <div className="w-[30px] h-[30px] rounded-full shrink-0 bg-blue-500 flex items-center justify-center">
                            <span className="text-white font-bold text-[13px]">
                                {(user.name || user.email || 'A')[0].toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                            <p className="text-[12px] font-semibold text-sidebar-foreground truncate m-0">
                                {user.name || "Admin User"}
                            </p>
                            <p className="text-[10px] text-sidebar-foreground/45 m-0 truncate">
                                {user.email}
                            </p>
                        </div>
                        <button onClick={logout}
                            className="group-data-[collapsible=icon]:hidden p-1 text-sidebar-foreground/40 rounded-md transition-all hover:text-red-500 hover:opacity-100 flex"
                            title="Sign out"
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