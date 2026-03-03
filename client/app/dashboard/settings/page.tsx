"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2, Camera, User, Building, Lock } from "lucide-react";
import { useAlert } from "@/components/CustomAlert";
import { useAuth } from "@/context/AuthContext";

interface UserData {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  profile_picture: string | null;
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { showAlert } = useAlert();

  // Avatar Upload States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Form States -> Based on new UI structure
  const [isSavingAll, setIsSavingAll] = useState(false);

  // 1. Personal Details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  // 2. Company Information -> Re-purposing Address logic for structural match
  const [companyName, setCompanyName] = useState(""); // Maps to Address Street
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");

  // 3. Preferences (Re-purposing as Password update block)
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (user) {
      // Split name intelligently
      const nameParts = user.name.split(" ");
      setFirstName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(" ") || "");
      setPhone(user.phone || "");
      setSelectedAvatar(user.profile_picture || "");
      setPreviewUrl(user.profile_picture || "");
    }
  }, [user]);

  useEffect(() => {
    const savedAddr = localStorage.getItem("client_shipping_address");
    if (savedAddr) {
      const parsed = JSON.parse(savedAddr);
      setCompanyName(parsed.street || ""); // Reusing street as Company Name locally
      setCity(parsed.city || "");
      setZip(parsed.zip || "");
    }
  }, []);

  // --- 1. Profile Picture Handlers ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      // Trigger upload immediately upon selection for better UX in this design
      uploadPicture(file);
    }
  };

  const uploadPicture = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/?purpose=profile`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        body: formData
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      const uploadData = await uploadRes.json();
      await updateUser({ profile_picture: uploadData.url });
      setSelectedAvatar(uploadData.url);
      showAlert("Profile picture updated.", "success");
      setUploadFile(null);
    } catch (e: any) {
      showAlert(e.message || "Failed to update profile picture", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // --- 2. Master Save Handler (Combines UI form into single/batch update) ---
  const saveAllChanges = async () => {
    setIsSavingAll(true);
    let success = true;

    // A. Save User Info
    try {
      const payload: any = {
        name: `${firstName} ${lastName}`.trim(),
        phone: phone,
      };
      if (newPassword.trim().length > 0) {
        payload.password = newPassword;
      }
      await updateUser(payload);
    } catch (e) {
      success = false;
      showAlert("Failed to save personal details.", "error");
    }

    // B. Save Address/Company locally (Demo standard)
    try {
      localStorage.setItem("client_shipping_address", JSON.stringify({
        street: companyName, // Treating Company Name as street for data reuse
        city,
        zip
      }));
    } catch (e) {
      success = false;
    }

    if (success) {
      showAlert("All changes saved successfully.", "success");
      setNewPassword(""); // Clear password field after save
    }

    setIsSavingAll(false);
  };

  // Helper
  const updateUser = async (payload: any) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/update`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token")}`
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      await refreshUser();
    } else {
      throw new Error("Update failed");
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b-2 border-slate-200 pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2 uppercase tracking-tight">Edit Profile</h1>
          <p className="text-slate-600 font-medium text-lg">Manage your account details and directory information.</p>
        </div>
        <div className="flex gap-3">
          <button className="neu-btn bg-white px-4 py-2 rounded-lg font-bold text-sm text-slate-900">Cancel</button>
          <button
            onClick={saveAllChanges}
            disabled={isSavingAll || isUploading}
            className="neu-btn bg-black text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
          >
            {isSavingAll ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Profile Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Avatar & Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="neu-card bg-white p-6 rounded-xl flex flex-col items-center gap-6">
            <div className="relative group w-40 h-40">
              <div
                className="w-full h-full bg-center bg-no-repeat bg-cover border-4 border-black rounded-full shadow-[6px_6px_0_0_#d946ef] overflow-hidden bg-zinc-100"
                style={{ backgroundImage: `url("${previewUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`}")` }}
              ></div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 right-2 neu-btn bg-white p-2 rounded-full hover:bg-slate-50 text-black flex items-center justify-center transform transition-transform group-hover:scale-110"
                title="Upload new photo"
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              </button>
            </div>
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="neu-btn w-full py-2 bg-[#fdf2f8] text-primary font-bold rounded-lg border-2 border-primary hover:bg-primary hover:text-white transition-all"
              >
                {isUploading ? "Uploading..." : "Upload New Photo"}
              </button>
              <p className="text-xs text-center text-slate-500 font-medium">JPG, GIF or PNG. Max size of 2MB.</p>
            </div>
          </div>

          {/* Note: Membership Status block removed per user request */}
        </div>

        {/* Right Column: Form Fields */}
        <div className="lg:col-span-2">
          <div className="neu-card bg-white p-6 md:p-8 rounded-xl space-y-10">

            {/* Personal Details */}
            <section>
              <h3 className="text-xl font-black mb-6 border-b-2 border-slate-100 pb-2 flex items-center gap-2">
                <span className="bg-primary text-white p-1 rounded border-2 border-black shadow-[2px_2px_0_0_#000]">
                  <User className="w-5 h-5 block" />
                </span>
                Personal Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-slate-900">First Name</label>
                  <input
                    className="neu-input w-full p-3 rounded-lg bg-slate-50 font-medium focus:bg-white"
                    placeholder="e.g. Alex"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-slate-900">Last Name</label>
                  <input
                    className="neu-input w-full p-3 rounded-lg bg-slate-50 font-medium focus:bg-white"
                    placeholder="e.g. Morgan"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="font-bold text-slate-900">Email Address (Locked)</label>
                  <div className="relative opacity-60 pointer-events-none">
                    <input
                      className="neu-input w-full p-3 rounded-lg bg-zinc-200 font-medium"
                      type="email"
                      value={user.email}
                      readOnly
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-slate-900">Phone Number</label>
                  <input
                    className="neu-input w-full p-3 rounded-lg bg-slate-50 font-medium focus:bg-white"
                    placeholder="(555) 000-0000"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Shipping / Company Info */}
            <section>
              <h3 className="text-xl font-black mb-6 border-b-2 border-slate-100 pb-2 flex items-center gap-2">
                <span className="bg-accent-lavender text-black p-1 rounded border-2 border-black shadow-[2px_2px_0_0_#000]">
                  <Building className="w-5 h-5 block" />
                </span>
                Shipping Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="font-bold text-slate-900">Street Address / Company</label>
                  <input
                    className="neu-input w-full p-3 rounded-lg bg-slate-50 font-medium focus:bg-white"
                    type="text"
                    placeholder="123 Printing Lane"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-slate-900">City</label>
                  <input
                    className="neu-input w-full p-3 rounded-lg bg-slate-50 font-medium focus:bg-white"
                    type="text"
                    placeholder="New York"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-bold text-slate-900">Zip / Postal Code</label>
                  <input
                    className="neu-input w-full p-3 rounded-lg bg-slate-50 font-medium focus:bg-white"
                    type="text"
                    placeholder="10001"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Security */}
            <section>
              <h3 className="text-xl font-black mb-6 border-b-2 border-slate-100 pb-2 flex items-center gap-2">
                <span className="bg-[#facc15] text-black p-1 rounded border-2 border-black shadow-[2px_2px_0_0_#000]">
                  <Lock className="w-5 h-5 block" />
                </span>
                Security
              </h3>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 w-full md:w-1/2">
                  <label className="font-bold text-slate-900">Update Password</label>
                  <input
                    className="neu-input w-full p-3 rounded-lg bg-slate-50 font-medium focus:bg-white"
                    placeholder="Enter new password to change..."
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <p className="text-xs text-zinc-500 font-medium mt-1">Leave blank to keep your current password.</p>
                </div>
              </div>
            </section>

          </div>
        </div>

      </div>
    </div>
  );
}