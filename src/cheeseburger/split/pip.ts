import { instead } from "@api/patcher";
import { FluxDispatcher } from "@metro/common";

import { caught, safe, safeInstead } from "../crash";
import { knownMainAspect, onAspectChange, streamAspect } from "./tiles";

const PIP_PATH = "modules/external_pip/ExternalPip.android.tsx";
const MIN_ASPECT = 0.42;
const MAX_ASPECT = 2.38;

const unpatches: (() => unknown)[] = [];
let pip: any = null;
let lastArgs: any[] | null = null;
let lastSent = "";
let clamped = 0;
let selected: string | null = null;
let focused: string | null = null;
let retry: ReturnType<typeof setTimeout> | null = null;

const idOf = (v: any) => (v == null ? null : String(v));

function moduleExports(path: string): any {
    const mods: any = (window as any).modules ?? {};
    for (const id of Object.keys(mods)) {
        const m = mods[id];
        if (m?.__filePath === path) return m.isInitialized ? m.publicModule?.exports : undefined;
    }
}

function pipAspect(): number | null {
    const sid = focused ?? selected;
    return (sid && streamAspect(sid)) || knownMainAspect();
}

function ratioOf(args: any[]): number | null {
    const [x, y] = args;
    let r: number | null = null;
    if (typeof x === "number" && typeof y === "number") r = y ? x / y : null;
    else if (typeof x === "number") r = x;
    else if (x && typeof x === "object") {
        if (typeof x.width === "number" && typeof x.height === "number") r = x.height ? x.width / x.height : null;
        else if (typeof x.numerator === "number" && typeof x.denominator === "number") r = x.denominator ? x.numerator / x.denominator : null;
        else {
            const k = Object.keys(x).find(key => /aspect|ratio/i.test(key) && typeof x[key] === "number");
            if (k) r = x[k];
        }
    }
    return r !== null && Number.isFinite(r) && r > 0 ? r : null;
}

function shape(args: any[], raw: number): any[] | null {
    if (!Number.isFinite(raw) || raw <= 0) return null;
    const a = Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, raw));
    if (a !== raw) clamped++;
    const [x, y] = args;
    if (typeof x === "number" && typeof y === "number") return [Math.round(a * 1000), 1000, ...args.slice(2)];
    if (typeof x === "number") return [a, ...args.slice(1)];
    if (x && typeof x === "object") {
        if (typeof x.width === "number" && typeof x.height === "number") return [{ ...x, width: Math.round(a * 1000), height: 1000 }, ...args.slice(1)];
        if (typeof x.numerator === "number" && typeof x.denominator === "number") return [{ ...x, numerator: Math.round(a * 1000), denominator: 1000 }, ...args.slice(1)];
        const k = Object.keys(x).find(key => /aspect|ratio/i.test(key) && typeof x[key] === "number");
        if (k) return [{ ...x, [k]: a }, ...args.slice(1)];
    }
    return null;
}

function safeArgs(args: any[]): any[] {
    const want = pipAspect();
    const next = want ? shape(args, want) : null;
    if (next) return next;
    const own = ratioOf(args);
    if (own !== null && (own < MIN_ASPECT || own > MAX_ASPECT)) return shape(args, own) ?? args;
    return args;
}

const resend = safe("pip resend", () => {
    if (pip && lastArgs) {
        try {
            pip.setPipAspectRatio(...lastArgs);
        } catch { }
    }
});

function patch(tries = 0) {
    retry = null;
    const obj = moduleExports(PIP_PATH)?.default;
    if (!obj || typeof obj.setPipAspectRatio !== "function") {
        if (tries < 60) retry = setTimeout(safe("pip wait", () => patch(tries + 1)), 2000);
        return;
    }
    pip = obj;
    unpatches.push(instead("setPipAspectRatio", pip, safeInstead("pip shape", (args: any[], orig: Function) => {
        lastArgs = [...args];
        let next = args;
        try {
            next = safeArgs(args);
        } catch (e) {
            caught("pip shape", e);
            next = inRange(args);
        }
        try {
            lastSent = `${JSON.stringify(args)} -> ${next !== args ? JSON.stringify(next) : "kept"}`;
        } catch { }
        return orig(...next);
    })));
    for (const [name, set] of [["setSelectedStream", (v: string | null) => selected = v], ["setFocusedStream", (v: string | null) => focused = v]] as const) {
        if (typeof pip[name] !== "function") continue;
        unpatches.push(instead(name, pip, safeInstead(`pip ${name}`, (args: any[], orig: Function) => {
            let before: number | null = null;
            try {
                before = pipAspect();
                set(idOf(args[0]));
            } catch (e) {
                caught(`pip ${name}`, e);
            }
            const ret = orig(...args);
            try {
                if (pipAspect() !== before) resend();
            } catch (e) {
                caught(`pip ${name}`, e);
            }
            return ret;
        })));
    }
}

function inRange(args: any[]): any[] {
    try {
        const ratio = ratioOf(args);
        return ratio !== null && (ratio < MIN_ASPECT || ratio > MAX_ASPECT) ? shape(args, ratio) ?? args : args;
    } catch {
        return args;
    }
}

const onRtc = safe("pip rtc", (e: any) => {
    if (!pip && !retry && /CONNECTED/.test(String(e?.state))) patch(0);
});

export function startPip() {
    patch();
    unpatches.push(onAspectChange(() => setTimeout(resend, 0)));
    FluxDispatcher.subscribe("RTC_CONNECTION_STATE", onRtc);
    unpatches.push(() => FluxDispatcher.unsubscribe("RTC_CONNECTION_STATE", onRtc));
}

export function stopPip() {
    if (retry) clearTimeout(retry);
    retry = null;
    for (const u of unpatches.splice(0)) u();
    if (lastArgs) lastArgs = inRange(lastArgs);
    resend();
    pip = null;
    lastArgs = null;
    selected = focused = null;
}

export function pipDebug(): string[] {
    const a = pipAspect();
    return [
        `pip: ${pip ? "hooked" : "not loaded yet"}, stream ${focused ?? selected ?? "main"}, shape ${a ? a.toFixed(3) : "unknown"}${clamped ? `, kept in range ${clamped}x` : ""}`,
        `pip last: ${lastSent || "none yet"}`,
    ];
}
