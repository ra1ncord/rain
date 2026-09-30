import { findByProps } from "@metro";

import { caught } from "../crash";

interface Coordinates { source: any; value: any; }
const state: { sources: WeakMap<object, Coordinates>; values: WeakMap<object, Coordinates>; } = (globalThis as any).__cheeseburgerCoordinates ??= {
    sources: new WeakMap(),
    values: new WeakMap(),
};
let api: any = null;
let lookedAt = 0;
let made = 0;
let lastError = "";

export const ownsCoordinates = (value: any) => !!value && typeof value === "object" && state.values.has(value);
export const sourceCoordinates = (value: any) => state.values.get(value)?.source ?? value;

function read(value: any) {
    return typeof value?.get === "function" ? value.get() : value?.value;
}

export function controlledCoordinates(source: any): any {
    if (!source || typeof source !== "object") return source;
    if (state.values.has(source)) return source;
    const existing = state.sources.get(source);
    if (existing) return existing.value;
    try {
        if (!api && Date.now() - lookedAt > 2000) {
            lookedAt = Date.now();
            api = findByProps("makeMutable", "cancelAnimation") ?? findByProps("makeMutable");
        }
        if (typeof api?.makeMutable !== "function") return source;
        const rect = read(source);
        if (!rect || typeof rect.x !== "number" || typeof rect.width !== "number") return source;
        const value = api.makeMutable({ ...rect });
        const entry = { source, value };
        state.sources.set(source, entry);
        state.values.set(value, entry);
        made++;
        return value;
    } catch (e: any) {
        lastError = String(e?.message ?? e).slice(0, 120);
        caught("split coordinates", e);
        return source;
    }
}

export const coordinatesDebug = () => `layout coordinates: ${api ? "independent" : "native fallback"}, created ${made}${lastError ? `, failed ${lastError}` : ""}`;
