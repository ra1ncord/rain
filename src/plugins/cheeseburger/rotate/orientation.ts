import { getNativeModule } from "@api/native/modules";
import { logger } from "@lib/utils/logger";

interface Api { name: string; lock(landscape: boolean): unknown; }

const NATIVE_GUESSES = [
    "ExpoScreenOrientation", "Orientation", "RNOrientation", "OrientationLocker", "DCDOrientationManager",
    "RTNOrientationManager", "NativeOrientationModule", "OrientationModule", "ScreenOrientationModule", "DCDScreenOrientation",
];

let api: Api | null | undefined;
let landscape = false;
let lastError = "";
const listeners = new Set<() => void>();

function scanModules(test: (exp: any) => boolean): any {
    const mods: any = (window as any).modules ?? {};
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

function detect(): Api | null {
    const expo = (globalThis as any).expo?.modules?.ExpoScreenOrientation;
    if (typeof expo?.lockAsync === "function") return { name: "expo native", lock: l => expo.lockAsync(l ? 5 : 0) };

    const expoJs = scanModules(e => typeof e.lockAsync === "function" && e.OrientationLock && typeof e.OrientationLock.LANDSCAPE === "number");
    if (expoJs) return { name: "expo js", lock: l => expoJs.lockAsync(l ? expoJs.OrientationLock.LANDSCAPE : expoJs.OrientationLock.DEFAULT) };

    const locker = getNativeModule<any>("Orientation", "RNOrientation", "OrientationLocker");
    if (typeof locker?.lockToLandscape === "function") {
        return { name: "locker native", lock: l => (l ? locker.lockToLandscape() : (locker.unlockAllOrientations ?? locker.lockToPortrait).call(locker)) };
    }

    const lockerJs = scanModules(e => typeof e.lockToLandscape === "function" && (typeof e.unlockAllOrientations === "function" || typeof e.lockToPortrait === "function"));
    if (lockerJs) return { name: "locker js", lock: l => (l ? lockerJs.lockToLandscape() : (lockerJs.unlockAllOrientations ?? lockerJs.lockToPortrait).call(lockerJs)) };

    return null;
}

function getApi() {
    if (api === undefined || api === null) api = detect();
    return api;
}

export const isLandscapeLocked = () => landscape;

export function onRotateChange(l: () => void) {
    listeners.add(l);
    return () => void listeners.delete(l);
}

export function setLandscape(v: boolean) {
    const a = getApi();
    if (!a) {
        lastError = "no orientation api";
        return false;
    }
    try {
        const r: any = a.lock(v);
        if (r && typeof r.catch === "function") {
            r.catch((e: any) => {
                lastError = String(e?.message ?? e);
                logger.error("[Cheeseburger] rotate failed", e);
            });
        }
        landscape = v;
        lastError = "";
        listeners.forEach(l => l());
        return true;
    } catch (e: any) {
        lastError = String(e?.message ?? e);
        logger.error("[Cheeseburger] rotate failed", e);
        return false;
    }
}

export const toggleLandscape = () => setLandscape(!landscape);

export function resetOrientation() {
    if (landscape) setLandscape(false);
}

export function orientationDebug(): string[] {
    const turbo = (globalThis as any).__turboModuleProxy;
    const proxy = (window as any).nativeModuleProxy ?? {};
    const natives = NATIVE_GUESSES.filter(n => {
        try {
            return !!(turbo?.(n) ?? proxy[n] ?? (globalThis as any).expo?.modules?.[n]);
        } catch {
            return false;
        }
    });
    const mods: any = (window as any).modules ?? {};
    const paths: string[] = [];
    for (const id of Object.keys(mods)) {
        const m = mods[id];
        const path: string | undefined = m?.__filePath;
        const exp = m?.isInitialized ? m.publicModule?.exports : undefined;
        const keys = exp && typeof exp === "object" ? Object.keys(exp) : [];
        const hit = (path && /orient/i.test(path)) || keys.some(k => /orient|lockTo|lockAsync/i.test(k));
        if (hit && paths.length < 12) paths.push(`  ${path ?? `#${id}`}: ${keys.slice(0, 10).join(",")}`);
    }
    const expoMods = Object.keys((globalThis as any).expo?.modules ?? {});
    return [
        `rotate api: ${getApi()?.name ?? "none"}${lastError ? ` (${lastError})` : ""}, landscape: ${landscape}`,
        `native: ${natives.join(",") || "none"}`,
        `expo modules: ${expoMods.join(",").slice(0, 300) || "none"}`,
        "orientation modules:",
        ...(paths.length ? paths : ["  none"]),
    ];
}
