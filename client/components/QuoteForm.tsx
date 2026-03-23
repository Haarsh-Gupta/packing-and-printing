"use client";

import React, { useState } from "react";
import { Package, FileText, Layout, ArrowRight, ArrowLeft, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  { id: 1, title: "Product" },
  { id: 2, title: "Details" },
  { id: 3, title: "Contact" }
];

const CATEGORIES = [
  { id: "packaging", name: "Custom Packaging", icon: Package, description: "Mailer boxes, shipping boxes, retail packaging." },
  { id: "printing", name: "Commercial Printing", icon: FileText, description: "Business cards, catalogs, brochures, stationery." },
  { id: "services", name: "Premium Services", icon: Layout, description: "Embossing, foil stamping, structural design." }
];

export default function QuoteForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: "",
    product: "",
    quantity: "",
    dimensions: "",
    notes: "",
    name: "",
    email: "",
    phone: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1500);
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-12 px-6">
        <div className="bg-[#4be794]/10 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[#4be794]/20">
          <CheckCircle2 className="h-10 w-10 text-[#4be794]" />
        </div>
        <h2 className="text-3xl font-bold text-zinc-900 mb-2 uppercase tracking-tight">Quote Request Sent!</h2>
        <p className="text-zinc-600 max-w-sm mx-auto mb-8 font-medium">
          We've received your request for {formData.category}. Our team will review the specs and send a quote to <span className="text-black font-bold">{formData.email}</span> within 2 hours.
        </p>
        <Button 
          onClick={() => window.location.href = '/'}
          variant="outline"
          className="rounded-full border-2 border-zinc-200 h-12 px-8 font-bold hover:bg-zinc-50"
        >
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-zinc-200 shadow-[0px_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Step Indicator */}
      <div className="flex border-b border-zinc-100">
        {STEPS.map((s) => (
          <div 
            key={s.id} 
            className={`flex-1 py-4 text-center text-xs font-black uppercase tracking-widest transition-colors ${step >= s.id ? 'text-black' : 'text-zinc-300'}`}
          >
            <span className={`inline-flex h-6 w-6 rounded-full items-center justify-center mr-2 border-2 transition-colors ${step >= s.id ? 'border-black bg-black text-white' : 'border-zinc-200'}`}>
              {s.id}
            </span>
            <span className="hidden sm:inline">{s.title}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-8 md:p-12">
        {/* STEP 1: CATEGORY */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight text-zinc-900">What are you looking for?</h3>
              <p className="text-zinc-500 font-medium">Select a category to help us route your request to the right specialist.</p>
            </div>
            
            <div className="grid md:grid-cols-1 gap-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { setFormData({...formData, category: cat.name}); handleNext(); }}
                  className={`flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all ${formData.category === cat.name ? 'border-black bg-zinc-50 shadow-sm' : 'border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50/50'}`}
                >
                  <div className={`p-3 rounded-xl border-2 ${formData.category === cat.name ? 'border-black bg-white' : 'border-zinc-100'}`}>
                    <cat.icon className="h-6 w-6 text-zinc-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 leading-tight mb-1">{cat.name}</h4>
                    <p className="text-sm text-zinc-500 font-medium">{cat.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: DETAILS */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight text-zinc-900">Tell us about the project</h3>
              <p className="text-zinc-500 font-medium">The more detail you provide, the faster we can get you an accurate price.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-zinc-600">Approx. Quantity</label>
                <input 
                  type="number" 
                  placeholder="e.g. 500"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  className="w-full h-12 bg-zinc-50 border-2 border-zinc-100 rounded-xl px-4 focus:border-black outline-none transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-zinc-600">Product Line</label>
                <select 
                  className="w-full h-12 bg-zinc-50 border-2 border-zinc-100 rounded-xl px-4 focus:border-black outline-none transition-all font-medium appearance-none"
                  value={formData.product}
                  onChange={(e) => setFormData({...formData, product: e.target.value})}
                  required
                >
                  <option value="">Select Option</option>
                  <option value="mailer-box">Custom Mailer Box</option>
                  <option value="shipping-box">Heavy-Duty Shipping Box</option>
                  <option value="retail-box">Premium Retail Packaging</option>
                  <option value="business-cards">Premium Business Cards</option>
                  <option value="catalog">Product Catalog / Booklet</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-zinc-600">Additional Specifications & Notes</label>
                <textarea 
                  placeholder="Mention dimensions, finish (matte/gloss), or any special requests..."
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-4 focus:border-black outline-none transition-all font-medium resize-none"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={handleBack}
                className="flex-1 h-14 border-2 border-zinc-200 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all cursor-pointer"
              >
                <ArrowLeft className="h-5 w-5" /> Back
              </button>
              <button 
                type="button" 
                onClick={handleNext}
                className="flex-2 h-14 bg-black text-white rounded-full font-bold flex items-center justify-center gap-2 hover:-translate-y-0.5 shadow-lg shadow-black/5 active:translate-y-0 transition-all cursor-pointer"
              >
                Continue <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CONTACT */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight text-zinc-900">Where should we send the quote?</h3>
              <div className="p-4 bg-zinc-50 rounded-xl border-l-4 border-black flex gap-3 italic text-zinc-600 text-sm font-medium">
                <Info className="h-5 w-5 shrink-0 text-black" />
                No account needed. We'll send the quote link directly to your email.
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase tracking-wider text-zinc-600">Full Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full h-12 bg-zinc-50 border-2 border-zinc-100 rounded-xl px-4 focus:border-black outline-none transition-all font-medium"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-zinc-600">Business Email</label>
                  <input 
                    type="email" 
                    placeholder="john@company.com"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full h-12 bg-zinc-50 border-2 border-zinc-100 rounded-xl px-4 focus:border-black outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-wider text-zinc-600">Phone Number (Optional)</label>
                  <input 
                    type="tel" 
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full h-12 bg-zinc-50 border-2 border-zinc-100 rounded-xl px-4 focus:border-black outline-none transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex-1 h-14 border-2 border-zinc-200 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-zinc-50 transition-all cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="h-5 w-5" /> Back
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-2 h-14 bg-[#4be794] text-black rounded-full font-black uppercase text-sm tracking-widest flex items-center justify-center gap-2 hover:-translate-y-0.5 shadow-lg shadow-[#4be794]/20 active:translate-y-0 transition-all cursor-pointer disabled:opacity-70"
              >
                {isSubmitting ? "Submitting..." : "Get My Quote"} <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
