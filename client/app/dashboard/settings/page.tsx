"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, UploadCloud, User as UserIcon } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  profile_picture: string | null;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: "", phone: "", password: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setFormData({ name: data.name, phone: data.phone || "", password: "" });
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Prepare payload based on your UserUpdate schema (ignore empty password)
    const payload: any = { name: formData.name, phone: formData.phone };
    if (formData.password) payload.password = formData.password;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Profile updated successfully!");
        const updatedData = await res.json();
        setUser(updatedData);
        setFormData({ ...formData, password: "" }); // clear password field
      } else {
        const err = await res.json();
        alert(`Failed to update: ${err.detail}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  const avatarUrl = user?.profile_picture || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name}&backgroundColor=ffffff`;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-4xl font-black uppercase tracking-tighter">Account Settings</h1>
        <p className="text-zinc-600 mt-2">Manage your profile, security, and preferences.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Left Col: Avatar Upload */}
        <div className="col-span-1">
          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none text-center">
            <CardContent className="pt-6 flex flex-col items-center space-y-4">
              <div className="h-32 w-32 rounded-full border-4 border-black bg-white flex items-center justify-center overflow-hidden shadow-sm relative group cursor-pointer">
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover group-hover:opacity-50 transition-opacity" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <UploadCloud className="w-8 h-8 text-black" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg">{user?.name}</h3>
                <p className="text-sm text-zinc-500">{user?.email}</p>
              </div>
              <Button variant="outline" className="w-full border-2 border-black rounded-none">
                Change Picture
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Forms */}
        <div className="col-span-2 space-y-6">
          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none">
            <CardHeader className="border-b-2 border-black bg-zinc-50">
              <CardTitle className="flex items-center gap-2"><UserIcon className="w-5 h-5"/> Personal Details</CardTitle>
              <CardDescription>Update your contact information.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSave} className="space-y-4">
                
                <div className="space-y-2">
                  <Label className="font-bold">Email Address (Read-only)</Label>
                  <Input value={user?.email} disabled className="border-2 border-black rounded-none bg-zinc-100" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold">Full Name</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      className="border-2 border-black rounded-none" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Phone Number</Label>
                    <Input 
                      value={formData.phone} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                      className="border-2 border-black rounded-none" 
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t-2 border-zinc-100">
                  <Label className="font-bold">New Password</Label>
                  <Input 
                    type="password"
                    placeholder="Leave blank to keep current password"
                    value={formData.password} 
                    onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    className="border-2 border-black rounded-none" 
                  />
                  <p className="text-xs text-zinc-500">Min 6 chars, 1 uppercase, 1 lowercase, 1 number.</p>
                </div>

                <Button type="submit" disabled={isSaving} className="w-full bg-black text-white rounded-none border-2 border-black hover:bg-zinc-800 mt-4 h-12 text-lg">
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}