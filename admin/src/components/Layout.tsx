import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "./Sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useState, useEffect, useRef } from "react";
import { Moon, Sun, Search, ChevronRight, Settings, LogOut, User } from "lucide-react";

const PAGE_LABELS: Record<string, { label: string; parent?: string }> = {
    "/": { label: "Overview" },
    "/orders": { label: "Orders", parent: "Management" },
    "/inquiries": { label: "Inquiries", parent: "Management" },
    "/products": { label: "Products", parent: "Catalog" },
    "/services": { label: "Services", parent: "Catalog" },
    "/users": { label: "Users", parent: "Admin" },
    "/tickets": { label: "Support Tickets", parent: "Admin" },
    "/notifications": { label: "Notifications", parent: "Comms" },
    "/email": { label: "Email Dispatcher", parent: "Comms" },
    "/reviews": { label: "Reviews", parent: "Content" },
    "/settings": { label: "Settings", parent: "System" },
};

function useTheme() {
    const [dark, setDark] = useState(() => {
        const saved = localStorage.getItem("admin_theme");
        return saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    });
    useEffect(() => {
        document.documentElement.classList.toggle("dark", dark);
        localStorage.setItem("admin_theme", dark ? "dark" : "light");
    }, [dark]);
    return { dark, setDark };
}

export default function Layout() {
    const { user, loading, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { dark, setDark } = useTheme();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchVal, setSearchVal] = useState("");
    const userMenuRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(v => !v); }
            if (e.key === "Escape") { setSearchOpen(false); setUserMenuOpen(false); }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    useEffect(() => { if (searchOpen && searchRef.current) searchRef.current.focus(); }, [searchOpen]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', fontFamily: "'DM Mono', monospace" }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '36px', height: '36px', border: '2px solid var(--border)', borderTopColor: 'var(--foreground)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>Initialising system...</p>
                </div>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;

    const pageInfo = PAGE_LABELS[location.pathname] || { label: "Dashboard" };
    const searchRoutes = Object.entries(PAGE_LABELS).map(([path, info]) => ({ path, ...info }));
    const filtered = searchRoutes.filter(r =>
        !searchVal || r.label.toLowerCase().includes(searchVal.toLowerCase()) || (r.parent || '').toLowerCase().includes(searchVal.toLowerCase())
    );

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-background">
                <header style={{ height: '52px', display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid var(--border)', gap: '12px', flexShrink: 0, background: 'var(--background)', position: 'sticky', top: 0, zIndex: 20 }}>
                    <SidebarTrigger style={{ color: 'var(--muted-foreground)' }} />
                    <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />

                    {/* Breadcrumb */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {pageInfo.parent && (
                            <>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', ...mono }}>{pageInfo.parent}</span>
                                <ChevronRight size={12} style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
                            </>
                        )}
                        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--foreground)', ...mono }}>{pageInfo.label}</span>
                    </div>

                    <div style={{ flex: 1 }} />

                    {/* Search */}
                    <button onClick={() => setSearchOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 12px', background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--muted-foreground)', fontSize: '12px', fontWeight: 500, fontFamily: "'DM Sans', system-ui" }}>
                        <Search size={13} />
                        <span style={{ opacity: 0.6 }}>Search...</span>
                        <span style={{ fontSize: '10px', ...mono, opacity: 0.4, marginLeft: '4px' }}>⌘K</span>
                    </button>

                    {/* Env badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'var(--secondary)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', boxShadow: '0 0 0 2px #16a34a30' }} />
                        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)', ...mono }}>Production</span>
                    </div>

                    {/* Dark mode */}
                    <button onClick={() => setDark(d => !d)} title={dark ? "Light mode" : "Dark mode"} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--muted-foreground)', transition: 'all 0.2s' }}>
                        {dark ? <Sun size={14} /> : <Moon size={14} />}
                    </button>

                    {/* User menu */}
                    <div ref={userMenuRef} style={{ position: 'relative' }}>
                        <button onClick={() => setUserMenuOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px 4px 4px', background: userMenuOpen ? 'var(--secondary)' : 'transparent', border: '1px solid', borderColor: userMenuOpen ? 'var(--border)' : 'transparent', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'DM Sans', system-ui" }}>
                            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900, color: 'var(--background)' }}>
                                {(user.name || user.email || "A").charAt(0).toUpperCase()}
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.2 }}>{user.name || user.email}</p>
                                <p style={{ fontSize: '9px', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em', ...mono }}>Admin</p>
                            </div>
                        </button>

                        {userMenuOpen && (
                            <div style={{ position: 'absolute', top: '40px', right: 0, width: '220px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 100, animation: 'fade-in 0.15s ease-out' }}>
                                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--secondary)' }}>
                                    <p style={{ fontSize: '13px', fontWeight: 800 }}>{user.name || user.email}</p>
                                    <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontWeight: 500 }}>{user.email}</p>
                                </div>
                                <div style={{ padding: '6px' }}>
                                    {[
                                        { icon: User, label: 'Profile', action: () => setUserMenuOpen(false) },
                                        { icon: Settings, label: 'Settings', action: () => { navigate('/settings'); setUserMenuOpen(false); } },
                                    ].map(item => (
                                        <button key={item.label} onClick={item.action} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '6px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', fontFamily: "'DM Sans', system-ui", textAlign: 'left' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--secondary)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <item.icon size={14} style={{ color: 'var(--muted-foreground)' }} /> {item.label}
                                        </button>
                                    ))}
                                    <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                                    <button onClick={() => { logout(); setUserMenuOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '6px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#dc2626', fontFamily: "'DM Sans', system-ui", textAlign: 'left' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <LogOut size={14} /> Sign out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* Global Search Modal */}
                {searchOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh', backdropFilter: 'blur(4px)' }}
                        onClick={(e) => { if (e.target === e.currentTarget) { setSearchOpen(false); setSearchVal(''); } }}>
                        <div style={{ width: '560px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', animation: 'fade-in 0.15s ease-out' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                                <Search size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                                <input ref={searchRef} value={searchVal} onChange={e => setSearchVal(e.target.value)} placeholder="Search pages, modules..." style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', fontFamily: "'DM Sans', system-ui" }} />
                                <button onClick={() => { setSearchOpen(false); setSearchVal(''); }} style={{ fontSize: '10px', ...mono, color: 'var(--muted-foreground)', background: 'var(--secondary)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}>ESC</button>
                            </div>
                            <div style={{ padding: '8px', maxHeight: '360px', overflowY: 'auto' }}>
                                {filtered.length === 0 ? (
                                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '13px', fontWeight: 600 }}>No results found</div>
                                ) : filtered.map(route => (
                                    <button key={route.path} onClick={() => { navigate(route.path); setSearchOpen(false); setSearchVal(''); }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s', fontFamily: "'DM Sans', system-ui" }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--secondary)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--foreground)' }}>{route.label.charAt(0)}</span>
                                            </div>
                                            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)' }}>{route.label}</span>
                                        </div>
                                        {route.parent && <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', ...mono }}>{route.parent}</span>}
                                    </button>
                                ))}
                            </div>
                            <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', background: 'var(--secondary)', display: 'flex', gap: '16px' }}>
                                {[['↵', 'select'], ['↑↓', 'navigate'], ['esc', 'close']].map(([key, desc]) => (
                                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ padding: '2px 5px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '10px', fontWeight: 800, ...mono }}>{key}</span>
                                        <span style={{ fontSize: '10px', color: 'var(--muted-foreground)', fontWeight: 600 }}>{desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '28px 32px', overflowX: 'hidden', maxWidth: '1400px', width: '100%' }}>
                    <Outlet />
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
