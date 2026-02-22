"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github, Twitter, Instagram, Linkedin, Mail } from "lucide-react";

import { useAlert } from "@/components/CustomAlert";

export default function Footer() {
  const { showAlert } = useAlert();

  return (
    <footer className="bg-black mt-auto z-10 relative text-white">

      {/* Newsletter CTA */}
      <div className="border-b-4 border-zinc-800 bg-[#FF90E8] px-6 py-14 md:py-20">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="max-w-2xl text-center lg:text-left">
            <h3 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-black leading-[0.9]">
              Join the Press Club.
            </h3>
            <p className="text-black/70 font-bold text-lg md:text-xl">
              Subscribe for exclusive print discounts, packaging trends, and early access to new materials.
            </p>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); showAlert("Subscribed!", "success"); }}
            className="w-full lg:w-auto flex flex-col sm:flex-row gap-4"
          >
            <Input
              type="email"
              placeholder="you@company.com"
              className="border-4 border-black rounded-full h-14 text-base px-6 md:w-80 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 focus-visible:shadow-none transition-all bg-white text-black"
              required
            />
            <Button className="h-14 px-8 bg-black text-white text-base font-bold rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] transition-all cursor-pointer">
              Subscribe <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

        {/* Col 1: Brand */}
        <div className="space-y-6">
          <Link href="/" className="text-3xl font-black tracking-tighter inline-block text-white">
            BookBind.
          </Link>
          <p className="text-zinc-500 font-medium leading-relaxed">
            The ultimate platform for modern printing and packaging. We turn your digital designs into premium physical reality.
          </p>
          <div className="flex gap-3">
            {[Twitter, Instagram, Linkedin].map((Icon, idx) => (
              <a
                key={idx}
                href="#"
                className="h-12 w-12 border-3 border-zinc-700 rounded-full flex items-center justify-center hover:bg-[#FF90E8] hover:text-black hover:border-black transition-all text-zinc-500"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Col 2: Products */}
        <div>
          <h4 className="font-black uppercase text-sm tracking-widest mb-6 text-white">Products</h4>
          <ul className="space-y-3 font-medium text-zinc-500">
            <li><Link href="/products" className="hover:text-[#FF90E8] transition-colors">Custom Packaging</Link></li>
            <li><Link href="/products" className="hover:text-[#FF90E8] transition-colors">Corporate Diaries</Link></li>
            <li><Link href="/products" className="hover:text-[#FF90E8] transition-colors">Invoice Books</Link></li>
            <li><Link href="/services" className="hover:text-[#FF90E8] transition-colors">Pre-Press Services</Link></li>
          </ul>
        </div>

        {/* Col 3: Support */}
        <div>
          <h4 className="font-black uppercase text-sm tracking-widest mb-6 text-white">Support</h4>
          <ul className="space-y-3 font-medium text-zinc-500">
            <li><Link href="/dashboard" className="hover:text-[#FF90E8] transition-colors">My Dashboard</Link></li>
            <li><Link href="/dashboard/inquiries" className="hover:text-[#FF90E8] transition-colors">Track Inquiries</Link></li>
            <li><Link href="/dashboard/support" className="hover:text-[#FF90E8] transition-colors">Help Desk</Link></li>
            <li><Link href="/contact" className="hover:text-[#FF90E8] transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        {/* Col 4: Company */}
        <div>
          <h4 className="font-black uppercase text-sm tracking-widest mb-6 text-white">Company</h4>
          <ul className="space-y-3 font-medium text-zinc-500">
            <li><Link href="/about" className="hover:text-[#FF90E8] transition-colors">About Us</Link></li>
            <li><Link href="/terms" className="hover:text-[#FF90E8] transition-colors">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-[#FF90E8] transition-colors">Privacy Policy</Link></li>
            <li className="pt-2">
              <a href="mailto:hello@bookbind.com" className="inline-flex items-center text-white hover:text-[#FF90E8] transition-colors font-bold">
                <Mail className="h-4 w-4 mr-2" /> hello@bookbind.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-zinc-800 py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-600">
          <p>© {new Date().getFullYear()} BookBind Printing & Packaging.</p>
          <p>Built with precision in Delhi.</p>
        </div>
      </div>
    </footer>
  );
}