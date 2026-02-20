"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { User, Menu, X } from "lucide-react";
import NotificationsBell from "@/components/NotificationsBell";

interface UserData {
  name: string;
  profile_picture: string | null;
}

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuthAndFetch();

    // Listen for updates from Settings page
    const handleUserUpdate = () => checkAuthAndFetch();
    window.addEventListener("user-updated", handleUserUpdate);

    return () => {
      window.removeEventListener("user-updated", handleUserUpdate);
    };
  }, []);

  const checkAuthAndFetch = async () => {
    const token = localStorage.getItem("access_token");
    setIsLoggedIn(!!token);

    if (token) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUserData(data);
        }
      } catch (e) {
        console.error("Failed to fetch user in header", e);
      }
    } else {
      setUserData(null);
    }
  };

  return (
    <header className="border-b-4 border-white bg-black text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-3xl font-black tracking-tighter hover:text-zinc-300 transition-colors">
          BookBind.
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6 font-bold text-lg">
          <Link href="/products" className="hover:text-[#fdf567] hover:underline underline-offset-4 transition-all">Products</Link>
          <Link href="/services" className="hover:text-[#fdf567] hover:underline underline-offset-4 transition-all">Services</Link>
          <Link href="/#how-it-works" className="hover:text-[#fdf567] hover:underline underline-offset-4 transition-all">How it works</Link>
          <Link href="/#about" className="hover:text-[#fdf567] hover:underline underline-offset-4 transition-all">About</Link>
          <Link href="/#contact" className="hover:text-[#fdf567] hover:underline underline-offset-4 transition-all">Contact</Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-6">
          {isLoggedIn ? (
            <>
              <NotificationsBell />

              <Link href="/dashboard" className="flex items-center gap-3 pl-4 border-l-2 border-zinc-800">
                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center border-2 border-white hover:bg-[#fdf567] transition-colors text-black overflow-hidden relative">
                  {userData?.profile_picture ? (
                    <img src={userData.profile_picture} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="h-6 w-6" />
                  )}
                </div>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                asChild
                className="text-white hover:text-black hover:bg-white text-lg font-bold"
              >
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button
                asChild
                className="bg-[#fdf567] text-black text-lg font-black uppercase rounded-none border-2 border-transparent hover:border-white hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
              >
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t-2 border-zinc-800 bg-black p-4 flex flex-col gap-4 absolute w-full left-0 z-50 shadow-xl">
          <Link href="/products" className="text-xl font-bold hover:text-[#fdf567]" onClick={() => setIsMobileMenuOpen(false)}>Products</Link>
          <Link href="/services" className="text-xl font-bold hover:text-[#fdf567]" onClick={() => setIsMobileMenuOpen(false)}>Services</Link>
          <Link href="/#how-it-works" className="text-xl font-bold hover:text-[#fdf567]" onClick={() => setIsMobileMenuOpen(false)}>How it works</Link>
          <Link href="/#about" className="text-xl font-bold hover:text-[#fdf567]" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
          <Link href="/#contact" className="text-xl font-bold hover:text-[#fdf567]" onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
          <div className="h-px bg-zinc-800 my-2" />
          {isLoggedIn ? (
            <div className="flex flex-col gap-4">
              <Link href="/dashboard" className="flex items-center gap-3 text-xl font-bold hover:text-[#fdf567]">
                <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center border-white hover:bg-[#fdf567] text-black overflow-hidden relative">
                  {userData?.profile_picture ? (
                    <img src={userData.profile_picture} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                My Dashboard
              </Link>
              <div>
                <NotificationsBell />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Link href="/auth/login" className="text-xl font-bold hover:text-[#fdf567]">Sign In</Link>
              <Link href="/auth/signup" className="text-xl font-bold hover:text-[#fdf567]">Get Started</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}