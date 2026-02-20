const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getToken(): string | null {
    return localStorage.getItem("admin_token");
}

function authHeaders(): Record<string, string> {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api<T = unknown>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
            ...(options.headers || {}),
        },
    });

    if (res.status === 401) {
        localStorage.removeItem("admin_token");
        window.location.href = "/login";
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

export async function apiFormData<T = unknown>(
    path: string,
    formData: FormData
): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: authHeaders(),
        body: formData,
    });

    if (res.status === 401) {
        localStorage.removeItem("admin_token");
        window.location.href = "/login";
        throw new Error("Unauthorized");
    }

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Request failed: ${res.status}`);
    }

    return res.json();
}

export async function apiBlob(path: string): Promise<Blob> {
    const res = await fetch(`${API_URL}${path}`, {
        headers: authHeaders(),
    });

    if (!res.ok) throw new Error(`Failed to fetch file`);
    return res.blob();
}

export { API_URL, getToken };
