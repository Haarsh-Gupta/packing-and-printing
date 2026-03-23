"use client";

import { WhatsAppIcon } from "./icons/WhatsAppIcon";
import Link from "next/link";

export default function WhatsAppWidget() {
  const phone = process.env.NEXT_PUBLIC_PHONE?.replace(/\s/g, "");
  const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || "NavArt";
  
  // Clean phone number for WhatsApp link (assuming India +91 if not specified)
  const cleanPhone = phone?.startsWith("91") ? phone : `91${phone}`;
  const message = `Hello ${companyName}, I'm interested in your printing and packaging services.`;
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  if (!phone) return null;

  return (
    <Link
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-[900] bg-[#25D366] text-white p-3 rounded-full shadow-[0_4px_20px_rgb(0,0,0,0.15)] border-2 border-black/10 hover:shadow-[0_8px_30px_rgba(37,211,102,0.4)] hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
      aria-label="Chat on WhatsApp"
    >
      {/* Gloss effect on hover */}
      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      
      {/* Tooltip - appears on hover */}
      <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-black text-white text-[10px] uppercase font-bold rounded border-2 border-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        Chat on WhatsApp
        {/* Tooltip Arrow */}
        <div className="absolute left-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-l-black" />
      </div>

      <div className="relative flex items-center justify-center">
        <WhatsAppIcon className="h-5 w-5" />
      </div>
    </Link>
  );
}
