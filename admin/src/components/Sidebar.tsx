import { useNavigate, useLocation, Link } from "react-router-dom";
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
    ChevronRight,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
    SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

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
            <SidebarHeader className="h-16 flex items-center px-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-black text-lg">B</span>
                    </div>
                    <span className="font-black text-xl tracking-tight group-data-[collapsible=icon]:hidden">
                        BookBind
                    </span>
                </div>
            </SidebarHeader>
            <Separator />
            <SidebarContent className="py-4">
                <SidebarMenu>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <SidebarMenuItem key={item.path}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive}
                                    tooltip={item.label}
                                    className="h-10 px-3"
                                >
                                    <Link to={item.path} className="flex items-center gap-3">
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-semibold">{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t border-border">
                {user && (
                    <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
                        <Avatar className="h-9 w-9 border border-border">
                            <AvatarImage src={user.profile_picture || ""} alt={user.name} />
                            <AvatarFallback className="font-bold">
                                {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                            <p className="text-sm font-bold truncate">{user.name}</p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                Admin
                            </p>
                        </div>
                    </div>
                )}
                <SidebarMenu className="mt-4">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={logout}
                            className="h-10 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-bold group-data-[collapsible=icon]:hidden">Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
