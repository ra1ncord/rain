import { instead } from "@api/patcher";
import { findByStoreName } from "@metro";
import { FluxDispatcher } from "@metro/common";
import { SelectedChannelStore, UserStore } from "@metro/common/stores";
import { NativeModules } from "react-native";

import { caught, safe, safeInstead } from "../crash";
import { splitViewSettings } from "./storage";
import { hasVideo, knownMainAspect, onAspectChange, streamAspect } from "./tiles";

const PIP_PATH = "modules/external_pip/ExternalPip.android.tsx";
const MIN_ASPECT = 0.42;
const MAX_ASPECT = 2.38;
const g = globalThis as any;

interface Cand { sid: any; pid: any; stream: boolean; }

const unpatches: (() => unknown)[] = [];
let pip: any = null;
let lastArgs: any[] | null = null;
let lastSent = "";
let lastPick: string | null = null;
let space: "sid" | "pid" = "sid";
let clamped = 0;
let skipped = 0;
let picks = "";
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

function inRange(args: any[]): any[] {
    try {
        const ratio = ratioOf(args);
        return ratio !== null && (ratio < MIN_ASPECT || ratio > MAX_ASPECT) ? shape(args, ratio) ?? args : args;
    } catch {
        return args;
    }
}

function safeArgs(args: any[]): any[] {
    const want = pipAspect();
    const next = want ? shape(args, want) : null;
    return next ?? inRange(args);
}

const resend = safe("pip resend", () => {
    if (pip && lastArgs) {
        try {
            pip.setPipAspectRatio(...lastArgs);
        } catch { }
    }
});

function people(): { others: Cand[]; mine: Cand[]; } | null {
    const channelId = SelectedChannelStore?.getVoiceChannelId?.();
    if (!channelId) return null;
    const parts = findByStoreName("ChannelRTCStore")?.getParticipants?.(channelId);
    if (!Array.isArray(parts)) return null;
    const meId = UserStore?.getCurrentUser?.()?.id;
    const others: Cand[] = [];
    const mine: Cand[] = [];
    for (const p of parts) {
        if (!p || p.streamId == null) continue;
        const c: Cand = { sid: p.streamId, pid: p.id, stream: !!p.stream };
        const owner = p.user?.id ?? p.userId ?? (p.stream ? undefined : p.id);
        if (meId != null && owner != null && String(owner) === String(meId)) mine.push(c);
        else if (hasVideo(p)) others.push(c);
    }
    return { others, mine };
}

function choose(which: "selected" | "focused", v: any): any {
    if (splitViewSettings.smartPip === false) return v;
    const list = people();
    if (!list || !list.others.length) return v;
    const id = v == null ? null : String(v);
    if (id != null) {
        const all = [...list.others, ...list.mine];
        if (all.some(c => String(c.sid) === id)) space = "sid";
        else if (all.some(c => String(c.pid) === id)) space = "pid";
    }
    const key = (c: Cand) => String(space === "pid" ? c.pid : c.sid);
    const val = (c: Cand) => (space === "pid" ? c.pid : c.sid);
    const pick = (pool: Cand[]) => {
        const c = (lastPick != null ? pool.find(x => key(x) === lastPick) : undefined) ?? pool[0];
        lastPick = key(c);
        return val(c);
    };
    const mine = id != null && list.mine.some(c => key(c) === id);
    if (which === "selected") return mine ? pick(list.others) : v;
    const streams = list.others.filter(c => c.stream);
    const pool = streams.length ? streams : list.others;
    const hit = id != null ? pool.find(c => key(c) === id) : undefined;
    if (hit) {
        lastPick = key(hit);
        return v;
    }
    return pick(pool);
}

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
    for (const [name, which, set] of [
        ["setSelectedStream", "selected", (v: string | null) => selected = v],
        ["setFocusedStream", "focused", (v: string | null) => focused = v],
    ] as const) {
        if (typeof pip[name] !== "function") continue;
        unpatches.push(instead(name, pip, safeInstead(`pip ${name}`, (args: any[], orig: Function) => {
            let next = args;
            let before: number | null = null;
            try {
                const v = choose(which, args[0]);
                if (v !== args[0]) {
                    next = [v, ...args.slice(1)];
                    skipped++;
                }
                picks = `${which} ${idOf(args[0]) ?? "none"}${next !== args ? ` -> ${idOf(next[0])}` : ""}`;
                before = pipAspect();
                set(idOf(next[0]));
            } catch (e) {
                caught(`pip ${name}`, e);
                next = args;
            }
            const ret = orig(...next);
            try {
                if (pipAspect() !== before) resend();
            } catch (e) {
                caught(`pip ${name}`, e);
            }
            return ret;
        })));
    }
    const handoff = g.__cheeseburgerPip;
    if (handoff) {
        delete g.__cheeseburgerPip;
        selected = handoff.selected ?? null;
        focused = handoff.focused ?? null;
        lastPick = handoff.lastPick ?? null;
        space = handoff.space ?? "sid";
        if (handoff.lastArgs) {
            lastArgs = handoff.lastArgs;
            resend();
        }
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
    if (g.__cheeseburgerSwapping) {
        g.__cheeseburgerPip = { lastArgs, selected, focused, lastPick, space };
    } else {
        if (lastArgs) lastArgs = inRange(lastArgs);
        resend();
    }
    pip = null;
    lastArgs = null;
    selected = focused = null;
}

export function pipDebug(): string[] {
    const a = pipAspect();
    return [
        `pip: ${pip ? "hooked" : "not loaded yet"}, stream ${focused ?? selected ?? "main"}, shape ${a ? a.toFixed(3) : "unknown"}${clamped ? `, kept in range ${clamped}x` : ""}`,
        `pip last: ${lastSent || "none yet"}`,
        `pip picks: ${splitViewSettings.smartPip === false ? "off" : `${picks || "none yet"}, skipped you ${skipped}x, ids ${space}`}`,
        ...pipParts(),
    ];
}

const keysOf = (o: any) => {
    const out = new Set<string>();
    let cur = o;
    for (let i = 0; cur && i < 3 && cur !== Object.prototype; i++, cur = Object.getPrototypeOf(cur)) {
        for (const k of Object.getOwnPropertyNames(cur)) if (k !== "constructor") out.add(k);
    }
    return [...out];
};

function pipParts(): string[] {
    const out: string[] = [];
    try {
        const exp = moduleExports(PIP_PATH);
        if (exp) {
            for (const k of Object.keys(exp)) {
                const v = exp[k];
                out.push(`pip js ${k}: ${v && (typeof v === "object" || typeof v === "function") ? keysOf(v).join(", ").slice(0, 400) : typeof v}`);
            }
        }
        const mods: any = (window as any).modules ?? {};
        const paths: string[] = [];
        for (const id of Object.keys(mods)) {
            const fp = mods[id]?.__filePath;
            if (typeof fp === "string" && /pip|picture/i.test(fp)) paths.push(fp.replace(/^modules\//, ""));
        }
        if (paths.length) out.push(`pip files: ${paths.slice(0, 20).join(", ")}`);
        const names = new Set<string>();
        try {
            for (const n of Object.keys(NativeModules ?? {})) names.add(n);
        } catch { }
        for (const n of ["ExternalPip", "ExternalPipManager", "PictureInPicture", "PipManager", "DCDPictureInPicture", "RTNExternalPip", "NativeExternalPip"]) names.add(n);
        for (const n of names) {
            if (!/pip|picture/i.test(n)) continue;
            let m: any;
            try {
                m = NativeModules?.[n] ?? (globalThis as any).__turboModuleProxy?.(n);
            } catch {
                m = undefined;
            }
            if (m) out.push(`pip native ${n}: ${keysOf(m).join(", ").slice(0, 400)}`);
        }
    } catch (e) {
        out.push(`pip parts: ${String((e as any)?.message ?? e).slice(0, 80)}`);
    }
    return out.length ? out : ["pip parts: nothing found"];
}
