"use client";

import { useState } from "react";
import { 
  Plus, 
  MapPin, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Home, 
  Building2, 
  ArrowLeft,
  X,
  CreditCard,
  Truck,
  MoreVertical,
  Star
} from "lucide-react";
import Link from "next/link";

// ── CONSTANTS ────────────────────────────────────────────────────────

const INDIAN_STATES = [
  "ANDAMAN AND NICOBAR ISLANDS", "ANDHRA PRADESH", "ARUNACHAL PRADESH", "ASSAM", "BIHAR", 
  "CHANDIGARH", "CHHATTISGARH", "DADRA AND NAGAR HAVELI AND DAMAN AND DIU", "DELHI", "GOA", 
  "GUJARAT", "HARYANA", "HIMACHAL PRADESH", "JAMMU AND KASHMIR", "JHARKHAND", "KARNATAKA", 
  "KERALA", "LAKSHADWEEP", "MADHYA PRADESH", "MAHARASHTRA", "MANIPUR", "MEGHALAYA", 
  "MIZORAM", "NAGALAND", "ODISHA", "PUDUCHERRY", "PUNJAB", "RAJASTHAN", "SIKKIM", 
  "TAMIL NADU", "TELANGANA", "TRIPURA", "UTTAR PRADESH", "UTTARAKHAND", "WEST BENGAL"
];

interface MockAddress {
  id: string;
  type: "BILLING" | "SHIPPING";
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

// ── COMPONENTS ───────────────────────────────────────────────────────

export default function AddressesSamplePage() {
  const [addresses, setAddresses] = useState<MockAddress[]>([
    {
      id: "1",
      type: "BILLING",
      line1: "123 Business Tower",
      line2: "Okhla Phase III",
      city: "New Delhi",
      state: "DELHI",
      pincode: "110020",
      isDefault: true,
    },
    {
      id: "2",
      type: "SHIPPING",
      line1: "Flat 402, Green Valley Apartments",
      line2: "Sector 45",
      city: "Gurugram",
      state: "HARYANA",
      pincode: "122003",
      isDefault: false,
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<MockAddress, 'id'>>({
    type: "SHIPPING",
    line1: "",
    line2: "",
    city: "",
    state: "DELHI",
    pincode: "",
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ type: "SHIPPING", line1: "", line2: "", city: "", state: "DELHI", pincode: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr: MockAddress) => {
    setEditingId(addr.id);
    setFormData({ ...addr });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this address?")) {
      setAddresses(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleSave = () => {
    if (!formData.line1 || !formData.city || !formData.pincode) {
      alert("Please fill all required fields.");
      return;
    }

    if (editingId) {
      setAddresses(prev => prev.map(a => a.id === editingId ? { ...formData, id: editingId } : a));
    } else {
      const newAddr: MockAddress = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9),
      };
      setAddresses(prev => [...prev, newAddr]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 pt-8 px-4">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <Link 
            href="/dashboard/settings" 
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-colors mb-4"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Settings
          </Link>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-black leading-none">
            Manage <span className="text-[#a788fa]">Addresses</span>
          </h1>
          <p className="text-sm font-medium text-zinc-500 bg-zinc-100 py-1 px-3 rounded-full inline-block">
            Beta: Sample Page with Dummy Data
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="h-14 px-8 bg-black text-white border-3 border-black font-black uppercase tracking-widest text-sm shadow-[6px_6px_0px_0px_#a788fa] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-3"
        >
          <Plus className="w-5 h-5" />
          Add New Address
        </button>
      </div>

      {/* ── Tabs/Filter ── */}
      <div className="flex flex-wrap gap-3">
        {["ALL", "BILLING", "SHIPPING"].map(tab => (
           <button 
             key={tab}
             className="px-6 py-2 border-2 border-black font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all bg-white"
           >
             {tab}
           </button>
        ))}
      </div>

      {/* ── Address Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {addresses.map((addr) => (
          <div 
            key={addr.id}
            className="group relative border-3 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all rounded-2xl overflow-hidden"
          >
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 transition-transform group-hover:scale-150 ${addr.type === 'BILLING' ? 'bg-[#FF90E8]' : 'bg-[#4be794]'}`} />
            
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-start">
                <div className={`px-3 py-1.5 border-2 border-black font-black text-[10px] uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 ${addr.type === 'BILLING' ? 'bg-[#FF90E8]' : 'bg-[#4be794]'}`}>
                  {addr.type === 'BILLING' ? <CreditCard className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                  {addr.type}
                </div>
                {addr.isDefault && (
                  <span className="flex items-center gap-1 text-[#a788fa] font-black text-[10px] uppercase">
                    <Star className="w-3 h-3 fill-current" />
                    Default
                  </span>
                )}
              </div>

              <div className="space-y-1 pt-2">
                <h3 className="font-black text-lg leading-tight truncate">{addr.line1}</h3>
                {addr.line2 && <p className="text-zinc-500 font-bold text-sm truncate">{addr.line2}</p>}
                <p className="text-zinc-800 font-bold text-sm">
                  {addr.city}, {addr.state} - {addr.pincode}
                </p>
              </div>

              <div className="pt-4 flex items-center gap-3 border-t-2 border-zinc-50">
                <button 
                  onClick={() => handleOpenEdit(addr)}
                  className="flex-1 py-2 bg-zinc-100 border-2 border-black font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black hover:text-white transition-colors"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
                <button 
                  onClick={() => handleDelete(addr.id)}
                  className="flex-1 py-2 bg-[#ff5c5c] border-2 border-black font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State placeholder */}
        {addresses.length === 0 && (
          <div className="col-span-full border-3 border-dashed border-zinc-300 rounded-3xl p-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center">
              <MapPin className="w-10 h-10 text-zinc-300" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-2xl">No Addresses Yet</h3>
              <p className="text-zinc-400 font-medium">Add your shipping or billing addresses for a faster checkout.</p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-8 py-3 bg-black text-white font-black uppercase tracking-widest text-xs border-2 border-black shadow-[4px_4px_0px_0px_#a788fa]"
            >
              Get Started
            </button>
          </div>
        )}
      </div>

      {/* ── Modal Overlay ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-xl bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-[#a788fa] p-8 border-b-4 border-black relative">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black tracking-tighter text-black leading-none">
                    {editingId ? 'Edit' : 'Add'} <span className="opacity-40">Address</span>
                  </h2>
                  <p className="text-xs font-bold text-black/60 uppercase tracking-widest">
                    Enter your delivery or billing details
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white border-2 border-black p-2 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Type Toggle */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setFormData({...formData, type: "BILLING"})}
                  className={`py-4 border-3 border-black font-black uppercase tracking-tight text-sm rounded-xl transition-all flex items-center justify-center gap-2 ${formData.type === 'BILLING' ? 'bg-[#FF90E8] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-zinc-50'}`}
                >
                  <CreditCard className="w-4 h-4" /> Billing
                </button>
                <button
                  onClick={() => setFormData({...formData, type: "SHIPPING"})}
                  className={`py-4 border-3 border-black font-black uppercase tracking-tight text-sm rounded-xl transition-all flex items-center justify-center gap-2 ${formData.type === 'SHIPPING' ? 'bg-[#4be794] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-zinc-50'}`}
                >
                  <Truck className="w-4 h-4" /> Shipping
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Flat / House / Apartment</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat 402, Business Tower"
                    className="w-full border-2 border-black p-4 rounded-xl font-bold bg-zinc-50 focus:bg-white outline-none focus:ring-4 focus:ring-[#a788fa]/20 transition-all"
                    value={formData.line1}
                    onChange={e => setFormData({...formData, line1: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Area / Street / Sector (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Okhla Phase III"
                    className="w-full border-2 border-black p-4 rounded-xl font-bold bg-zinc-50 focus:bg-white outline-none transition-all"
                    value={formData.line2}
                    onChange={e => setFormData({...formData, line2: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">City</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. New Delhi"
                      className="w-full border-2 border-black p-4 rounded-xl font-bold bg-zinc-50 focus:bg-white outline-none transition-all"
                      value={formData.city}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Pincode</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="6 digits"
                      className="w-full border-2 border-black p-4 rounded-xl font-bold bg-zinc-50 focus:bg-white outline-none transition-all"
                      value={formData.pincode}
                      onChange={e => setFormData({...formData, pincode: e.target.value.replace(/\D/g, "")})}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">State</label>
                  <select
                    className="w-full border-2 border-black p-4 rounded-xl font-bold bg-zinc-50 focus:bg-white outline-none appearance-none cursor-pointer"
                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em' }}
                    value={formData.state}
                    onChange={e => setFormData({...formData, state: e.target.value})}
                  >
                    {INDIAN_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-zinc-50 border-t-4 border-black flex gap-4">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 border-3 border-black font-black uppercase tracking-widest text-sm rounded-xl hover:bg-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-4 bg-[#a788fa] border-3 border-black font-black uppercase tracking-widest text-sm rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
              >
                Save Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for custom scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f4f4f5;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #000;
          border-radius: 10px;
          border: 2px solid #f4f4f5;
        }
      `}</style>
    </div>
  );
}
