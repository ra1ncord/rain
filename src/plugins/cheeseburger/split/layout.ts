import { after } from "@api/patcher";
import { logger } from "@lib/utils/logger";
import { findByStoreName } from "@metro";
import { FluxDispatcher } from "@metro/common";
import { SelectedChannelStore, UserStore } from "@metro/common/stores";
import { AppState, Dimensions } from "react-native";

import { discordFullscreen, setTilesActive, setTilesFullscreen, tilesDebug } from "./tiles";

let active = false;
let fullscreen = false;
let fullscreenSel: string | null = null;
const listeners = new Set<() => void>();
const unpatches: (() => unknown)[] = [];
let salt = 0;

export const isSplitActive = () => active || resumeAfterFocus || resumeAfterRotate;
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

let resumeAfterRotate = false;
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
            if (!active) return;
            resumeAfterRotate = true;
            setSplitActive(false, true);
        } else if (resumeAfterRotate) {
            resumeAfterRotate = false;
            setSplitActive(true, true);
        }
    }, 300);
}

export function setSplitActive(v: boolean, fromFocus = false) {
    if (!fromFocus && resumeAfterRotate) {
        resumeAfterRotate = false;
        if (!v) {
            listeners.forEach(l => l());
            return;
        }
    }
    if (v && !fromFocus && isLandscape()) {
        resumeAfterRotate = true;
        listeners.forEach(l => l());
        return;
    }
    if (!fromFocus && resumeAfterFocus) {
        resumeAfterFocus = false;
        if (active === v) {
            listeners.forEach(l => l());
            return;
        }
    }
    if (active === v) return;
    active = v;
    if (v && !fromFocus) {
        fullscreenSel = selectedParticipant();
        fullscreen = !!fullscreenSel || discordFullscreen();
        if (!fullscreen) unselectParticipant();
    }
    if (!v && !fromFocus) fullscreen = false;
    setTilesFullscreen(fullscreen);
    setTilesActive(v);
    refresh();
}

export function toggleSplit() {
    if (active) return setSplitActive(false);
    if (resumeAfterFocus && (selectedParticipant() || discordFullscreen())) {
        resumeAfterFocus = false;
        return setSplitActive(true);
    }
    setSplitActive(!isSplitActive());
}

export const isFullscreenSplit = () => active && fullscreen;

function onRtcState(e: any) {
    if (/DISCONNECTED/.test(String(e?.state))) {
        resumeAfterFocus = false;
        resumeAfterAway = false;
        if (active) setSplitActive(false);
        fullscreen = false;
    }
}

let focusWatch: ReturnType<typeof setInterval> | null = null;
let resumeAfterFocus = false;

function selectedParticipant(): string | null {
    const channelId = SelectedChannelStore?.getVoiceChannelId?.();
    if (!channelId) return null;
    try { return rtcStore()?.getSelectedParticipantId?.(channelId) ?? null; } catch { return null; }
}

function onSelect(e: any) {
    if (!active || fullscreen || e?.id == null) return;
    resumeAfterFocus = true;
    setTilesActive(false);
    setTimeout(() => {
        if (active) setSplitActive(false, true);
    }, 0);
}

function watchFocus() {
    const selected = selectedParticipant();
    if (active && fullscreen) {
        if (fullscreenSel && !selected) {
            fullscreen = false;
            setTilesFullscreen(false);
            refresh();
        }
        return;
    }
    if (active && selected) {
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
        resumeAfterRotate = false;
    });
    unpatches.push(() => {
        appSub.remove();
        if (returnTimer) clearTimeout(returnTimer);
        returnTimer = null;
        away = resumeAfterAway = false;
    });
    FluxDispatcher.subscribe("CHANNEL_RTC_SELECT_PARTICIPANT", onSelect);
    unpatches.push(() => FluxDispatcher.unsubscribe("CHANNEL_RTC_SELECT_PARTICIPANT", onSelect));
    FluxDispatcher.subscribe("RTC_CONNECTION_STATE", onRtcState);
    unpatches.push(() => FluxDispatcher.unsubscribe("RTC_CONNECTION_STATE", onRtcState));
    return true;
}

export function stopLayoutPatches() {
    const wasActive = active;
    active = false;
    setTilesActive(false);
    for (const u of unpatches.splice(0)) u();
    if (wasActive) refresh();
}

export function layoutDebug(): string[] {
    const store = rtcStore();
    const channelId = SelectedChannelStore?.getVoiceChannelId?.();
    const safe = (f: () => any) => { try { return f(); } catch (e) { return `err ${e}`; } };
    const parts = channelId ? safe(() => store?.getParticipants?.(channelId)) : [];
    return [
        `split active: ${active}${fullscreen ? " (full screen)" : ""}`,
        `store fns: ${["getParticipants", "getFilteredParticipants", "getSelectedParticipantId", "getVoiceParticipantsHidden", "getParticipantsVersion", "emitChange"].filter(f => typeof store?.[f] === "function").join(",")}`,
        `selected: ${channelId ? safe(() => store?.getSelectedParticipantId?.(channelId)) : "-"}`,
        `grid order: ${Array.isArray(parts) ? parts.map((p: any) => (p.stream ? "stream" : hasVideo(p) ? "cam" : "novideo")).join(", ") : String(parts)}`,
        ...tilesDebug(),
    ];
}
