import { Button } from "@/components/ui/button";
import { ArrowRight, Package, Printer } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h1 className="text-6xl md:text-7xl font-black leading-none tracking-tight">
            PRINTING <br /> 
            <span className="text-zinc-400">MADE SIMPLE.</span>
          </h1>
          <p className="text-xl text-zinc-600 max-w-lg">
            Custom packaging and high-quality printing solutions for your business. From invoices to brand boxes, we bind it all.
          </p>
          <div className="flex gap-4 pt-4">
            <Button size="lg" className="bg-black text-white h-14 px-8 text-lg" asChild>
              <Link href="/products">
                Explore Products <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Visual Element: Neo-brutalist cards */}
        <div className="relative">
          <div className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rotate-2 hover:rotate-0 transition-transform">
            <div className="flex gap-4 mb-4">
              <Printer size={40} className="text-black" />
              <Package size={40} className="text-zinc-400" />
            </div>
            <h3 className="text-2xl font-bold">Premium Packaging</h3>
            <p className="text-zinc-500">Customized to fit your brand identity.</p>
          </div>
          {/* Mock Notion-style avatar floating */}
          <img 
            src="https://api.dicebear.com/7.x/notionists/svg?seed=Harsh&backgroundColor=ffffff" 
            className="absolute -top-10 -right-5 w-24 h-24 border-2 border-black rounded-full bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            alt="User"
          />
        </div>
      </div>
    </section>
  );
}