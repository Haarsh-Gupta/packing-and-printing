import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";
import type { AuthUser } from "@/types";

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem("admin_token"));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            api<AuthUser>("/users/me")
                .then((u) => {
                    if (u.admin) {
                        setUser(u);
                    } else {
                        logout();
                    }
                })
                .catch(() => logout())
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = async (email: string, password: string) => {
        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);

        const url = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/auth/login`;
        console.log("Login URL:", url, "Form:", formData.toString());
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData,
        });

        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.detail || "Login failed");
        }

        const data = await res.json();
        localStorage.setItem("admin_token", data.access_token);
        setToken(data.access_token);

        // Verify admin
        const me = await api<AuthUser>("/users/me");
        if (!me.admin) {
            localStorage.removeItem("admin_token");
            setToken(null);
            throw new Error("Access denied. Admin privileges required.");
        }
        setUser(me);
    };

    const logout = () => {
        localStorage.removeItem("admin_token");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
