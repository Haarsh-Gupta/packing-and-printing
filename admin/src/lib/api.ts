const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Singleton refresh gate ───────────────────────────────────────────────
// Ensures only ONE refresh request is in-flight at a time.
// Every caller that hits a 401 waits on the same promise,
// and only retries AFTER the cookie has been confirmed stored.
let refreshPromise: Promise<boolean> | null = null;

async function waitForRefresh(): Promise<boolean> {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        try {
            const res = await fetch(`${API_URL}/auth/refresh`, {
                method: "POST",
                credentials: "include",
            });
            if (res.ok) {
                // Small delay to let the browser fully store the Set-Cookie
                await new Promise((r) => setTimeout(r, 50));
                return true;
            }
            return false;
        } catch {
            return false;
        }
    })();

    try {
        return await refreshPromise;
    } finally {
        // Only clear AFTER all awaiting callers have received the result.
        // setTimeout ensures no caller can start a new refresh in the same microtask.
        setTimeout(() => {
            refreshPromise = null;
        }, 100);
    }
}

// ── Generic JSON API call ────────────────────────────────────────────────
export async function api<T = unknown>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const doFetch = () =>
        fetch(`${API_URL}${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
            },
            credentials: "include",
        });

    let res = await doFetch();

    if (res.status === 401) {
        const refreshed = await waitForRefresh();
        if (refreshed) {
            res = await doFetch();
            if (res.ok) {
                if (res.status === 204) return undefined as T;
                const ct = res.headers.get("content-type");
                if (ct && ct.includes("application/json")) return res.json();
                return undefined as T;
            }
        }
        throw new Error("Unauthorized");
    }

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Request failed: ${res.status}`);
    }

    if (res.status === 204) return undefined as T;

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return res.json();
    }

    return undefined as T;
}

// ── FormData upload ──────────────────────────────────────────────────────
export async function apiFormData<T = unknown>(
    path: string,
    formData: FormData
): Promise<T> {
    const doFetch = () =>
        fetch(`${API_URL}${path}`, {
            method: "POST",
            body: formData,
            credentials: "include",
        });

    let res = await doFetch();

    if (res.status === 401) {
        const refreshed = await waitForRefresh();
        if (refreshed) {
            res = await doFetch();
            if (res.ok) return res.json();
        }
        throw new Error("Unauthorized");
    }

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Request failed: ${res.status}`);
    }

    return res.json();
}

// ── Blob download ────────────────────────────────────────────────────────
export async function apiBlob(path: string): Promise<Blob> {
    const res = await fetch(`${API_URL}${path}`, {
        credentials: "include",
    });

    if (!res.ok) throw new Error(`Failed to fetch file`);
    return res.blob();
}

export { API_URL };
export default api;
