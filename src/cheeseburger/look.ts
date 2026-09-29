import { React } from "@metro/common";

import { parseColor, toHex } from "./style/colors";

const FALLBACK_TINT = "#e4e4e6";
const FALLBACK_SIZE = 24;
const PRIORITY = [/Soundboard/i, /Screenshare/i, /Mic|PTT/i, /Video/i];

const latest = new Map<string, string>();
const sizes = new Map<string, number>();
let tint: string | null = null;
let size: number | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function changed() {
    if (timer) return;
    timer = setTimeout(() => {
        timer = null;
        listeners.forEach(l => {
            try {
                l();
            } catch { }
        });
    }, 0);
}

const rank = (who: string) => {
    const i = PRIORITY.findIndex(r => r.test(who));
    return i === -1 ? PRIORITY.length : i;
};

function vote<T>(m: Map<string, T>): T | null {
    const votes = new Map<T, { n: number; best: number; }>();
    for (const [who, v] of m) {
        const cur = votes.get(v) ?? { n: 0, best: 99 };
        cur.n++;
        cur.best = Math.min(cur.best, rank(who));
        votes.set(v, cur);
    }
    let out: T | null = null;
    let top = { n: 0, best: 99 };
    for (const [v, c] of votes) {
        if (c.n > top.n || (c.n === top.n && c.best < top.best)) {
            out = v;
            top = c;
        }
    }
    return out;
}

export function noteCallIcon(who: string, color: unknown, width: unknown) {
    if (!who || /Disconnect|Leave|Hang|End/i.test(who)) return;
    const c = parseColor(color);
    if (c && c.a > 0.9 && (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255 >= 0.3) {
        const key = toHex({ ...c, a: 1 });
        if (latest.get(who) !== key) {
            latest.set(who, key);
            const next = vote(latest);
            if (next !== tint) {
                tint = next;
                changed();
            }
        }
    }
    if (typeof width === "number" && width >= 16 && width <= 40) {
        const w = Math.round(width);
        if (sizes.get(who) !== w) {
            sizes.set(who, w);
            const next = vote(sizes);
            if (next !== size) {
                size = next;
                changed();
            }
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
    const t = [...latest.entries()].map(([k, v]) => `${k} ${v}`).join(", ");
    const s = [...sizes.entries()].map(([k, v]) => `${k} ${v}`).join(", ");
    return `call icons: ${tint ?? `${FALLBACK_TINT} (default)`} ${size ?? `${FALLBACK_SIZE} (default)`}${t ? `, now ${t}` : ""}${s ? `, sizes ${s}` : ""}`;
}
