import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    fetchMe(stored || null);
  }, []);

  const fetchMe = async (tok: string | null) => {
    try {
      const headers: Record<string, string> = {};
      if (tok) {
        headers["Authorization"] = `Bearer ${tok}`;
        setToken(tok);
      }
      
      const data = await api<Admin>("/users/me", { headers });
      setAdmin(data);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  };

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
    await fetchMe(tok);
    navigate("/");
  };

  const googleLogin = () => {
    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const adminUrl = window.location.origin;
    window.location.href = `${backendUrl}/auth/google/login?redirect_to=${adminUrl}`;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null); setAdmin(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ admin, token, login, googleLogin, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}