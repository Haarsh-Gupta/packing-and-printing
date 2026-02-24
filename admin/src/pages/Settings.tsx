import { useState } from "react";
import { User, CreditCard, Bell, Shield, Key, Save, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const TABS = [
    { id: "general", label: "General", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "payments", label: "Payments", icon: CreditCard },
];

export default function Settings() {
    const [activeTab, setActiveTab] = useState("general");
    const [saving, setSaving] = useState(false);

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => setSaving(false), 800);
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: "'DM Sans', system-ui" }}>

            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                paddingBottom: '24px',
                borderBottom: '1px solid var(--border)',
            }}>
                <div>
                    <p style={{
                        fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em',
                        textTransform: 'uppercase', color: 'var(--muted-foreground)',
                        fontFamily: "'DM Mono', monospace", marginBottom: '4px',
                    }}>Configuration</p>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>
                        Settings
                    </h1>
                </div>
            </div>

            <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>

                {/* Sidebar Navigation */}
                <div style={{ width: "240px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: "flex", alignItems: "center", gap: "10px",
                                    padding: "10px 14px", borderRadius: "8px",
                                    border: "none", background: active ? "var(--secondary)" : "transparent",
                                    color: active ? "var(--foreground)" : "var(--muted-foreground)",
                                    fontSize: "13px", fontWeight: 700, cursor: "pointer",
                                    transition: "all 0.15s",
                                    textAlign: "left"
                                }}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, padding: "32px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px" }}>

                    {activeTab === "general" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <div>
                                <h2 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "4px", letterSpacing: "-0.02em" }}>General Settings</h2>
                                <p style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>Manage your main application settings here.</p>
                            </div>
                            <Separator />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Platform Name</label>
                                    <Input defaultValue="BookBind Platform" />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Support Email</label>
                                    <Input defaultValue="support@bookbind.in" />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Tax Rate (%)</label>
                                    <Input type="number" defaultValue="18" />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Currency</label>
                                    <Input defaultValue="INR (₹)" disabled />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "security" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <div>
                                <h2 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "4px", letterSpacing: "-0.02em" }}>Security</h2>
                                <p style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>Update passwords and authentication settings.</p>
                            </div>
                            <Separator />
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "400px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Current Password</label>
                                    <Input type="password" />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>New Password</label>
                                    <Input type="password" />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Confirm new Password</label>
                                    <Input type="password" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "notifications" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <div>
                                <h2 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "4px", letterSpacing: "-0.02em" }}>Notifications</h2>
                                <p style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>Configure email and alert behavior.</p>
                            </div>
                            <Separator />
                            <p style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>Notification preferences to be mapped to the backend structure.</p>
                        </div>
                    )}

                    {activeTab === "payments" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <div>
                                <h2 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "4px", letterSpacing: "-0.02em" }}>Payments & Gateways</h2>
                                <p style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>Configure Razorpay integration and other wallets.</p>
                            </div>
                            <Separator />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px", maxWidth: "400px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Razorpay Key ID</label>
                                    <Input defaultValue="rzp_test_xxxxxx" type="password" />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Razorpay Secret</label>
                                    <Input defaultValue="•••••••••••••••••" type="password" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--border)" }}>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <><Save size={14} style={{ marginRight: "6px" }} /> Save Changes</>}
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
}
