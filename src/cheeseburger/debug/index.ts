import { hotStatus } from "@api/hot/status";
import { NativeClientInfoModule } from "@api/native/modules";
import { findByStoreName } from "@metro";
import { SelectedChannelStore, UserStore } from "@metro/common/stores";
import { pluginInstances } from "@plugins";
import { getCurrentTheme } from "@plugins/_core/painter/themes";
import { AppState, Dimensions, PixelRatio, Platform, StatusBar } from "react-native";

import { caught, crashDebug, lastCrashAt } from "../crash";
import { useDeafenButtonSettings } from "../deafen/storage";
import { lookDebug } from "../look";
import { rotateDebug } from "../rotate";
import { shareDebug } from "../share";
import { useShareSettings } from "../share/storage";
import { factoryDebug } from "../split";
import { isFullscreenSplit, isSplitActive, layoutDebug } from "../split/layout";
import { pipDebug } from "../split/pip";
import { pinControlsDebug, pinIconName } from "../split/PipPin";
import { useSplitViewSettings } from "../split/storage";
import { hasVideo } from "../split/tiles";
import { useCheeseburger } from "../storage";
import { styleDebug } from "../style";
import { accentColor, baseColor } from "../style/colors";
import { useStyleSettings } from "../style/storage";
import { toolbarDebug } from "../toolbar";
import { buildRevision } from "../updates";
import { volumeDebug } from "../volume";
import { useVolumeBoostSettings } from "../volume/storage";
import { debugSettings } from "./storage";

const started = Date.now();
const API = "https://api.github.com";
const REPO = /^[\w.-]+\/[\w.-]+$/;

function attempt(name: string, fn: () => string[] | string): string[] {
    try {
        const out = fn();
        return Array.isArray(out) ? out : [out];
    } catch (e) {
        return [`${name}: failed (${String((e as any)?.message ?? e).slice(0, 100)})`];
    }
}

const plain = (o: any, skip: string[] = []) => {
    try {
        const out: any = {};
        for (const k of Object.keys(o ?? {})) {
            if (skip.includes(k) || typeof o[k] === "function" || k.startsWith("_")) continue;
            out[k] = o[k];
        }
        return JSON.stringify(out).slice(0, 600);
    } catch {
        return "?";
    }
};

const stamp = (t: number) => {
    const d = new Date(t);
    const off = -d.getTimezoneOffset() / 60;
    return `${d.toISOString()} (utc${off >= 0 ? "+" : ""}${off})`;
};

interface Names { people: Map<string, string>; words: Map<string, string>; }

function store(name: string): any {
    try {
        return findByStoreName(name);
    } catch {
        return null;
    }
}

function names(): Names {
    const people = new Map<string, string>();
    const words = new Map<string, string>();
    const me = UserStore?.getCurrentUser?.();
    const tag = (id: any, label: string) => {
        if (id != null && !people.has(String(id))) people.set(String(id), label);
        return people.get(String(id)) ?? label;
    };
    const word = (w: any, label: string) => {
        if (typeof w !== "string") return;
        const t = w.trim();
        if (t.length >= 3 && !words.has(t)) words.set(t, label);
    };
    const rel = store("RelationshipStore");
    const addUser = (u: any, label: string) => {
        if (!u) return;
        const l = tag(u.id, label);
        word(u.username, l);
        word(u.globalName ?? u.global_name, l);
        try {
            word(rel?.getNickname?.(u.id), l);
        } catch { }
    };
    addUser(me, "me");
    try {
        for (const a of store("ConnectedAccountsStore")?.getAccounts?.() ?? []) word(a?.name, "me");
    } catch { }
    const channelId = SelectedChannelStore?.getVoiceChannelId?.();
    if (channelId) {
        const channel = store("ChannelStore")?.getChannel?.(channelId);
        word(channel?.name, "channel");
        if (channel?.guild_id) word(store("GuildStore")?.getGuild?.(channel.guild_id)?.name, "server");
        const members = store("GuildMemberStore");
        let n = 0;
        for (const p of store("ChannelRTCStore")?.getParticipants?.(channelId) ?? []) {
            const u = p?.user;
            if (!u || people.has(String(u.id))) continue;
            addUser(u, `person ${++n}`);
            if (channel?.guild_id) {
                try {
                    word(members?.getMember?.(channel.guild_id, u.id)?.nick, people.get(String(u.id)) ?? "someone");
                } catch { }
            }
        }
    }
    return { people, words };
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function scrub(text: string, n: Names): string {
    let out = text;
    const list = [...n.words.entries()].sort((a, b) => b[0].length - a[0].length);
    for (const [w, label] of list) out = out.replace(new RegExp(escape(w), "gi"), `‹${label}›`);
    const ids = new Map<string, string>();
    out = out.replace(/\b\d{16,21}\b/g, id => {
        const who = n.people.get(id);
        if (who) return `‹${who}›`;
        if (!ids.has(id)) ids.set(id, `#${ids.size + 1}`);
        return `‹id${ids.get(id)}›`;
    });
    out = out.replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[a-z]{2,}\b(?![:\w.])/gi, m => (/\.(?:bundle|js|jsx|tsx?|hbc)$/i.test(m) ? m : "‹email›"));
    out = out.replace(/\b(?:github_pat|ghp|gho|ghu|ghs)_\w+/g, "‹token›");
    return out;
}

function device(): string[] {
    const c: any = (Platform as any).constants ?? {};
    let info: any = {};
    try {
        info = NativeClientInfoModule?.getConstants?.() ?? {};
    } catch { }
    const win = Dimensions.get("window");
    const scr = Dimensions.get("screen");
    return [
        `discord ${info.Version ?? "?"} (${info.Build ?? "?"}) ${info.ReleaseChannel ?? ""}`.trim(),
        `rain ${buildRevision}, cheeseburger ${hotStatus.source} ${hotStatus.revision}${hotStatus.error ? `, hot error: ${hotStatus.error}` : ""}`,
        `phone ${c.Brand ?? ""} ${c.Model ?? ""}, android ${c.Release ?? "?"} (sdk ${c.Version ?? Platform.Version}), hermes ${!!(globalThis as any).HermesInternal}`,
        `window ${Math.round(win.width)}x${Math.round(win.height)}, screen ${Math.round(scr.width)}x${Math.round(scr.height)}, density ${PixelRatio.get()}, font ${PixelRatio.getFontScale()}, status bar ${StatusBar?.currentHeight ?? "?"}`,
        `app ${AppState.currentState}, this copy loaded ${Math.round((Date.now() - started) / 60000)}m ago`,
    ];
}

function call(n: Names): string[] {
    const channelId = SelectedChannelStore?.getVoiceChannelId?.();
    if (!channelId) return ["not in a call"];
    const channel = store("ChannelStore")?.getChannel?.(channelId);
    const parts: any[] = store("ChannelRTCStore")?.getParticipants?.(channelId) ?? [];
    const lines = parts.slice(0, 16).map(p => {
        const who = n.people.get(String(p?.user?.id)) ?? "someone";
        const screen = p?.type === 0 || String(p?.id ?? "").startsWith("call:");
        const flags = [!screen && hasVideo(p) ? "camera" : "", p?.speaking ? "talking" : "", p?.streamId != null ? `stream ${p.streamId}` : ""].filter(Boolean).join(", ");
        const kind = screen ? "screen" : "user";
        return `  ${kind} ${who}${flags ? ` (${flags})` : ""}`;
    });
    return [
        `${channel?.guild_id ? "server" : "dm/group"} call, ${parts.length} tiles, split ${isSplitActive() ? "on" : "off"}${isFullscreenSplit() ? ", full screen" : ""}`,
        ...lines,
    ];
}

function setup(): string[] {
    const theme: any = getCurrentTheme?.();
    const state = (h: any) => {
        try {
            return h.getState();
        } catch {
            return {};
        }
    };
    const volume = state(useVolumeBoostSettings);
    return [
        `features ${plain(state(useCheeseburger))}`,
        `split ${plain(state(useSplitViewSettings))}`,
        `deafen ${plain(state(useDeafenButtonSettings))}`,
        `volume ${plain(volume, ["boosted"])}, boosted ${Object.keys(volume.boosted ?? {}).length}`,
        `style ${plain(state(useStyleSettings))}`,
        `share ${plain(state(useShareSettings))}`,
        `theme ${theme?.id ?? "none"} ${theme?.data?.name ?? ""}, base ${baseColor() ?? "?"}, accent ${accentColor("?")}`,
        `plugins ${[...pluginInstances.keys()].join(", ").slice(0, 500)}`,
    ];
}

export function debugReport(): string {
    const n = names();
    const sections: [string, () => string[] | string][] = [
        ["device", device],
        ["setup", setup],
        ["call", () => call(n)],
        ["crashes", crashDebug],
        ["split", () => [...layoutDebug(), ...factoryDebug(), ...pipDebug(), pinControlsDebug(), `pin icon: ${pinIconName || "none found"}`]],
        ["style", () => [...styleDebug(), lookDebug(), toolbarDebug()]],
        ["share", shareDebug],
        ["volume", volumeDebug],
        ["rotate", rotateDebug],
    ];
    const out = [`cheeseburger debug ${stamp(Date.now())}`];
    for (const [name, fn] of sections) out.push("", `== ${name}`, ...attempt(name, fn));
    return scrub(out.join("\n"), n);
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function base64(text: string): string {
    const bytes: number[] = [];
    for (const ch of text) {
        let c = ch.codePointAt(0)!;
        if (c < 0x80) bytes.push(c);
        else if (c < 0x800) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 63));
        else if (c < 0x10000) bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
        else {
            c = Math.min(c, 0x10ffff);
            bytes.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
        }
    }
    let out = "";
    for (let i = 0; i < bytes.length; i += 3) {
        const a = bytes[i];
        const b = bytes[i + 1];
        const c = bytes[i + 2];
        const v = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);
        out += B64[(v >> 18) & 63] + B64[(v >> 12) & 63] + (b === undefined ? "=" : B64[(v >> 6) & 63]) + (c === undefined ? "=" : B64[v & 63]);
    }
    return out;
}

const headers = (token: string) => ({
    "Authorization": `Bearer ${token}`,
    "Accept": "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
});

const why = (status: number) => (status === 401 ? "token not accepted" : status === 403 ? "token can't write there" : status === 404 ? "repo not found for this token" : `github said ${status}`);

async function put(repo: string, token: string, path: string, text: string, message: string) {
    const url = `${API}/repos/${repo}/contents/${path}`;
    let sha: string | undefined;
    const head = await fetch(url, { headers: headers(token) });
    if (head.ok) sha = (await head.json())?.sha;
    else if (head.status !== 404) throw new Error(why(head.status));
    const res = await fetch(url, { method: "PUT", headers: headers(token), body: JSON.stringify({ message, content: base64(text), ...(sha ? { sha } : {}) }) });
    if (!res.ok) throw new Error(why(res.status));
}

export async function connectDebug(repo: string, token: string): Promise<string> {
    let r = repo.trim().replace(/^https?:\/\/github\.com\//i, "").replace(/\.git$/, "").replace(/\/+$/, "");
    const t = token.trim();
    if (!t) return "paste the token";
    if (!r) return "type the repo name";
    try {
        if (!r.includes("/")) {
            const me = await fetch(`${API}/user`, { headers: headers(t) });
            if (!me.ok) return why(me.status);
            const login = (await me.json())?.login;
            if (typeof login !== "string" || !login) return "couldn't tell whose token this is";
            r = `${login}/${r}`;
        }
        if (!REPO.test(r)) return "that repo name looks off";
        const res = await fetch(`${API}/repos/${r}`, { headers: headers(t) });
        if (!res.ok) return why(res.status);
        const info = await res.json();
        if (info?.private !== true) return "that repo is public, make it private first";
        if (info?.permissions && info.permissions.push === false) return "token can't write there";
    } catch (e) {
        return `couldn't reach github (${String((e as any)?.message ?? e).slice(0, 40)})`;
    }
    debugSettings.repo = r;
    debugSettings.token = t;
    debugSettings.verified = true;
    debugSettings.status = "";
    return "";
}

export function disconnectDebug() {
    debugSettings.repo = "";
    debugSettings.token = "";
    debugSettings.verified = false;
    debugSettings.status = "";
}

const two = (n: number) => String(n).padStart(2, "0");
let sending: Promise<string> | null = null;

export function sendDebug(reason = "sent"): Promise<string> {
    if (sending) return sending;
    sending = (async () => {
        const repo = debugSettings.repo;
        const token = debugSettings.token;
        if (!token || !REPO.test(repo) || !debugSettings.verified) return "connect it first";
        const d = new Date();
        const name = `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}-${two(d.getHours())}${two(d.getMinutes())}${two(d.getSeconds())}`;
        let status: string;
        try {
            const text = debugReport();
            await put(repo, token, `debug/${name}-${reason}.txt`, text, `${reason} ${name}`);
            await put(repo, token, "latest.txt", text, `latest ${name}`);
            debugSettings.lastSent = Date.now();
            status = `${reason} ${d.getHours() % 12 || 12}:${two(d.getMinutes())} ${d.getHours() < 12 ? "AM" : "PM"}`;
        } catch (e) {
            status = `failed: ${String((e as any)?.message ?? e).slice(0, 60)}`;
        }
        debugSettings.status = status;
        return status;
    })().finally(() => {
        sending = null;
    });
    return sending;
}

let crashTimer: ReturnType<typeof setTimeout> | null = null;

export function startDebug() {
    if (crashTimer) clearTimeout(crashTimer);
    crashTimer = setTimeout(() => {
        crashTimer = null;
        try {
            const t = lastCrashAt();
            if (!t || t <= (debugSettings.lastCrashSent || 0) || !debugSettings.verified) return;
            debugSettings.lastCrashSent = t;
            void sendDebug("crash");
        } catch (e) {
            caught("debug crash send", e);
        }
    }, 20000);
}

export function stopDebug() {
    if (crashTimer) clearTimeout(crashTimer);
    crashTimer = null;
}
