import { useAuthorizationStore } from "../stores/AuthorizationStore";

export const API_BASE = "https://customeffects-api.serstars.workers.dev";
export const CLIENT_ID = "1485042396830892042";

export async function apiFetch(path: string, options: RequestInit = {}) {
    const token = useAuthorizationStore.getState().token;

    if (!token) {
        throw new Error("Not authorized — user must log in first");
    }

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: token,
        },
    });

    if (!res.ok) {
        const text = await res.text();
        if (res.status === 401) {
            throw new Error("Unauthorized — please log in again");
        }
        if (res.status === 403) {
            throw new Error("Forbidden — you don't have access to this endpoint");
        }
        throw new Error(`Fetch failed: ${res.status} — ${text}`);
    }

    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
        return res.json();
    }

    return res.text();
}
