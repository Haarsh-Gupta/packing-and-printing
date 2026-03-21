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
        <div className="flex items-center justify-between py-4 border-b border-[#434655]/20">
            <div>
                <p className="text-[13px] font-extrabold text-[#dae2fd] m-0">{label}</p>
                {description && <p className="text-[11px] text-[#c3c5d8]/70 mt-0.5 m-0 font-medium">{description}</p>}
            </div>
            <button
                onClick={() => setOn(v => !v)}
                className={`relative w-10 h-[22px] rounded-full shrink-0 transition-colors ${on ? 'bg-[#34d399]' : 'bg-[#0b1326] border border-[#434655]/40'}`}
            >
                <div 
                    className={`absolute top-[2px] w-[16px] h-[16px] rounded-full bg-white shadow-sm transition-all duration-200 ${on ? 'left-[20px]' : 'left-[2px] bg-[#434655]'}`} 
                />
            </button>
        </div>
    );
};

const Field = ({ label, defaultValue = "", type = "text", disabled = false }: { label: string; defaultValue?: string; type?: string; disabled?: boolean }) => (
    <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[#c3c5d8]">
            {label}
        </label>
        <input
            type={type} defaultValue={defaultValue} disabled={disabled}
            className={`h-10 px-3 border rounded-lg text-sm font-bold outline-none w-full box-border transition-colors
                ${disabled 
                    ? 'border-[#434655]/20 bg-[#060e20]/50 text-[#8d90a1]' 
                    : 'border-[#434655]/40 bg-[#0b1326] text-[#dae2fd] focus:border-[#adc6ff]'
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
        <div className="flex flex-col h-full font-['Inter'] bg-[#0b1326] text-[#dae2fd] px-2 pb-12">

            {/* Header */}
            <div className="mb-8">
                <nav className="flex items-center gap-2 text-[10px] font-bold text-[#adc6ff] mb-2 tracking-widest uppercase">
                    <span>System</span>
                    <span>/</span>
                    <span className="text-[#c3c5d8]/60">Configuration</span>
                </nav>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#dae2fd] m-0">Global Parameters</h1>
                <p className="text-xs text-[#c3c5d8] mt-1 m-0">Manage workspace variables and system behaviors</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">

                {/* Left nav */}
                <div className="w-full md:w-[240px] shrink-0 bg-[#131b2e] rounded-2xl p-3 border border-[#434655]/20 shadow-sm">
                    {SETTING_TABS.map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
                                className={`flex items-center gap-3 w-full p-3 rounded-xl text-[11px] uppercase tracking-widest transition-all ${
                                    active 
                                        ? 'bg-[#1f70e3]/10 text-[#adc6ff] font-extrabold border border-[#1f70e3]/20' 
                                        : 'bg-transparent text-[#8d90a1] font-bold hover:bg-[#171f33] hover:text-[#c3c5d8] border border-transparent'
                                }`}
                            >
                                <Icon size={16} className={active ? 'text-[#1f70e3]' : 'text-[#434655]'} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="flex-1 w-full bg-[#131b2e] rounded-2xl border border-[#434655]/20 shadow-sm flex flex-col min-h-[500px]">

                    <div className="p-8 flex-1">
                        {activeTab === "general" && (
                            <div className="animate-fade-in">
                                <h2 className="text-lg font-extrabold text-[#dae2fd] mb-1">Store Information</h2>
                                <p className="text-xs text-[#c3c5d8] mb-8">Update your entity's basic details and contact vectors.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                                    <Field label="Platform Name" defaultValue="Navart Packing & Printing" />
                                    <Field label="Support Vector (Email)" defaultValue="support@navart.in" />
                                    <Field label="Tax Rate (%)" defaultValue="18" type="number" />
                                    <Field label="Baseline Currency" defaultValue="INR (₹)" disabled />
                                    <Field label="Contact Comm" defaultValue="+91 98765 43210" />
                                    <Field label="Physical Location" defaultValue="Mumbai, India" />
                                </div>
                            </div>
                        )}

                        {activeTab === "account" && (
                            <div className="animate-fade-in">
                                <h2 className="text-lg font-extrabold text-[#dae2fd] mb-1">Account Vectors</h2>
                                <p className="text-xs text-[#c3c5d8] mb-8">Manage personal profile parameters.</p>
                                <div className="flex flex-col gap-6 max-w-md">
                                    <Field label="Master Identity" defaultValue="Admin User" />
                                    <Field label="Communication Key" defaultValue="admin@navart.com" />
                                    <Field label="Hierarchy Level" defaultValue="Super Administrator" disabled />
                                </div>
                            </div>
                        )}

                        {activeTab === "appearance" && (
                            <div className="animate-fade-in">
                                <h2 className="text-lg font-extrabold text-[#dae2fd] mb-1">Interface Aesthetics</h2>
                                <p className="text-xs text-[#c3c5d8] mb-8">Customize visual parameters for this terminal.</p>

                                {/* Theme selector */}
                                <div className="mb-10">
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-[#c3c5d8] mb-4">Luminance Mode</p>
                                    <div className="flex flex-wrap gap-4">
                                        {[
                                            { id: 'light', label: 'Light', icon: Sun },
                                            { id: 'dark', label: 'Dark', icon: Moon },
                                            { id: 'system', label: 'System', icon: Monitor },
                                        ].map(t => {
                                            const Icon = t.icon;
                                            const active = themeMode === t.id;
                                            return (
                                                <button key={t.id} onClick={() => applyTheme(t.id)} 
                                                    className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${
                                                        active 
                                                            ? 'border-[#1f70e3] bg-[#1f70e3]/10' 
                                                            : 'border-[#434655]/40 bg-[#0b1326] hover:border-[#adc6ff]/50'
                                                    }`}
                                                >
                                                    <Icon size={24} className={active ? 'text-[#adc6ff]' : 'text-[#434655]'} />
                                                    <span className={`text-[10px] uppercase tracking-widest font-bold ${active ? 'text-[#adc6ff]' : 'text-[#8d90a1]'}`}>
                                                        {t.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Color accent */}
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-[#c3c5d8] mb-4">Primary Hue</p>
                                    <div className="flex gap-3">
                                        {['#1f70e3', '#34d399', '#8b5cf6', '#f59e0b', '#ffb4ab'].map(color => (
                                            <button key={color} 
                                                className="w-10 h-10 rounded-full cursor-pointer hover:scale-110 transition-transform"
                                                style={{ background: color, boxShadow: `0 0 0 2px #131b2e, 0 0 0 4px ${color}40` }} 
                                                title={color} 
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "notifications" && (
                            <div className="animate-fade-in">
                                <h2 className="text-lg font-extrabold text-[#dae2fd] mb-1">Alerter Protocol</h2>
                                <p className="text-xs text-[#c3c5d8] mb-8">Configure system push parameters.</p>
                                <div className="max-w-2xl bg-[#0b1326] rounded-2xl border border-[#434655]/30 p-2">
                                    <div className="px-4"><ToggleRow label="New Order Triggers" description="Ping upon structural order creation" defaultOn={true} /></div>
                                    <div className="px-4"><ToggleRow label="Inventory Depletion" description="Alert when stock hits critical threshold" defaultOn={true} /></div>
                                    <div className="px-4"><ToggleRow label="Inbound Queries" description="Notify for external contact submissions" defaultOn={true} /></div>
                                    <div className="px-4"><ToggleRow label="Support Threads" description="Updates on active resolution channels" defaultOn={false} /></div>
                                    <div className="px-4 border-b-0"><ToggleRow label="Digest Rollup" description="Compile weekly analytical payload" defaultOn={false} /></div>
                                </div>
                            </div>
                        )}

                        {activeTab === "security" && (
                            <div className="animate-fade-in">
                                <h2 className="text-lg font-extrabold text-[#dae2fd] mb-1">Security Systems</h2>
                                <p className="text-xs text-[#c3c5d8] mb-8">Manage cryptographic keys and auth barriers.</p>
                                <div className="flex flex-col gap-6 max-w-md">
                                    <Field label="Current Hashword" type="password" />
                                    <Field label="New Hashword" type="password" />
                                    <Field label="Verify Hashword" type="password" />
                                </div>
                                <div className="mt-8 p-6 bg-[#0b1326] rounded-2xl border border-[#434655]/30 max-w-md">
                                    <div className="w-10 h-10 bg-[#1f70e3]/10 text-[#1f70e3] rounded-xl flex items-center justify-center mb-4"><Shield size={20} /></div>
                                    <p className="text-sm font-extrabold text-[#dae2fd] mb-1">Multi-Factor Lock</p>
                                    <p className="text-[11px] text-[#8d90a1] mb-5">Enforce high-security TOTP validation upon login.</p>
                                    <button className="h-10 px-6 bg-[#adc6ff] hover:bg-white text-[#001a42] rounded-lg text-[11px] font-extrabold uppercase tracking-widest transition-colors w-full">
                                        Initialize 2FA
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === "payments" && (
                            <div className="animate-fade-in">
                                <h2 className="text-lg font-extrabold text-[#dae2fd] mb-1">Transaction Node</h2>
                                <p className="text-xs text-[#c3c5d8] mb-8">Link external economic processors.</p>
                                <div className="flex flex-col gap-6 max-w-md">
                                    <Field label="Processor Public Key" defaultValue="rzp_test_xxxxxx" type="password" />
                                    <Field label="Processor Private Key" defaultValue="•••••••••••••••••" type="password" />
                                    <Field label="Webhook Crypto Secret" defaultValue="whsec_xxxxxx" type="password" />
                                </div>
                                <div className="mt-8 p-4 bg-[#f59e0b]/10 rounded-xl border border-[#f59e0b]/20 max-w-md flex items-start gap-4">
                                    <Shield size={20} className="text-[#fcd34d] shrink-0 mt-0.5" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#fcd34d] leading-relaxed">
                                        Warning: These variables define economic flow. Treat them with absolute confidentiality.
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Save button footer */}
                    <div className="p-6 bg-[#060e20]/50 border-t border-[#434655]/20 flex justify-end shrink-0">
                        <button
                            onClick={handleSave} disabled={saving}
                            className={`h-11 px-8 rounded-xl flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest transition-all
                                ${saving 
                                    ? 'bg-[#434655]/30 text-[#8d90a1] cursor-not-allowed' 
                                    : 'bg-[#adc6ff] hover:bg-white text-[#001a42] shadow-[0_4px_12px_rgba(173,198,255,0.2)]'
                                }`}
                        >
                            {saving
                                ? <Loader2 size={16} className="animate-spin" />
                                : <Save size={16} />
                            }
                            {saving ? 'Committing...' : 'Commit Configuration'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
