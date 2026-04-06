/**
 * Wrapper around fetch that:
 * 1. Includes credentials for cookie-based auth (HttpOnly cookies)
 * 2. On 401, tries to refresh the token via /auth/refresh and retry once
 *
 * NO localStorage or Authorization headers — auth is purely via cookies.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchWithAuth(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    // Merge headers: keep caller's headers
    const mergedHeaders: Record<string, string> = {};

    if (options.headers) {
        if (options.headers instanceof Headers) {
            options.headers.forEach((v, k) => { mergedHeaders[k] = v; });
        } else if (Array.isArray(options.headers)) {
            options.headers.forEach(([k, v]) => { mergedHeaders[k] = v; });
        } else {
            Object.assign(mergedHeaders, options.headers);
        }
    }

    // Remove any leftover Authorization headers — we use cookies only
    delete mergedHeaders["Authorization"];
    delete mergedHeaders["authorization"];

    // First attempt
    let res = await fetch(url, {
        method: options.method || "GET",
        headers: mergedHeaders,
        body: options.body,
        credentials: "include",
    });

    // On 401, try refreshing token once
    if (res.status === 401) {
        try {
            const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
                method: "POST",
                credentials: "include",
            });

            if (refreshRes.ok) {
                // Retry — server set new access_token cookie
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
