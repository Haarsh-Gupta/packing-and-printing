import { useState } from "react";
import { User, Shield, Bell, CreditCard, Save, Loader2, Sun, Moon, Monitor, Globe, Mail, Lock, KeyRound, Palette } from "lucide-react";

const SETTING_TABS = [
    { id: "general", label: "General", icon: Globe },
    { id: "account", label: "Account", icon: User },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "payments", label: "Payment Gateway", icon: CreditCard },
];

const ToggleRow = ({ label, description, defaultOn = false }: { label: string; description?: string; defaultOn?: boolean }) => {
    const [on, setOn] = useState(defaultOn);
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #f4f4f5' }}>
            <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#18181b', margin: 0 }}>{label}</p>
                {description && <p style={{ fontSize: '12px', color: '#71717a', margin: '2px 0 0' }}>{description}</p>}
            </div>
            <button
                onClick={() => setOn(v => !v)}
                style={{
                    width: '44px', height: '24px', borderRadius: '999px', border: 'none',
                    background: on ? '#3b82f6' : '#e4e4e7',
                    cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}
            >
                <div style={{
                    width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                    position: 'absolute', top: '3px',
                    left: on ? '23px' : '3px', transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
            </button>
        </div>
    );
};

const Field = ({ label, defaultValue = "", type = "text", disabled = false }: { label: string; defaultValue?: string; type?: string; disabled?: boolean }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#52525b', letterSpacing: '0' }}>
            {label}
        </label>
        <input
            type={type} defaultValue={defaultValue} disabled={disabled}
            style={{
                height: '38px', padding: '0 12px', border: '1px solid #e4e4e7', borderRadius: '9px',
                fontSize: '13px', color: disabled ? '#a1a1aa' : '#18181b',
                background: disabled ? '#f9f9f9' : 'white',
                fontFamily: "'Inter', system-ui", outline: 'none', width: '100%', boxSizing: 'border-box',
            }}
        />
    </div>
);

export default function Settings() {
    const [activeTab, setActiveTab] = useState("general");
    const [saving, setSaving] = useState(false);
    const [themeMode, setThemeMode] = useState("system");

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => setSaving(false), 800);
    };

    // Apply dark mode toggle
    const applyTheme = (mode: string) => {
        setThemeMode(mode);
        const root = document.documentElement;
        if (mode === 'dark') root.classList.add('dark');
        else if (mode === 'light') root.classList.remove('dark');
        else {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark');
            else root.classList.remove('dark');
        }
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: "'Inter', system-ui" }}>

            {/* Header */}
            <div>
                <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.025em', color: '#18181b', margin: 0 }}>Settings</h1>
                <p style={{ fontSize: '13px', color: '#71717a', marginTop: '3px' }}>Manage your workspace preferences</p>
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

                {/* Left nav */}
                <div style={{
                    width: '200px', flexShrink: 0, background: 'white', borderRadius: '14px', padding: '8px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
                }}>
                    {SETTING_TABS.map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                                display: 'flex', alignItems: 'center', gap: '9px', width: '100%',
                                padding: '10px 12px', borderRadius: '9px', border: 'none',
                                background: active ? '#f4f4f5' : 'transparent',
                                color: active ? '#18181b' : '#71717a',
                                fontSize: '13px', fontWeight: active ? 600 : 400,
                                cursor: 'pointer', transition: 'all 0.1s', textAlign: 'left',
                                fontFamily: "'Inter', system-ui",
                            }}>
                                <Icon size={14} style={{ color: active ? '#3b82f6' : '#a1a1aa' }} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div style={{
                    flex: 1, background: 'white', borderRadius: '14px', padding: '28px',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
                }}>

                    {activeTab === "general" && (
                        <div>
                            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#18181b', margin: '0 0 4px' }}>Store Information</h2>
                            <p style={{ fontSize: '13px', color: '#71717a', margin: '0 0 24px' }}>Update your store's basic details and contact information.</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '600px' }}>
                                <Field label="Platform Name" defaultValue="Navart Packing & Printing" />
                                <Field label="Support Email" defaultValue="support@navart.in" />
                                <Field label="Tax Rate (%)" defaultValue="18" type="number" />
                                <Field label="Currency" defaultValue="INR (₹)" disabled />
                                <Field label="Contact Phone" defaultValue="+91 98765 43210" />
                                <Field label="Business Location" defaultValue="Mumbai, India" />
                            </div>
                        </div>
                    )}

                    {activeTab === "account" && (
                        <div>
                            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#18181b', margin: '0 0 4px' }}>Account Details</h2>
                            <p style={{ fontSize: '13px', color: '#71717a', margin: '0 0 24px' }}>Manage your admin profile information.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '420px' }}>
                                <Field label="Full Name" defaultValue="Admin User" />
                                <Field label="Email Address" defaultValue="admin@navart.com" />
                                <Field label="Role" defaultValue="Super Administrator" disabled />
                            </div>
                        </div>
                    )}

                    {activeTab === "appearance" && (
                        <div>
                            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#18181b', margin: '0 0 4px' }}>Appearance</h2>
                            <p style={{ fontSize: '13px', color: '#71717a', margin: '0 0 24px' }}>Customize the look and feel of your workspace.</p>

                            {/* Theme selector */}
                            <div style={{ marginBottom: '28px' }}>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#18181b', marginBottom: '12px' }}>Theme</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {[
                                        { id: 'light', label: 'Light', icon: Sun },
                                        { id: 'dark', label: 'Dark', icon: Moon },
                                        { id: 'system', label: 'System', icon: Monitor },
                                    ].map(t => {
                                        const Icon = t.icon;
                                        const active = themeMode === t.id;
                                        return (
                                            <button key={t.id} onClick={() => applyTheme(t.id)} style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                                padding: '16px 24px', borderRadius: '12px', border: `2px solid ${active ? '#3b82f6' : '#e4e4e7'}`,
                                                background: active ? '#eff6ff' : 'white', cursor: 'pointer', transition: 'all 0.15s',
                                                fontFamily: "'Inter', system-ui",
                                            }}>
                                                <Icon size={20} style={{ color: active ? '#3b82f6' : '#71717a' }} />
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: active ? '#3b82f6' : '#52525b' }}>
                                                    {t.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <p style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '10px' }}>
                                    Dark mode uses warm gray tones for comfortable nighttime use.
                                </p>
                            </div>

                            {/* Color accent */}
                            <div style={{ marginBottom: '28px' }}>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#18181b', marginBottom: '10px' }}>Color Accent</p>
                                <p style={{ fontSize: '12px', color: '#71717a', marginBottom: '12px' }}>Select the primary color for interactive elements.</p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#18181b'].map(color => (
                                        <button key={color} style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            background: color, border: '3px solid white', cursor: 'pointer',
                                            boxShadow: '0 0 0 2px rgba(0,0,0,0.1)',
                                        }} title={color} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "notifications" && (
                        <div>
                            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#18181b', margin: '0 0 4px' }}>Notifications</h2>
                            <p style={{ fontSize: '13px', color: '#71717a', margin: '0 0 24px' }}>Configure email and in-app alert behavior.</p>
                            <ToggleRow label="New Order Alerts" description="Get notified when a new order is placed" defaultOn={true} />
                            <ToggleRow label="Low Inventory Warnings" description="Alert when product stock falls below threshold" defaultOn={true} />
                            <ToggleRow label="Customer Inquiry Notifications" description="Get alerts for new inquiries" defaultOn={true} />
                            <ToggleRow label="Support Ticket Updates" description="Notify on new messages in tickets" defaultOn={false} />
                            <ToggleRow label="Weekly Summary Report" description="Receive weekly performance digest via email" defaultOn={false} />
                        </div>
                    )}

                    {activeTab === "security" && (
                        <div>
                            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#18181b', margin: '0 0 4px' }}>Security</h2>
                            <p style={{ fontSize: '13px', color: '#71717a', margin: '0 0 24px' }}>Update your password and authentication settings.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '420px' }}>
                                <Field label="Current Password" type="password" />
                                <Field label="New Password" type="password" />
                                <Field label="Confirm New Password" type="password" />
                            </div>
                            <div style={{ marginTop: '28px', padding: '16px', background: '#f9f9f9', borderRadius: '12px', border: '1px solid #f0f0f0', maxWidth: '420px' }}>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#18181b', margin: '0 0 4px' }}>Two-Factor Authentication</p>
                                <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 12px' }}>Add an extra layer of security to your account</p>
                                <button style={{
                                    height: '34px', padding: '0 14px', background: '#18181b', color: 'white',
                                    border: 'none', borderRadius: '9px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer',
                                    fontFamily: "'Inter', system-ui",
                                }}>
                                    Enable 2FA
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "payments" && (
                        <div>
                            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#18181b', margin: '0 0 4px' }}>Payment Gateway</h2>
                            <p style={{ fontSize: '13px', color: '#71717a', margin: '0 0 24px' }}>Configure Razorpay integration and payment settings.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '420px' }}>
                                <Field label="Razorpay Key ID" defaultValue="rzp_test_xxxxxx" type="password" />
                                <Field label="Razorpay Secret" defaultValue="•••••••••••••••••" type="password" />
                                <Field label="Webhook Secret" defaultValue="whsec_xxxxxx" type="password" />
                            </div>
                            <div style={{ marginTop: '20px', padding: '14px 16px', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a', maxWidth: '420px' }}>
                                <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>
                                    ⚠️ These credentials are stored securely. Never share your secret keys.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Save button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #f4f4f5' }}>
                        <button
                            onClick={handleSave} disabled={saving}
                            style={{
                                height: '38px', padding: '0 20px',
                                background: saving ? '#e4e4e7' : '#18181b', color: saving ? '#a1a1aa' : 'white',
                                border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 600,
                                cursor: saving ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '7px',
                                fontFamily: "'Inter', system-ui", transition: 'all 0.12s',
                            }}
                        >
                            {saving
                                ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                                : <Save size={14} />
                            }
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
