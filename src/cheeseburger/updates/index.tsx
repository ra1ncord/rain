import { updateAllExternalPlugins, useExternalPlugins } from "@api/external/plugins";
import { revision } from "@api/hot/build";
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
