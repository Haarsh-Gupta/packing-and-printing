import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import useSWR from "swr";
import { useNavigate } from "react-router-dom";
import api, { TOKEN_KEY } from "@/lib/api";

interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: () => void;
  logout: () => void;
  isLoading: boolean;
}

interface Admin { id: string; email: string; name: string; role: string; }

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const navigate = useNavigate();

  const fetcher = async (url: string) => {
    if (!token) throw new Error("No token");
    const headers = { "Authorization": `Bearer ${token}` };
    return api<Admin>(url, { headers });
  };

  const { data: admin, isLoading, mutate } = useSWR<Admin | null>(
    token ? "/users/me" : null,
    fetcher,
    {
      dedupingInterval: 10000,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      onError: () => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }
    }
  );

  const login = async (email: string, password: string) => {
    const params = new URLSearchParams();
    params.append("username", email);
    params.append("password", password);
    const data = await api<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: params,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const tok = data.access_token;
    localStorage.setItem(TOKEN_KEY, tok);
    setToken(tok);
    await mutate(); // Let SWR fetch with new token
    navigate("/");
  };

  const googleLogin = () => {
    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const adminUrl = window.location.origin;
    window.location.href = `${backendUrl}/auth/google/login?redirect_to=${adminUrl}`;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null); 
    mutate(null, false);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ admin: admin || null, token, login, googleLogin, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}