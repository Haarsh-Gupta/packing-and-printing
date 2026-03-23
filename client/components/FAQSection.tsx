"use client";

import React, { useState } from "react";
import { Plus, Minus, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "What is your Minimum Order Quantity (MOQ)?",
    answer: "Our MOQ depends on the product type. For standard corrugated boxes, it's typically 100 units. For premium rigid boxes or custom-printed luxury packaging, it starts at 50 units. We offer special pricing for bulk orders over 1,000 units."
  },
  {
    question: "Can I get a physical sample before placing a bulk order?",
    answer: "Yes! We provide two types of samples: Digital Proofs (free with every order) and Physical Prototypes. For a small fee (refundable upon bulk order), we can ship a custom-made physical sample to your office to verify material quality and dimensions."
  },
  {
    question: "What is the typical turnaround time for custom orders?",
    answer: "Standard production takes 7-10 business days after digital proof approval. Shipping time depends on your location. Emergency 'Fast-Track' production (3-5 days) is available for an additional fee for specific materials."
  },
  {
    question: "Do you provide design assistance for packaging?",
    answer: "Absolutely. We offer two levels of service: 'Basic Check' (free), where we ensure your files are print-ready, and 'Full Structural Design' (paid), where our engineers help you create the perfect box template from scratch."
  },
  {
    question: "What printing technologies do you use?",
    answer: "We utilize Offset printing for large volume consistency, Digital printing for short-run speed, and UV/Silk-Screen for specialized finishes like gold foiling, embossing, and spot-UV textures."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 px-6" style={{ backgroundColor: 'var(--site-bg)' }} id="faq">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-zinc-500 font-medium text-lg">
            Find answers to common questions about our printing and packaging services.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index}
                className={`rounded-2xl border-2 transition-all duration-300 shadow-[2px_2px_0px_rgba(0,0,0,2)] ${isOpen ? 'bg-zinc-50 border-zinc-200' : 'bg-white border-black border-0 hover:shadow-[2px_2px_0px_rgba(0,0,0,0.04)]'}`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full text-left p-6 md:p-7 flex items-center justify-between group cursor-pointer"
                >
                  <span className="text-lg md:text-xl font-bold text-zinc-800 tracking-tight leading-tight">
                    {faq.question}
                  </span>
                  <div className={`shrink-0 p-2 rounded-full transition-all duration-300 ${isOpen ? 'bg-zinc-200 rotate-180' : 'bg-zinc-100 group-hover:bg-zinc-200'}`}>
                    {isOpen ? <Minus className="h-5 w-5 text-zinc-600" /> : <Plus className="h-5 w-5 text-zinc-500" />}
                  </div>
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-500 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="p-6 md:p-7 pt-0 font-medium text-zinc-600 leading-relaxed text-base md:text-lg">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
