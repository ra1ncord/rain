import { useLoaderConfig } from "@api/settings";
import { showToast } from "@api/ui/toasts";
import { logger } from "@lib/utils/logger";
import { pluginInstances } from "@plugins";
import { AppState } from "react-native";

import builtin from "../../cheeseburger";
import { builtinRevision } from "./build";
import { installRegistry } from "./registry";
import { hotStatus } from "./status";

const ID = "cheeseburger";
const FALLBACK = "https://github.com/TonyskalYT/rain/releases/latest/download/rain.js";
const CHECK_MS = 10_000;
const g = globalThis as any;

let current: any = builtin;
let revision = builtinRevision;
let running = false;
let queue: Promise<unknown> = Promise.resolve();
let timer: ReturnType<typeof setInterval> | null = null;
let checking = false;
let lastError = "";
let failedRevision = "";

function setStatus(source: string) {
    hotStatus.source = source;
    hotStatus.revision = revision;
    hotStatus.error = lastError;
}

setStatus("built-in");

function serial<T>(fn: () => T | Promise<T>): Promise<T> {
    const next = queue.then(() => fn());
    queue = next.catch(() => { });
    return next;
}

function baseUrl() {
    const c = useLoaderConfig.getState().customLoadUrl;
    const url = (c?.enabled && c.url ? c.url : FALLBACK).replace(/[?#].*$/, "");
    return url.replace(/[^/]+$/, "");
}

async function fetchText(name: string) {
    const res = await fetch(`${baseUrl()}${name}?t=${Date.now()}`, { cache: "no-store" } as any);
    if (!res.ok) throw new Error(`${name}: ${res.status}`);
    return res.text();
}

function evaluate(code: string): any {
    const src = `(function(module, exports){${code}\n;return module.exports;})`;
    const factory = typeof g.globalEvalWithSourceUrl === "function"
        ? g.globalEvalWithSourceUrl(src, "cheeseburger")
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
    start: () => serial(async () => {
        if (running) return;
        running = true;
        await current.start();
    }),
    stop: () => serial(async () => {
        if (!running) return;
        running = false;
        await current.stop?.();
    }),
};

async function swap(code: string, rev: string) {
    const next = evaluate(code);
    const prev = current;
    const prevRevision = revision;
    g.__cheeseburgerSwapping = true;
    try {
        if (running) {
            try {
                await prev.stop?.();
            } catch (e) {
                logger.error("[Hot] old stop failed", e);
            }
        }
        current = next;
        revision = rev;
        if (running) {
            try {
                await next.start();
            } catch (e) {
                try {
                    await next.stop?.();
                } catch { }
                current = prev;
                revision = prevRevision;
                await prev.start();
                throw e;
            }
        }
    } finally {
        g.__cheeseburgerSwapping = false;
    }
}

async function check() {
    if (checking || AppState.currentState !== "active") return;
    checking = true;
    try {
        const meta = JSON.parse(await fetchText("cheeseburger.json"));
        if (!meta?.revision || meta.revision === revision || meta.revision === failedRevision) return;
        const code = await fetchText("cheeseburger.js");
        try {
            await serial(() => swap(code, meta.revision));
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
