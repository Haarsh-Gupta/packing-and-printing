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
        <div className="flex items-center justify-between py-3.5 border-b border-slate-100 dark:border-slate-800">
            <div>
                <p className="text-[13px] font-semibold text-slate-900 dark:text-white m-0">{label}</p>
                {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0">{description}</p>}
            </div>
            <button
                onClick={() => setOn(v => !v)}
                className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${on ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
                <div 
                    className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-all duration-200 ${on ? 'left-[23px]' : 'left-[3px]'}`} 
                />
            </button>
        </div>
    );
};

const Field = ({ label, defaultValue = "", type = "text", disabled = false }: { label: string; defaultValue?: string; type?: string; disabled?: boolean }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 tracking-tight">
            {label}
        </label>
        <input
            type={type} defaultValue={defaultValue} disabled={disabled}
            className={`h-9 px-3 border rounded-lg text-[13px] font-sans outline-none w-full box-border transition-colors
                ${disabled 
                    ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500' 
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500'
                }`}
        />
    </div>
);

export default function Settings() {
    const [activeTab, setActiveTab] = useState("general");
    const [saving, setSaving] = useState(false);
    
    // Check initial layout without causing hydration mismatch
    const [themeMode, setThemeMode] = useState(() => {
        if (typeof document !== 'undefined') {
            return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        }
        return 'system';
    });

    const handleSave = () => {
        setSaving(true);
        setTimeout(() => setSaving(false), 800);
    };

    // Apply dark mode toggle
    const applyTheme = (mode: string) => {
        setThemeMode(mode);
        const root = document.documentElement;
        if (mode === 'dark') {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else if (mode === 'light') {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            localStorage.removeItem('theme');
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark');
            else root.classList.remove('dark');
        }
    };

    return (
        <div className="animate-fade-in flex flex-col gap-5 font-sans h-full">

            {/* Header */}
            <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white m-0">Settings</h1>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Manage your workspace preferences</p>
            </div>

            <div className="flex flex-col md:flex-row gap-5 items-start">

                {/* Left nav */}
                <div className="w-full md:w-[200px] shrink-0 bg-white dark:bg-slate-900 rounded-xl p-2 border border-black/5 dark:border-slate-800 shadow-sm">
                    {SETTING_TABS.map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
                                className={`flex items-center gap-2.5 w-full p-2.5 rounded-lg text-[13px] font-sans text-left transition-all ${
                                    active 
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold' 
                                        : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}
                            >
                                <Icon size={14} className={active ? 'text-blue-500' : 'text-slate-400'} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 w-full bg-white dark:bg-slate-900 rounded-xl p-6 md:p-7 border border-black/5 dark:border-slate-800 shadow-sm">

                    {activeTab === "general" && (
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Store Information</h2>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-6">Update your store's basic details and contact information.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
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
                            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Account Details</h2>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-6">Manage your admin profile information.</p>
                            <div className="flex flex-col gap-4 max-w-md">
                                <Field label="Full Name" defaultValue="Admin User" />
                                <Field label="Email Address" defaultValue="admin@navart.com" />
                                <Field label="Role" defaultValue="Super Administrator" disabled />
                            </div>
                        </div>
                    )}

                    {activeTab === "appearance" && (
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Appearance</h2>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-6">Customize the look and feel of your workspace.</p>

                            {/* Theme selector */}
                            <div className="mb-7">
                                <p className="text-[13px] font-semibold text-slate-900 dark:text-white mb-3">Theme</p>
                                <div className="flex flex-wrap gap-2.5">
                                    {[
                                        { id: 'light', label: 'Light', icon: Sun },
                                        { id: 'dark', label: 'Dark', icon: Moon },
                                        { id: 'system', label: 'System', icon: Monitor },
                                    ].map(t => {
                                        const Icon = t.icon;
                                        const active = themeMode === t.id;
                                        return (
                                            <button key={t.id} onClick={() => applyTheme(t.id)} 
                                                className={`flex flex-col items-center gap-2 p-4 px-6 rounded-xl border-2 transition-all font-sans ${
                                                    active 
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                            >
                                                <Icon size={20} className={active ? 'text-blue-500' : 'text-slate-500 dark:text-slate-400'} />
                                                <span className={`text-xs font-semibold ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                                    {t.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2.5">
                                    Dark mode uses deeply dark tones for comfortable nighttime use.
                                </p>
                            </div>

                            {/* Color accent */}
                            <div className="mb-7">
                                <p className="text-[13px] font-semibold text-slate-900 dark:text-white mb-2.5">Color Accent</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Select the primary color for interactive elements.</p>
                                <div className="flex gap-2.5">
                                    {['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#18181b'].map(color => (
                                        <button key={color} 
                                            className="w-8 h-8 rounded-full border-[3px] border-white dark:border-slate-900 cursor-pointer shadow-[0_0_0_2px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_2px_rgba(255,255,255,0.1)]"
                                            style={{ background: color }} 
                                            title={color} 
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "notifications" && (
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Notifications</h2>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-6">Configure email and in-app alert behavior.</p>
                            <ToggleRow label="New Order Alerts" description="Get notified when a new order is placed" defaultOn={true} />
                            <ToggleRow label="Low Inventory Warnings" description="Alert when product stock falls below threshold" defaultOn={true} />
                            <ToggleRow label="Customer Inquiry Notifications" description="Get alerts for new inquiries" defaultOn={true} />
                            <ToggleRow label="Support Ticket Updates" description="Notify on new messages in tickets" defaultOn={false} />
                            <ToggleRow label="Weekly Summary Report" description="Receive weekly performance digest via email" defaultOn={false} />
                        </div>
                    )}

                    {activeTab === "security" && (
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Security</h2>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-6">Update your password and authentication settings.</p>
                            <div className="flex flex-col gap-4 max-w-md">
                                <Field label="Current Password" type="password" />
                                <Field label="New Password" type="password" />
                                <Field label="Confirm New Password" type="password" />
                            </div>
                            <div className="mt-7 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 max-w-md">
                                <p className="text-[13px] font-semibold text-slate-900 dark:text-white mb-1">Two-Factor Authentication</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Add an extra layer of security to your account</p>
                                <button className="h-9 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-semibold font-sans hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors">
                                    Enable 2FA
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "payments" && (
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Payment Gateway</h2>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-6">Configure Razorpay integration and payment settings.</p>
                            <div className="flex flex-col gap-4 max-w-md">
                                <Field label="Razorpay Key ID" defaultValue="rzp_test_xxxxxx" type="password" />
                                <Field label="Razorpay Secret" defaultValue="•••••••••••••••••" type="password" />
                                <Field label="Webhook Secret" defaultValue="whsec_xxxxxx" type="password" />
                            </div>
                            <div className="mt-5 p-3.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700/50 max-w-md">
                                <p className="text-xs text-amber-800 dark:text-amber-400 m-0">
                                    ⚠️ These credentials are stored securely. Never share your secret keys.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Save button */}
                    <div className="flex justify-end mt-7 pt-5 border-t border-slate-100 dark:border-slate-800">
                        <button
                            onClick={handleSave} disabled={saving}
                            className={`h-9 px-5 rounded-lg flex items-center gap-2 text-[13px] font-semibold font-sans transition-all
                                ${saving 
                                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                                    : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
                                }`}
                        >
                            {saving
                                ? <Loader2 size={14} className="animate-spin" />
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
