import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Data matching the services shown in your image
const features = [
  {
    id: "product-packaging",
    title: "Product Packaging",
    description: "Custom boxes and packaging solutions designed to make your brand stand out on the shelf.",
    image: "https://images.unsplash.com/photo-1606836591695-4d58a73eba1e?q=80&w=800&auto=format&fit=crop", // Replace with your actual image URLs
    href: "/products/product-packaging"
  },
  {
    id: "visiting-cards",
    title: "Visiting Cards",
    description: "Premium quality business cards with options for matte, gloss, and textured finishes.",
    image: "https://images.unsplash.com/photo-1589330694653-efa637bc901a?q=80&w=800&auto=format&fit=crop",
    href: "/products/visiting-cards"
  },
  {
    id: "catalogs",
    title: "Catalogs",
    description: "High-resolution printed catalogs to showcase your entire product range beautifully.",
    image: "https://images.unsplash.com/photo-1544390041-031f0a2ba1fc?q=80&w=800&auto=format&fit=crop",
    href: "/products/catalogs"
  },
  {
    id: "letterheads",
    title: "Letterheads",
    description: "Professional corporate letterheads printed on premium grade paper for official correspondence.",
    image: "https://images.unsplash.com/photo-1616628188506-4bf98a58cb0a?q=80&w=800&auto=format&fit=crop",
    href: "/products/letterheads"
  }
];

export default function FeaturesSection() {
  return (
    <section className="py-24 px-4 bg-slate-50 border-t-2 border-black">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header matching the image style */}
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-4 text-black">
            What We <span className="text-zinc-400">Print</span>
          </h2>
          <p className="text-lg text-zinc-600 max-w-2xl">
            Explore our comprehensive range of printing and packaging services tailored for your business needs.
          </p>
        </div>

        {/* 2x2 Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => (
            <Link key={feature.id} href={feature.href} className="group">
              <Card className="h-full border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden rounded-none bg-white">
                
                {/* Image Container */}
                <div className="aspect-[4/3] sm:aspect-[21/9] md:aspect-[16/9] w-full border-b-2 border-black overflow-hidden relative">
                   <img 
                    src={feature.image} 
                    alt={feature.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Content Container */}
                <CardContent className="p-6 flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-zinc-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-zinc-600">
                      {feature.description}
                    </p>
                  </div>
                  
                  {/* Arrow Icon that rotates on hover */}
                  <div className="bg-zinc-100 border-2 border-black p-3 shrink-0 group-hover:bg-black group-hover:text-white transition-colors duration-300">
                     <ArrowUpRight className="h-6 w-6 group-hover:rotate-45 transition-transform" />
                  </div>
                </CardContent>

              </Card>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}