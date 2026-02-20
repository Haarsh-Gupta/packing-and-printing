"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Twitter, Instagram, Linkedin, Mail, MapPin } from "lucide-react";

import { useAlert } from "@/components/CustomAlert";

export default function Footer() {
  const { showAlert } = useAlert();

  return (
    <footer className="bg-black border-t-4 border-black mt-auto z-10 relative text-white">

      {/* 1. Bold Newsletter CTA Section */}
      <div className="border-b-4 border-white bg-[#fdf567] px-4 py-12 md:py-16">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl text-center lg:text-left">
            <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-black">
              Join the Press Club.
            </h3>
            <p className="text-zinc-800 font-bold text-lg md:text-xl">
              Subscribe for exclusive print discounts, packaging trends, and early access to new materials.
            </p>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); showAlert("Subscribed!", "success"); }}
            className="w-full lg:w-auto flex flex-col sm:flex-row gap-4"
          >
            <Input
              type="email"
              placeholder="Enter your email address"
              className="border-4 border-black rounded-none h-16 text-lg px-6 md:w-96 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 focus-visible:shadow-none transition-all bg-white text-black"
              required
            />
            <Button className="h-16 px-8 bg-black text-white text-lg font-black uppercase rounded-none border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all">
              Subscribe <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </form>
        </div>
      </div>

      {/* 2. Main Footer Links Area */}
      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

        {/* Column 1: Brand & Socials */}
        <div className="space-y-8">
          <Link href="/" className="text-4xl font-black tracking-tighter inline-block text-white">
            BookBind.
          </Link>
          <p className="text-zinc-400 font-medium leading-relaxed text-lg">
            The ultimate platform for modern printing and packaging. We turn your digital designs into premium physical reality.
          </p>
          <div className="flex gap-4">
            {/* Brutalist Social Icons */}
            {[Twitter, Instagram, Linkedin, MapPin].map((Icon, idx) => (
              <a
                key={idx}
                href="#"
                className="h-14 w-14 border-4 border-white bg-black flex items-center justify-center hover:bg-[#fdf567] hover:text-black hover:border-black hover:-translate-y-1 transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] text-white"
              >
                <Icon className="h-6 w-6" />
              </a>
            ))}
          </div>
        </div>

        {/* Column 2: Products */}
        <div>
          <h4 className="font-black uppercase text-xl mb-6 text-white border-b-4 border-white pb-2 inline-block">Products</h4>
          <ul className="space-y-4 font-bold text-zinc-400 text-lg">
            <li><Link href="/products" className="hover:text-white hover:underline underline-offset-4">Custom Packaging</Link></li>
            <li><Link href="/products" className="hover:text-white hover:underline underline-offset-4">Corporate Diaries</Link></li>
            <li><Link href="/products" className="hover:text-white hover:underline underline-offset-4">Invoice Books</Link></li>
            <li><Link href="/services" className="hover:text-white hover:underline underline-offset-4">Pre-Press Services</Link></li>
          </ul>
        </div>

        {/* Column 3: Support */}
        <div>
          <h4 className="font-black uppercase text-xl mb-6 text-white border-b-4 border-white pb-2 inline-block">Support</h4>
          <ul className="space-y-4 font-bold text-zinc-400 text-lg">
            <li><Link href="/dashboard" className="hover:text-white hover:underline underline-offset-4">My Dashboard</Link></li>
            <li><Link href="/dashboard/inquiries" className="hover:text-white hover:underline underline-offset-4">Track Inquiries</Link></li>
            <li><Link href="/dashboard/support" className="hover:text-white hover:underline underline-offset-4">Help Desk / Tickets</Link></li>
            <li><Link href="/contact" className="hover:text-white hover:underline underline-offset-4">Contact Us</Link></li>
          </ul>
        </div>

        {/* Column 4: Company & Contact */}
        <div>
          <h4 className="font-black uppercase text-xl mb-6 text-white border-b-4 border-white pb-2 inline-block">Company</h4>
          <ul className="space-y-4 font-bold text-zinc-400 text-lg">
            <li><Link href="/about" className="hover:text-white hover:underline underline-offset-4">About Us</Link></li>
            <li><Link href="/terms" className="hover:text-white hover:underline underline-offset-4">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-white hover:underline underline-offset-4">Privacy Policy</Link></li>
            <li className="pt-4">
              <a href="mailto:hello@bookbind.com" className="inline-flex items-center text-black hover:underline underline-offset-4 bg-white p-2 border-2 border-white hover:bg-[#fdf567] hover:border-black transition-colors">
                <Mail className="h-5 w-5 mr-3" /> hello@bookbind.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* 3. Bottom Bar */}
      <div className="border-t-4 border-white bg-black py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 font-bold text-sm uppercase tracking-wider text-zinc-400">
          <p>© {new Date().getFullYear()} BookBind Printing & Packaging.</p>
          <p>Built with precision in Delhi.</p>
        </div>
      </div>
    </footer>
  );
}