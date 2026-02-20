import Link from "next/link";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export default function ContactPage() {
    return (
        <main className="max-w-5xl mx-auto px-4 py-16 space-y-12">
            <div className="text-center space-y-4">
                <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter">Contact Us</h1>
                <p className="text-xl text-zinc-500 font-bold max-w-xl mx-auto">
                    Have questions about printing, packaging, or an existing order? We&apos;re here to help.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Contact Info Cards */}
                <div className="space-y-6">
                    {[
                        { icon: Mail, label: "Email", value: "hello@bookbind.com", href: "mailto:hello@bookbind.com", color: "bg-[#fdf567]" },
                        { icon: Phone, label: "Phone", value: "+91 98765 43210", href: "tel:+919876543210", color: "bg-[#4be794]" },
                        { icon: MapPin, label: "Address", value: "BookBind HQ, Sector 62, Noida, UP 201301", href: "#", color: "bg-[#90e8ff]" },
                        { icon: Clock, label: "Working Hours", value: "Mon – Sat, 9:00 AM – 7:00 PM IST", href: "#", color: "bg-[#ff90e8]" },
                    ].map((item) => (
                        <a key={item.label} href={item.href} className={`${item.color} border-4 border-black p-6 flex items-center gap-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all`}>
                            <div className="h-14 w-14 bg-black text-white flex items-center justify-center shrink-0">
                                <item.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-zinc-700">{item.label}</p>
                                <p className="font-black text-lg">{item.value}</p>
                            </div>
                        </a>
                    ))}
                </div>

                {/* Quick Support CTA */}
                <div className="border-4 border-black p-8 bg-zinc-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center space-y-6">
                    <h2 className="text-3xl font-black uppercase tracking-tight">Need faster support?</h2>
                    <p className="text-zinc-600 font-bold text-lg">
                        Log into your dashboard and open a support ticket — our team typically responds within 2 hours during business hours.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Link href="/dashboard/support" className="inline-block bg-black text-white font-black uppercase px-8 py-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#fdf567] hover:text-black hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all">
                            Open a Ticket
                        </Link>
                        <Link href="/dashboard" className="inline-block bg-white text-black font-black uppercase px-8 py-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all">
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
