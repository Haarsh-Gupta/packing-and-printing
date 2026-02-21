import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
    Settings2, User, Bell, Shield, Palette, Globe, Database,
    Save, Eye, EyeOff, Loader2, CheckCircle2, Moon, Sun, Monitor,
    Key, Mail, Phone, Building2, Lock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };

const SectionHeader = ({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '28px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={18} style={{ color: 'var(--foreground)' }} />
        </div>
        <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '3px' }}>{title}</h2>
            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontWeight: 500 }}>{desc}</p>
        </div>
    </div>
);

const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)', ...mono, marginBottom: '6px' }}>
        {children}{required && <span style={{ color: '#dc2626', marginLeft: '3px' }}>*</span>}
    </label>
);

const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', ...style }}>
        {children}
    </div>
);

const ToggleRow = ({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
        <div>
            <p style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>{label}</p>
            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontWeight: 500 }}>{desc}</p>
        </div>
        <Switch checked={checked} onCheckedChange={onChange} />
    </div>
);

type Tab = 'profile' | 'notifications' | 'appearance' | 'security' | 'system';

export default function SettingsPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', bio: '' });
    const [notifs, setNotifs] = useState({ emailOrders: true, emailInquiries: true, emailTickets: false, emailReviews: true, pushAll: true, pushUrgent: true, digest: 'daily' });
    const [appearance, setAppearance] = useState({ theme: 'system', density: 'comfortable', animations: true, fontScale: 'medium' });
    const [security, setSecurity] = useState({ currentPass: '', newPass: '', confirmPass: '', twoFactor: false, sessionTimeout: '30' });
    const [system, setSystem] = useState({ apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000', timezone: 'Asia/Kolkata', currency: 'INR', language: 'en' });

    const save = async () => {
        setSaving(true);
        await new Promise(r => setTimeout(r, 900));
        setSaved(true);
        setSaving(false);
        setTimeout(() => setSaved(false), 2500);
    };

    const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
        { key: 'profile', label: 'Profile', icon: User },
        { key: 'notifications', label: 'Notifications', icon: Bell },
        { key: 'appearance', label: 'Appearance', icon: Palette },
        { key: 'security', label: 'Security', icon: Shield },
        { key: 'system', label: 'System', icon: Globe },
    ];

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: "'DM Sans', system-ui" }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                <div>
                    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted-foreground)', ...mono, marginBottom: '4px' }}>System</p>
                    <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>Settings</h1>
                </div>
                <Button onClick={save} disabled={saving} style={{ height: '36px', gap: '8px', fontWeight: 700, fontSize: '13px', background: saved ? '#16a34a' : 'var(--foreground)', color: 'var(--background)' }}>
                    {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px', alignItems: 'start' }}>
                {/* Sidebar nav */}
                <Card>
                    <div style={{ padding: '8px' }}>
                        {tabs.map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                background: activeTab === tab.key ? 'var(--secondary)' : 'transparent',
                                color: activeTab === tab.key ? 'var(--foreground)' : 'var(--muted-foreground)',
                                fontSize: '13px', fontWeight: activeTab === tab.key ? 700 : 500,
                                fontFamily: "'DM Sans', system-ui", textAlign: 'left', transition: 'all 0.15s',
                                borderLeft: activeTab === tab.key ? '2px solid var(--foreground)' : '2px solid transparent',
                            }}>
                                <tab.icon size={15} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Content panels */}
                <div className="animate-fade-in" key={activeTab}>

                    {activeTab === 'profile' && (
                        <Card>
                            <div style={{ padding: '28px' }}>
                                <SectionHeader icon={User} title="Profile Information" desc="Update your account details and personal information" />

                                {/* Avatar */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', padding: '20px', background: 'var(--secondary)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                    <div style={{ width: '72px', height: '72px', borderRadius: '16px', background: 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 900, color: 'var(--background)', flexShrink: 0 }}>
                                        {(profile.name || 'A').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '16px', fontWeight: 800, marginBottom: '4px' }}>{profile.name || 'Administrator'}</p>
                                        <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontWeight: 500, marginBottom: '10px' }}>{profile.email}</p>
                                        <button style={{ fontSize: '12px', fontWeight: 700, color: 'var(--foreground)', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer' }}>Change Avatar</button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <FieldLabel required>Full Name</FieldLabel>
                                        <div style={{ position: 'relative' }}>
                                            <User size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                                            <Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} style={{ paddingLeft: '36px', height: '42px', fontWeight: 600 }} />
                                        </div>
                                    </div>
                                    <div>
                                        <FieldLabel required>Email Address</FieldLabel>
                                        <div style={{ position: 'relative' }}>
                                            <Mail size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                                            <Input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} style={{ paddingLeft: '36px', height: '42px', fontWeight: 600 }} />
                                        </div>
                                    </div>
                                    <div>
                                        <FieldLabel>Phone Number</FieldLabel>
                                        <div style={{ position: 'relative' }}>
                                            <Phone size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                                            <Input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="+91 98765 43210" style={{ paddingLeft: '36px', height: '42px', fontWeight: 600 }} />
                                        </div>
                                    </div>
                                    <div>
                                        <FieldLabel>Role</FieldLabel>
                                        <Input value="Administrator" disabled style={{ height: '42px', fontWeight: 700, opacity: 0.6, cursor: 'not-allowed' }} />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <FieldLabel>Bio</FieldLabel>
                                        <Textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} placeholder="Brief description about your role and responsibilities..." style={{ minHeight: '100px', fontSize: '13px', fontWeight: 500, lineHeight: 1.6 }} />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'notifications' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <Card>
                                <div style={{ padding: '28px' }}>
                                    <SectionHeader icon={Mail} title="Email Notifications" desc="Manage which events trigger email alerts to your inbox" />
                                    <div>
                                        {[
                                            { key: 'emailOrders', label: 'New Orders', desc: 'Get notified when a new order is placed' },
                                            { key: 'emailInquiries', label: 'Inquiries', desc: 'Receive alerts for new customer inquiries' },
                                            { key: 'emailTickets', label: 'Support Tickets', desc: 'Notify me of new or escalated support tickets' },
                                            { key: 'emailReviews', label: 'New Reviews', desc: 'Be alerted when customers leave reviews' },
                                        ].map(item => (
                                            <ToggleRow key={item.key} label={item.label} desc={item.desc}
                                                checked={notifs[item.key as keyof typeof notifs] as boolean}
                                                onChange={v => setNotifs({ ...notifs, [item.key]: v })}
                                            />
                                        ))}
                                        <div style={{ paddingTop: '20px' }}>
                                            <FieldLabel>Digest Frequency</FieldLabel>
                                            <Select value={notifs.digest} onValueChange={v => setNotifs({ ...notifs, digest: v })}>
                                                <SelectTrigger style={{ height: '42px', width: '240px', fontSize: '13px', fontWeight: 600 }}><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="realtime">Real-time (immediately)</SelectItem>
                                                    <SelectItem value="hourly">Hourly digest</SelectItem>
                                                    <SelectItem value="daily">Daily digest</SelectItem>
                                                    <SelectItem value="weekly">Weekly digest</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                            <Card>
                                <div style={{ padding: '28px' }}>
                                    <SectionHeader icon={Bell} title="Push Notifications" desc="In-app push notification preferences" />
                                    <ToggleRow label="All Notifications" desc="Enable all in-app push notifications" checked={notifs.pushAll} onChange={v => setNotifs({ ...notifs, pushAll: v })} />
                                    <ToggleRow label="Urgent Alerts Only" desc="Only receive critical system and security alerts" checked={notifs.pushUrgent} onChange={v => setNotifs({ ...notifs, pushUrgent: v })} />
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <Card>
                            <div style={{ padding: '28px' }}>
                                <SectionHeader icon={Palette} title="Appearance" desc="Customise the look and feel of the admin interface" />

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div>
                                        <FieldLabel>Theme Mode</FieldLabel>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '8px' }}>
                                            {[
                                                { value: 'light', label: 'Light', icon: Sun },
                                                { value: 'dark', label: 'Dark', icon: Moon },
                                                { value: 'system', label: 'System', icon: Monitor },
                                            ].map(opt => (
                                                <button key={opt.value} onClick={() => setAppearance({ ...appearance, theme: opt.value })} style={{ padding: '16px', border: '2px solid', borderColor: appearance.theme === opt.value ? 'var(--foreground)' : 'var(--border)', borderRadius: '10px', background: appearance.theme === opt.value ? 'var(--secondary)' : 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.15s', fontFamily: "'DM Sans', system-ui" }}>
                                                    <opt.icon size={20} style={{ color: appearance.theme === opt.value ? 'var(--foreground)' : 'var(--muted-foreground)' }} />
                                                    <span style={{ fontSize: '13px', fontWeight: 700, color: appearance.theme === opt.value ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <FieldLabel>Interface Density</FieldLabel>
                                            <Select value={appearance.density} onValueChange={v => setAppearance({ ...appearance, density: v })}>
                                                <SelectTrigger style={{ height: '42px', fontSize: '13px', fontWeight: 600 }}><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="compact">Compact</SelectItem>
                                                    <SelectItem value="comfortable">Comfortable</SelectItem>
                                                    <SelectItem value="spacious">Spacious</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <FieldLabel>Font Scale</FieldLabel>
                                            <Select value={appearance.fontScale} onValueChange={v => setAppearance({ ...appearance, fontScale: v })}>
                                                <SelectTrigger style={{ height: '42px', fontSize: '13px', fontWeight: 600 }}><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="small">Small (12px)</SelectItem>
                                                    <SelectItem value="medium">Medium (14px)</SelectItem>
                                                    <SelectItem value="large">Large (16px)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--secondary)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                        <div>
                                            <p style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>UI Animations</p>
                                            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontWeight: 500 }}>Enable smooth transitions and motion effects</p>
                                        </div>
                                        <Switch checked={appearance.animations} onCheckedChange={v => setAppearance({ ...appearance, animations: v })} />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'security' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <Card>
                                <div style={{ padding: '28px' }}>
                                    <SectionHeader icon={Lock} title="Change Password" desc="Update your admin account password" />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
                                        {[
                                            { key: 'currentPass', label: 'Current Password' },
                                            { key: 'newPass', label: 'New Password' },
                                            { key: 'confirmPass', label: 'Confirm New Password' },
                                        ].map(field => (
                                            <div key={field.key}>
                                                <FieldLabel>{field.label}</FieldLabel>
                                                <div style={{ position: 'relative' }}>
                                                    <Key size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                                                    <Input type={showPass ? 'text' : 'password'} value={security[field.key as keyof typeof security] as string} onChange={e => setSecurity({ ...security, [field.key]: e.target.value })} style={{ paddingLeft: '36px', paddingRight: '40px', height: '42px', fontWeight: 600 }} />
                                                    <button onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}>
                                                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <div style={{ padding: '14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#92400e' }}>
                                            Password must be at least 8 characters and include uppercase, lowercase, and a number.
                                        </div>
                                        <Button style={{ width: 'fit-content', height: '40px', fontWeight: 700, gap: '8px' }}>
                                            <Lock size={14} /> Update Password
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            <Card>
                                <div style={{ padding: '28px' }}>
                                    <SectionHeader icon={Shield} title="Two-Factor Authentication" desc="Add an extra layer of security to your account" />
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: security.twoFactor ? '#f0fdf4' : 'var(--secondary)', borderRadius: '10px', border: `1px solid ${security.twoFactor ? '#bbf7d0' : 'var(--border)'}` }}>
                                        <div>
                                            <p style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px', color: security.twoFactor ? '#16a34a' : 'var(--foreground)' }}>
                                                2FA is currently {security.twoFactor ? 'enabled' : 'disabled'}
                                            </p>
                                            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontWeight: 500 }}>Require a verification code on login</p>
                                        </div>
                                        <Switch checked={security.twoFactor} onCheckedChange={v => setSecurity({ ...security, twoFactor: v })} />
                                    </div>

                                    <div style={{ marginTop: '20px' }}>
                                        <FieldLabel>Session Timeout</FieldLabel>
                                        <Select value={security.sessionTimeout} onValueChange={v => setSecurity({ ...security, sessionTimeout: v })}>
                                            <SelectTrigger style={{ height: '42px', width: '240px', fontSize: '13px', fontWeight: 600 }}><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="15">15 minutes</SelectItem>
                                                <SelectItem value="30">30 minutes</SelectItem>
                                                <SelectItem value="60">1 hour</SelectItem>
                                                <SelectItem value="240">4 hours</SelectItem>
                                                <SelectItem value="never">Never</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <Card>
                                <div style={{ padding: '28px' }}>
                                    <SectionHeader icon={Database} title="API Configuration" desc="Backend connection and environment settings" />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div>
                                            <FieldLabel required>API Base URL</FieldLabel>
                                            <Input value={system.apiUrl} onChange={e => setSystem({ ...system, apiUrl: e.target.value })} style={{ height: '42px', fontWeight: 600, ...mono, fontSize: '13px' }} />
                                        </div>
                                        <div style={{ padding: '16px', background: 'var(--secondary)', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div>
                                                <p style={{ fontSize: '12px', fontWeight: 800, ...mono, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>API Status</p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a', boxShadow: '0 0 0 2px #16a34a25' }} />
                                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a' }}>Connected · 14ms latency</span>
                                                </div>
                                            </div>
                                            <button style={{ fontSize: '12px', fontWeight: 700, ...mono, background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', color: 'var(--foreground)' }}>Test Connection</button>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card>
                                <div style={{ padding: '28px' }}>
                                    <SectionHeader icon={Globe} title="Localisation" desc="Regional and language preferences" />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <FieldLabel>Timezone</FieldLabel>
                                            <Select value={system.timezone} onValueChange={v => setSystem({ ...system, timezone: v })}>
                                                <SelectTrigger style={{ height: '42px', fontSize: '13px', fontWeight: 600 }}><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</SelectItem>
                                                    <SelectItem value="UTC">UTC</SelectItem>
                                                    <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                                                    <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <FieldLabel>Currency</FieldLabel>
                                            <Select value={system.currency} onValueChange={v => setSystem({ ...system, currency: v })}>
                                                <SelectTrigger style={{ height: '42px', fontSize: '13px', fontWeight: 600 }}><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="INR">INR — Indian Rupee (₹)</SelectItem>
                                                    <SelectItem value="USD">USD — US Dollar ($)</SelectItem>
                                                    <SelectItem value="EUR">EUR — Euro (€)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <FieldLabel>Language</FieldLabel>
                                            <Select value={system.language} onValueChange={v => setSystem({ ...system, language: v })}>
                                                <SelectTrigger style={{ height: '42px', fontSize: '13px', fontWeight: 600 }}><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="en">English</SelectItem>
                                                    <SelectItem value="hi">Hindi</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card>
                                <div style={{ padding: '28px' }}>
                                    <SectionHeader icon={Building2} title="Business Details" desc="Company information displayed in communications" />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <FieldLabel>Business Name</FieldLabel>
                                            <Input defaultValue="BookBind" style={{ height: '42px', fontWeight: 600 }} />
                                        </div>
                                        <div>
                                            <FieldLabel>Support Email</FieldLabel>
                                            <Input defaultValue="support@bookbind.in" style={{ height: '42px', fontWeight: 600 }} />
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <FieldLabel>Business Address</FieldLabel>
                                            <Textarea defaultValue="" placeholder="Full registered address..." style={{ minHeight: '80px', fontSize: '13px', fontWeight: 500 }} />
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Danger zone */}
                            <div style={{ border: '1px solid #fecaca', borderRadius: '12px', overflow: 'hidden' }}>
                                <div style={{ padding: '16px 24px', background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
                                    <p style={{ fontSize: '13px', fontWeight: 800, color: '#991b1b', ...mono, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Danger Zone</p>
                                </div>
                                <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <p style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>Reset to Defaults</p>
                                        <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontWeight: 500 }}>Clear all settings and revert to factory defaults. This cannot be undone.</p>
                                    </div>
                                    <button style={{ padding: '8px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', system-ui" }}
                                        onClick={() => confirm('Are you sure? All settings will be reset.') && null}>
                                        Reset Settings
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
