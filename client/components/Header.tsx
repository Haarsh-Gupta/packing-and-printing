"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { User, Menu, X, ShoppingCart } from "lucide-react";
import NotificationsBell from "@/components/NotificationsBell";
import InquiryCartSidebar from "@/components/InquiryCartSidebar";
import MegaMenu from "@/components/MegaMenu";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

export default function Header() {
  const { user, isLoggedIn } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchMenuData = async () => {
    if (hasFetched || isLoading) return;
    
    setIsLoading(true);
    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const [p, s] = await Promise.all([
            fetch(`${baseUrl}/products?_t=${Date.now()}`)
                .then(r => r.ok ? r.json() : [])
                .catch(e => { console.warn("Failed to fetch products:", e.message); return []; }),
            fetch(`${baseUrl}/services?_t=${Date.now()}`)
                .then(r => r.ok ? r.json() : [])
                .catch(e => { console.warn("Failed to fetch services:", e.message); return []; })
        ]);
        setProducts(Array.isArray(p) ? p : []);
        setServices(Array.isArray(s) ? s : []);
        setHasFetched(true);
    } catch (err) {
        console.error("Header fetch error", err);
    } finally {
        setIsLoading(false);
    }
  };


  if (pathname && pathname.startsWith("/dashboard")) {
    return null;
  }

  return (
    <header
      className={`sticky top-0 z-[100] bg-black transition-all duration-300 ${isScrolled
        ? 'shadow-[0_4px_20px_rgba(0,0,0,0.3)] border-b border-white/10'
        : 'border-b border-transparent'
        }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo - Left aligned */}
        <div className="flex-1 flex justify-start">
          <Link href="/" className="text-xl font-black tracking-tighter text-white hover:text-white transition-colors flex items-center">
            NavArt<span className="text-[#FF90E8]">.</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav 
            className="hidden md:flex gap-10 font-bold text-[13px] uppercase tracking-widest text-white/70 h-full items-center"
            onMouseEnter={fetchMenuData}
        >
          <MegaMenu title="Catalog" href="/products" items={products} type="product" />
          <MegaMenu title="Services" href="/services" items={services} type="service" />
          <Link href="/quote" className="hover:text-[#FF90E8] transition-colors">Quote</Link>
          <Link href="/#how-it-works" className="hover:text-[#FF90E8] transition-colors">Process</Link>
          <Link href="/#about" className="hover:text-[#FF90E8] transition-colors">About</Link>
        </nav>

        {/* Desktop Actions - Right aligned */}
        <div className="hidden md:flex flex-1 justify-end items-center gap-5">
          <InquiryCartSidebar />

          {isLoggedIn ? (
            <>
              <NotificationsBell />

              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="h-9 w-9 bg-[#FF90E8] rounded-full flex items-center justify-center border-2 border-white/20 hover:border-[#FF90E8] hover:scale-110 transition-all text-black overflow-hidden relative shadow-neubrutalism-sm">
                  {user?.profile_picture ? (
                    <img src={user.profile_picture} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                asChild
                className="text-white/80 hover:text-white hover:bg-white/5 text-[12px] font-bold uppercase tracking-wider cursor-pointer h-9"
              >
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button
                asChild
                className="bg-[#FF90E8] text-black text-[12px] font-black uppercase tracking-widest rounded-full border-2 border-[#FF90E8] px-6 h-9 hover:bg-white hover:border-white hover:text-black transition-all cursor-pointer"
              >
                <Link href="/auth/signup">Sign up</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Actions */}
        <div className="md:hidden flex items-center gap-4 text-white">
          <InquiryCartSidebar />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-black p-6 flex flex-col gap-4 absolute w-full left-0 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] max-h-[80vh] overflow-y-auto">
          
          <Link href="/products" className="text-lg font-bold uppercase tracking-wider hover:text-[#FF90E8] text-white/80 py-2 border-b border-white/5" onClick={() => setIsMobileMenuOpen(false)}>
            Catalog
          </Link>

          <Link href="/services" className="text-lg font-bold uppercase tracking-wider hover:text-[#FF90E8] text-white/80 py-2 border-b border-white/5" onClick={() => setIsMobileMenuOpen(false)}>
            Services
          </Link>

          <Link href="/quote" className="text-lg font-bold uppercase tracking-wider hover:text-[#FF90E8] text-white/80" onClick={() => setIsMobileMenuOpen(false)}>Quote</Link>
          <Link href="/#how-it-works" className="text-lg font-bold uppercase tracking-wider hover:text-[#FF90E8] text-white/80" onClick={() => setIsMobileMenuOpen(false)}>How it works</Link>
          <Link href="/#about" className="text-lg font-bold uppercase tracking-wider hover:text-[#FF90E8] text-white/80" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
          
          <div className="h-px bg-white/10 my-2" />
          
          {isLoggedIn ? (
            <div className="flex flex-col gap-4">
              <Link href="/dashboard" className="flex items-center gap-3 text-lg font-bold hover:text-[#FF90E8] text-white" onClick={() => setIsMobileMenuOpen(false)}>
                <div className="h-10 w-10 bg-[#FF90E8] rounded-full flex items-center justify-center border-2 border-white/20 text-black overflow-hidden relative">
                  {user?.profile_picture ? (
                    <img src={user.profile_picture} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                My Dashboard
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pt-2">
              <Link href="/auth/login" className="text-lg font-bold uppercase tracking-wider hover:text-[#FF90E8] text-white" onClick={() => setIsMobileMenuOpen(false)}>Log in</Link>
              <Button
                asChild
                className="bg-[#FF90E8] text-black text-lg font-black uppercase rounded-full border-2 border-[#FF90E8] h-12 hover:bg-white hover:border-white transition-all cursor-pointer"
              >
                <Link href="/auth/signup" onClick={() => setIsMobileMenuOpen(false)}>Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}