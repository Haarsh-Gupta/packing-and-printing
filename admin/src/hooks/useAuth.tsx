import { createContext, useContext, useState, ReactNode } from "react";
import useSWR from "swr";
import { useNavigate } from "react-router-dom";
import api, { API_URL } from "@/lib/api";

interface AuthContextType {
  admin: Admin | null;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: () => void;
  logout: () => void;
  isLoading: boolean;
}

interface Admin { id: string; email: string; name: string; role: string; admin: boolean; }

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Track if user attempted login (to trigger SWR fetch)
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Optimistic — always try cookies
  const navigate = useNavigate();

  const fetcher = async (url: string) => {
    return api<Admin>(url);
  };

  const { data: admin, isLoading, mutate } = useSWR<Admin | null>(
    isAuthenticated ? "/users/me" : null,
    fetcher,
    {
      dedupingInterval: 10000,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onError: () => {
        setIsAuthenticated(false);
      }
    }
  );

  const login = async (email: string, password: string) => {
    const params = new URLSearchParams();
    params.append("username", email);
    params.append("password", password);

    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
      credentials: "include", // Server sets HttpOnly cookies
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Login failed");
    }

    // Cookies are set. Let SWR refetch user.
    setIsAuthenticated(true);
    await mutate();
    navigate("/");
  };

  const googleLogin = () => {
    const adminUrl = window.location.origin;
    window.location.href = `${API_URL}/auth/google/login?redirect_to=${adminUrl}`;
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch { /* ignore */ }
    setIsAuthenticated(false);
    mutate(null, false);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ admin: admin || null, login, googleLogin, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}