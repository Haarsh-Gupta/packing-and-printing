"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, Save, UploadCloud, User as UserIcon, Lock, MapPin, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { SettingsSkeleton } from "./SettingsSkeleton";
import { useAlert } from "@/components/CustomAlert";


interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  profile_picture: string | null;
}

// Predefined Avatars
const MALE_AVATARS = ["Alexander", "Liam", "Noah", "Oliver", "William", "James", "Benjamin", "Lucas"].map(seed => `https://api.dicebear.com/9.x/open-peeps/svg?seed=${seed}&backgroundColor=b6e3f4`);
const FEMALE_AVATARS = ["Sophia", "Emma", "Olivia", "Ava", "Isabella", "Mia", "Charlotte", "Amelia"].map(seed => `https://api.dicebear.com/9.x/open-peeps/svg?seed=${seed}&backgroundColor=c0aede`);

import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false); // Context handles initial load, but for settings specific local loads

  // Form States
  const [avatarTab, setAvatarTab] = useState("upload");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [personalInfo, setPersonalInfo] = useState({ name: "", phone: "" });
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  const [passwordData, setPasswordData] = useState({ password: "" });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Address Logic (Mocked for Demo as per request)
  const [address, setAddress] = useState({ street: "", city: "", zip: "" });
  const [isAddressNew, setIsAddressNew] = useState(true);
  const [isEditingAddress, setIsEditingAddress] = useState(true); // Default valid for new
  const [addressAuthPassword, setAddressAuthPassword] = useState("");
  const [isAddressUnlocked, setIsAddressUnlocked] = useState(false);

  const { showAlert } = useAlert();

  useEffect(() => {
    if (user) {
      setPersonalInfo({ name: user.name, phone: user.phone || "" });
      setSelectedAvatar(user.profile_picture || "");
    }
  }, [user]);

  useEffect(() => {
    // Load mocked address
    const savedAddr = localStorage.getItem("client_shipping_address");
    if (savedAddr) {
      setAddress(JSON.parse(savedAddr));
      setIsAddressNew(false);
      setIsEditingAddress(false);
    }
  }, []);

  // --- 1. Profile Picture Handlers ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAvatarTab("upload"); // Set to upload tab if file selected
    }
  };

  const saveProfilePicture = async () => {
    setIsUploading(true);
    let finalUrl = selectedAvatar;

    try {
      // 1. Handle Upload if in Upload Tab and a file is selected
      if (avatarTab === "upload" && uploadFile) {
        const formData = new FormData();
        formData.append("file", uploadFile);

        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/?purpose=profile`, {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
          body: formData
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(errorData.detail || "Upload failed");
        }

        const uploadData = await uploadRes.json();
        finalUrl = uploadData.url;
      }
      // 2. If in Avatar Tab, finalUrl is already selectedAvatar from state

      // 3. Update User Profile
      await updateUser({ profile_picture: finalUrl });
      showAlert("Profile picture updated!", "success");
      setUploadFile(null); // Reset
    } catch (e: any) {
      showAlert(e.message || "Failed to update profile picture", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // --- 2. Personal Info Handler ---
  const savePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInfo(true);
    try {
      await updateUser(personalInfo);
      showAlert("Personal details saved.", "success");
    } catch (e: any) {
      showAlert(e.message || "Failed to save info.", "error");
    } finally {
      setIsSavingInfo(false);
    }
  };

  // --- 3. Password Handler ---
  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.password) return;
    setIsSavingPassword(true);
    try {
      await updateUser({ password: passwordData.password });
      showAlert("Password updated securely.", "success");
      setPasswordData({ password: "" });
    } catch (e: any) {
      showAlert(e.message || "Failed to update password.", "error");
    } finally {
      setIsSavingPassword(false);
    }
  };

  // --- 4. Address Logic ---
  const handleUnlockAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (addressAuthPassword) {
      setIsAddressUnlocked(true);
      setIsEditingAddress(true);
      setAddressAuthPassword("");
    } else {
      showAlert("Please enter your password to edit address.", "error");
    }
  };

  const saveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("client_shipping_address", JSON.stringify(address));
    setIsAddressNew(false);
    setIsEditingAddress(false);
    setIsAddressUnlocked(false);
    showAlert("Address saved locally (Demo).", "success");
  };


  // Helper to call backend update
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



  if (isLoading) return <SettingsSkeleton />;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="border-b-4 border-black pb-6">
        <h1 className="text-5xl font-black uppercase tracking-tighter">My Profile</h1>
        <p className="text-xl font-bold text-zinc-500 mt-2">Manage your printing preferences and account security.</p>
      </div>

      <div className="grid gap-8">

        {/* SECTION 1: Profile Picture */}
        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden">
          <CardHeader className="bg-zinc-50 border-b-2 border-black">
            <CardTitle className="flex items-center gap-2 font-black uppercase tracking-tight"><ImageIcon className="w-5 h-5" /> Profile Appearance</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-8 items-start">

              {/* Preview Circle */}
              <div className="shrink-0 mx-auto md:mx-0">
                <div className="h-40 w-40 rounded-full border-4 border-black overflow-hidden shadow-md bg-white">
                  <img
                    src={previewUrl || user?.profile_picture || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name}`}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="flex-1 w-full">
                <div className="w-full">
                  <div className="grid w-full grid-cols-2 border-2 border-black h-12 bg-white mb-6 rounded-full overflow-hidden">
                    <button
                      onClick={() => setAvatarTab("upload")}
                      className={`font-bold text-md transition-colors ${avatarTab === "upload" ? "bg-black text-white" : "bg-white text-black hover:bg-zinc-50"}`}
                    >
                      Upload Photo
                    </button>
                    <button
                      onClick={() => setAvatarTab("avatar")}
                      className={`font-bold text-md border-l-2 border-black transition-colors ${avatarTab === "avatar" ? "bg-[#90e8ff] text-black" : "bg-white text-black hover:bg-zinc-50"}`}
                    >
                      Choose Avatar
                    </button>
                  </div>

                  {avatarTab === "upload" && (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-zinc-300 p-8 text-center hover:bg-zinc-50 transition-colors cursor-pointer relative rounded-2xl">
                        <input type="file" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                        <UploadCloud className="w-10 h-10 mx-auto text-zinc-400 mb-2" />
                        <p className="font-bold text-zinc-600">Click to upload or drag and drop</p>
                        <p className="text-xs text-zinc-400">JPG, PNG or GIF (Max 2MB)</p>
                      </div>
                      {uploadFile && <p className="text-sm font-bold text-green-600 flex items-center"><CheckCircle2 className="w-4 h-4 mr-1" /> Selected: {uploadFile.name}</p>}
                      <Button onClick={saveProfilePicture} disabled={!uploadFile || isUploading} className="w-full bg-black text-white rounded-full border-2 border-black hover:bg-zinc-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-widest font-black">
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Upload & Save Photo"}
                      </Button>
                    </div>
                  )}

                  {avatarTab === "avatar" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 border-2 border-zinc-100">
                        {[...MALE_AVATARS, ...FEMALE_AVATARS].map((url, i) => (
                          <div
                            key={i}
                            onClick={() => { setSelectedAvatar(url); setPreviewUrl(url); }}
                            className={`aspect-square rounded-full border-2 cursor-pointer transition-all hover:scale-110 overflow-hidden ${selectedAvatar === url ? 'border-black ring-2 ring-black ring-offset-1' : 'border-zinc-200'}`}
                          >
                            <img src={url} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                      <Button onClick={saveProfilePicture} disabled={isUploading} className="w-full bg-[#90e8ff] text-black rounded-full border-2 border-black hover:bg-[#7dd3ea] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-widest font-black">
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Use Selected Avatar"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">

          {/* SECTION 2: Personal Details */}
          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden h-fit">
            <CardHeader className="bg-zinc-50 border-b-2 border-black">
              <CardTitle className="flex items-center gap-2 font-black uppercase tracking-tight"><UserIcon className="w-5 h-5" /> Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={savePersonalInfo} className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-bold">Full Name</Label>
                  <Input value={personalInfo.name} onChange={e => setPersonalInfo({ ...personalInfo, name: e.target.value })} className="border-2 border-black rounded-none" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold uppercase text-[10px] tracking-widest text-zinc-500">Phone Number</Label>
                  <Input value={personalInfo.phone} onChange={e => setPersonalInfo({ ...personalInfo, phone: e.target.value })} className="border-2 border-black rounded-lg" />
                </div>
                <Button disabled={isSavingInfo} className="w-full bg-black text-white rounded-full border-2 border-black hover:bg-zinc-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black uppercase tracking-widest">
                  {isSavingInfo ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save Details"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* SECTION 3: Address (With Special Logic) */}
          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden h-fit">
            <CardHeader className="bg-zinc-50 border-b-2 border-black">
              <CardTitle className="flex items-center gap-2 font-black uppercase tracking-tight"><MapPin className="w-5 h-5" /> Shipping Address</CardTitle>
              <CardDescription className="font-bold text-xs uppercase tracking-widest">
                {isAddressNew ? "Add your primary shipping address." : "Secure address management."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {/* LOCKED STATE: Show only if address exists and is locked */}
              {!isAddressNew && !isEditingAddress && !isAddressUnlocked ? (
                <div className="text-center py-6 space-y-4">
                  <MapPin className="w-12 h-12 mx-auto text-black" />
                  <div>
                    <p className="font-bold text-lg">{address.street}</p>
                    <p className="text-zinc-600">{address.city} - {address.zip}</p>
                  </div>
                  <div className="pt-4 border-t-2 border-zinc-100">
                    <Label className="mb-2 block text-sm font-bold">Enter Password to Edit Address</Label>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        placeholder="Current Password"
                        value={addressAuthPassword}
                        onChange={(e) => setAddressAuthPassword(e.target.value)}
                        className="border-2 border-black rounded-lg"
                      />
                      <Button onClick={handleUnlockAddress} className="bg-black text-white border-2 border-black rounded-full hover:bg-zinc-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black uppercase">Unlock</Button>
                    </div>
                  </div>
                </div>
              ) : (
                /* EDIT/NEW FORM STATE */
                <form onSubmit={saveAddress} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Street Address</Label>
                    <Input
                      value={address.street}
                      onChange={e => setAddress({ ...address, street: e.target.value })}
                      required
                      className="border-2 border-black rounded-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold">City</Label>
                      <Input
                        value={address.city}
                        onChange={e => setAddress({ ...address, city: e.target.value })}
                        required
                        className="border-2 border-black rounded-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">Zip Code</Label>
                      <Input
                        value={address.zip}
                        onChange={e => setAddress({ ...address, zip: e.target.value })}
                        required
                        className="border-2 border-black rounded-none"
                      />
                    </div>
                  </div>
                  <Button className="w-full bg-[#fdf567] text-black rounded-full border-2 border-black hover:bg-[#e6de5a] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black uppercase transition-all">
                    Save Address
                  </Button>
                  {!isAddressNew && (
                    <button
                      type="button"
                      onClick={() => { setIsEditingAddress(false); setIsAddressUnlocked(false); }}
                      className="w-full text-center text-sm font-bold underline mt-2"
                    >
                      Cancel
                    </button>
                  )}
                </form>
              )}
            </CardContent>
          </Card>

          {/* SECTION 4: Security */}
          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden h-fit md:col-span-2">
            <CardHeader className="bg-zinc-50 border-b-2 border-black">
              <CardTitle className="flex items-center gap-2 font-black uppercase tracking-tight"><Lock className="w-5 h-5" /> Security</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={savePassword} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label className="font-bold">Email Address</Label>
                  <Input value={user?.email || ""} disabled className="bg-zinc-100 border-2 border-black rounded-none opacity-100 text-zinc-500" />
                </div>
                <div className="space-y-2 pt-4 border-t-2 border-zinc-100">
                  <Label className="font-bold">New Password</Label>
                  <Input
                    type="password"
                    value={passwordData.password}
                    onChange={e => setPasswordData({ password: e.target.value })}
                    placeholder="Enter new password"
                    className="border-2 border-black rounded-lg"
                  />
                </div>
                <Button disabled={isSavingPassword} className="bg-black text-white rounded-full border-2 border-black hover:bg-zinc-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black uppercase px-8">
                  {isSavingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}