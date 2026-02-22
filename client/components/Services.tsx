"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Printer, PenTool, Package, Truck, BookOpen, Layers, ArrowRight } from "lucide-react";

const services = [
  {
    icon: <Printer className="h-10 w-10" />,
    title: "High-Volume Offset Printing",
    description: "Ideal for massive runs of catalogs, magazines, and marketing materials. Color consistency across thousands of copies.",
    color: "#FF90E8"
  },
  {
    icon: <Package className="h-10 w-10" />,
    title: "Custom Structural Packaging",
    description: "Die-cutting, custom molds, and structural design for rigid boxes, corrugated mailers, and product packaging.",
    color: "#90E8FF"
  },
  {
    icon: <BookOpen className="h-10 w-10" />,
    title: "Professional Book Binding",
    description: "Perfect binding for reports, saddle-stitching for zines, and premium hardbound covers with gold foil stamping.",
    color: "#FDF567"
  },
  {
    icon: <PenTool className="h-10 w-10" />,
    title: "Pre-Press & Design Support",
    description: "Upload your raw files. Our pre-press team will review vectors, fix bleed margins, and ensure they're print-ready.",
    color: "#B8FF90"
  },
  {
    icon: <Layers className="h-10 w-10" />,
    title: "Premium Finishings",
    description: "Spot UV coating, embossing, debossing, matte/gloss lamination, and metallic foil stamping to elevate your brand.",
    color: "#FFB890"
  },
  {
    icon: <Truck className="h-10 w-10" />,
    title: "Fulfillment & Drop-shipping",
    description: "We don't just print — we pack and ship. Split your bulk order to multiple locations or ship directly to customers.",
    color: "#FF90E8"
  }
];

export default function ServicesPage() {
  return (
    <div className="bg-white pt-16 pb-24 px-6">
      <div className="max-w-6xl mx-auto space-y-24">

        {/* Page Header */}
        <div className="space-y-6 max-w-4xl mx-auto text-center">
          <div className="inline-block bg-[#ff90e8] text-black px-4 py-2 font-black text-sm uppercase tracking-widest border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-2 rounded-full">
            Professional Printing
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-black leading-[0.85]">
            We Print <span className="bg-[#fdf567] px-3 inline-block -rotate-1">Everything.</span>
          </h1>
          <p className="text-xl md:text-2xl text-black/60 font-medium max-w-2xl mx-auto">
            Beyond standard products, we provide end-to-end commercial printing capabilities. From structural design to final delivery.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, idx) => (
            <div
              key={idx}
              className="border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 flex flex-col group overflow-hidden"
              style={{ backgroundColor: service.color }}
            >
              <div className="p-8 border-b-4 border-black">
                <div className="bg-white border-4 border-black w-16 h-16 flex items-center justify-center rounded-full mb-5 group-hover:rotate-12 transition-transform text-black">
                  {service.icon}
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight leading-tight text-black">
                  {service.title}
                </h3>
              </div>
              <div className="p-8 flex-grow">
                <p className="text-black/70 font-medium text-base leading-relaxed">
                  {service.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center space-y-8 border-4 border-black bg-[#fdf567] p-12 md:p-16 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-black leading-[0.9]">
            Have a complex print job?
          </h2>
          <p className="text-xl font-medium text-black/60 max-w-2xl mx-auto">
            Select a product to start your inquiry. Upload files, add custom requirements, and chat with our team in the order thread.
          </p>
          <Button
            size="lg"
            className="bg-black text-white rounded-full border-4 border-black text-xl h-16 px-10 hover:bg-[#FF90E8] hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] cursor-pointer"
            asChild
          >
            <Link href="/products">
              Start New Inquiry <ArrowRight className="ml-2 h-6 w-6" />
            </Link>
          </Button>
        </div>

      </div>
    </div>
  );
}