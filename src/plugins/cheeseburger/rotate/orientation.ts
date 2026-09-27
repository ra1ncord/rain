import { getNativeModule } from "@api/native/modules";
import { instead } from "@api/patcher";
import { logger } from "@lib/utils/logger";

const DISCORD_PATH = "modules/device/native/DeviceOrientation.tsx";
const RELOCKS = ["lockToPortrait", "unlockAllOrientations", "lockToPortraitUpsideDown"];

let forced = false;
let locker: any = null;
let native: any = null;
let discord: any = null;
let patched: string[] = [];
let lastError = "";
const unpatches: (() => unknown)[] = [];
const listeners = new Set<() => void>();

function modules(): any {
    return (window as any).modules ?? {};
}

function byPath(path: string): any {
    const mods = modules();
    for (const id of Object.keys(mods)) {
        const m = mods[id];
        if (m?.__filePath === path) return m.isInitialized ? m.publicModule?.exports : undefined;
    }
}

function scan(test: (exp: any) => boolean): any {
    const mods = modules();
    for (const id of Object.keys(mods)) {
        const m = mods[id];
        if (!m?.isInitialized) continue;
        const exp = m.publicModule?.exports;
        if (!exp || typeof exp !== "object") continue;
        try {
            if (test(exp)) return exp;
            if (exp.default && typeof exp.default === "object" && test(exp.default)) return exp.default;
        } catch { }
    }
}

const isLocker = (e: any) => typeof e.lockToLandscape === "function" && typeof e.lockToPortrait === "function" && typeof e.unlockAllOrientations === "function";

function hook(target: any, label: string) {
    if (!target) return;
    const landscape = target.lockToLandscape;
    if (typeof landscape !== "function") return;
    for (const name of RELOCKS) {
        if (typeof target[name] !== "function") continue;
        try {
            unpatches.push(instead(name, target, (args: any[], orig: Function) => (forced ? landscape.call(target) : orig(...args))));
            patched.push(`${label}.${name}`);
        } catch { }
    }
}

export function startOrientation() {
    locker = scan(isLocker) ?? null;
    native = getNativeModule<any>("Orientation") ?? null;
    discord = byPath(DISCORD_PATH) ?? null;
    patched = [];
    hook(locker, "js");
    if (native !== locker) hook(native, "native");
}

export function stopOrientation() {
    if (forced) setLandscape(false);
    for (const u of unpatches.splice(0)) u();
    patched = [];
}

export const isLandscapeLocked = () => forced;

export function onRotateChange(l: () => void) {
    listeners.add(l);
    return () => void listeners.delete(l);
}

function restore() {
    try {
        const lock = discord?.getOrientationLock?.();
        if (lock != null && typeof discord?.lockOrientation === "function") return void discord.lockOrientation(lock);
    } catch { }
    (locker ?? native)?.lockToPortrait?.();
}

export function setLandscape(v: boolean) {
    if (!locker && !native) startOrientation();
    const target = locker ?? native;
    if (!target) {
        lastError = "no orientation api";
        return false;
    }
    forced = v;
    try {
        if (v) target.lockToLandscape();
        else restore();
        lastError = "";
    } catch (e: any) {
        lastError = String(e?.message ?? e);
        logger.error("[Cheeseburger] rotate failed", e);
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
            return JSON.stringify(f()) ?? "undefined";
        } catch (e) {
            return `err ${e}`;
        }
    };
    return [
        `rotate: ${locker ? "js" : native ? "native" : "none"}${lastError ? ` (${lastError})` : ""}, landscape: ${forced}`,
        `hooked: ${patched.join(",") || "none"}`,
        `discord lock: ${safe(() => discord?.getOrientationLock?.())}, now: ${safe(() => discord?.getOrientation?.())}`,
    ];
}
