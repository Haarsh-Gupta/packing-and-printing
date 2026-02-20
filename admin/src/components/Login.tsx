import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Lock, Mail, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Login() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'grid',
            gridTemplateColumns: '1fr 480px',
            background: 'var(--background)',
            fontFamily: "'DM Sans', system-ui",
        }}>
            {/* Left: Brand panel */}
            <div style={{
                background: 'var(--foreground)',
                color: 'var(--background)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '48px',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Grid lines decoration */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'linear-gradient(var(--background) 1px, transparent 1px), linear-gradient(90deg, var(--background) 1px, transparent 1px)',
                    backgroundSize: '64px 64px',
                    opacity: 0.04,
                }} />

                <div style={{ position: 'relative' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '80px',
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            background: 'var(--background)',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <span style={{ fontWeight: 900, fontSize: '16px', color: 'var(--foreground)' }}>B</span>
                        </div>
                        <span style={{
                            fontWeight: 900,
                            fontSize: '20px',
                            letterSpacing: '-0.04em',
                            color: 'var(--background)',
                        }}>BookBind</span>
                    </div>

                    <h2 style={{
                        fontSize: '56px',
                        fontWeight: 900,
                        letterSpacing: '-0.06em',
                        lineHeight: 0.95,
                        color: 'var(--background)',
                        marginBottom: '24px',
                    }}>
                        Manage<br />
                        Everything.<br />
                        <span style={{ opacity: 0.35 }}>Effortlessly.</span>
                    </h2>
                    <p style={{
                        fontSize: '14px',
                        color: 'var(--background)',
                        opacity: 0.5,
                        fontWeight: 400,
                        lineHeight: 1.6,
                        maxWidth: '340px',
                    }}>
                        Your complete command center for orders, inquiries, customers, and everything in between.
                    </p>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '40px',
                    position: 'relative',
                }}>
                    {[
                        { label: 'Orders', value: '2.4k+' },
                        { label: 'Customers', value: '890+' },
                        { label: 'Products', value: '48' },
                    ].map(stat => (
                        <div key={stat.label}>
                            <div style={{
                                fontSize: '28px',
                                fontWeight: 900,
                                letterSpacing: '-0.04em',
                                color: 'var(--background)',
                            }}>{stat.value}</div>
                            <div style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                color: 'var(--background)',
                                opacity: 0.4,
                                fontFamily: "'DM Mono', monospace",
                            }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Login form */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '48px',
                borderLeft: '1px solid var(--border)',
            }}>
                <div style={{ marginBottom: '40px' }}>
                    <p style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: 'var(--muted-foreground)',
                        fontFamily: "'DM Mono', monospace",
                        marginBottom: '8px',
                    }}>
                        Admin Access
                    </p>
                    <h1 style={{
                        fontSize: '28px',
                        fontWeight: 900,
                        letterSpacing: '-0.04em',
                        color: 'var(--foreground)',
                    }}>
                        Sign in to continue
                    </h1>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {error && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            color: '#dc2626',
                            fontSize: '13px',
                            fontWeight: 600,
                        }}>
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}

                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: 'var(--muted-foreground)',
                            fontFamily: "'DM Mono', monospace",
                            marginBottom: '6px',
                        }}>
                            Email address
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={14} style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--muted-foreground)',
                            }} />
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@bookbind.com"
                                required
                                style={{
                                    paddingLeft: '36px',
                                    height: '44px',
                                    fontWeight: 500,
                                    fontSize: '14px',
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: 'var(--muted-foreground)',
                            fontFamily: "'DM Mono', monospace",
                            marginBottom: '6px',
                        }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={14} style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--muted-foreground)',
                            }} />
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{
                                    paddingLeft: '36px',
                                    height: '44px',
                                    fontWeight: 500,
                                    fontSize: '14px',
                                }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            height: '44px',
                            background: loading ? 'var(--muted)' : 'var(--foreground)',
                            color: 'var(--background)',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            marginTop: '8px',
                            fontFamily: "'DM Sans', system-ui",
                            transition: 'opacity 0.15s',
                        }}
                    >
                        {loading ? (
                            <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                        ) : (
                            <>
                                Sign in
                                <ArrowRight size={14} />
                            </>
                        )}
                    </button>
                </form>

                <div style={{
                    marginTop: 'auto',
                    paddingTop: '40px',
                    borderTop: '1px solid var(--border)',
                    marginBottom: '-8px',
                }}>
                    <p style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--muted-foreground)',
                        fontFamily: "'DM Mono', monospace",
                        textAlign: 'center',
                    }}>
                        Powered by Antigravity · BookBind v2.0
                    </p>
                </div>
            </div>
        </div>
    );
}