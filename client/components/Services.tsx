import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, PenTool, Package, Truck, BookOpen, Layers, ArrowRight } from "lucide-react";

const services = [
  {
    icon: <Printer className="h-10 w-10 mb-4 text-black" />,
    title: "High-Volume Offset Printing",
    description: "Ideal for massive runs of catalogs, magazines, and marketing materials. We guarantee color consistency and crisp details across thousands of copies."
  },
  {
    icon: <Package className="h-10 w-10 mb-4 text-black" />,
    title: "Custom Structural Packaging",
    description: "Need a unique box shape? We offer die-cutting, custom molds, and structural design for rigid boxes, corrugated mailers, and product packaging."
  },
  {
    icon: <BookOpen className="h-10 w-10 mb-4 text-black" />,
    title: "Professional Book Binding",
    description: "From perfect binding for corporate reports to saddle-stitching for zines and premium hardbound covers with gold foil stamping."
  },
  {
    icon: <PenTool className="h-10 w-10 mb-4 text-black" />,
    title: "Pre-Press & Design Support",
    description: "Upload your raw .cdr, .ai, or .pdf files. Our pre-press team will review your vectors, fix bleed margins, and ensure they are 100% print-ready."
  },
  {
    icon: <Layers className="h-10 w-10 mb-4 text-black" />,
    title: "Premium Finishings",
    description: "Elevate your brand with spot UV coating, embossing, debossing, matte/gloss lamination, and metallic foil stamping."
  },
  {
    icon: <Truck className="h-10 w-10 mb-4 text-black" />,
    title: "Fulfillment & Drop-shipping",
    description: "We don't just print; we pack and ship. We can split your bulk order and ship it directly to your different franchise locations or customers."
  }
];

const processSteps = [
  { step: "01", title: "Submit Inquiry", desc: "Choose your specs and upload your design files." },
  { step: "02", title: "Get Official Quote", desc: "Our admins review your request and set a final price." },
  { step: "03", title: "Accept & Pay", desc: "Approve the quote and make a secure payment." },
  { step: "04", title: "Production", desc: "Your job hits the press. Track progress live." },
  { step: "05", title: "Delivery", desc: "Receive your premium printed goods at your doorstep." },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-slate-50 pt-16 pb-24 px-4">
      <div className="max-w-7xl mx-auto space-y-24">
        
        {/* Page Header */}
        <div className="space-y-6 max-w-3xl text-center mx-auto">
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase text-black">
            Our <span className="text-zinc-400">Services</span>
          </h1>
          <p className="text-xl text-zinc-600 leading-relaxed">
            Beyond standard products, we provide end-to-end commercial printing capabilities. From structural design to final delivery, BookBind is your production partner.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, idx) => (
            <Card 
              key={idx} 
              className="border-2 border-black rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 bg-white flex flex-col"
            >
              <CardHeader>
                {service.icon}
                <CardTitle className="text-2xl font-bold uppercase">{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow text-zinc-600 text-lg">
                {service.description}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How It Works Section */}
        <div className="bg-black text-white p-8 md:p-16 border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] relative overflow-hidden">
          {/* Background decorative element */}
          <div className="absolute -top-24 -right-24 text-zinc-800 opacity-20">
            <Printer size={400} />
          </div>

          <div className="relative z-10">
            <h2 className="text-4xl font-black uppercase mb-12">How the Process Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {processSteps.map((item, idx) => (
                <div key={idx} className="space-y-4 relative">
                  <div className="text-5xl font-black text-zinc-700">{item.step}</div>
                  <h3 className="text-xl font-bold uppercase">{item.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
                  
                  {/* Visual connector line for desktop */}
                  {idx !== processSteps.length - 1 && (
                    <div className="hidden md:block absolute top-6 -right-4 w-8 border-t-2 border-dashed border-zinc-700"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center space-y-8 border-2 border-black bg-white p-12 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-3xl font-black uppercase">Have a complex print job?</h2>
          <p className="text-lg text-zinc-600 max-w-xl mx-auto">
            Upload your vector files and tell us exactly what you need. Our team will review your requirements and provide a custom quote within 24 hours.
          </p>
          <Button size="lg" className="bg-black text-white rounded-none border-2 border-black text-lg h-14 px-8 hover:bg-zinc-800" asChild>
            <Link href="/inquiry/custom">
              Request Custom Quote <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>

      </div>
    </div>
  );
}