"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { syncGuestWishlist, fetchUserWishlist } from "@/lib/store/wishlistSlice";
import { AppDispatch } from "@/lib/store/store";

interface UserData {
    id: string;
    name: string;
    email: string;
    admin: boolean;
    profile_picture: string | null;
    phone: string | null;
    address: string | null;
    created_at: string | null;
}

interface AuthContextType {
    user: UserData | null;
    isLoading: boolean;
    isLoggedIn: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Helper: make a fetch to the API with cookies.
 * On 401, auto-refresh the access_token via POST /auth/refresh and retry once.
 */
async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        credentials: "include",
    });

    if (res.status === 401) {
        // Try refreshing the access_token cookie
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            credentials: "include",
        });
        if (refreshRes.ok) {
            // Retry the original request with the new cookie
            return fetch(`${API_URL}${path}`, {
                ...options,
                credentials: "include",
            });
        }
    }

    return res;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();

    const fetchUser = useCallback(async () => {
        try {
            const res = await apiFetch("/users/me");
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                dispatch(syncGuestWishlist());
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("AuthContext: Failed to fetch user", error);
        } finally {
            setIsLoading(false);
        }
    }, [dispatch]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const login = useCallback(async (email: string, password: string) => {
        const formBody = new URLSearchParams();
        formBody.append("username", email);
        formBody.append("password", password);

        const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formBody,
            credentials: "include", // Server sets HttpOnly cookies
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            const detail = typeof data.detail === "object" ? JSON.stringify(data.detail) : data.detail;
            throw new Error(detail || "Invalid credentials");
        }

        // Cookies are now set. Fetch user data.
        await fetchUser();
        router.push("/dashboard");
        window.dispatchEvent(new Event("user-updated"));
    }, [fetchUser, router]);

    const logout = useCallback(async () => {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
        } catch (e) {
            console.error("Logout error", e);
        } finally {
            setUser(null);
            router.replace("/auth/login");
            window.dispatchEvent(new Event("user-updated"));
        }
    }, [router]);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isLoggedIn: !!user,
                login,
                logout,
                refreshUser: fetchUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
