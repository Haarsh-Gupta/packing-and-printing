import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t-2 border-black bg-[#d2d9f7] mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-4 gap-8">
        <div className="col-span-2">
          <div className="text-xl font-black mb-4">BookBind.</div>
          <p className="text-zinc-500 max-w-xs">
            The ultimate platform for printing and packaging inquiries, orders, and professional invoicing.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-4 uppercase text-sm tracking-widest">Support</h4>
          <ul className="space-y-2 text-zinc-600 text-sm">
            <li><Link href="/tickets">Help Desk</Link></li>
            <li><Link href="/contact">Contact Us</Link></li>
            <li><Link href="/faq">FAQs</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4 uppercase text-sm tracking-widest">Company</h4>
          <ul className="space-y-2 text-zinc-600 text-sm">
            <li><Link href="/terms">Terms of Service</Link></li>
            <li><Link href="/privacy">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} BookBind Printing & Packaging. All rights reserved.
      </div>
    </footer>
  );
}