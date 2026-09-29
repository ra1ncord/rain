import { getCurrentTheme } from "@plugins/_core/painter/themes";

let cache: { at: number; id: string; values: Map<string, string | undefined>; } | null = null;

export function themeColor(key: string): string | undefined {
    let theme: any;
    try {
        theme = getCurrentTheme();
    } catch {
        return undefined;
    }
    const id = theme?.id ?? "";
    const now = Date.now();
    if (!cache || cache.id !== id || now - cache.at > 2000) cache = { at: now, id, values: new Map() };
    if (cache.values.has(key)) return cache.values.get(key);
    const data = theme?.data;
    const raw = data?.semanticColors?.[key]?.[0] ?? data?.main?.semantic?.[key];
    const value = typeof raw === "string" ? raw : typeof raw?.value === "string" ? raw.value : undefined;
    const hex = value && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value) ? value : undefined;
    cache.values.set(key, hex);
    return hex;
}

export const accentColor = (fallback = "#5865f2") => themeColor("BACKGROUND_ACCENT") ?? themeColor("TEXT_BRAND") ?? fallback;

export const baseColor = () => themeColor("BACKGROUND_PRIMARY") ?? themeColor("BG_BASE_PRIMARY") ?? themeColor("CHAT_BACKGROUND");
