"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, ArrowLeft, Building2 } from "lucide-react";
import { useAlert } from "@/components/CustomAlert";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function CompanySettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showAlert } = useAlert();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    company_name: "",
    company_address: "",
    company_state_code: "",
    company_gstin: "",
    company_pan: "",
    bank_details: "",
    shipping_is_taxable: true,
  });

  useEffect(() => {
    if (user && !user.admin) {
      router.push("/dashboard");
      return;
    }
    loadConfig();
  }, [user, router]);

  const loadConfig = async () => {
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/admin/settings`);
      if (!res.ok) throw new Error("Failed to load settings");
      const data = await res.json();
      setFormData({
        company_name: data.company_name || "",
        company_address: data.company_address || "",
        company_state_code: data.company_state_code || "",
        company_gstin: data.company_gstin || "",
        company_pan: data.company_pan || "",
        bank_details: data.bank_details || "",
        shipping_is_taxable: data.shipping_is_taxable ?? true,
      });
    } catch (e) {
      showAlert("Could not load company settings.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to update");
      showAlert("Company settings updated successfully!", "success");
    } catch {
      showAlert("Failed to update settings.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <Link href="/dashboard/settings" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest hover:text-[#FF90E8] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Settings
      </Link>

      <div className="border-2 border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-zinc-100">
          <div className="p-3 bg-[#fdf567] text-black border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Company & Finance</h1>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Global tax and invoice configs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Company Name</label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full border-2 border-black p-3 rounded-lg font-medium text-sm bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fdf567] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Company State Code (GST)</label>
            <input
              type="text"
              value={formData.company_state_code}
              onChange={(e) => setFormData({ ...formData, company_state_code: e.target.value })}
              placeholder="e.g. 07 for Delhi"
              className="w-full border-2 border-black p-3 rounded-lg font-medium text-sm bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fdf567] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Company Address</label>
            <textarea
              value={formData.company_address}
              onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
              className="w-full border-2 border-black p-3 rounded-lg font-medium text-sm bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fdf567] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)] resize-y min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500">GSTIN</label>
            <input
              type="text"
              value={formData.company_gstin}
              onChange={(e) => setFormData({ ...formData, company_gstin: e.target.value })}
              className="w-full border-2 border-black p-3 rounded-lg font-medium text-sm uppercase bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fdf567] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500">PAN Number</label>
            <input
              type="text"
              value={formData.company_pan}
              onChange={(e) => setFormData({ ...formData, company_pan: e.target.value })}
              className="w-full border-2 border-black p-3 rounded-lg font-medium text-sm uppercase bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fdf567] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Bank Details (Used on Invoice)</label>
            <textarea
              value={formData.bank_details}
              onChange={(e) => setFormData({ ...formData, bank_details: e.target.value })}
              className="w-full border-2 border-black p-3 rounded-lg font-medium text-sm bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fdf567] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)] resize-y min-h-[100px]"
              placeholder="Bank Name: \nAccount No: \nIFSC: "
            />
          </div>

        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={saveConfig}
            disabled={isSaving}
            className="px-8 py-3 bg-[#4be794] text-black border-2 border-black font-black text-sm uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
