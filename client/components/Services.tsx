"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, PenTool, Package, Truck, BookOpen, Layers, ArrowRight } from "lucide-react";

const services = [
  {
    icon: <Printer className="h-10 w-10 mb-4 text-black" />,
    title: "High-Volume Offset Printing",
    description: "Ideal for massive runs of catalogs, magazines, and marketing materials. We guarantee color consistency and crisp details across thousands of copies.",
    color: "bg-[#fdf567]"
  },
  {
    icon: <Package className="h-10 w-10 mb-4 text-black" />,
    title: "Custom Structural Packaging",
    description: "Need a unique box shape? We offer die-cutting, custom molds, and structural design for rigid boxes, corrugated mailers, and product packaging.",
    color: "bg-[#ff90e8]"
  },
  {
    icon: <BookOpen className="h-10 w-10 mb-4 text-black" />,
    title: "Professional Book Binding",
    description: "From perfect binding for corporate reports to saddle-stitching for zines and premium hardbound covers with gold foil stamping.",
    color: "bg-[#90e8ff]"
  },
  {
    icon: <PenTool className="h-10 w-10 mb-4 text-black" />,
    title: "Pre-Press & Design Support",
    description: "Upload your raw .cdr, .ai, or .pdf files. Our pre-press team will review your vectors, fix bleed margins, and ensure they are 100% print-ready.",
    color: "bg-white"
  },
  {
    icon: <Layers className="h-10 w-10 mb-4 text-black" />,
    title: "Premium Finishings",
    description: "Elevate your brand with spot UV coating, embossing, debossing, matte/gloss lamination, and metallic foil stamping.",
    color: "bg-[#fdf567]"
  },
  {
    icon: <Truck className="h-10 w-10 mb-4 text-black" />,
    title: "Fulfillment & Drop-shipping",
    description: "We don't just print; we pack and ship. We can split your bulk order and ship it directly to your different franchise locations or customers.",
    color: "bg-[#ff90e8]"
  }
];

const processSteps = [
  { step: "01", title: "Submit Inquiry", desc: "Choose your specs and upload your design files.", icon: <PenTool className="h-10 w-10 text-white" /> },
  { step: "02", title: "Get Official Quote", desc: "Our admins review your request and set a final price.", icon: <BookOpen className="h-10 w-10 text-white" /> },
  { step: "03", title: "Accept & Pay", desc: "Approve the quote and make a secure payment.", icon: <Layers className="h-10 w-10 text-white" /> },
  { step: "04", title: "Production", desc: "Your job hits the press. Track progress live.", icon: <Printer className="h-10 w-10 text-white" /> },
  { step: "05", title: "Delivery", desc: "Receive your premium printed goods at your doorstep.", icon: <Truck className="h-10 w-10 text-white" /> },
];



export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-zinc-50 pt-16 pb-24 px-4 font-sans">
      <div className="max-w-7xl mx-auto space-y-24">

        {/* Page Header */}
        <div className="space-y-6 max-w-4xl mx-auto text-center">
          <div className="inline-block bg-[#ff90e8] text-black px-4 py-2 font-black text-sm uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-2">
            Professional Printing
          </div>
          <h1 className="text-6xl md:text-7xl font-black tracking-tighter uppercase text-black leading-none">
            We Print <span className="bg-[#fdf567] px-2">Everything.</span>
          </h1>
          <p className="text-2xl text-black font-bold max-w-2xl mx-auto border-l-4 border-black pl-6 text-left md:text-center md:border-none md:pl-0">
            Beyond standard products, we provide end-to-end commercial printing capabilities. From structural design to final delivery.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, idx) => (
            <Card
              key={idx}
              className={`border-4 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 ${service.color} flex flex-col group`}
            >
              <CardHeader className="border-b-4 border-black pb-4">
                <div className="bg-white border-2 border-black w-16 h-16 flex items-center justify-center rounded-full mb-4 group-hover:rotate-12 transition-transform">
                  {service.icon}
                </div>
                <CardTitle className="text-3xl font-black uppercase tracking-tight leading-none">{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow pt-6">
                <p className="text-black font-medium text-lg leading-snug">
                  {service.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How It Works Section */}
        <div id="how-it-works" className="bg-black text-white p-8 md:p-16 border-4 border-black shadow-[12px_12px_0px_0px_#90e8ff] relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-block bg-[#90e8ff] text-black px-3 py-1 font-bold text-sm uppercase tracking-wider mb-6 rotate-1">
              Workflow
            </div>
            <h2 className="text-5xl md:text-6xl font-black uppercase mb-16 tracking-tighter">How It Works</h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
              {processSteps.map((item, idx) => (
                <div key={idx} className="space-y-4 relative group">

                  {/* Step Number & Icon */}
                  <div className="flex items-end gap-3 mb-2">
                    <div className="text-7xl font-black text-transparent stroke-text leading-none" style={{ WebkitTextStroke: "2px #fdf567" }}>
                      {item.step}
                    </div>
                    <div className="mb-2 transition-transform group-hover:scale-110 group-hover:-rotate-6 duration-300">
                      {item.icon}
                    </div>
                  </div>

                  <h3 className="text-2xl font-black uppercase bg-white text-black inline-block px-1 transform group-hover:-skew-x-12 transition-transform">{item.title}</h3>
                  <p className="text-zinc-300 font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div id="contact" className="text-center space-y-8 border-4 border-black bg-[#fdf567] p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight">Have a complex print job?</h2>
          <p className="text-xl font-bold max-w-2xl mx-auto">
            Select a product to start your inquiry. You can add custom requirements, upload files, and chat with our team directly in the order thread.
          </p>
          <Button size="lg" className="bg-black text-white rounded-none border-2 border-black text-xl h-16 px-10 hover:bg-white hover:text-black hover:scale-105 transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]" asChild>
            <Link href="/products">
              Start New Inquiry <ArrowRight className="ml-2 h-6 w-6" />
            </Link>
          </Button>
        </div>

      </div>
    </div>
  );
}