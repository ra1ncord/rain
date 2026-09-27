import { getNativeModule } from "@api/native/modules";
import { instead } from "@api/patcher";
import { logger } from "@lib/utils/logger";
import { findByStoreName } from "@metro";
import { FluxDispatcher } from "@metro/common";
import { SelectedChannelStore } from "@metro/common/stores";
import { AppState, Dimensions } from "react-native";

const DISCORD_PATH = "modules/device/native/DeviceOrientation.tsx";
const RELOCKS = ["lockToPortrait", "unlockAllOrientations", "lockToPortraitUpsideDown"];
const WATCH = ["lockToPortrait", "lockToLandscape", "lockToLandscapeLeft", "lockToLandscapeRight", "unlockAllOrientations", "ignoreAutoRotate"];

let forced = false;
let locker: any = null;
let native: any = null;
let discord: any = null;
let hooked: string[] = [];
let lastError = "";
let dimsSub: { remove(): void; } | null = null;
let retryTimer: ReturnType<typeof setInterval> | null = null;
const trail: string[] = [];
const unpatches: (() => unknown)[] = [];
const listeners = new Set<() => void>();

const brief = (v: any) => {
    try {
        return (JSON.stringify(v) ?? String(v)).slice(0, 60);
    } catch {
        return String(v).slice(0, 60);
    }
};

function note(text: string) {
    trail.push(`${new Date().toISOString().slice(17, 23)} ${text}`);
    if (trail.length > 24) trail.splice(0, trail.length - 24);
}

function mods(): any {
    return (window as any).modules ?? {};
}

function byPath(path: string): any {
    const m = mods();
    for (const id of Object.keys(m)) {
        if (m[id]?.__filePath === path) return m[id].isInitialized ? m[id].publicModule?.exports : undefined;
    }
}

function scan(test: (exp: any) => boolean): any {
    const m = mods();
    for (const id of Object.keys(m)) {
        if (!m[id]?.isInitialized) continue;
        const exp = m[id].publicModule?.exports;
        if (!exp || typeof exp !== "object") continue;
        try {
            if (test(exp)) return exp;
            if (exp.default && typeof exp.default === "object" && test(exp.default)) return exp.default;
        } catch { }
    }
}

const isLocker = (e: any) => typeof e.lockToLandscape === "function" && typeof e.lockToPortrait === "function" && typeof e.unlockAllOrientations === "function";

function wrap(target: any, name: string, label: string, body: (args: any[], orig: Function) => any) {
    const before = target?.[name];
    if (typeof before !== "function") return;
    try {
        unpatches.push(instead(name, target, body));
        hooked.push(`${label}.${name}${target[name] === before ? "(no)" : ""}`);
    } catch {
        hooked.push(`${label}.${name}(no)`);
    }
}

function hookLocker(target: any, label: string) {
    if (!target) return;
    const landscape = target.lockToLandscape;
    for (const name of WATCH) {
        wrap(target, name, label, (args, orig) => {
            const flip = forced && (RELOCKS.includes(name) || (name === "ignoreAutoRotate" && args[0] !== true));
            note(`${label}.${name}(${args.map(brief).join(",")})${flip ? " -> kept landscape" : ""}`);
            if (forced && name === "ignoreAutoRotate") return orig(true);
            if (forced && RELOCKS.includes(name) && typeof landscape === "function") return landscape.call(target);
            return orig(...args);
        });
    }
}

function landscapeType(): any {
    const types = discord?.OrientationType;
    if (!types || typeof types !== "object") return undefined;
    const keys = Object.keys(types);
    const key = keys.find(k => /^landscape$/i.test(k)) ?? keys.find(k => /landscape/i.test(k) && !/right/i.test(k)) ?? keys.find(k => /landscape/i.test(k));
    return key !== undefined ? types[key] : undefined;
}

function onDims({ window: w }: any) {
    note(`screen ${Math.round(w.width)}x${Math.round(w.height)}`);
}

export function startOrientation() {
    locker = scan(isLocker) ?? null;
    native = getNativeModule<any>("Orientation") ?? null;
    discord = byPath(DISCORD_PATH) ?? null;
    hooked = [];
    hookLocker(locker, "js");
    if (native && native !== locker) hookLocker(native, "native");
    if (discord) {
        const lt = landscapeType();
        wrap(discord, "lockOrientation", "discord", (args, orig) => {
            note(`discord.lockOrientation(${args.map(brief).join(",")})${forced && lt !== undefined ? " -> landscape" : ""}`);
            return orig(...(forced && lt !== undefined ? [lt] : args));
        });
        wrap(discord, "unlockOrientation", "discord", (args, orig) => {
            note(`discord.unlockOrientation()${forced ? " -> kept" : ""}`);
            if (forced) return;
            return orig(...args);
        });
    }
    dimsSub = Dimensions.addEventListener("change", onDims);
}

export function stopOrientation() {
    if (forced) setLandscape(false);
    for (const u of unpatches.splice(0)) u();
    dimsSub?.remove();
    dimsSub = null;
    hooked = [];
}

export const isLandscapeLocked = () => forced;

export function onRotateChange(l: () => void) {
    listeners.add(l);
    return () => void listeners.delete(l);
}

function attempt(label: string, fn: () => any) {
    try {
        const r = fn();
        if (r && typeof r.catch === "function") r.catch((e: any) => note(`${label} failed: ${e?.message ?? e}`));
        return true;
    } catch (e: any) {
        lastError = `${label}: ${e?.message ?? e}`;
        note(`${label} failed: ${e?.message ?? e}`);
        logger.error("[Cheeseburger] rotate", e);
        return false;
    }
}

function setIgnoreAutoRotate(v: boolean) {
    for (const t of [locker, native]) {
        if (!t) continue;
        if (typeof t.ignoreAutoRotate === "function") attempt(`ignoreAutoRotate(${v})`, () => t.ignoreAutoRotate(v));
        else if (typeof t.ignoreAutoRotate === "boolean") t.ignoreAutoRotate = v;
    }
}

const portrait = () => {
    const w = Dimensions.get("window");
    return w.height >= w.width;
};

function focus(id: string | null) {
    const channelId = SelectedChannelStore?.getVoiceChannelId?.();
    if (!channelId) return;
    try {
        FluxDispatcher.dispatch({ type: "CHANNEL_RTC_SELECT_PARTICIPANT", channelId, id });
        note(`focus ${id ?? "none"}`);
    } catch { }
}

function streamId(): string | null {
    const channelId = SelectedChannelStore?.getVoiceChannelId?.();
    if (!channelId) return null;
    try {
        const parts: any[] = findByStoreName("ChannelRTCStore")?.getParticipants?.(channelId) ?? [];
        const s = parts.find(p => p?.stream);
        return s?.id != null ? String(s.id) : null;
    } catch {
        return null;
    }
}

let focused = false;

export function setLandscape(v: boolean) {
    if (!locker && !native && !discord) startOrientation();
    lastError = "";
    if (retryTimer) clearInterval(retryTimer);
    retryTimer = null;

    if (v) {
        forced = true;
        note("rotate on");
        setIgnoreAutoRotate(true);
        const target = native ?? locker;
        if (target) attempt("lockToLandscape", () => target.lockToLandscape());
        const sid = streamId();
        focused = !!sid;
        if (sid) focus(sid);
        let tries = 0;
        retryTimer = setInterval(() => {
            if (!forced || !portrait() || AppState.currentState !== "active") return;
            tries++;
            note(`still portrait (${tries})`);
            setIgnoreAutoRotate(true);
            const t = native ?? locker;
            if (tries % 2 === 0 && t?.lockToLandscapeLeft) attempt("lockToLandscapeLeft", () => t.lockToLandscapeLeft());
            else if (t) attempt("lockToLandscape", () => t.lockToLandscape());
        }, 1200);
    } else {
        forced = false;
        note("rotate off");
        setIgnoreAutoRotate(false);
        const target = locker ?? native;
        if (target) attempt("unlock", () => target.unlockAllOrientations());
        if (focused) focus(null);
        focused = false;
    }
    listeners.forEach(l => l());
    return true;
}

export const toggleLandscape = () => setLandscape(!forced);

export function resetOrientation() {
    if (forced) setLandscape(false);
}

export function orientationDebug(): string[] {
    const safe = (f: () => any) => {
        try {
            return brief(f());
        } catch (e) {
            return `err ${e}`;
        }
    };
    const w = Dimensions.get("window");
    return [
        `rotate: ${locker ? "js" : native ? "native" : "none"}${discord ? " + discord" : ""}${lastError ? ` (${lastError})` : ""}, on: ${forced}, screen ${Math.round(w.width)}x${Math.round(w.height)}`,
        `hooked: ${hooked.join(",") || "none"}`,
        `ignoreAutoRotate: ${typeof locker?.ignoreAutoRotate}${typeof locker?.ignoreAutoRotate === "function" ? `/${locker.ignoreAutoRotate.length}` : ""}, native: ${typeof native?.ignoreAutoRotate}`,
        `discord types: ${safe(() => discord?.OrientationType)}, lock: ${safe(() => discord?.getOrientationLock?.())}, now: ${safe(() => discord?.getOrientation?.())}`,
        "rotate log:",
        ...(trail.length ? trail.map(t => `  ${t}`) : ["  none yet"]),
    ];
}
