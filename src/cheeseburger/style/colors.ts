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

export interface RGBA { r: number; g: number; b: number; a: number; }

export function parseColor(c: unknown): RGBA | null {
    if (typeof c === "number" && Number.isFinite(c)) {
        const n = c >>> 0;
        return { a: (n >>> 24) / 255, r: (n >>> 16) & 255, g: (n >>> 8) & 255, b: n & 255 };
    }
    if (typeof c !== "string") return null;
    const s = c.trim().toLowerCase();
    if (s === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
    if (s === "white") return { r: 255, g: 255, b: 255, a: 1 };
    if (s === "black") return { r: 0, g: 0, b: 0, a: 1 };
    let m = s.match(/^#([0-9a-f]{3,8})$/);
    if (m) {
        let h = m[1];
        if (h.length === 3 || h.length === 4) h = h.split("").map(x => x + x).join("");
        if (h.length !== 6 && h.length !== 8) return null;
        return {
            r: parseInt(h.slice(0, 2), 16),
            g: parseInt(h.slice(2, 4), 16),
            b: parseInt(h.slice(4, 6), 16),
            a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
        };
    }
    m = s.match(/^rgba?\(([^)]+)\)$/);
    if (m) {
        const p = m[1].split(/[\s,/]+/).filter(Boolean).map(x => (x.endsWith("%") ? parseFloat(x) / 100 : parseFloat(x)));
        if (p.length < 3 || p.slice(0, 3).some(x => !Number.isFinite(x))) return null;
        const a = p.length > 3 && Number.isFinite(p[3]) ? p[3] : 1;
        return { r: p[0], g: p[1], b: p[2], a };
    }
    return null;
}

const hex2 = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");

export const toHex = (c: RGBA) => `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}${c.a < 1 ? hex2(c.a * 255) : ""}`;

export function withAlpha(color: string, a: number): string {
    const c = parseColor(color);
    return c ? toHex({ ...c, a }) : color;
}
