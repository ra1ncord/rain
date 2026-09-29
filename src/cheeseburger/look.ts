import { React } from "@metro/common";

import { parseColor, toHex } from "./style/colors";

const FALLBACK_TINT = "#e4e4e6";
const FALLBACK_SIZE = 24;

const tints = new Map<string, Set<string>>();
const sizes = new Map<number, Set<string>>();
let tint: string | null = null;
let size: number | null = null;
const listeners = new Set<() => void>();

function best<K>(m: Map<K, Set<string>>): K | null {
    let out: K | null = null;
    let n = 0;
    for (const [k, who] of m) {
        if (who.size > n) {
            n = who.size;
            out = k;
        }
    }
    return out;
}

function changed() {
    listeners.forEach(l => {
        try {
            l();
        } catch { }
    });
}

export function noteCallIcon(who: string, color: unknown, width: unknown) {
    const c = parseColor(color);
    if (c && c.a > 0.9 && Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b) <= 24 && (c.r + c.g + c.b) / 3 >= 150) {
        const key = toHex({ ...c, a: 1 });
        if (!tints.has(key) && tints.size >= 16) tints.clear();
        tints.set(key, (tints.get(key) ?? new Set()).add(who));
        const next = best(tints);
        if (next !== tint) {
            tint = next;
            changed();
        }
    }
    if (typeof width === "number" && width >= 16 && width <= 40) {
        const w = Math.round(width);
        if (!sizes.has(w) && sizes.size >= 16) sizes.clear();
        sizes.set(w, (sizes.get(w) ?? new Set()).add(who));
        const next = best(sizes);
        if (next !== size) {
            size = next;
            changed();
        }
    }
}

export const callIconTint = () => tint ?? FALLBACK_TINT;
export const callIconSize = () => size ?? FALLBACK_SIZE;
export const DEFAULT_ICON_SIZE = FALLBACK_SIZE;

export function useCallLook() {
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => {
        listeners.add(force);
        return () => void listeners.delete(force);
    }, []);
    return { tint: callIconTint(), size: callIconSize() };
}

export function lookDebug(): string {
    const t = [...tints.entries()].map(([k, v]) => `${k} x${v.size}`).join(", ");
    const s = [...sizes.entries()].map(([k, v]) => `${k} x${v.size}`).join(", ");
    return `call icons: ${tint ?? `${FALLBACK_TINT} (default)`} ${size ?? `${FALLBACK_SIZE} (default)`}${t ? `, seen ${t}` : ""}${s ? `, sizes ${s}` : ""}`;
}
