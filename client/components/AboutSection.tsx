import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function AboutSection() {
  return (
    <section className="py-24 px-4 bg-white border-t-2 border-black overflow-hidden">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 md:gap-24 items-center">
        
        {/* Left Content - The Story */}
        <div className="space-y-8">
          <div className="inline-block bg-zinc-100 px-4 py-2 border-2 border-black font-bold uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Who We Are
          </div>
          
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[1.1]">
            Modernizing the traditional printing press.
          </h2>
          
          <p className="text-xl text-zinc-600 leading-relaxed">
            BookBind was born out of a simple frustration: getting custom, high-quality printing shouldn't require endless emails and confusing pricing. We have combined state-of-the-art production facilities with a seamless digital platform.
          </p>
          
          <ul className="space-y-4 pt-2">
            {[
              'Premium quality inks and materials', 
              'Transparent quoted pricing system', 
              'End-to-end custom fulfillment'
            ].map((item, i) => (
              <li key={i} className="flex items-center text-lg font-bold text-zinc-800">
                <CheckCircle2 className="h-6 w-6 mr-3 text-black shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          <Button size="lg" className="bg-black text-white rounded-none border-2 border-black hover:bg-zinc-800 text-lg h-14 px-8 mt-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all" asChild>
            <Link href="/about">
              Read Our Full Story <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>

        {/* Right Content - Visual & Floating Stats */}
        <div className="relative mt-12 md:mt-0">
          
          {/* Main Brutalist Image Frame */}
          <div className="border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-zinc-100 overflow-hidden aspect-square md:aspect-[4/5] relative z-10">
            {/* Using a high-quality printing press image. It starts grayscale and gains color on hover! */}
            <img 
              src="https://images.unsplash.com/photo-1562664377-709f2c337eb2?q=80&w=800&auto=format&fit=crop" 
              alt="Printing Press in Action" 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
            />
          </div>

          {/* Floating Stat Card 1 (Bottom Left) */}
          <div className="absolute -bottom-6 -left-6 md:-left-12 bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-20 hover:-translate-y-2 transition-transform">
            <div className="text-4xl md:text-5xl font-black">10+</div>
            <div className="text-sm font-bold uppercase text-zinc-600 mt-1">Years of Craft</div>
          </div>
          
          {/* Floating Stat Card 2 (Top Right) */}
          {/* Added a pop of yellow to break up the monochrome palette */}
          <div className="absolute -top-6 -right-6 md:-right-12 bg-[#fdf567] border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-20 hidden sm:block hover:-translate-y-2 transition-transform">
            <div className="text-4xl md:text-5xl font-black">1M+</div>
            <div className="text-sm font-bold uppercase text-zinc-800 mt-1">Prints Delivered</div>
          </div>
          
        </div>

      </div>
    </section>
  );
}