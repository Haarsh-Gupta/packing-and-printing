"use client";

import { useState } from "react";
import { 
  Building2, 
  MapPin, 
  Printer, 
  Download, 
  ArrowLeft,
  FileCheck2,
  Phone,
  Mail,
  Receipt,
  Truck,
  Globe
} from "lucide-react";
import Link from "next/link";

// ── COMPONENT ────────────────────────────────────────────────────────

export default function InvoiceSamplePage() {
  const [isInterstate, setIsInterstate] = useState(false);

  // Dummy Vendor (Delhi)
  const vendor = {
    name: "BOOK BIND ENTERPRISES",
    address: "B-12/3, Okhla Industrial Area, Phase-II",
    city: "New Delhi",
    state: "DELHI",
    pincode: "110020",
    gstin: "07AAACB1234Z1Z5",
    pan: "AAACB1234Z",
    email: "billing@bookbind.in",
    phone: "+91 98765 43210"
  };

  // Dummy Customer
  const customer = isInterstate ? {
    name: "TechNova Solutions Pvt Ltd",
    address: "Quantum Towers, 15th Floor, BKC",
    city: "Mumbai",
    state: "MAHARASHTRA",
    pincode: "400051",
    gstin: "27BBBCC5678X2Z9"
  } : {
    name: "Delhi Print Hub",
    address: "42, Nehru Place Commercial Center",
    city: "New Delhi",
    state: "DELHI",
    pincode: "110019",
    gstin: "07CCCDD9012W3Z7"
  };

  // Items with different GST slabs
  const items = [
    { desc: "Premium Hardcover Binding", hsn: "4901", qty: 100, price: 250, gstRate: 18 },
    { desc: "Custom Calendar Printing", hsn: "4910", qty: 50, price: 450, gstRate: 12 },
    { desc: "Embossed Visiting Cards", hsn: "4817", qty: 500, price: 5, gstRate: 5 },
    { desc: "Luxury Packing Boxes (Set of 10)", hsn: "4819", qty: 20, price: 1200, gstRate: 28 },
  ];

  const subtotal = items.reduce((acc, item) => acc + (item.qty * item.price), 0);
  const shipping = 1200;
  const shippingGstRate = 18;

  // Tax Calculations
  const calculateTaxes = () => {
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    const itemsTax = items.map(item => {
      const taxable = item.qty * item.price;
      const taxAmt = (taxable * item.gstRate) / 100;
      
      if (isInterstate) {
        igstTotal += taxAmt;
        return { ...item, igst: taxAmt, cgst: 0, sgst: 0 };
      } else {
        cgstTotal += taxAmt / 2;
        sgstTotal += taxAmt / 2;
        return { ...item, igst: 0, cgst: taxAmt / 2, sgst: taxAmt / 2 };
      }
    });

    const shipTax = (shipping * shippingGstRate) / 100;
    if (isInterstate) igstTotal += shipTax;
    else { cgstTotal += shipTax/2; sgstTotal += shipTax/2; }

    return { 
      itemsTax, 
      cgstTotal: Math.round(cgstTotal * 100) / 100, 
      sgstTotal: Math.round(sgstTotal * 100) / 100, 
      igstTotal: Math.round(igstTotal * 100) / 100,
      totalTax: Math.round((cgstTotal + sgstTotal + igstTotal) * 100) / 100
    };
  };

  const { itemsTax, cgstTotal, sgstTotal, igstTotal, totalTax } = calculateTaxes();
  const grandTotal = subtotal + shipping + totalTax;

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 space-y-8 pb-32">
      {/* ── Controls ── */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-black text-white p-6 rounded-2xl shadow-[8px_8px_0px_0px_#a788fa] border-2 border-black mb-8">
        <div className="space-y-1 text-center md:text-left">
          <Link href="/dashboard/settings" className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
          <h2 className="text-2xl font-black tracking-tight">TAX INVOICE <span className="text-[#a788fa]">DEMO</span></h2>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Testing dynamic GST splitting & Slabs</p>
        </div>
        
        <div className="flex items-center gap-4 mt-6 md:mt-0">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 p-3 rounded-xl">
             <span className="text-xs font-black uppercase text-zinc-400">Transaction Type:</span>
             <button 
               onClick={() => setIsInterstate(!isInterstate)}
               className={`px-4 py-2 font-black text-[10px] uppercase border-2 border-black rounded-lg transition-all ${!isInterstate ? 'bg-[#4be794] text-black shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]' : 'bg-zinc-800 text-zinc-500'}`}
             >
               Intra-state (Delhi)
             </button>
             <button 
               onClick={() => setIsInterstate(!isInterstate)}
               className={`px-4 py-2 font-black text-[10px] uppercase border-2 border-black rounded-lg transition-all ${isInterstate ? 'bg-[#ff90e8] text-black shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]' : 'bg-zinc-800 text-zinc-500'}`}
             >
               Inter-state (Out of State)
             </button>
          </div>
        </div>
      </div>

      {/* ── Invoice Frame ── */}
      <div className="relative bg-white border-4 border-black p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-3xl overflow-hidden">
        
        {/* Header Ribbon */}
        <div className="absolute top-0 right-0 w-48 h-12 bg-[#fdf567] border-b-4 border-l-4 border-black flex items-center justify-center -mr-12 rotate-45 transform translate-y-4 translate-x-4">
           <span className="font-black text-xs uppercase tracking-widest text-black">OFFICIAL</span>
        </div>

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between gap-12 border-b-4 border-black pb-10">
          <div className="space-y-4 max-w-sm">
             <div className="h-16 w-16 bg-[#a788fa] border-3 border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Receipt className="w-8 h-8 text-white" />
             </div>
             <div>
               <h1 className="text-3xl font-black tracking-tight">{vendor.name}</h1>
               <p className="text-sm font-bold text-zinc-500 leading-tight mt-2">{vendor.address}, {vendor.city}, {vendor.state} - {vendor.pincode}</p>
               <div className="grid grid-cols-1 gap-1 pt-3">
                  <p className="text-xs font-bold flex items-center gap-2"><Globe className="w-3 h-3" /> GSTIN: <span className="font-black">{vendor.gstin}</span></p>
                  <p className="text-xs font-bold flex items-center gap-2"><Phone className="w-3 h-3" /> {vendor.phone}</p>
               </div>
             </div>
          </div>

          <div className="space-y-6 text-right">
             <div className="space-y-1">
               <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Tax Invoice</h2>
               <p className="text-4xl font-black tracking-tighter">#INV-2024-001</p>
             </div>
             <div className="flex flex-col items-end gap-2">
                <div className="text-xs font-bold px-3 py-1 bg-zinc-100 border-2 border-black rounded-lg">Date: 14th April 2026</div>
                <div className="text-xs font-bold px-3 py-1 bg-zinc-100 border-2 border-black rounded-lg">Place of Supply: {customer.state}</div>
             </div>
          </div>
        </div>

        {/* ── Bill To ── */}
        <div className="grid md:grid-cols-2 gap-12 py-10 border-b-4 border-black/5">
           <div className="space-y-4 p-6 bg-zinc-50 border-3 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)]">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest underline decoration-2 underline-offset-4">Billed To:</h3>
              <div className="space-y-2">
                <p className="text-xl font-black">{customer.name}</p>
                <p className="text-sm font-bold text-zinc-500 leading-snug">{customer.address}, {customer.city}, {customer.state} - {customer.pincode}</p>
                <div className="pt-2">
                   <p className="text-xs font-black px-2 py-1 bg-white border-2 border-black/10 inline-block rounded-md">GSTIN: {customer.gstin}</p>
                </div>
              </div>
           </div>
           
           <div className="flex flex-col justify-end space-y-4 pb-4">
              <div className="text-right space-y-1">
                <p className="text-xs font-black uppercase text-zinc-400">Total Payable</p>
                <p className="text-5xl font-black text-[#a788fa] tracking-tighter">₹{grandTotal.toLocaleString('en-IN')}</p>
              </div>
           </div>
        </div>

        {/* ── Table ── */}
        <div className="py-10 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b-4 border-black">
                <th className="pb-4 font-black uppercase text-xs tracking-widest text-zinc-400">#</th>
                <th className="pb-4 font-black uppercase text-xs tracking-widest text-zinc-400">Description / HSN</th>
                <th className="pb-4 font-black uppercase text-xs tracking-widest text-zinc-400 text-center">Qty / Rate</th>
                <th className="pb-4 font-black uppercase text-xs tracking-widest text-zinc-400 text-center">Tax %</th>
                <th className="pb-4 font-black uppercase text-xs tracking-widest text-zinc-400 text-right">Taxable Value</th>
                <th className="pb-4 font-black uppercase text-xs tracking-widest text-zinc-400 text-right">GST Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-zinc-100">
              {itemsTax.map((item, idx) => {
                const taxable = item.qty * item.price;
                const gst = (isInterstate) ? item.igst : (item.cgst + item.sgst);
                return (
                  <tr key={idx} className="group hover:bg-zinc-50 transition-colors">
                    <td className="py-5 font-black text-sm text-zinc-400">0{idx + 1}</td>
                    <td className="py-5">
                       <p className="font-black text-sm">{item.desc}</p>
                       <p className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase mt-1">HSN: {item.hsn}</p>
                    </td>
                    <td className="py-5 text-center">
                       <p className="font-bold text-sm">{item.qty} Nos</p>
                       <p className="text-[10px] font-medium text-zinc-400">@ ₹{item.price}</p>
                    </td>
                    <td className="py-5 text-center">
                       <span className="px-2 py-0.5 border-2 border-black rounded-md font-black text-[9px] bg-zinc-100">{item.gstRate}%</span>
                    </td>
                    <td className="py-5 text-right font-bold text-sm">₹{taxable.toLocaleString('en-IN')}</td>
                    <td className="py-5 text-right space-y-1">
                       <p className="font-black text-sm text-[#a788fa]">₹{gst.toLocaleString('en-IN')}</p>
                       {!isInterstate && (
                         <p className="text-[8px] font-black text-zinc-300 uppercase leading-none">C: {item.cgst} | S: {item.sgst}</p>
                       )}
                    </td>
                  </tr>
                );
              })}
              {/* Shipping Row */}
              <tr className="bg-zinc-50/50">
                 <td className="py-4"></td>
                 <td className="py-4 font-bold text-sm text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Shipping & Freight
                 </td>
                 <td className="py-4"></td>
                 <td className="py-4 text-center">
                    <span className="px-2 py-0.5 border-2 border-black rounded-md font-black text-[9px] bg-white">{shippingGstRate}%</span>
                 </td>
                 <td className="py-4 text-right font-bold text-sm">₹{shipping.toLocaleString('en-IN')}</td>
                 <td className="py-4 text-right font-black text-sm text-[#a788fa]">₹{((shipping * shippingGstRate)/100).toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Summary ── */}
        <div className="grid md:grid-cols-2 gap-12 py-10 border-t-4 border-black">
          <div className="space-y-6">
             <div className="p-6 bg-zinc-50 border-3 border-black border-dashed rounded-2xl">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">Bank Account Details</h4>
                <div className="space-y-1 text-xs">
                   <p className="font-bold">A/C Holder: <span className="font-black uppercase">{vendor.name}</span></p>
                   <p className="font-bold">A/C Number: <span className="font-black">9876543210123</span></p>
                   <p className="font-bold">Bank Name: <span className="font-black">HDFC BANK LTD</span></p>
                   <p className="font-bold">IFSC Code: <span className="font-black uppercase">HDFC0001234</span></p>
                </div>
             </div>
             <p className="text-[10px] font-bold text-zinc-400 italic">This is a system generated sample invoice for design and calculation demonstration only.</p>
          </div>

          <div className="space-y-3">
             <div className="flex justify-between items-center text-sm font-bold text-zinc-500">
                <span>Total Taxable Value</span>
                <span>₹{(subtotal + shipping).toLocaleString('en-IN')}</span>
             </div>
             
             {isInterstate ? (
               <div className="flex justify-between items-center text-sm font-black text-black">
                  <span className="uppercase tracking-widest text-[10px]">Total IGST</span>
                  <span>₹{igstTotal.toLocaleString('en-IN')}</span>
               </div>
             ) : (
               <>
                 <div className="flex justify-between items-center text-sm font-black text-black">
                    <span className="uppercase tracking-widest text-[10px]">Total CGST</span>
                    <span>₹{cgstTotal.toLocaleString('en-IN')}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm font-black text-black">
                    <span className="uppercase tracking-widest text-[10px]">Total SGST</span>
                    <span>₹{sgstTotal.toLocaleString('en-IN')}</span>
                 </div>
               </>
             )}
             
             <div className="pt-4 mt-4 border-t-4 border-black flex justify-between items-center">
                <span className="font-black uppercase text-lg tracking-tighter">Grand Total</span>
                <span className="text-3xl font-black text-[#a788fa]">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
             </div>
             <p className="text-[10px] font-black text-zinc-300 text-right uppercase tracking-widest italic pt-2">Amount in Words: Fifty Six Thousand Two Hundred and Ten Only</p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-20 flex justify-between items-end border-t-2 border-zinc-100">
           <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 mb-6 underline decoration-4 underline-offset-8 decoration-[#a788fa]">Subject to Delhi Jurisdiction</p>
              <FileCheck2 className="w-10 h-10 text-[#4be794]" />
           </div>
           <div className="text-center space-y-4">
              <div className="w-48 border-b-2 border-black pb-1">
                 <p className="text-[8px] font-black uppercase text-zinc-400 tracking-widest">Authorized Signatory</p>
              </div>
              <p className="font-black text-xs uppercase tracking-tighter">For {vendor.name}</p>
           </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex justify-center gap-6">
         <button className="h-14 px-8 bg-white border-3 border-black font-black uppercase tracking-widest text-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-3">
            <Printer className="w-5 h-5" /> Print Invoice
         </button>
         <button className="h-14 px-8 bg-[#fdf567] border-3 border-black font-black uppercase tracking-widest text-sm shadow-[6px_6px_0px_0px_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-3">
            <Download className="w-5 h-5" /> Download PDF
         </button>
      </div>

      {/* Global CSS for page transitions */}
      <style jsx global>{`
        .animate-in {
          animation: fade-in 0.3s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
