import { after, before } from "@api/patcher";
import { logger } from "@lib/utils/logger";
import { findByStoreName } from "@metro";
import { FluxDispatcher } from "@metro/common";
import { SelectedChannelStore, UserStore } from "@metro/common/stores";
import { AppState, Dimensions } from "react-native";

import { isLandscapeLocked } from "../rotate/orientation";
import { setTilesActive, setTilesFullscreen, tilesDebug } from "./tiles";

let active = false;
let fullscreen = false;
let lastSel: string | null = null;
let fsSel: string | null = null;
let watchedAt = 0;
const listeners = new Set<() => void>();
const unpatches: (() => unknown)[] = [];
let salt = 0;

export const isSplitActive = () => active || resumeAfterFocus;
export function onSplitChange(l: () => void) {
    listeners.add(l);
    return () => void listeners.delete(l);
}

const rtcStore = () => findByStoreName("ChannelRTCStore");

const hasVideo = (p: any) => !!(p?.stream || p?.streamId != null || p?.userVideo);

const memo = new WeakMap<object, { key: string; out: any[]; }>();

const signature = (list: any[]) => list.map((p: any) => `${p?.id ?? p?.user?.id}:${p?.streamId ?? ""}:${p?.stream ? 1 : 0}:${p?.userVideo ? 1 : 0}`).join("|");

function arrange(list: any): any {
    if (!active || !Array.isArray(list)) return list;
    const key = `${salt}#${signature(list)}`;
    const hit = memo.get(list);
    if (hit?.key === key) return hit.out;

    const video = list.filter(hasVideo);
    let out = list;
    if (video.length >= 2) {
        const meId = UserStore?.getCurrentUser?.()?.id;
        const isMe = (p: any) => (p?.user?.id ?? p?.id) === meId;
        const streams = video.filter((p: any) => p.stream);
        const theirCams = video.filter((p: any) => !p.stream && !isMe(p));
        const myCam = video.filter((p: any) => !p.stream && isMe(p));
        out = [...streams, ...theirCams, ...myCam];
    }
    memo.set(list, { key, out });
    return out;
}

function refresh() {
    salt++;
    const store = rtcStore();
    try { store?.emitChange?.(); } catch (e) { logger.error("[SplitView] emitChange failed", e); }
    listeners.forEach(l => l());
}

function selectParticipant(id: string | null) {
    const channelId = SelectedChannelStore?.getVoiceChannelId?.();
    if (!channelId) return;
    try {
        FluxDispatcher.dispatch({ type: "CHANNEL_RTC_SELECT_PARTICIPANT", channelId, id });
    } catch { }
}

const unselectParticipant = () => selectParticipant(null);

function mainParticipantId(): string | null {
    const channelId = SelectedChannelStore?.getVoiceChannelId?.();
    if (!channelId) return null;
    try {
        const parts: any[] = rtcStore()?.getParticipants?.(channelId) ?? [];
        const meId = UserStore?.getCurrentUser?.()?.id;
        const pick = parts.find(p => p?.stream) ?? parts.find(p => hasVideo(p) && (p?.user?.id ?? p?.id) !== meId);
        return pick?.id != null ? String(pick.id) : null;
    } catch {
        return null;
    }
}

const actions: string[] = [];
const NOISY = /^(SPEAKING|RTC_CONNECTION_PING|RTC_CONNECTION_STATS|MEDIA_ENGINE|TYPING|PRESENCE|VOICE_STATE_UPDATES|MESSAGE|LOAD_MESSAGES|WINDOW_FOCUS|TRACK|RTC_CONNECTION_LOSS|VIDEO_SIZE_UPDATE|IDLE|AFK|WRITE_CACHES|SELF_PRESENCE|CONTENT_INVENTORY|SESSIONS_REPLACE|GPLAY|ACCESSIBILITY|SYSTEM_THEME|APP_STATE|PUSH_NOTIFICATION|QUESTS|UPDATE_CHANNEL_DIMENSIONS)/;

function onAction(args: any[]) {
    const a = args[0];
    const type = a?.type;
    if (typeof type !== "string") return;
    if (/^STREAM_(WATCH|START|CREATE)/.test(type)) watchedAt = Date.now();
    const kept = type === "CHANNEL_RTC_SELECT_PARTICIPANT" && a.id != null && active && !rotated();
    if (!NOISY.test(type)) {
        const extra = ["id", "channelId", "participantId", "streamKey", "userId", "focused", "mode", "layout"].filter(k => a[k] !== undefined).map(k => `${k}=${String(a[k]).slice(0, 40)}`).join(" ");
        actions.push(`${new Date().toISOString().slice(17, 23)} ${type}${extra ? ` ${extra}` : ""}${kept ? " (split)" : ""}`);
        if (actions.length > 25) actions.splice(0, actions.length - 25);
    }
    if (!kept) return;
    maximized(String(a.id));
    return [{ ...a, id: null }, ...args.slice(1)];
}

function maximized(id: string) {
    const watched = Date.now() - watchedAt < 1500;
    if (watched) return;
    fsSel = id;
    const next = !fullscreen;
    setTimeout(() => setFullscreen(next), 0);
}

function moduleExports(path: string): any {
    const mods: any = (window as any).modules ?? {};
    for (const id of Object.keys(mods)) {
        if (mods[id]?.__filePath === path) return mods[id].isInitialized ? mods[id].publicModule?.exports : undefined;
    }
}

function shallow(v: any): string {
    if (!v || typeof v !== "object") return String(v);
    return Object.keys(v).slice(0, 20).map(k => {
        const x = v[k];
        return `${k}=${x === null || typeof x !== "object" ? (typeof x === "function" ? "fn" : String(x).slice(0, 30)) : Array.isArray(x) ? `[${x.length}]` : "{..}"}`;
    }).join(" ");
}

let away = false;
let resumeAfterAway = false;
let awayFocus: string | null = null;
let returnTimer: ReturnType<typeof setTimeout> | null = null;

function onAppState(state: string) {
    if (state === "active") {
        if (!away) return;
        away = false;
        if (!resumeAfterAway) return;
        resumeAfterAway = false;
        if (fullscreen && awayFocus) selectParticipant(awayFocus);
        else unselectParticipant();
        returnTimer = setTimeout(() => {
            returnTimer = null;
            if (!active && !away) setSplitActive(true, true);
        }, 350);
        return;
    }
    if (away) return;
    away = true;
    if (returnTimer) {
        clearTimeout(returnTimer);
        returnTimer = null;
    } else {
        if (!active) return;
        awayFocus = selectedParticipant();
        setSplitActive(false, true);
    }
    resumeAfterAway = true;
    const id = mainParticipantId();
    if (id) selectParticipant(id);
}

let landscapeAuto = false;
let dimsTimer: ReturnType<typeof setTimeout> | null = null;

const isLandscape = () => {
    const w = Dimensions.get("window");
    return w.width > w.height;
};

function onDims() {
    if (dimsTimer) clearTimeout(dimsTimer);
    dimsTimer = setTimeout(() => {
        dimsTimer = null;
        if (AppState.currentState !== "active") return;
        if (isLandscape()) {
            if (active || resumeAfterFocus || lastSel) return;
            landscapeAuto = true;
            setSplitActive(true, true);
        } else if (landscapeAuto) {
            landscapeAuto = false;
            if (active) setSplitActive(false, true);
        }
    }, 300);
}

export function setSplitActive(v: boolean, fromFocus = false) {
    if (!fromFocus) landscapeAuto = false;
    if (!fromFocus && resumeAfterFocus) {
        resumeAfterFocus = false;
        if (active === v) {
            listeners.forEach(l => l());
            return;
        }
    }
    if (active === v) return;
    active = v;
    let back: string | null = null;
    if (v && !fromFocus) {
        fsSel = isLandscape() ? null : selectedParticipant() ?? lastSel;
        fullscreen = !!fsSel;
        unselectParticipant();
    }
    if (!v && !fromFocus) {
        if (fullscreen && fsSel && isParticipant(fsSel)) back = fsSel;
        fullscreen = false;
        fsSel = null;
    }
    setTilesFullscreen(fullscreen);
    setTilesActive(v);
    refresh();
    if (back) selectParticipant(back);
}

function isParticipant(id: string) {
    const channelId = SelectedChannelStore?.getVoiceChannelId?.();
    if (!channelId) return false;
    try {
        return (rtcStore()?.getParticipants?.(channelId) ?? []).some((p: any) => String(p?.id) === id);
    } catch {
        return false;
    }
}

function setFullscreen(v: boolean) {
    if (!active || fullscreen === v) return;
    fullscreen = v;
    setTilesFullscreen(v);
    listeners.forEach(l => l());
}

export function toggleSplit() {
    if (active) return setSplitActive(false);
    if (resumeAfterFocus && (selectedParticipant() ?? lastSel)) {
        resumeAfterFocus = false;
        return setSplitActive(true);
    }
    setSplitActive(!isSplitActive());
}

export const isFullscreenSplit = () => active && fullscreen;

export const isLandscapeAuto = () => landscapeAuto;

export function resumeSplit(fs: boolean, auto = false) {
    fullscreen = fs;
    setSplitActive(true, true);
    landscapeAuto = auto && isLandscape();
}

function onRtcState(e: any) {
    if (/DISCONNECTED/.test(String(e?.state))) {
        resumeAfterFocus = false;
        resumeAfterAway = false;
        if (active) setSplitActive(false);
        fullscreen = false;
        fsSel = lastSel = null;
    }
}

let focusWatch: ReturnType<typeof setInterval> | null = null;
let resumeAfterFocus = false;

function selectedParticipant(): string | null {
    const channelId = SelectedChannelStore?.getVoiceChannelId?.();
    if (!channelId) return null;
    try { return rtcStore()?.getSelectedParticipantId?.(channelId) ?? null; } catch { return null; }
}

const rotated = () => isLandscapeLocked() || isLandscape();

function onSelect(e: any) {
    const id = e?.id != null ? String(e.id) : null;
    lastSel = id;
    if (id == null && !active && !resumeAfterFocus && isLandscapeLocked()) onDims();
    if (!active || id == null) return;
    if (rotated()) {
        resumeAfterFocus = true;
        setTilesActive(false);
        setTimeout(() => {
            if (active) setSplitActive(false, true);
        }, 0);
        return;
    }
    maximized(id);
    setTimeout(() => {
        if (active) unselectParticipant();
    }, 0);
}

function watchFocus() {
    const selected = selectedParticipant();
    if (active && selected && !rotated()) {
        unselectParticipant();
    } else if (active && selected) {
        resumeAfterFocus = true;
        setSplitActive(false, true);
    } else if (!active && resumeAfterFocus && !selected) {
        resumeAfterFocus = false;
        setSplitActive(true, true);
    }
}

export function startLayoutPatches() {
    const store = rtcStore();
    if (!store) {
        logger.error("[SplitView] ChannelRTCStore not found");
        return false;
    }

    for (const fn of ["getParticipants", "getFilteredParticipants"]) {
        if (typeof store[fn] === "function") unpatches.push(after(fn, store, (_: any, ret: any) => arrange(ret)));
    }
    focusWatch = setInterval(watchFocus, 400);
    unpatches.push(() => {
        if (focusWatch) clearInterval(focusWatch);
        focusWatch = null;
    });
    if (typeof store.getVoiceParticipantsHidden === "function") {
        unpatches.push(after("getVoiceParticipantsHidden", store, (_: any, ret: any) => active ? true : ret));
    }
    if (typeof store.getParticipantsVersion === "function") {
        unpatches.push(after("getParticipantsVersion", store, (_: any, ret: any) => typeof ret === "number" ? ret + salt * 1000 : ret));
    }

    const appSub = AppState.addEventListener("change", onAppState);
    const dimsSub = Dimensions.addEventListener("change", onDims);
    unpatches.push(() => {
        dimsSub.remove();
        if (dimsTimer) clearTimeout(dimsTimer);
        dimsTimer = null;
        landscapeAuto = false;
    });
    unpatches.push(() => {
        appSub.remove();
        if (returnTimer) clearTimeout(returnTimer);
        returnTimer = null;
        away = resumeAfterAway = false;
    });
    unpatches.push(before("dispatch", FluxDispatcher, onAction));
    FluxDispatcher.subscribe("CHANNEL_RTC_SELECT_PARTICIPANT", onSelect);
    unpatches.push(() => FluxDispatcher.unsubscribe("CHANNEL_RTC_SELECT_PARTICIPANT", onSelect));
    FluxDispatcher.subscribe("RTC_CONNECTION_STATE", onRtcState);
    unpatches.push(() => FluxDispatcher.unsubscribe("RTC_CONNECTION_STATE", onRtcState));
    onDims();
    return true;
}

export function stopLayoutPatches(handoff = false) {
    const wasActive = active;
    active = false;
    setTilesActive(false, handoff);
    for (const u of unpatches.splice(0)) u();
    if (wasActive && !handoff) refresh();
}

export function layoutDebug(): string[] {
    const store = rtcStore();
    const channelId = SelectedChannelStore?.getVoiceChannelId?.();
    const safe = (f: () => any) => { try { return f(); } catch (e) { return `err ${e}`; } };
    const parts = channelId ? safe(() => store?.getParticipants?.(channelId)) : [];
    return [
        `split active: ${active}${fullscreen ? ` (full screen${fsSel ? ` from ${fsSel.slice(0, 24)}` : ""})` : ""}${resumeAfterFocus ? ", waiting for focus" : ""}${landscapeAuto ? ", auto for landscape" : ""}`,
        `store fns: ${["getParticipants", "getFilteredParticipants", "getSelectedParticipantId", "getVoiceParticipantsHidden", "getParticipantsVersion", "emitChange"].filter(f => typeof store?.[f] === "function").join(",")}`,
        `selected: ${channelId ? safe(() => store?.getSelectedParticipantId?.(channelId)) : "-"}`,
        `grid order: ${Array.isArray(parts) ? parts.map((p: any) => (p.stream ? "stream" : hasVideo(p) ? "cam" : "novideo")).join(", ") : String(parts)}`,
        ...tilesDebug(),
        `call store: ${shallow(moduleExports("modules/video_calls/native/ChannelCallStore.tsx")?.useChannelCallStore?.getState?.())}`,
        "recent actions:",
        ...(actions.length ? actions.map(a => `  ${a}`) : ["  none"]),
    ];
}
