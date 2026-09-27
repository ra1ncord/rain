import { NativeFileModule } from "@api/native/modules";
import { useLoaderConfig } from "@api/settings";
import { showToast } from "@api/ui/toasts";
import { logger } from "@lib/utils/logger";
import { isPluginEnabled, pluginInstances } from "@plugins";
import { AppState } from "react-native";

import builtin from "../../cheeseburger";
import { installRegistry } from "./registry";
import { hotStatus } from "./status";

const ID = "cheeseburger";
const CACHE = "rain/hot/cheeseburger.js";
const CACHE_META = "rain/hot/cheeseburger.rev";
const FALLBACK = "https://github.com/TonyskalYT/rain/releases/latest/download/rain.js";
const CHECK_MS = 10_000;

let current: any = null;
let revision = "";
let running = false;
let loading: Promise<void> | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let checking = false;
let lastError = "";
let failedRevision = "";

function setStatus(source: string) {
    hotStatus.source = source;
    hotStatus.revision = revision;
    hotStatus.error = lastError;
}

const docs = () => NativeFileModule.getConstants().DocumentsDirPath;

async function readCache(): Promise<{ code: string; rev: string; } | null> {
    try {
        if (!(await NativeFileModule.fileExists(`${docs()}/${CACHE}`))) return null;
        const code = await NativeFileModule.readFile(`${docs()}/${CACHE}`, "utf8");
        const rev = (await NativeFileModule.fileExists(`${docs()}/${CACHE_META}`)) ? await NativeFileModule.readFile(`${docs()}/${CACHE_META}`, "utf8") : "";
        return code ? { code, rev: rev.trim() } : null;
    } catch {
        return null;
    }
}

async function writeCache(code: string, rev: string) {
    try {
        await NativeFileModule.writeFile("documents", CACHE, code, "utf8");
        await NativeFileModule.writeFile("documents", CACHE_META, rev, "utf8");
    } catch (e) {
        logger.error("[Hot] cache write failed", e);
    }
}

function baseUrl() {
    const c = useLoaderConfig.getState().customLoadUrl;
    const url = (c?.enabled && c.url ? c.url : FALLBACK).replace(/[?#].*$/, "");
    return url.replace(/[^/]+$/, "");
}

const bust = (url: string) => `${url}?t=${Date.now()}`;

async function fetchText(name: string) {
    const res = await fetch(bust(baseUrl() + name), { cache: "no-store" } as any);
    if (!res.ok) throw new Error(`${name}: ${res.status}`);
    return res.text();
}

function evaluate(code: string): any {
    const src = `(function(module, exports){${code}\n;return module.exports;})`;
    const factory = typeof (globalThis as any).globalEvalWithSourceUrl === "function"
        ? (globalThis as any).globalEvalWithSourceUrl(src, "cheeseburger")
        : (0, eval)(`${src}\n//# sourceURL=cheeseburger`);
    const mod = { exports: {} as any };
    const out = factory(mod, mod.exports);
    const def = out?.default ?? out;
    if (!def || typeof def.start !== "function") throw new Error("not a plugin");
    return def;
}

const instance: any = {
    id: ID,
    get name() { return current?.name ?? "Cheeseburger"; },
    get description() { return current?.description ?? ""; },
    get version() { return current?.version ?? "?"; },
    get author() { return current?.author ?? []; },
    get settings() { return current?.settings; },
    async start() {
        await ensureLoaded();
        running = true;
        if (!current) throw new Error(lastError || "not loaded");
        await current.start();
    },
    stop() {
        running = false;
        current?.stop?.();
    },
};

async function ensureLoaded() {
    if (current) return;
    loading ??= (async () => {
        const cached = await readCache();
        if (cached) {
            try {
                current = evaluate(cached.code);
                revision = cached.rev;
                setStatus("cache");
                return;
            } catch (e: any) {
                lastError = `cache: ${e?.message ?? e}`;
                failedRevision = cached.rev;
                logger.error("[Hot] cached cheeseburger failed", e);
            }
        }
        current = builtin;
        revision = "";
        setStatus("built-in");
    })();
    await loading;
    loading = null;
}

async function swap(code: string, rev: string) {
    const next = evaluate(code);
    const prev = current;
    const prevRevision = revision;
    const wasRunning = running && isPluginEnabled(ID);
    (globalThis as any).__cheeseburgerSwapping = true;
    try {
        if (wasRunning) {
            try {
                prev?.stop?.();
            } catch (e) {
                logger.error("[Hot] old stop failed", e);
            }
        }
        current = next;
        revision = rev;
        if (wasRunning) {
            try {
                await next.start();
            } catch (e) {
                try {
                    next.stop?.();
                } catch { }
                current = prev;
                revision = prevRevision;
                if (prev) await prev.start();
                throw e;
            }
        }
    } finally {
        (globalThis as any).__cheeseburgerSwapping = false;
    }
    await writeCache(code, rev);
}

async function check() {
    if (checking || AppState.currentState !== "active") return;
    checking = true;
    try {
        const meta = JSON.parse(await fetchText("cheeseburger.json"));
        if (!meta?.revision || meta.revision === revision || meta.revision === failedRevision) return;
        const code = await fetchText("cheeseburger.js");
        try {
            await swap(code, meta.revision);
        } catch (e: any) {
            failedRevision = meta.revision;
            lastError = `live: ${e?.message ?? e}`;
            setStatus(hotStatus.source);
            logger.error("[Hot] swap failed", e);
            return;
        }
        lastError = "";
        setStatus("live");
        showToast("Updated");
    } catch (e: any) {
        lastError = `check: ${e?.message ?? e}`;
        setStatus(hotStatus.source);
    } finally {
        checking = false;
    }
}

export const hotRevision = () => revision;
export const hotError = () => lastError;
export const checkHotNow = () => check();

export function registerHotPlugins() {
    installRegistry();
    pluginInstances.set(ID, instance);
    timer ??= setInterval(() => void check(), CHECK_MS);
    AppState.addEventListener("change", s => {
        if (s === "active") void check();
    });
}
