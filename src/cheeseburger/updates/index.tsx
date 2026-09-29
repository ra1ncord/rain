import { updateAllExternalPlugins, updateExternalPlugin, useExternalPlugins } from "@api/external/plugins";
import { revision } from "@api/hot/build";
import { hotStatus } from "@api/hot/status";
import { BundleUpdaterManager } from "@api/native/modules";
import UpdateModule from "@api/native/modules/update";
import { useLoaderConfig } from "@api/settings";
import { createPluginStore, waitForHydration } from "@api/storage";
import { openAlert } from "@api/ui/alerts";
import { showToast } from "@api/ui/toasts";
import { cyrb64Hash } from "@lib/utils/cyrb64";
import { logger } from "@lib/utils/logger";
import { findByProps, findByStoreName } from "@metro";
import { React } from "@metro/common";
import { AlertActionButton, AlertActions, AlertModal } from "@metro/common/components";
import { SelectedChannelStore } from "@metro/common/stores";
import { fetchTheme, getCurrentTheme, useThemes } from "@plugins/_core/painter/themes";
import { AppState } from "react-native";

interface Rejoin { channelId: string; video: boolean; at: number; }

const { useStore: useLiveUpdates, settings: state } = createPluginStore<{ target: string; tries: number; rejoin: Rejoin | null; }>("liveupdates", { target: "", tries: 0, rejoin: null });

const CHECK_MS = 10_000;
const ADDONS_MS = 30_000;

let running = false;
let busy = false;
let pending: string | null = null;
let prompted: string | null = null;
const readyListeners = new Set<() => void>();
let lastCheck = 0;
let lastAddons = 0;
let timer: ReturnType<typeof setInterval> | null = null;
let appSub: { remove(): void; } | null = null;
const themeHashes = new Map<string, string>();

export const buildRevision = revision;

const bust = (url: string) => `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;
const voiceChannel = (): string | null => SelectedChannelStore?.getVoiceChannelId?.() ?? null;
const foreground = () => AppState.currentState === "active";

function infoUrl(): string | null {
    const c = useLoaderConfig.getState().customLoadUrl;
    if (!c?.enabled || !c.url) return null;
    const url = c.url.replace(/[?#].*$/, "");
    return /\.(js|hbc)$/i.test(url) ? url.replace(/[^/]+$/, "info.json") : null;
}

async function latestRevision(): Promise<string | null> {
    const url = infoUrl();
    if (!url) return null;
    const res = await fetch(bust(url), { cache: "no-store" } as any);
    if (!res.ok) return null;
    const info = await res.json();
    return typeof info?.revision === "string" ? info.revision : null;
}

const stuck = (target: string) => state.target === target && state.tries >= 2;

async function applyBuild(target: string, manual = false) {
    if (busy || (!manual && stuck(target))) return;
    busy = true;
    state.tries = state.target === target ? state.tries + 1 : 1;
    state.target = target;
    const channelId = voiceChannel();
    state.rejoin = channelId ? { channelId, video: videoOn(), at: Date.now() } : null;
    showToast("Updating");
    try {
        await UpdateModule.nativeBundleClear();
        await UpdateModule.nativeDownload();
    } catch (e) {
        logger.error("[Cheeseburger] update download failed", e);
    }
    setTimeout(() => BundleUpdaterManager.reload(), 300);
}

function maybePrompt() {
    if (!running || !pending || !foreground() || prompted === pending || stuck(pending)) return;
    const target = pending;
    prompted = target;
    openAlert("cheeseburger-update", (
        <AlertModal
            title="Update ready"
            content="Reloads Discord"
            actions={
                <AlertActions>
                    <AlertActionButton text="Reload" variant="primary" onPress={() => void applyBuild(target, true)} />
                    <AlertActionButton text="Later" variant="secondary" />
                </AlertActions>
            }
        />
    ));
}

export function useUpdateReady(): boolean {
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => {
        readyListeners.add(force);
        return () => void readyListeners.delete(force);
    }, []);
    return !!pending;
}

export function updateNow() {
    if (pending) void applyBuild(pending, true);
}

function videoOn(): boolean {
    try {
        return !!findByStoreName("MediaEngineStore")?.isVideoEnabled?.();
    } catch {
        return false;
    }
}

function rejoinCall() {
    const r = state.rejoin;
    state.rejoin = null;
    if (!r || Date.now() - r.at > 90_000) return;
    setTimeout(() => {
        if (!running || voiceChannel()) return;
        try {
            findByProps("selectVoiceChannel")?.selectVoiceChannel?.(r.channelId);
        } catch (e) {
            logger.error("[Cheeseburger] rejoin failed", e);
            return;
        }
        if (!r.video) return;
        setTimeout(() => {
            try {
                if (voiceChannel() === r.channelId && !videoOn()) findByProps("setVideoEnabled")?.setVideoEnabled?.(true);
            } catch { }
        }, 3000);
    }, 5000);
}

async function checkAddons() {
    lastAddons = Date.now();
    if (useExternalPlugins.getState().autoUpdate) {
        updateAllExternalPlugins({ restart: true, silent: true }).catch(() => { });
    }
    const current = getCurrentTheme();
    for (const id of Object.keys(useThemes.getState().themes)) {
        if (!/^https?:\/\//.test(id)) continue;
        try {
            const res = await fetch(bust(id), { cache: "no-store" } as any);
            if (!res.ok) continue;
            const hash = cyrb64Hash(await res.text());
            const prev = themeHashes.get(id);
            themeHashes.set(id, hash);
            if (prev !== undefined && prev !== hash) await fetchTheme(id, current?.id === id);
        } catch { }
    }
}

const FALLBACK = "https://github.com/TonyskalYT/rain/releases/latest/download/rain.js";
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function hotBase() {
    const c = useLoaderConfig.getState().customLoadUrl;
    const url = (c?.enabled && c.url ? c.url : FALLBACK).replace(/[?#].*$/, "");
    return url.replace(/[^/]+$/, "");
}

async function syncCheeseburger(): Promise<"updated" | "current" | "failed"> {
    try {
        const res = await fetch(bust(`${hotBase()}cheeseburger.json`), { cache: "no-store" } as any);
        if (!res.ok) return "failed";
        const meta = await res.json();
        if (!meta?.revision || meta.revision === hotStatus.revision) return "current";
        setSync("Updating Cheeseburger");
        const until = Date.now() + 15_000;
        while (Date.now() < until) {
            await sleep(250);
            if (hotStatus.revision === meta.revision) return "updated";
        }
        return "failed";
    } catch {
        return "failed";
    }
}

const norm = (v: any): any => {
    if (typeof v === "string") return v.toLowerCase();
    if (Array.isArray(v)) return v.slice(0, 2).map(norm);
    if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().map(k => [k, norm(v[k])]));
    return v;
};

function sameTheme(next: any, cur: any) {
    if (!cur) return false;
    const pick = (d: any, raw: any) => JSON.stringify(norm({
        name: d?.name,
        semantic: d?.semanticColors ?? d?.main?.semantic,
        raw: Object.fromEntries(Object.keys(raw ?? {}).map(k => [k, (d?.rawColors ?? d?.main?.raw)?.[k]])),
        background: d?.background ?? d?.main?.background,
        plus: d?.plus,
    }));
    const raw = next?.rawColors ?? next?.main?.raw;
    return pick(next, raw) === pick(cur, raw);
}

async function syncThemes() {
    let updated = 0, failed = 0;
    const current = getCurrentTheme();
    for (const [id, theme] of Object.entries(useThemes.getState().themes)) {
        if (!/^https?:\/\//.test(id)) continue;
        try {
            const res = await fetch(bust(id), { cache: "no-store" } as any);
            if (!res.ok) {
                failed++;
                continue;
            }
            const text = await res.text();
            themeHashes.set(id, cyrb64Hash(text));
            if (sameTheme(JSON.parse(text), (theme as any).data)) continue;
            await fetchTheme(id, current?.id === id);
            updated++;
        } catch {
            failed++;
        }
    }
    return { updated, failed };
}

async function syncPlugins() {
    let updated = 0, failed = 0;
    const ids = Object.values(useExternalPlugins.getState().plugins).filter((p: any) => p.source && p.update).map((p: any) => p.id);
    for (const id of ids) {
        try {
            if (await updateExternalPlugin(id, { restart: true })) updated++;
        } catch {
            failed++;
        }
    }
    return { updated, failed };
}

async function syncCore() {
    try {
        const latest = await latestRevision();
        const prev = pending;
        pending = latest && latest !== revision ? latest : null;
        if (pending !== prev) readyListeners.forEach(l => l());
    } catch { }
    return !!pending;
}

const sync = { busy: false, text: "" };
const syncListeners = new Set<() => void>();

function setSync(text: string, busy = sync.busy) {
    sync.text = text;
    sync.busy = busy;
    syncListeners.forEach(l => l());
}

export function useSync() {
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => {
        syncListeners.add(force);
        return () => void syncListeners.delete(force);
    }, []);
    return sync;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export async function syncNow() {
    if (sync.busy) return;
    setSync("Checking", true);
    try {
        const [cb, themes, plugins, core] = await Promise.all([syncCheeseburger(), syncThemes(), syncPlugins(), syncCore()]);
        const done = [
            cb === "updated" && "Cheeseburger",
            themes.updated > 0 && plural(themes.updated, "theme"),
            plugins.updated > 0 && plural(plugins.updated, "plugin"),
        ].filter(Boolean);
        const failed = (cb === "failed" ? 1 : 0) + themes.failed + plugins.failed;
        const text = [
            done.length ? `Updated ${done.join(", ")}` : "Up to date",
            failed && `${failed} failed`,
            core && "Rain update needs a reload",
        ].filter(Boolean).join(" · ");
        setSync(text, false);
    } catch {
        setSync("Couldn't check", false);
    }
}

let checking = false;

async function check() {
    if (!running || checking || !foreground()) return;
    checking = true;
    lastCheck = Date.now();
    try {
        const latest = await latestRevision();
        const prev = pending;
        pending = latest && latest !== revision ? latest : null;
        if (pending !== prev) readyListeners.forEach(l => l());
    } catch { } finally {
        checking = false;
    }
    maybePrompt();
    if (!pending && Date.now() - lastAddons >= ADDONS_MS) void checkAddons();
}

function onAppState(s: string) {
    if (s !== "active") return;
    if (Date.now() - lastCheck > 3_000) void check();
    else maybePrompt();
}

export default {
    async start() {
        running = true;
        await waitForHydration(useLiveUpdates);
        if (state.target === revision) state.tries = 0;
        rejoinCall();
        appSub = AppState.addEventListener("change", onAppState);
        timer = setInterval(() => void check(), CHECK_MS);
        setTimeout(() => void check(), 5_000);
    },
    stop() {
        running = false;
        pending = null;
        if (timer) clearInterval(timer);
        timer = null;
        appSub?.remove();
        appSub = null;
    },
};
