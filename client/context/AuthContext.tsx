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
    login: (token: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();

    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem("access_token");
        // Even if no token in localStorage, we attempt fetch to let cookies authenticate us
        
        try {
            const headers: Record<string, string> = {};
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
                headers,
                credentials: "include",
            });

            if (res.ok) {
                const data = await res.json();
                setUser(data);
                dispatch(syncGuestWishlist());
            } else {
                // If 401 and we had a token, it's definitely invalid
                if (res.status === 401 && token) {
                    localStorage.removeItem("access_token");
                }
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

    const login = useCallback(async (token: string) => {
        localStorage.setItem("access_token", token);

        // Fetch user data immediately so it's available before navigating
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` },
                credentials: "include",
            });
            if (res.ok) {
                const userData = await res.json();
                setUser(userData);
            }
        } catch (error) {
            console.error("Failed to fetch user after login:", error);
        }

        // Trigger wishlist sync on imperative login
        dispatch(syncGuestWishlist());
        router.push("/dashboard");
        // Trigger header update if needed
        window.dispatchEvent(new Event("user-updated"));
    }, [dispatch, router]);

    const logout = useCallback(async () => {
        try {
            const token = localStorage.getItem("access_token");
            if (token) {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    credentials: "include",
                });
            }
        } catch (e) {
            console.error("Logout error", e);
        } finally {
            localStorage.removeItem("access_token");
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
