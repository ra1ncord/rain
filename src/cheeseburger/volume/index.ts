import { registerCommand } from "@api/commands";
import { ApplicationCommandOptionType, RainApplicationCommand } from "@api/commands/types";
import { after, before } from "@api/patcher";
import { jsxRuntime } from "@api/react/jsx";
import { waitForHydration } from "@api/storage";
import { showToast } from "@api/ui/toasts";
import { logger } from "@lib/utils/logger";
import { findByName, findByProps, findByStoreName } from "@metro";
import { FluxDispatcher, messageUtil, React } from "@metro/common";
import { View } from "react-native";

import { caught, safe } from "../crash";
import { engineDebug, expect, hookEngine, teach, unhookEngine } from "./engine";
import { useVolumeBoostSettings, volumeBoostSettings } from "./storage";
import { note, short, trail } from "./trail";
import VolumeLabel, { emitSliderValue } from "./VolumeLabel";

const DISCORD_MAX = 200;
const unpatches: (() => unknown)[] = [];
let patchedProtos = new WeakSet<object>();

let lastSlider: { value: number; at: number; } | null = null;
let thumb: { value: number; at: number; } | null = null;
const SLIDER_WINDOW_MS = 2500;
const SLIDER_COMMIT_MS = 60_000;

const getAudioActions = () => findByProps("setLocalVolume", "toggleSelfDeaf") ?? findByProps("setLocalVolume");
const getMediaEngineStore = () => findByStoreName("MediaEngineStore");

const keyOf = (userId: string, context = "default") => `${context}:${userId}`;
const maxPercent = () => Math.max(DISCORD_MAX, Number(volumeBoostSettings.maxPercent) || 1000);

function debug(msg: string) {
    if (!volumeBoostSettings.debugSliders) return;
    logger.log(`[VolumeBoost] ${msg}`);
    showToast(msg);
}

function getBoost(userId: string, context = "default"): number | undefined {
    return volumeBoostSettings.boosted?.[keyOf(userId, context)];
}

function setBoost(userId: string, volume: number | null, context = "default") {
    const boosted = { ...volumeBoostSettings.boosted };
    const key = keyOf(userId, context);
    if (volume && volume > DISCORD_MAX) boosted[key] = Math.min(volume, maxPercent());
    else delete boosted[key];
    useVolumeBoostSettings.getState().updateSettings({ boosted });
}

function forEachConnection(cb: (conn: any) => void): boolean {
    const engine = getMediaEngineStore()?.getMediaEngine?.();
    if (typeof engine?.eachConnection !== "function") return false;
    engine.eachConnection(cb);
    return true;
}

let observed = new WeakSet<object>();

function connContext(conn: any): string {
    const c = conn?.context ?? conn?.mediaContext ?? conn?._context;
    if (typeof c === "string") return c;
    if (conn?.streamUserId != null || conn?.isStream || conn?.streamKey != null) return "stream";
    return "default";
}

function observe(obj: any, label: string) {
    if (!obj || typeof obj !== "object" || observed.has(obj)) return;
    observed.add(obj);
    let names: string[] = [];
    try {
        names = [...new Set([...Object.keys(obj), ...Object.getOwnPropertyNames(Object.getPrototypeOf(obj) ?? {})])];
    } catch { }
    for (const name of names) {
        if (!/^(set|update|apply)/.test(name) || !/volume|gain/i.test(name) || name === "setLocalVolume" && label === "conn") continue;
        try {
            if (typeof obj[name] !== "function") continue;
            const orig = obj[name];
            obj[name] = function (this: any, ...a: any[]) {
                try {
                    note(`${label}.${name}(${a.map(short).join(",")})`);
                } catch { }
                return orig.apply(this, a);
            };
            unpatches.push(() => {
                try {
                    obj[name] = orig;
                } catch { }
            });
        } catch { }
    }
}

function observeConnection(conn: any) {
    observe(conn, "conn");
    for (const key of Object.keys(conn ?? {})) {
        const v = conn[key];
        if (v && typeof v === "object" && !Array.isArray(v)) {
            try {
                const proto = Object.getPrototypeOf(v);
                const fns = [...Object.keys(v), ...Object.getOwnPropertyNames(proto ?? {})];
                if (fns.some(n => /volume/i.test(n))) observe(v, key);
            } catch { }
        }
    }
}

function patchConnection(conn: any) {
    observeConnection(conn);
    const proto = Object.getPrototypeOf(conn);
    const target = proto && typeof proto.setLocalVolume === "function" ? proto : conn;
    if (typeof target?.setLocalVolume !== "function" || patchedProtos.has(target)) return;
    patchedProtos.add(target);

    unpatches.push(before("setLocalVolume", target, safe("volume engine", function (this: any, args: any[]) {
        const [userId, volume] = args;
        const ctx = connContext(this);
        const boost = typeof userId === "string" ? getBoost(userId, ctx) : undefined;
        const out = boost && boost > DISCORD_MAX ? boost : volume;
        note(`${ctx} ${short(userId)} ${short(volume)}${out !== volume ? ` -> ${out}` : ""}`);
        if (typeof userId === "string" && typeof out === "number") expect(userId, out);
        if (out !== volume) {
            debug(`engine ${userId}: ${volume} -> ${boost}`);
            args[1] = out;
            return args;
        }
    })));
}

function localVolumesOf(conn: any, userId: string): string {
    const hits: string[] = [];
    for (const key of Object.keys(conn ?? {})) {
        const v = conn[key];
        try {
            if (v instanceof Map && v.has(userId)) hits.push(`${key}=${short(v.get(userId))}`);
            else if (v && typeof v === "object" && !Array.isArray(v) && userId in v) hits.push(`${key}=${short(v[userId])}`);
        } catch { }
    }
    return hits.join(" ") || "-";
}

function modulePaths(): string[] {
    const mods: any = (window as any).modules ?? {};
    const out: string[] = [];
    for (const id of Object.keys(mods)) {
        const p = mods[id]?.__filePath;
        if (typeof p !== "string" || !/media_?engine|voice_?engine|MediaEngine|audio_?output|NativeVoice/i.test(p)) continue;
        const exp = mods[id].isInitialized ? mods[id].publicModule?.exports : undefined;
        let keys = "";
        try {
            keys = exp ? Object.keys(exp).slice(0, 8).join(",") : "not loaded";
        } catch { }
        out.push(`  ${p} [${keys}]`);
        if (out.length >= 14) break;
    }
    return out;
}

export function volumeDebug(): string[] {
    const store = getMediaEngineStore();
    const lines: string[] = [`max ${maxPercent()}%, boosted: ${Object.entries(volumeBoostSettings.boosted ?? {}).map(([k, v]) => `${k.split(":")[0]} ${short(k.split(":")[1])}=${v}`).join(", ") || "none"}`];
    const users = [...new Set(Object.keys(volumeBoostSettings.boosted ?? {}).map(k => k.split(":")[1]))];
    for (const u of users) {
        const safe = (ctx: string) => {
            try {
                return short(store?.getLocalVolume?.(u, ctx));
            } catch {
                return "err";
            }
        };
        lines.push(`store ${short(u)}: default=${safe("default")} stream=${safe("stream")}`);
    }
    const found = forEachConnection(conn => {
        let methods = "";
        try {
            methods = Object.getOwnPropertyNames(Object.getPrototypeOf(conn) ?? {}).filter(n => /volume|gain|context|stream|mute/i.test(n)).join(",");
        } catch { }
        lines.push(`conn ${conn?.constructor?.name ?? "?"} context=${String(conn?.context)} -> ${connContext(conn)} keys=${Object.keys(conn ?? {}).slice(0, 14).join(",")}`);
        lines.push(`  methods: ${methods || "-"}`);
        for (const u of users) lines.push(`  ${short(u)}: ${localVolumesOf(conn, u)}`);
    });
    if (!found) lines.push("no media engine");
    lines.push(...engineDebug());
    lines.push("files:", ...modulePaths());
    lines.push("calls:", ...(trail.length ? trail.map(t => `  ${t}`) : ["  none yet"]));
    return lines;
}

function applyToConnections(userId?: string) {
    try {
        return applyNow(userId);
    } catch (e) {
        caught("volume apply", e);
        return false;
    }
}

function applyNow(userId?: string) {
    hookEngine();
    const ok = forEachConnection(conn => {
        try {
            patchConnection(conn);
        } catch (e) {
            caught("volume hook", e);
        }
        teach(conn);
        const ctx = connContext(conn);
        for (const [key, volume] of Object.entries(volumeBoostSettings.boosted ?? {})) {
            const [kctx, kuser] = key.split(":");
            if (kctx !== ctx || (userId && kuser !== userId)) continue;
            try { conn.setLocalVolume?.(kuser, volume); } catch (e) { logger.error("[VolumeBoost] apply failed", e); }
        }
    });
    if (!ok) debug("no media engine connections found");
    return ok;
}

const onRtcState = safe("volume rtc", (e: any) => {
    if (e?.state === "RTC_CONNECTED") setTimeout(() => applyToConnections(), 300);
});

let sliderUser: { userId: string; context: string; } | null = null;
const ourSliders = new WeakSet<object>();

const roundTo10 = (v: number) => Math.round(v / 10) * 10;

const wrapped = new WeakMap<Function, Function>();
const wrap = (fn: Function) => {
    let w = wrapped.get(fn);
    if (!w) {
        w = (raw: number, ...rest: any[]) => {
            const v = typeof raw === "number" ? roundTo10(raw) : raw;
            try {
                lastSlider = thumb = { value: v, at: Date.now() };
                emitSliderValue(v);
            } catch (e) {
                caught("volume slider move", e);
            }
            return fn(typeof v === "number" ? Math.min(v, DISCORD_MAX) : raw, ...rest);
        };
        wrapped.set(fn, w);
    }
    return w;
};

function displayValue(discordValue: number): number {
    if (thumb && Date.now() - thumb.at < SLIDER_WINDOW_MS && thumb.value > DISCORD_MAX && discordValue >= DISCORD_MAX - 1) {
        return thumb.value;
    }
    if (sliderUser && discordValue >= DISCORD_MAX - 1) {
        const boost = getBoost(sliderUser.userId, sliderUser.context);
        if (boost && boost > DISCORD_MAX) return boost;
    }
    return discordValue;
}

interface VolumeQuery { context: string; value: number; }
let tickQueries: VolumeQuery[] = [];
let tickFlushScheduled = false;
let lastSliderContext: { context: string; at: number; } | null = null;

function recordVolumeQuery(args: any[], ret: any) {
    if (typeof ret !== "number") return;
    tickQueries.push({ context: args?.[1] ?? "default", value: ret });
    if (tickQueries.length > 50) tickQueries.shift();
    if (!tickFlushScheduled) {
        tickFlushScheduled = true;
        Promise.resolve().then(() => {
            tickQueries = [];
            tickFlushScheduled = false;
        });
    }
}

function toPerceptual(amplitude: number, base = 100) {
    if (amplitude <= 0) return 0;
    const db = 20 * Math.log10(amplitude / base);
    return base * (db > 0 ? db / 6 + 1 : (50 + db) / 50);
}
const near = (a: number, b: number) => Math.abs(a - b) <= 1;

function sliderContext(value: unknown): string {
    if (tickQueries.length) {
        const i = typeof value === "number"
            ? tickQueries.findIndex(q => near(q.value, value) || near(toPerceptual(q.value), value))
            : -1;
        const [q] = tickQueries.splice(i === -1 ? 0 : i, 1);
        lastSliderContext = { context: q.context, at: Date.now() };
        return q.context;
    }
    if (lastSliderContext && Date.now() - lastSliderContext.at < 5000) {
        lastSliderContext.at = Date.now();
        return lastSliderContext.context;
    }
    return "default";
}

function jsxBefore(args: any[]) {
    const props = args[1];
    if (!props || typeof props !== "object") return;
    if (props.maximumValue !== DISCORD_MAX || typeof props.onValueChange !== "function") return;

    const context = sliderContext(props.value);
    if (context !== "default") {
        if (volumeBoostSettings.debugSliders) debug(`left ${context} slider alone`);
        return;
    }

    const next: any = {
        ...props,
        maximumValue: maxPercent(),
        step: 10,
        onValueChange: wrap(props.onValueChange),
        value: typeof props.value === "number" ? displayValue(props.value) : props.value,
    };
    if (typeof props.onSlidingComplete === "function") next.onSlidingComplete = wrap(props.onSlidingComplete);

    ourSliders.add(next);
    args[1] = next;
    return args;
}

function jsxAfter(args: any[], ret: any) {
    const props = args[1];
    if (!volumeBoostSettings.showPercent || !props || !ourSliders.has(props)) return;
    return React.createElement(
        View,
        { key: ret?.key ?? undefined, style: { flex: 1, flexDirection: "row", alignItems: "center" } },
        React.createElement(View, { style: { flex: 1 } }, ret),
        React.createElement(VolumeLabel, { value: typeof props.value === "number" ? props.value : 0 }),
    );
}

function boostUser(userId: string, percent: number) {
    const volume = Math.min(Math.max(percent, 0), maxPercent());
    const actions = getAudioActions();

    setBoost(userId, volume > DISCORD_MAX ? volume : null);
    actions?.setLocalVolume?.(userId, Math.min(volume, DISCORD_MAX), "default");
    const ok = applyToConnections(userId);
    return { volume, ok };
}

const boostCommand = (): RainApplicationCommand => ({
    name: "boost",
    displayName: "boost",
    description: "Set a user's volume.",
    displayDescription: "Set a user's volume.",
    applicationId: "-1",
    inputType: 1,
    type: 1,
    shouldHide: () => false,
    options: [
        {
            name: "user",
            description: "User",
            type: ApplicationCommandOptionType.USER,
            required: true,
            displayName: "user",
            displayDescription: "User",
        },
        {
            name: "percent",
            description: "Volume (%)",
            type: ApplicationCommandOptionType.INTEGER,
            required: true,
            displayName: "percent",
            displayDescription: "Volume (%)",
        },
    ],
    execute: (args, ctx) => {
        const userId = args.find(a => a.name === "user")?.value;
        const percent = Number(args.find(a => a.name === "percent")?.value);
        if (!userId || !Number.isFinite(percent)) return;

        const { volume, ok } = boostUser(userId, percent);
        messageUtil.sendBotMessage(
            ctx.channel.id,
            `<@${userId}> ${volume}%` + (volume > DISCORD_MAX && !ok ? " (next call)" : ""),
        );
    },
});

export default {
    async start() {
        await waitForHydration(useVolumeBoostSettings);

        const sliderBefore = safe("volume slider", jsxBefore);
        const sliderAfter = safe("volume label", jsxAfter);
        unpatches.push(before("jsx", jsxRuntime, sliderBefore));
        unpatches.push(before("jsxs", jsxRuntime, sliderBefore));
        unpatches.push(after("jsx", jsxRuntime, sliderAfter));
        unpatches.push(after("jsxs", jsxRuntime, sliderAfter));

        const mediaStore = getMediaEngineStore();
        if (typeof mediaStore?.getLocalVolume === "function") {
            unpatches.push(after("getLocalVolume", mediaStore, safe("volume read", recordVolumeQuery)));
        }

        const profileSheet = findByName("showUserProfileActionSheet", false);
        if (profileSheet?.default) {
            unpatches.push(before("default", profileSheet, safe("volume profile", (args: any[]) => {
                const userId = args?.[0]?.userId;
                if (typeof userId === "string") sliderUser = { userId, context: "default" };
            })));
        }

        const actions = getAudioActions();
        if (actions?.setLocalVolume) {
            unpatches.push(before("setLocalVolume", actions, safe("volume set", (args: any[]) => {
                const [userId, volume, context = "default"] = args;
                if (typeof userId !== "string" || typeof volume !== "number") return;

                if (context !== "default") {
                    if (getBoost(userId, context)) setBoost(userId, null, context);
                    if (volume > DISCORD_MAX) {
                        args[1] = DISCORD_MAX;
                        return args;
                    }
                    return;
                }

                const recent = lastSlider && Date.now() - lastSlider.at < SLIDER_COMMIT_MS ? lastSlider.value : null;
                lastSlider = null;
                if (recent !== null) sliderUser = { userId, context };
                const wanted = recent ?? volume;
                debug(`store ${userId}: discord=${volume} slider=${recent ?? "-"}`);

                if (recent === null && volume < DISCORD_MAX && getBoost(userId, context)) {
                    debug(`blocked reset of ${userId} to ${volume}`);
                    args[1] = DISCORD_MAX;
                    return args;
                }

                if (recent !== null || volume > DISCORD_MAX) setBoost(userId, wanted > DISCORD_MAX ? wanted : null, context);

                if (volume > DISCORD_MAX) {
                    args[1] = DISCORD_MAX;
                    return args;
                }
            })));
        }

        const onLocalVolume = safe("volume local", (e: any) => {
            if (e?.userId && getBoost(e.userId, e.context ?? "default")) setTimeout(() => applyToConnections(e.userId), 50);
        });
        const restores = new Map<string, number[]>();
        const onSync = () => setTimeout(safe("volume sync", () => {
            const store = getMediaEngineStore();
            for (const key of Object.keys(volumeBoostSettings.boosted ?? {})) {
                const [context, userId] = key.split(":");
                try {
                    const current = store?.getLocalVolume?.(userId, context);
                    const recent = restores.get(key) ?? [];
                    const now = Date.now();
                    const window = recent.filter(t => now - t < 10_000);
                    if (typeof current === "number" && Math.abs(current - DISCORD_MAX) > 2 && window.length < 3) {
                        restores.set(key, [...window, now]);
                        debug(`sync changed ${userId} to ${current}, restoring`);
                        getAudioActions()?.setLocalVolume?.(userId, DISCORD_MAX, context);
                    }
                } catch { }
            }
            applyToConnections();
        }), 300);
        for (const ev of ["USER_SETTINGS_PROTO_UPDATE", "AUDIO_SET_LOCAL_VOLUME"]) {
            FluxDispatcher.subscribe(ev, onSync);
            unpatches.push(() => FluxDispatcher.unsubscribe(ev, onSync));
        }
        FluxDispatcher.subscribe("AUDIO_SET_LOCAL_VOLUME", onLocalVolume);
        FluxDispatcher.subscribe("RTC_CONNECTION_STATE", onRtcState);
        unpatches.push(() => FluxDispatcher.unsubscribe("AUDIO_SET_LOCAL_VOLUME", onLocalVolume));
        unpatches.push(() => FluxDispatcher.unsubscribe("RTC_CONNECTION_STATE", onRtcState));

        unpatches.push(registerCommand(boostCommand()));

        setTimeout(safe("volume first apply", () => {
            const store = getMediaEngineStore();
            for (const key of Object.keys(volumeBoostSettings.boosted ?? {})) {
                const [context, userId] = key.split(":");
                try {
                    const current = store?.getLocalVolume?.(userId, context);
                    if (typeof current === "number" && (current > DISCORD_MAX || current === 0)) {
                        actions?.setLocalVolume?.(userId, DISCORD_MAX, context);
                    }
                } catch { }
            }
            applyToConnections();
        }), 2000);
    },
    stop() {
        for (const u of unpatches.splice(0)) u();
        lastSlider = thumb = null;
        sliderUser = null;
        tickQueries = [];
        lastSliderContext = null;
        patchedProtos = new WeakSet<object>();
        observed = new WeakSet<object>();
        trail.length = 0;
        unhookEngine();
    },
};
