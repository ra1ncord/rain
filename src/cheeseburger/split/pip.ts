import { after, before, instead } from "@api/patcher";
import { jsxRuntime } from "@api/react/jsx";
import { findByStoreName } from "@metro";
import { FluxDispatcher, React } from "@metro/common";
import { SelectedChannelStore, UserStore } from "@metro/common/stores";
import { NativeModules } from "react-native";

import { caught, safe, safeInstead } from "../crash";
import { hasPipStreamId, isParticipant, isStreamParticipant, pipValueLike, replacePipSource, sameId } from "./pipSource";
import { splitViewSettings } from "./storage";
import { hasVideo, knownMainAspect, onAspectChange, streamAspect } from "./tiles";

const PIP_PATH = "modules/external_pip/ExternalPip.android.tsx";
const VIEW_PATHS = [
    "modules/external_pip/useExternalPipParticipant.android.tsx",
    "modules/voice_panel/native/pip/useControllerPIPState.tsx",
];
const CALL_STORE = "modules/video_calls/native/ChannelCallStore.tsx";
const OPEN_CALL_DRAWER_STATE = 3;
const MIN_ASPECT = 0.42;
const MAX_ASPECT = 2.38;
const g = globalThis as any;

interface Cand { sid: any; pid: any; stream: boolean; }
type PipContext = "android" | "floating";

const unpatches: (() => unknown)[] = [];
let pip: any = null;
let lastArgs: any[] | null = null;
let lastSent = "";
let lastPick: string | null = null;
let space: "sid" | "pid" = "sid";
let clamped = 0;
let skipped = 0;
let picks = "";
let selected: string | null = null;
let focused: string | null = null;
let retry: ReturnType<typeof setTimeout> | null = null;
let viewRetry: ReturnType<typeof setTimeout> | null = null;
let pinned: string | null = null;
let viewPick: string | null = null;
let viewSid: string | null = null;
let running = false;
let renderContext: PipContext | null = null;
let candidateContext: PipContext | null = null;
let renderParticipant: any = null;
let sourceSwaps = 0;
let internalRenders = 0;
const viewPatched = new Set<string>();
const viewShapes = new Map<string, string>();
const pinListeners = new Set<() => void>();
let controller: { channelId: any; showSecondaryPIP: boolean | undefined; mode: any; panel: any; id: any; } | null = null;
const controllerShapes: string[] = [];

const idOf = (v: any) => (v == null ? null : String(v));

function moduleExports(path: string): any {
    const mods: any = (window as any).modules ?? {};
    for (const id of Object.keys(mods)) {
        const m = mods[id];
        if (m?.__filePath === path) return m.isInitialized ? m.publicModule?.exports : undefined;
    }
}

let aspectFrom = "";
let discordSid: string | null = null;
const shapeLog: string[] = [];

function pipAspect(): number | null {
    for (const [from, sid] of [["shown", viewSid], ["discord", discordSid], ["focused", focused], ["selected", selected]] as const) {
        const a = sid ? streamAspect(sid) : null;
        if (a) {
            aspectFrom = `${from} ${sid}`;
            return a;
        }
    }
    const main = knownMainAspect();
    aspectFrom = main ? "main tile" : "unknown";
    return main;
}

function logShape(line: string) {
    shapeLog.push(`${new Date().toISOString().slice(17, 23)} ${line}`);
    if (shapeLog.length > 8) shapeLog.shift();
}

function ratioOf(args: any[]): number | null {
    const [x, y] = args;
    let r: number | null = null;
    if (typeof x === "number" && typeof y === "number") r = y ? x / y : null;
    else if (typeof x === "number") r = x;
    else if (x && typeof x === "object") {
        if (typeof x.width === "number" && typeof x.height === "number") r = x.height ? x.width / x.height : null;
        else if (typeof x.numerator === "number" && typeof x.denominator === "number") r = x.denominator ? x.numerator / x.denominator : null;
        else {
            const k = Object.keys(x).find(key => /aspect|ratio/i.test(key) && typeof x[key] === "number");
            if (k) r = x[k];
        }
    }
    return r !== null && Number.isFinite(r) && r > 0 ? r : null;
}

function shape(args: any[], raw: number): any[] | null {
    if (!Number.isFinite(raw) || raw <= 0) return null;
    const a = Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, raw));
    if (a !== raw) clamped++;
    const [x, y] = args;
    if (typeof x === "number" && typeof y === "number") return [Math.round(a * 1000), 1000, ...args.slice(2)];
    if (typeof x === "number") return [a, ...args.slice(1)];
    if (x && typeof x === "object") {
        if (typeof x.width === "number" && typeof x.height === "number") return [{ ...x, width: Math.round(a * 1000), height: 1000 }, ...args.slice(1)];
        if (typeof x.numerator === "number" && typeof x.denominator === "number") return [{ ...x, numerator: Math.round(a * 1000), denominator: 1000 }, ...args.slice(1)];
        const k = Object.keys(x).find(key => /aspect|ratio/i.test(key) && typeof x[key] === "number");
        if (k) return [{ ...x, [k]: a }, ...args.slice(1)];
    }
    return null;
}

function inRange(args: any[]): any[] {
    try {
        const ratio = ratioOf(args);
        return ratio !== null && (ratio < MIN_ASPECT || ratio > MAX_ASPECT) ? shape(args, ratio) ?? args : args;
    } catch {
        return args;
    }
}

function safeArgs(args: any[]): any[] {
    const want = pipAspect();
    const next = want ? shape(args, want) : null;
    return next ?? inRange(args);
}

const resend = safe("pip resend", () => {
    if (pip && lastArgs) {
        try {
            pip.setPipAspectRatio(...lastArgs);
        } catch { }
    }
});

function people(): { others: Cand[]; mine: Cand[]; } | null {
    const channelId = SelectedChannelStore?.getVoiceChannelId?.();
    if (!channelId) return null;
    const parts = findByStoreName("ChannelRTCStore")?.getParticipants?.(channelId);
    if (!Array.isArray(parts)) return null;
    const meId = UserStore?.getCurrentUser?.()?.id;
    const others: Cand[] = [];
    const mine: Cand[] = [];
    for (const p of parts) {
        if (!p || !hasPipStreamId(p)) continue;
        const c: Cand = { sid: p.streamId, pid: p.id, stream: isStreamParticipant(p) };
        const owner = p.user?.id ?? p.userId ?? (p.stream ? undefined : p.id);
        if (meId != null && owner != null && String(owner) === String(meId)) mine.push(c);
        else if (hasVideo(p)) others.push(c);
    }
    return { others, mine };
}

function choose(which: "selected" | "focused", v: any): any {
    if (splitViewSettings.smartPip === false) return v;
    const list = people();
    if (!list || !list.others.length) return v;
    const id = v == null ? null : String(v);
    if (id != null) {
        const all = [...list.others, ...list.mine];
        if (all.some(c => String(c.sid) === id)) space = "sid";
        else if (all.some(c => String(c.pid) === id)) space = "pid";
    }
    const key = (c: Cand) => String(space === "pid" ? c.pid : c.sid);
    const val = (c: Cand) => (space === "pid" ? c.pid : c.sid);
    const pick = (pool: Cand[]) => {
        const c = (lastPick != null ? pool.find(x => key(x) === lastPick) : undefined) ?? pool[0];
        lastPick = key(c);
        return val(c);
    };
    const mine = id != null && list.mine.some(c => key(c) === id);
    if (which === "selected") return mine ? pick(list.others) : v;
    const streams = list.others.filter(c => c.stream);
    const pool = streams.length ? streams : list.others;
    const hit = id != null ? pool.find(c => key(c) === id) : undefined;
    if (hit) {
        lastPick = key(hit);
        return v;
    }
    return pick(pool);
}

function patch(tries = 0) {
    retry = null;
    const obj = moduleExports(PIP_PATH)?.default;
    if (!obj || typeof obj.setPipAspectRatio !== "function") {
        if (tries < 60) retry = setTimeout(safe("pip wait", () => patch(tries + 1)), 2000);
        return;
    }
    pip = obj;
    unpatches.push(instead("setPipAspectRatio", pip, safeInstead("pip shape", (args: any[], orig: Function) => {
        lastArgs = [...args];
        let next = args;
        try {
            next = safeArgs(args);
        } catch (e) {
            caught("pip shape", e);
            next = inRange(args);
        }
        try {
            lastSent = `${JSON.stringify(args)} -> ${next !== args ? JSON.stringify(next) : "kept"}`;
            logShape(`${lastSent} (${aspectFrom})`);
        } catch { }
        return orig(...next);
    })));
    for (const [name, which, set] of [
        ["setSelectedStream", "selected", (v: string | null) => selected = v],
        ["setFocusedStream", "focused", (v: string | null) => focused = v],
    ] as const) {
        if (typeof pip[name] !== "function") continue;
        unpatches.push(instead(name, pip, safeInstead(`pip ${name}`, (args: any[], orig: Function) => {
            let next = args;
            let before: number | null = null;
            try {
                const v = choose(which, args[0]);
                if (v !== args[0]) {
                    next = [v, ...args.slice(1)];
                    skipped++;
                }
                picks = `${which} ${idOf(args[0]) ?? "none"}${next !== args ? ` -> ${idOf(next[0])}` : ""}`;
                before = pipAspect();
                set(idOf(next[0]));
            } catch (e) {
                caught(`pip ${name}`, e);
                next = args;
            }
            const ret = orig(...next);
            try {
                if (pipAspect() !== before) resend();
            } catch (e) {
                caught(`pip ${name}`, e);
            }
            return ret;
        })));
    }
    const handoff = g.__cheeseburgerPip;
    if (handoff) {
        delete g.__cheeseburgerPip;
        selected = handoff.selected ?? null;
        focused = handoff.focused ?? null;
        lastPick = handoff.lastPick ?? null;
        space = handoff.space ?? "sid";
        pinned = handoff.pinned ?? null;
        viewPick = handoff.viewPick ?? null;
        viewSid = handoff.viewSid ?? null;
        if (handoff.lastArgs) {
            lastArgs = handoff.lastArgs;
            resend();
        }
    }
}

const isStreamPart = isStreamParticipant;
const isPart = isParticipant;

function myId(): string | null {
    const id = UserStore?.getCurrentUser?.()?.id;
    return id == null ? null : String(id);
}

function isMine(p: any, me = myId()): boolean {
    const owner = p?.user?.id ?? p?.userId ?? (isStreamPart(p) ? undefined : p?.id);
    return me != null && owner != null && String(owner) === me;
}

function allParts(channelId = SelectedChannelStore?.getVoiceChannelId?.()): any[] {
    if (!channelId) return [];
    const parts = findByStoreName("ChannelRTCStore")?.getParticipants?.(channelId);
    return Array.isArray(parts) ? parts.filter(Boolean) : [];
}

function chosen(currentId: string | null, all = allParts()): any {
    if (!all.length) return null;
    const me = myId();
    if (pinned) {
        const p = all.find(x => sameId(x.id, pinned) && hasPipStreamId(x) && hasVideo(x));
        if (p) return p;
    }
    if (splitViewSettings.smartPip === false) return null;
    const others = all.filter(x => !isMine(x, me) && hasPipStreamId(x) && hasVideo(x));
    if (!others.length) return null;
    const cur = currentId != null ? others.find(x => sameId(x.id, currentId)) : undefined;
    const streams = others.filter(isStreamPart);
    if (streams.length) return streams.find(x => x.id === viewPick) ?? (cur && isStreamPart(cur) ? cur : streams[0]);
    return cur ?? others.find(x => x.id === viewPick) ?? others[0];
}

function describe(v: any): string {
    if (v == null) return String(v);
    if (typeof v !== "object") return typeof v;
    if ("$$typeof" in v) return "element";
    if (isPart(v)) return `participant ${isStreamPart(v) ? "screen" : "user"}`;
    return `{${Object.keys(v).slice(0, 8).map(k => `${k}${isPart(v[k]) ? "=participant" : ""}`).join(",")}}`;
}

function remember(want: any) {
    const id = want?.id ?? null;
    const sid = want?.streamId != null ? String(want.streamId) : null;
    viewPick = id;
    if (sid !== viewSid) {
        viewSid = sid;
        setTimeout(resend, 0);
    }
}

const swapped = new WeakMap<object, any>();
const controllerSwapped = new WeakMap<object, any>();

function pickSelection(ret: any): any {
    discordSid = ret.selectedParticipantStreamId != null ? String(ret.selectedParticipantStreamId) : null;
    if (!ret.channelId) return ret;
    const parts = allParts(ret.channelId);
    const cur = parts.find(p => sameId(p.streamId, ret.selectedParticipantStreamId));
    const want = chosen(cur?.id ?? null, parts);
    if (!want) return ret;
    remember(want);
    if (cur?.id === want.id) return ret;
    const hit = swapped.get(ret);
    const out = replacePipSource(ret, want, parts);
    if (hit && Object.keys(hit).length === Object.keys(out).length && Object.keys(out).every(key => hit[key] === out[key])) return hit;
    swapped.set(ret, out);
    logShape(`view ${discordSid ?? "none"} -> ${want.streamId}${pinned ? " (pinned)" : ""}`);
    return out;
}

function pickFor(ret: any): any {
    if (ret && typeof ret === "object" && !Array.isArray(ret) && "selectedParticipantStreamId" in ret) return pickSelection(ret);
    if (ret && typeof ret === "object" && "$$typeof" in ret) return ret;
    const curId = isPart(ret) ? ret.id : typeof ret === "string" ? ret : isPart(ret?.participant) ? ret.participant.id : null;
    const want = chosen(curId);
    if (!want) return ret;
    remember(want);
    if (isPart(ret)) return ret.id === want.id ? ret : want;
    if (typeof ret === "string" && allParts().some(p => p.id === ret)) return ret === want.id ? ret : want.id;
    return replacePipSource(ret, want, allParts());
}

function drawerState(): any {
    try {
        return moduleExports(CALL_STORE)?.useChannelCallStore?.getState?.()?.voiceChatDrawerState;
    } catch {
        return undefined;
    }
}

function floatingPipAllowed(): boolean {
    const drawer = drawerState();
    const explicit = controller?.mode === "IN_APP" || controller?.panel === "pip";
    const panel = controller?.mode === "IN_PANEL" || controller?.panel === "panel";
    return !panel && (explicit || typeof drawer === "number" && drawer >= 0 && drawer < OPEN_CALL_DRAWER_STATE) && controller?.showSecondaryPIP === false
        && sameId(controller.channelId, SelectedChannelStore?.getVoiceChannelId?.());
}

function observeController(args: any, ret: any) {
    if (!ret || typeof ret !== "object") return;
    const channelId = args?.channelId ?? SelectedChannelStore?.getVoiceChannelId?.();
    controller = { channelId, showSecondaryPIP: ret.showSecondaryPIP, mode: ret.mode, panel: args?.mode, id: ret.id ?? ret.participantId ?? args?.id };
    let next = ret;
    if (running && floatingPipAllowed() && (controller.mode === "IN_APP" || controller.panel === "pip")) {
        const parts = allParts(channelId);
        const current = parts.find(p => sameId(p.id, controller?.id) || sameId(p.streamId, controller?.id));
        const want = chosen(current?.id ?? null, parts);
        if (want) {
            remember(want);
            const put = (key: string, value: any) => {
                if (!(key in ret) || next[key] === value) return;
                if (next === ret) next = { ...ret };
                next[key] = value;
            };
            const putId = (key: string, value: any) => put(key, pipValueLike(ret[key], value));
            putId("id", want.id);
            putId("participantId", want.id);
            putId("type", want.type);
            put("isCamera", !isStreamPart(want));
            put("isStream", isStreamPart(want));
            putId("streamId", want.streamId);
            const uid = want.user?.id ?? want.userId ?? (isStreamPart(want) ? want.stream?.ownerId : want.id);
            if (uid != null) putId("userId", uid);
            putId("selectedParticipantStreamId", want.streamId);
            putId("selectedParticipantUserId", uid ?? null);
            putId("focusedParticipantType", want.type);
            put("selectedParticipantSpeaking", !!(want.speaking ?? want.voiceState?.speaking));
            for (const key of ["participant", "pipParticipant", "videoParticipant", "selectedParticipant", "focusedParticipant"]) {
                if (isPart(ret[key])) put(key, want);
            }
            const aspect = streamAspect(String(want.streamId));
            if (aspect && Number.isFinite(aspect) && aspect > 0 && typeof ret.width === "number" && Number.isFinite(ret.width) && ret.width > 0
                && typeof ret.height === "number" && Number.isFinite(ret.height) && ret.height > 0) {
                const height = ret.width / Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, aspect));
                if (Math.abs(ret.height - height) >= 0.5) put("height", height);
            }
            controller.id = want.id;
            renderParticipant = want;
        }
    }
    if (next !== ret) {
        const cached = controllerSwapped.get(ret);
        if (cached && Object.keys(cached).length === Object.keys(next).length && Object.keys(next).every(key => cached[key] === next[key])) next = cached;
        else controllerSwapped.set(ret, next);
    }
    const focused = args?.focusedId != null || args?.focusedParticipantId != null;
    const line = `controller mode=${String(ret.mode ?? "unknown")} panel=${String(args?.mode ?? "unknown")} secondary=${String(ret.showSecondaryPIP)} focused=${focused} drawer=${String(drawerState())} size=${ret.width ?? "?"}x${ret.height ?? "?"}${next.height !== ret.height ? `->${next.width}x${next.height}` : ""} id=${String(ret.id ?? "unknown")}${next.id !== ret.id ? `->${String(next.id)}` : ""} keys=${Object.keys(ret).slice(0, 12).join(",")}`;
    if (!controllerShapes.includes(line)) {
        controllerShapes.push(line);
        if (controllerShapes.length > 6) controllerShapes.shift();
    }
    if (candidateContext === "floating") renderContext = floatingPipAllowed() ? "floating" : null;
    return next;
}

function patchViews(tries = 0) {
    viewRetry = null;
    for (const path of VIEW_PATHS) {
        if (viewPatched.has(path)) continue;
        const exp = moduleExports(path);
        if (!exp) continue;
        const name = path.split("/").pop()!.replace(/\..*$/, "");
        let installed = false;
        for (const key of ["default", name]) {
            if (typeof exp[key] !== "function") continue;
            try {
                unpatches.push(after(key, exp, safe(`pip view ${name}`, (args: any[], ret: any) => {
                    if (path === VIEW_PATHS[1]) {
                        const next = observeController(args?.[0], ret);
                        return next === ret ? undefined : next;
                    }
                    const context = renderContext ?? (path === VIEW_PATHS[0] ? "android" : null);
                    if (!running || !context) return;
                    const next = pickFor(ret);
                    const input = args?.length ? `takes ${args.slice(0, 2).map(describe).join(", ")}, ` : "";
                    viewShapes.set(`${name}.${key}`, `${context}, ${input}returns ${describe(ret)}${next !== ret ? " (swapped)" : ""}`);
                    return next === ret ? undefined : next;
                })));
                installed = true;
            } catch (e) {
                caught("pip view patch", e);
            }
        }
        if (installed) viewPatched.add(path);
    }
    if (viewPatched.size < VIEW_PATHS.length && tries < 60) viewRetry = setTimeout(safe("pip view wait", () => patchViews(tries + 1)), 2000);
}

function refresh() {
    try {
        findByStoreName("ChannelRTCStore")?.emitChange?.();
    } catch { }
    setTimeout(resend, 0);
    try {
        pip?.refreshPipUi?.();
    } catch { }
}

export function pinnedPip(): string | null {
    return pinned;
}

export function pinPip(id: string | null) {
    if (pinned === id) return;
    pinned = id;
    pinListeners.forEach(l => {
        try {
            l();
        } catch { }
    });
    refresh();
}

export function onPinChange(l: () => void) {
    pinListeners.add(l);
    return () => void pinListeners.delete(l);
}

export function participantForStream(streamId: any): any {
    if (streamId == null) return null;
    const sid = String(streamId);
    return allParts().find(p => p.streamId != null && String(p.streamId) === sid) ?? null;
}

export function participantForPin(props: any): any {
    const parts = allParts();
    for (const key of ["participant", "pipParticipant", "videoParticipant"]) {
        if (isParticipant(props?.[key])) return parts.find(p => sameId(p.id, props[key].id)) ?? props[key];
    }
    for (const key of ["participantId", "selectedParticipantId", "id"]) {
        const found = parts.find(p => sameId(p.id, props?.[key]));
        if (found) return found;
    }
    const byStream = participantForStream(props?.streamId);
    if (byStream) return byStream;
    const camera = props?.isCamera === true || props?.type === 2;
    const stream = !camera && (props?.isCamera === false || props?.type === 0 || String(props?.id ?? "").startsWith("call:")
        || props != null && typeof props === "object" && ("streamGuildId" in props || "streamKey" in props));
    if (props?.userId == null || !stream && !camera) return null;
    const matching = parts.filter(p => isStreamPart(p) === stream && sameId(p.user?.id ?? p.userId ?? p.stream?.ownerId ?? p.id, props.userId));
    return matching.length === 1 ? matching[0] : null;
}

export function participantForFocus(label: string): any {
    const name = label.replace(/^(?:unfocus|focus)\s+/i, "").trim();
    if (!name) return null;
    const parts = allParts();
    const channelId = SelectedChannelStore?.getVoiceChannelId?.();
    const channel = findByStoreName("ChannelStore")?.getChannel?.(channelId);
    const relationship = findByStoreName("RelationshipStore");
    const members = findByStoreName("GuildMemberStore");
    const hits = parts.filter(p => {
        const uid = p.user?.id ?? p.userId;
        const names = [p.name, p.displayName, p.user?.username, p.user?.globalName, p.user?.global_name,
            uid != null ? relationship?.getNickname?.(uid) : null,
            uid != null && channel?.guild_id ? members?.getMember?.(channel.guild_id, uid)?.nick : null];
        return hasVideo(p) && names.some(n => typeof n === "string" && n.trim() === name);
    });
    return hits.length === 1 ? hits[0] : null;
}

export const isPipRender = () => renderContext != null;

export function floatingPinParticipant(props?: any): any {
    if (!running || renderContext !== "floating" || !floatingPipAllowed()) return null;
    const current = participantForPin(props) ?? renderParticipant ?? allParts().find(p => sameId(p.id, controller?.id) || sameId(p.streamId, controller?.id));
    if (!current) return null;
    const source = chosen(current.id) ?? current;
    if (participantForPin(props)) renderParticipant = source;
    return isStreamPart(source) && !isMine(source) && hasPipStreamId(source) && hasVideo(source) ? source : null;
}

export const mineParticipant = (p: any) => isMine(p);

const onRtc = safe("pip rtc", (e: any) => {
    const state = String(e?.state ?? "");
    if (/DISCONNECT/.test(state)) {
        pinPip(null);
        return;
    }
    if (!pip && !retry && /CONNECTED/.test(state)) patch(0);
    if (!viewRetry && viewPatched.size < VIEW_PATHS.length && /CONNECTED/.test(state)) patchViews(0);
});

const VIEW_TYPES = [
    "modules/external_pip/ExternalPipView.android.tsx",
    "modules/voice_panel/native/pip/VoicePanelPIP.tsx",
];
const awareOf = new WeakMap<object, any>();
const renderedOf = new WeakMap<object, Map<string, any>>();
const renderedTypes = new WeakSet<object>();
const viewTypes = new Map<any, string>();
let lastTypeLook = 0;
let rerenders = 0;

function viewTypeList() {
    const now = Date.now();
    if (now - lastTypeLook > 2000) {
        lastTypeLook = now;
        for (const path of VIEW_TYPES) {
            const exp = moduleExports(path);
            if (!exp) continue;
            const name = path.split("/").pop()!.replace(/\..*$/, "");
            for (const key of ["default", name]) {
                const type = exp[key];
                if (typeof type === "function" || type?.$$typeof === Symbol.for("react.memo") || type?.$$typeof === Symbol.for("react.forward_ref")) viewTypes.set(type, path);
            }
        }
    }
}

function rtcStore(): any {
    try {
        return findByStoreName("ChannelRTCStore");
    } catch {
        return null;
    }
}

function sourceProps(props: any): any {
    if (!running || !renderContext || !props || typeof props !== "object") return props;
    const parts = allParts();
    const current = participantForPin(props);
    const want = chosen(current?.id ?? null, parts);
    if (!want) return props;
    const next = replacePipSource(props, want, parts);
    if (current) renderParticipant = participantForPin(next) ?? current;
    if (next !== props) {
        sourceSwaps++;
        remember(want);
    }
    return next;
}

function pipTree(tree: any, context: PipContext, level = 0): any {
    if (Array.isArray(tree)) return tree.map(el => pipTree(el, context, level));
    if (!tree || typeof tree !== "object" || !("$$typeof" in tree) || level > 6) return tree;
    const props = sourceProps(tree.props);
    const children = props?.children;
    const nextChildren = children != null && typeof children !== "function" ? pipTree(children, context, level + 1) : children;
    const type = tree.type;
    const name = type?.displayName ?? type?.name ?? type?.render?.name ?? "";
    const wrap = type && typeof type !== "string" && typeof type !== "symbol"
        && !/^(?:RCT|Native|Animated|View$|Pressable|Touchable|Gesture|Text|Image|Icon|Button|Scroll|Svg|Guard|PipAware)/i.test(name);
    const nextType = wrap ? rendered(type, context) : type;
    return nextType === type && props === tree.props && nextChildren === children ? tree
        : { ...tree, type: nextType, props: nextChildren === children ? props : { ...props, children: nextChildren } };
}

function renderPip(orig: Function, self: any, args: any[], context: PipContext, root = false): any {
    const previous = renderContext;
    const previousCandidate = candidateContext;
    const previousParticipant = renderParticipant;
    if (root) renderParticipant = null;
    candidateContext = context;
    renderContext = context === "android" || floatingPipAllowed() ? context : null;
    try {
        let props = args[0];
        try {
            if (!root || context === "android") props = sourceProps(props);
        } catch (e) {
            caught("pip source props", e);
        }
        const nextArgs = [props, ...args.slice(1)];
        const ret = orig.apply(self, nextArgs);
        try {
            return renderContext ? pipTree(ret, renderContext) : ret;
        } catch (e) {
            caught("pip source tree", e);
            return ret;
        }
    } finally {
        renderContext = previous;
        candidateContext = previousCandidate;
        renderParticipant = previousParticipant;
    }
}

function rendered(T: any, context: PipContext, root = false): any {
    if (!T || renderedTypes.has(T)) return T;
    let byContext = renderedOf.get(T);
    const key = `${context}:${root}`;
    const found = byContext?.get(key);
    if (found) return found;
    let W: any;
    if (typeof T === "function" && !T.prototype?.isReactComponent) {
        W = function (this: any, ...args: any[]) { return renderPip(T, this, args, context, root); };
    } else if (T?.$$typeof === Symbol.for("react.forward_ref") && typeof T.render === "function") {
        W = React.forwardRef((props: any, ref: any) => renderPip(T.render, undefined, [props, ref], context, root));
    } else if (T?.$$typeof === Symbol.for("react.memo") && T.type) {
        W = React.memo(rendered(T.type, context, root), typeof T.compare === "function"
            ? (a: any, b: any) => a.cheeseburgerPip === b.cheeseburgerPip && T.compare(a, b) : undefined);
    } else return T;
    W.displayName = T.displayName ?? T.name ?? "PipSource";
    if (T.defaultProps) W.defaultProps = T.defaultProps;
    if (!byContext) renderedOf.set(T, byContext = new Map());
    byContext.set(key, W);
    renderedTypes.add(W);
    return W;
}

function aware(T: any, path: string): any {
    let W = awareOf.get(T);
    if (W) return W;
    W = function PipAware(props: any) {
        const [n, force] = React.useReducer((x: number) => x + 1, 0);
        React.useEffect(() => {
            const bump = safe("pip view change", () => {
                rerenders++;
                force();
            });
            const offPin = onPinChange(bump);
            const offAspect = onAspectChange(bump);
            const store = rtcStore();
            try {
                store?.addChangeListener?.(bump);
            } catch { }
            return () => {
                offPin();
                offAspect();
                try {
                    store?.removeChangeListener?.(bump);
                } catch { }
            };
        }, []);
        if (!running) return React.createElement(T, props);
        if (/voice_panel/.test(path)) internalRenders++;
        viewShapes.set(path.split("/").pop()!, `takes ${describe(props)}`);
        const context = /external_pip/.test(path) ? "android" : "floating";
        return React.createElement(rendered(T, context, true), { ...props, cheeseburgerPip: `${pinned ?? ""}:${n}` });
    };
    awareOf.set(T, W);
    return W;
}

const onViewJsx = safe("pip view jsx", (args: any[]) => {
    const t = args[0];
    if (!running || !t || typeof t === "string" || renderedTypes.has(t)) return;
    viewTypeList();
    const path = viewTypes.get(t);
    if (!path) return;
    args[0] = aware(t, path);
    return args;
});

export function startPip() {
    running = true;
    patch();
    patchViews();
    unpatches.push(before("jsx", jsxRuntime, onViewJsx), before("jsxs", jsxRuntime, onViewJsx), before("createElement", React, onViewJsx));
    unpatches.push(onAspectChange(() => setTimeout(resend, 0)));
    FluxDispatcher.subscribe("RTC_CONNECTION_STATE", onRtc);
    unpatches.push(() => FluxDispatcher.unsubscribe("RTC_CONNECTION_STATE", onRtc));
}

export function stopPip() {
    running = false;
    if (retry) clearTimeout(retry);
    retry = null;
    if (viewRetry) clearTimeout(viewRetry);
    viewRetry = null;
    for (const u of unpatches.splice(0)) u();
    viewPatched.clear();
    if (g.__cheeseburgerSwapping) {
        g.__cheeseburgerPip = { lastArgs, selected, focused, lastPick, space, pinned, viewPick, viewSid };
    } else {
        if (lastArgs) lastArgs = inRange(lastArgs);
        resend();
    }
    pip = null;
    lastArgs = null;
    selected = focused = null;
    viewSid = viewPick = null;
    pinned = null;
    controller = null;
}

export function pipDebug(): string[] {
    const a = pipAspect();
    return [
        `pip: ${pip ? "hooked" : "not loaded yet"}, stream ${focused ?? selected ?? "main"}, shape ${a ? a.toFixed(3) : "unknown"}${clamped ? `, kept in range ${clamped}x` : ""}`,
        `pip last: ${lastSent || "none yet"}`,
        `pip picks: ${splitViewSettings.smartPip === false ? "off" : `${picks || "none yet"}, skipped you ${skipped}x, ids ${space}`}`,
        `pip shape from: ${aspectFrom || "not asked yet"}, pip view rerenders ${rerenders}, wrapped ${viewTypes.size}/${VIEW_TYPES.length}`,
        `in-discord pip: renders ${internalRenders}, source swaps ${sourceSwaps}, shared helpers native, roots ${[...viewTypes.values()].filter(p => /voice_panel/.test(p)).map(p => p.split("/").pop()).join(", ") || "not loaded"}`,
        `floating source: ${floatingPipAllowed() ? "primary pip" : "native call/secondary"}, drawer=${String(drawerState())}, mode=${String(controller?.mode ?? "unknown")}, secondary=${String(controller?.showSecondaryPIP)}`,
        ...controllerShapes.map(line => `  ${line}`),
        ...shapeLog.map(l => `  ${l}`),
        `pip view: pinned ${pinned ? "yes" : "no"}, showing ${viewPick ? (isStreamPart({ id: viewPick }) ? "a screen" : viewPick === myId() ? "me" : "a camera") : "discord's pick"}${viewSid ? ` (stream ${viewSid})` : ""}, hooked ${[...viewPatched].map(x => x.split("/").pop()).join(", ") || "not yet"}`,
        ...[...viewShapes].map(([k, v]) => `  ${k} ${v}`),
        ...pipParts(),
    ];
}

const keysOf = (o: any) => {
    const out = new Set<string>();
    let cur = o;
    for (let i = 0; cur && i < 3 && cur !== Object.prototype; i++, cur = Object.getPrototypeOf(cur)) {
        for (const k of Object.getOwnPropertyNames(cur)) if (k !== "constructor") out.add(k);
    }
    return [...out];
};

function pipParts(): string[] {
    const out: string[] = [];
    try {
        const exp = moduleExports(PIP_PATH);
        if (exp) {
            for (const k of Object.keys(exp)) {
                const v = exp[k];
                out.push(`pip js ${k}: ${v && (typeof v === "object" || typeof v === "function") ? keysOf(v).join(", ").slice(0, 400) : typeof v}`);
            }
        }
        const mods: any = (window as any).modules ?? {};
        const paths: string[] = [];
        for (const id of Object.keys(mods)) {
            const fp = mods[id]?.__filePath;
            if (typeof fp === "string" && /pip|picture/i.test(fp)) paths.push(fp.replace(/^modules\//, ""));
        }
        if (paths.length) out.push(`pip files: ${paths.slice(0, 20).join(", ")}`);
        const names = new Set<string>();
        try {
            for (const n of Object.keys(NativeModules ?? {})) names.add(n);
        } catch { }
        for (const n of ["ExternalPip", "ExternalPipManager", "PictureInPicture", "PipManager", "DCDPictureInPicture", "RTNExternalPip", "NativeExternalPip"]) names.add(n);
        for (const n of names) {
            if (!/pip|picture/i.test(n)) continue;
            let m: any;
            try {
                m = NativeModules?.[n] ?? (globalThis as any).__turboModuleProxy?.(n);
            } catch {
                m = undefined;
            }
            if (m) out.push(`pip native ${n}: ${keysOf(m).join(", ").slice(0, 400)}`);
        }
    } catch (e) {
        out.push(`pip parts: ${String((e as any)?.message ?? e).slice(0, 80)}`);
    }
    return out.length ? out : ["pip parts: nothing found"];
}
