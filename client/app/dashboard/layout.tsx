"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, FileText, Settings, LogOut, ChevronLeft, ChevronRight, Menu, X, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NotificationCenter from "@/components/NotificationCenter";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close mobile menu when path changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem("access_token");
            if (token) {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` }
                });
            }
        } catch (e) {
            console.error("Logout error", e);
        } finally {
            localStorage.removeItem("access_token");
            router.replace("/auth/login");
        }
    };

    if (!mounted) return null;

    const isActive = (path: string) => pathname === path;

    const navLinks = [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, activeColor: "#fdf567" },
        { href: "/dashboard/orders", label: "My Orders", icon: Package, activeColor: "#ff90e8" },
        { href: "/dashboard/inquiries", label: "Inquiries", icon: FileText, activeColor: "#90e8ff" },
        { href: "/dashboard/support", label: "Support", icon: MessageSquare, activeColor: "#4be794" },
        { href: "/dashboard/settings", label: "Settings", icon: Settings, activeColor: "#ffffff" },
    ];

    return (
        <div className="flex min-h-screen bg-zinc-50 relative overflow-x-hidden">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 transition-opacity md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar Navigation (Desktop & Mobile Drawer) */}
            <aside
                className={`border-r-4 border-black bg-black text-white flex flex-col fixed h-full z-40 transition-all duration-300 ease-in-out 
                ${isMobileMenuOpen ? 'left-0 w-72' : '-left-full md:left-0'} 
                ${isCollapsed ? 'md:w-24 p-4' : 'md:w-72 p-6'}`}
            >
                <div className="flex items-center justify-between mb-10 text-white">
                    {(!isCollapsed || isMobileMenuOpen) && <span className="font-black text-3xl tracking-tighter">BOOKBIND.</span>}
                    <button
                        onClick={() => isMobileMenuOpen ? setIsMobileMenuOpen(false) : setIsCollapsed(!isCollapsed)}
                        className="p-1 hover:bg-zinc-800 rounded-md transition-colors ml-auto"
                    >
                        {isMobileMenuOpen ? <X className="h-6 w-6" /> : isCollapsed ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
                    </button>
                </div>

                <nav className="space-y-4 flex-1">
                    {navLinks.map((link) => {
                        const active = isActive(link.href);
                        return (
                            <Link key={link.href} href={link.href} title={link.label}>
                                <div
                                    className={`flex items-center text-lg font-bold transition-all border-2 ${active
                                        ? "text-black border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] translate-x-1"
                                        : "border-transparent hover:border-white hover:bg-zinc-900 text-zinc-400 hover:text-white"
                                        } ${isCollapsed && !isMobileMenuOpen ? 'justify-center p-3 aspect-square' : 'p-4'}`}
                                    style={active ? { backgroundColor: link.activeColor } : {}}
                                >
                                    <link.icon className={`${isCollapsed && !isMobileMenuOpen ? 'h-6 w-6' : 'mr-3 h-5 w-5'}`} />
                                    {(!isCollapsed || isMobileMenuOpen) && link.label}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                <div className={`pt-8 border-t-2 border-zinc-800 ${(isCollapsed && !isMobileMenuOpen) ? 'flex justify-center' : ''}`}>
                    <button
                        onClick={handleLogout}
                        className={`flex items-center text-lg font-bold text-red-400 hover:bg-red-950/30 hover:text-red-300 border-2 border-transparent transition-all ${(isCollapsed && !isMobileMenuOpen) ? 'justify-center p-3 aspect-square' : 'w-full p-4'}`}
                        title="Logout"
                    >
                        <LogOut className={`${isCollapsed && !isMobileMenuOpen ? 'h-6 w-6' : 'mr-3 h-5 w-5'}`} />
                        {(!isCollapsed || isMobileMenuOpen) && "Logout"}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={`flex-1 min-h-screen transition-all duration-300 ease-in-out ${isCollapsed ? 'md:ml-24' : 'md:ml-72'}`}>
                <header className="bg-white border-b-2 border-black p-4 flex justify-between items-center sticky top-0 z-10 h-16">
                    <div className="flex items-center gap-4">
                        <button
                            className="p-2 border-2 border-black md:hidden hover:bg-zinc-100 transition-colors"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <span className="font-bold text-lg uppercase tracking-tight md:hidden">BookBind.</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-bold hidden md:inline-block">Welcome back, User</span>
                        <NotificationCenter />
                    </div>
                </header>
                <div className="p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
