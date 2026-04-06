"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2, Camera, User, MapPin, Lock, Mail, Phone, Shield, CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { useAlert } from "@/components/CustomAlert";
import { useAuth } from "@/context/AuthContext";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { showAlert } = useAlert();

  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Form
  const [isSaving, setIsSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Track which section is being edited
  const [editSection, setEditSection] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const parts = user.name.split(" ");
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setPreviewUrl(user.profile_picture || "");
    }
  }, [user]);

  const avatarUrl = previewUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user?.name || "")}&backgroundColor=fdf567`;

  // ── Helpers ──
  const updateUser = async (payload: any) => {
    const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/users/update`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Update failed");
    await refreshUser();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setPreviewUrl(URL.createObjectURL(file));
      uploadPicture(file);
    }
  };

  const uploadPicture = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/upload/?purpose=profile`, {
        method: "POST",
        credentials: "include",
        body: formData
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      await updateUser({ profile_picture: data.url });
      showAlert("Profile picture updated!", "success");
    } catch {
      showAlert("Failed to upload picture.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const payload: any = {
        name: `${firstName} ${lastName}`.trim(),
        phone: phone.trim(),
        address: address.trim(),
      };
      if (newPassword.trim()) {
        if (newPassword !== confirmPassword) {
          showAlert("Passwords don't match.", "error");
          setIsSaving(false);
          return;
        }
        if (newPassword.length < 6) {
          showAlert("Password must be at least 6 characters.", "error");
          setIsSaving(false);
          return;
        }
        payload.password = newPassword;
      }
      await updateUser(payload);
      showAlert("Profile updated successfully!", "success");
      setNewPassword("");
      setConfirmPassword("");
      setEditSection(null);
    } catch {
      showAlert("Failed to save changes.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "New Member";

  // Info items for the profile card
  const profileItems = [
    { icon: Mail, label: "Email", value: user.email },
    { icon: Phone, label: "Phone", value: user.phone || "Not set" },
    { icon: MapPin, label: "Address", value: user.address || "Not set" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">

      {/* ── Header Banner ── */}
      <header className="relative overflow-hidden rounded-2xl bg-[#a788fa] border border-black/10 shadow-sm">
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle,#000_1px,transparent_1px)] bg-size-[24px_24px]" />
        <div className="relative z-10 p-6 sm:p-8 md:p-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-3">
              <div className="inline-block bg-white text-black px-3 py-1.5 font-black text-xs uppercase tracking-widest border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -rotate-1">
                Settings
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-black leading-[0.9]">
                Your <span className="text-black/40">Profile</span>
              </h1>
              <p className="text-base text-black/60 font-medium max-w-xl leading-relaxed">
                Manage your personal information, shipping address, and security settings.
              </p>
            </div>
            <button
              onClick={saveProfile}
              disabled={isSaving}
              className="h-12 px-8 text-base font-black uppercase border-3 border-black bg-black text-white hover:bg-white hover:text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,0.3)] transition-all rounded-full flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Save Changes
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content: Profile Card (Left) + Edit Forms (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ─── LEFT: Profile Card ─── */}
        <div className="lg:col-span-4 space-y-6">

          {/* Avatar Card */}
          <div className="border-2 border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl">
            <div className="flex flex-col items-center">
              {/* Avatar */}
              <div className="relative group mb-6">
                <div
                  className="w-36 h-36 rounded-full border-4 border-black bg-zinc-100 bg-center bg-cover bg-no-repeat shadow-[4px_4px_0px_0px_#FF90E8] overflow-hidden"
                  style={{ backgroundImage: `url("${avatarUrl}")` }}
                />
                <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" accept="image/*" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-1 right-1 w-10 h-10 bg-[#fdf567] border-2 border-black rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all group-hover:scale-110"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
              </div>

              {/* Name & Role */}
              <h2 className="text-2xl font-black uppercase tracking-tight text-center">{user.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-black uppercase px-3 py-1 bg-[#4be794] border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {user.admin ? "Admin" : "Customer"}
                </span>
              </div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-3">
                Member since {memberSince}
              </p>

              {/* Upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="mt-6 w-full py-2.5 bg-[#FF90E8] border-2 border-black font-black text-sm uppercase tracking-wider rounded-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all"
              >
                {isUploading ? "Uploading..." : "Change Photo"}
              </button>
              <p className="text-[10px] text-zinc-400 font-medium mt-2 text-center">JPG, PNG or GIF. Max 2MB.</p>
            </div>
          </div>

          {/* Info Card */}
          <div className="border-2 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl space-y-4">
            <h3 className="font-black text-sm uppercase tracking-widest text-zinc-400 mb-2">Contact Details</h3>
            {profileItems.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 group">
                <div className="w-9 h-9 bg-zinc-100 border-2 border-black rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
                  <p className={`text-sm font-bold truncate ${value === "Not set" ? "text-zinc-300 italic" : "text-zinc-800"}`}>
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Tip */}
          <div className="border-2 border-black bg-[#fdf567] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" />
              <h4 className="font-black text-xs uppercase tracking-widest">Pro Tip</h4>
            </div>
            <p className="text-xs font-medium text-black/70 leading-relaxed">
              Complete your profile with phone and address to speed up your inquiry process. 
              We&apos;ll pre-fill this info when you submit orders.
            </p>
          </div>
        </div>

        {/* ─── RIGHT: Edit Forms ─── */}
        <div className="lg:col-span-8 space-y-6">

          {/* Personal Details */}
          <div className="border-2 border-black bg-white p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl">
            <div className="flex items-center justify-between mb-7 border-b-2 border-zinc-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#FF90E8] text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Personal Details</h3>
                  <p className="text-xs font-medium text-zinc-400">Name, email & phone number</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">First Name</label>
                <input
                  type="text"
                  className="w-full border-2 border-black p-3 rounded-lg font-medium text-sm bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a788fa] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]"
                  placeholder="Alex"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Last Name</label>
                <input
                  type="text"
                  className="w-full border-2 border-black p-3 rounded-lg font-medium text-sm bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a788fa] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]"
                  placeholder="Morgan"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">
                  Email Address
                  <span className="ml-2 text-[9px] font-black bg-zinc-200 text-zinc-500 px-2 py-0.5 rounded-full border border-zinc-300">LOCKED</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    className="w-full border-2 border-zinc-200 p-3 rounded-lg font-medium text-sm bg-zinc-100 text-zinc-400 cursor-not-allowed"
                    value={user.email}
                    readOnly
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Phone Number</label>
                <input
                  type="tel"
                  className="w-full border-2 border-black p-3 rounded-lg font-medium text-sm bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a788fa] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="border-2 border-black bg-white p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl">
            <div className="flex items-center justify-between mb-7 border-b-2 border-zinc-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#4be794] text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Delivery Address</h3>
                  <p className="text-xs font-medium text-zinc-400">Used for shipping and invoices</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Full Address</label>
              <textarea
                className="w-full border-2 border-black p-3 rounded-lg font-medium text-sm bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4be794] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)] resize-none"
                rows={3}
                placeholder="Enter your full address including street, city, state and PIN code"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
              <p className="text-[10px] font-medium text-zinc-400">
                This address will be pre-filled when you submit inquiries and used for shipping calculations.
              </p>
            </div>
          </div>

          {/* Security */}
          <div className="border-2 border-black bg-white p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl">
            <div className="flex items-center justify-between mb-7 border-b-2 border-zinc-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#fdf567] text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Security</h3>
                  <p className="text-xs font-medium text-zinc-400">Update your password</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">New Password</label>
                <input
                  type="password"
                  className="w-full border-2 border-black p-3 rounded-lg font-medium text-sm bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fdf567] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Confirm Password</label>
                <input
                  type="password"
                  className="w-full border-2 border-black p-3 rounded-lg font-medium text-sm bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#fdf567] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1,0.05)]"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <p className="text-[10px] font-medium text-zinc-400">
                  Leave blank to keep your current password. Minimum 6 characters.
                </p>
              </div>
            </div>
          </div>

          {/* Save Button (Bottom) */}
          <div className="flex justify-end">
            <button
              onClick={saveProfile}
              disabled={isSaving}
              className="px-10 py-3.5 bg-[#4be794] text-black border-2 border-black font-black text-sm uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Save All Changes
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}