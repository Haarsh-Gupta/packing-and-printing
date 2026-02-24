/**
 * Wrapper around fetch that:
 * 1. Attaches the Bearer token from localStorage
 * 2. Includes credentials for cookie-based auth
 * 3. On 401, tries to refresh the token and retry once
 */

export async function fetchWithAuth(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const token = localStorage.getItem("access_token");

    // Merge headers: keep caller's headers, add Authorization
    const mergedHeaders: Record<string, string> = {};

    // Copy existing headers
    if (options.headers) {
        if (options.headers instanceof Headers) {
            options.headers.forEach((v, k) => { mergedHeaders[k] = v; });
        } else if (Array.isArray(options.headers)) {
            options.headers.forEach(([k, v]) => { mergedHeaders[k] = v; });
        } else {
            Object.assign(mergedHeaders, options.headers);
        }
    }

    if (token) {
        mergedHeaders["Authorization"] = `Bearer ${token}`;
    }

    // First attempt
    let res = await fetch(url, {
        method: options.method || "GET",
        headers: mergedHeaders,
        body: options.body,
        credentials: "include",
    });

    // On 401, try refreshing token once
    if (res.status === 401) {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        try {
            const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
                method: "POST",
                credentials: "include",
            });

            if (refreshRes.ok) {
                const data = await refreshRes.json();
                if (data.access_token) {
                    localStorage.setItem("access_token", data.access_token);
                    mergedHeaders["Authorization"] = `Bearer ${data.access_token}`;
                }

                // Retry with new token
                res = await fetch(url, {
                    method: options.method || "GET",
                    headers: mergedHeaders,
                    body: options.body,
                    credentials: "include",
                });
            }
        } catch {
            // Refresh failed — return original 401
        }
    }

    return res;
}
