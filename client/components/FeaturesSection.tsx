"use client";

import Link from "next/link";
import { ArrowUpRight, Package, BookOpen, Printer, PenTool, Layers } from "lucide-react";

const features = [
  {
    title: "Custom Packaging",
    description: "From rigid boxes to corrugated mailers, we design and produce packaging that makes your brand pop on the shelf.",
    icon: <Package className="h-8 w-8" />,
    color: "#FF90E8",
    href: "/products"
  },
  {
    title: "Book Binding",
    description: "Perfect binding, saddle-stitching, or premium hardbound covers with gold foil stamping — we do it all.",
    icon: <BookOpen className="h-8 w-8" />,
    color: "#90E8FF",
    href: "/products"
  },
  {
    title: "Offset Printing",
    description: "High-volume catalogs, magazines, and marketing materials with color consistency across thousands of copies.",
    icon: <Printer className="h-8 w-8" />,
    color: "#FDF567",
    href: "/products"
  },
  {
    title: "Pre-Press Design",
    description: "Upload your raw files. Our team will fix bleed margins, review vectors, and make them 100% print-ready.",
    icon: <PenTool className="h-8 w-8" />,
    color: "#B8FF90",
    href: "/services"
  },
  {
    title: "Premium Finishing",
    description: "Elevate with spot UV, embossing, debossing, matte/gloss lamination, and metallic foil stamping.",
    icon: <Layers className="h-8 w-8" />,
    color: "#FFB890",
    href: "/services"
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-16 px-6 bg-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto">

        {/* Section Header */}
        <div className="mb-12 space-y-3">
          <div className="inline-block bg-[#90e8ff] text-black px-4 py-2 font-black text-sm uppercase tracking-widest border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-1">
            Capabilities
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-black leading-[0.9]">
            Sell anything.<br />
            <span className="text-zinc-400">We print everything.</span>
          </h2>
          <p className="text-base text-zinc-600 max-w-2xl font-medium">
            Whatever your business needs — from a single prototype to a million copies — we&apos;ve got you covered.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <Link
              key={idx}
              href={feature.href}
              className="group block"
            >
              <div
                className="h-full border-3 border-black p-6 transition-all duration-200 hover:-translate-y-2 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-xl"
                style={{ backgroundColor: feature.color }}
              >
                {/* Icon */}
                <div className="w-12 h-12 bg-white border-3 border-black rounded-full flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-300">
                  {feature.icon}
                </div>

                {/* Content */}
                <h3 className="text-lg font-black uppercase tracking-tight mb-2 text-black leading-tight">
                  {feature.title}
                </h3>
                <p className="text-black/70 font-medium text-sm leading-relaxed mb-4">
                  {feature.description}
                </p>

                {/* Arrow */}
                <div className="flex items-center gap-2 font-bold text-black text-sm uppercase tracking-wider">
                  <span>Explore</span>
                  <ArrowUpRight className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}