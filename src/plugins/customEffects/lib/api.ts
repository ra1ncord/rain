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
        throw new Error(`Fetch failed: ${res.status} — ${text}`);
    }

    return res.json();
}
