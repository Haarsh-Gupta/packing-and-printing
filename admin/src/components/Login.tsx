import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

export default function Login() {
    const { admin: user, login, googleLogin } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState<"password" | "otp">("password");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (user) return <Navigate to="/" replace />;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(email, password);
            navigate("/");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f2f2f7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
        }}>
            {/* Floating Login Card */}
            <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '40px 36px 36px',
                width: '100%',
                maxWidth: '380px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.08)',
            }}>
                {/* Brand */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <h1 style={{
                        fontSize: '22px',
                        fontWeight: 700,
                        letterSpacing: '-0.025em',
                        color: '#18181b',
                        margin: 0,
                    }}>
                        Navart Admin
                    </h1>
                    <p style={{ fontSize: '13px', color: '#71717a', marginTop: '4px' }}>
                        Sign in to continue
                    </p>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    background: '#f4f4f5',
                    borderRadius: '10px',
                    padding: '3px',
                    marginBottom: '24px',
                }}>
                    {[
                        { id: 'password' as const, label: 'Password Login' },
                        { id: 'otp' as const, label: 'OTP Login' },
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => { setTab(t.id); setError(''); }}
                            style={{
                                padding: '7px',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '12.5px',
                                fontWeight: tab === t.id ? 600 : 400,
                                color: tab === t.id ? '#18181b' : '#71717a',
                                background: tab === t.id ? 'white' : 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                                fontFamily: "'Inter', system-ui",
                            }}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 12px', background: '#fef2f2',
                        border: '1px solid #fecaca', borderRadius: '10px',
                        color: '#dc2626', fontSize: '13px', marginBottom: '16px',
                    }}>
                        <AlertCircle size={13} style={{ flexShrink: 0 }} />
                        {error}
                    </div>
                )}

                {tab === 'password' ? (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#3f3f46', marginBottom: '6px' }}>
                                Email
                            </label>
                            <div style={{ position: 'relative', width: '100%' }}>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="admin@navart.com"
                                    required
                                    style={{
                                        width: '100%', height: '40px', padding: '0 12px',
                                        border: '1px solid #e4e4e7', borderRadius: '10px',
                                        fontSize: '14px', color: '#18181b', background: 'white',
                                        fontFamily: "'Inter', system-ui", outline: 'none',
                                        boxSizing: 'border-box', transition: 'all 0.15s',
                                    }}
                                    onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                                    onBlur={e => { e.target.style.borderColor = '#e4e4e7'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#3f3f46', marginBottom: '6px' }}>
                                Password
                            </label>
                            <div style={{ position: 'relative', width: '100%' }}>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={{
                                        width: '100%', height: '40px', padding: '0 40px 0 12px',
                                        border: '1px solid #e4e4e7', borderRadius: '10px',
                                        fontSize: '14px', color: '#18181b', background: 'white',
                                        fontFamily: "'Inter', system-ui", outline: 'none',
                                        boxSizing: 'border-box', transition: 'all 0.15s',
                                    }}
                                    onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                                    onBlur={e => { e.target.style.borderColor = '#e4e4e7'; e.target.style.boxShadow = 'none'; }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(v => !v)}
                                    style={{
                                        position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa', padding: '2px',
                                    }}
                                >
                                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', height: '42px',
                                background: loading ? '#3f3f46' : '#18181b',
                                color: 'white', border: 'none', borderRadius: '10px',
                                fontSize: '14px', fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                fontFamily: "'Inter', system-ui",
                                transition: 'background 0.15s',
                                marginTop: '4px',
                            }}
                            onMouseEnter={e => !loading && (e.currentTarget.style.background = '#27272a')}
                            onMouseLeave={e => !loading && (e.currentTarget.style.background = '#18181b')}
                        >
                            {loading ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : 'Sign In'}
                        </button>

                        {/* Forgot password */}
                        <p style={{ textAlign: 'center', margin: 0 }}>
                            <button
                                type="button"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12.5px', color: '#3b82f6', fontFamily: "'Inter', system-ui" }}
                            >
                                Forgot password?
                            </button>
                        </p>
                    </form>
                ) : (
                    /* OTP Tab */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#3f3f46', marginBottom: '6px' }}>
                                Email
                            </label>
                            <div style={{ position: 'relative', width: '100%' }}>
                                <input
                                    type="email"
                                    placeholder="admin@navart.com"
                                    style={{
                                        width: '100%', height: '40px', padding: '0 12px',
                                        border: '1px solid #e4e4e7', borderRadius: '10px',
                                        fontSize: '14px', color: '#18181b', background: 'white',
                                        fontFamily: "'Inter', system-ui", outline: 'none',
                                        boxSizing: 'border-box', transition: 'all 0.15s',
                                    }}
                                    onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                                    onBlur={e => { e.target.style.borderColor = '#e4e4e7'; e.target.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>
                        <button
                            style={{
                                width: '100%', height: '42px',
                                background: '#18181b', color: 'white', border: 'none', borderRadius: '10px',
                                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                                fontFamily: "'Inter', system-ui", marginTop: '4px',
                            }}
                        >
                            Send OTP
                        </button>
                        <p style={{ textAlign: 'center', fontSize: '12px', color: '#71717a', margin: 0 }}>
                            We'll send a one-time code to your email address
                        </p>
                    </div>
                )}

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '20px 0' }}>
                    <div style={{ flex: 1, height: '1px', background: '#e4e4e7' }} />
                    <span style={{ fontSize: '12px', color: '#71717a' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: '#e4e4e7' }} />
                </div>

                {/* Google Login Button */}
                <button
                    type="button"
                    onClick={googleLogin}
                    style={{
                        width: '100%',
                        height: '42px',
                        background: 'white',
                        border: '1px solid #e4e4e7',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#18181b',
                        fontFamily: "'Inter', sans-serif",
                        transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    Continue with Google
                </button>
            </div>
        </div>
    );
}