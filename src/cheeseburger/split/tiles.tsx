import { hotStatus } from "@api/hot/status";
import { logger } from "@lib/utils/logger";
import { findByStoreName } from "@metro";
import { SelectedChannelStore, UserStore } from "@metro/common/stores";
import { Dimensions, StatusBar } from "react-native";

import { caught, safe } from "../crash";
import { hasToolbarRef, measureAll, measured, measureToolbarNow, toolbarKnown } from "./probe";
import { splitViewSettings } from "./storage";

export type TileKind = "stream" | "them" | "me";

interface Tile {
    key: string;
    kind: TileKind;
    coords: any;
    streamId?: string;
    seenAt: number;
    firstSeen: number;
}

interface Rect { x: number; y: number; width: number; height: number; }

interface Aspect { value: number; pending?: number; timer?: ReturnType<typeof setTimeout>; }

interface Shared {
    tiles: Map<string, Tile>;
    previews: Map<string, Tile>;
    coordsById: Map<string, { coords: any; seenAt: number; }>;
    videoSizes: Map<string, { w: number; h: number; }>;
    aspects: Map<string, Aspect>;
    intended: WeakMap<object, any>;
    touched: Set<object>;
    copies: number;
    owner: number;
}

const shared: Shared = (globalThis as any).__cheeseburgerTiles ??= {
    tiles: new Map(),
    previews: new Map(),
    coordsById: new Map(),
    videoSizes: new Map(),
    aspects: new Map(),
    intended: new WeakMap(),
    touched: new Set(),
    copies: 0,
    owner: 0,
};

const copy = ++shared.copies;
const mine = () => shared.owner === copy;
const { tiles, previews, coordsById, videoSizes, aspects, intended, touched } = shared;
const coordsIds = new WeakMap<object, string>();
const targets = new WeakMap<object, Rect>();
const written = new WeakMap<object, Rect[]>();
const lastWrite = new WeakMap<object, number>();
const guards = new Map<object, PropertyDescriptor | null>();
const modGuards = new Map<object, PropertyDescriptor | null>();
const moves: string[] = [];

let active = false;
let pollTimer: ReturnType<typeof setTimeout> | null = null;
let burstUntil = 0;
let gridW: { ww: number; w: number; } | null = null;
let held = 0;
let fullscreen = false;
let origin: { x: number; y: number; } | null = null;
let moved = 0;

const GRID_GAP = 10;
const FS_GAP = 4;
const CAM_MIN_ASPECT = 0.75;
const HEADER_GAP = 8;
const SETTLE_MS = 1000;
const DEFAULT_ORDER: TileKind[] = ["stream", "them", "me"];
const SNAPS = [16 / 9, 4 / 3, 1, 3 / 4, 9 / 16];

function readCoords(sv: any): any {
    try {
        return typeof sv?.get === "function" ? sv.get() : sv?.value;
    } catch {
        return undefined;
    }
}

function writeCoords(sv: any, next: any) {
    try {
        if (typeof sv?.set === "function") sv.set(next);
        else sv.value = next;
    } catch (e) {
        logger.error("[SplitView] couldn't move tile", e);
    }
}

function write(sv: any, next: any, r: Rect) {
    const list = written.get(sv) ?? [];
    if (!list.some(w => near(w, r))) {
        list.push(r);
        if (list.length > 4) list.shift();
        written.set(sv, list);
    }
    lastWrite.set(sv, Date.now());
    writeCoords(sv, next);
}

const near = (a: any, r: Rect) => Math.abs((a.x ?? 0) - r.x) < 0.5 && Math.abs((a.y ?? 0) - r.y) < 0.5
    && Math.abs((a.width ?? 0) - r.width) < 0.5 && Math.abs((a.height ?? 0) - r.height) < 0.5;

const isCoords = (v: any) => !!v && typeof v === "object" && typeof v.x === "number" && typeof v.width === "number";

function steer(sv: any, v: any) {
    try {
        return steerTo(sv, v);
    } catch (e) {
        caught("split steer", e);
        return v;
    }
}

function steerTo(sv: any, v: any) {
    if (!active || !mine()) return v;
    const r = targets.get(sv);
    if (!r) return v;
    if (isCoords(v)) {
        if (near(v, r)) return v;
        intended.set(sv, { ...v });
        held++;
        return { ...v, ...r, zIndex: 1 };
    }
    if (typeof v === "function" && v.__isAnimationDefinition && intended.has(sv)) {
        held++;
        return { ...intended.get(sv), ...r, zIndex: 1 };
    }
    return v;
}

function findDescriptor(obj: any, key: string) {
    for (let o = obj; o; o = Object.getPrototypeOf(o)) {
        const d = Object.getOwnPropertyDescriptor(o, key);
        if (d) return { d, own: o === obj };
    }
    return null;
}

function guard(sv: any) {
    if (!sv || typeof sv !== "object" || guards.has(sv)) return;
    const found = findDescriptor(sv, "value");
    if (!found?.d.get || !found.d.set) return;
    if (found.own ? !found.d.configurable : !Object.isExtensible(sv)) return;
    const { get, set } = found.d;
    try {
        Object.defineProperty(sv, "value", {
            configurable: true,
            enumerable: found.d.enumerable ?? true,
            get() { return get.call(this); },
            set(v) { set.call(this, steer(sv, v)); },
        });
        guards.set(sv, found.own ? found.d : null);
    } catch { }
    guardModify(sv);
}

function guardModify(sv: any) {
    if (modGuards.has(sv) || typeof sv.modify !== "function") return;
    const own = Object.getOwnPropertyDescriptor(sv, "modify");
    if (own && !own.configurable) return;
    const orig = sv.modify;
    try {
        Object.defineProperty(sv, "modify", {
            configurable: true,
            writable: true,
            value(this: any, ...a: any[]) {
                let r: Rect | undefined;
                try {
                    r = active && mine() ? targets.get(sv) : undefined;
                } catch { }
                if (!r) return orig.apply(this, a);
                try {
                    held++;
                    burstUntil = Date.now() + 3000;
                    const cur = readCoords(sv);
                    if (cur && typeof a[0] === "function") {
                        try {
                            const want = a[0]({ ...cur });
                            if (isCoords(want)) intended.set(sv, { ...want });
                        } catch { }
                    }
                    if (cur && !near(cur, r)) write(sv, { ...cur, ...r, zIndex: 1 }, r);
                } catch (e) {
                    caught("split modify", e);
                }
            },
        });
        modGuards.set(sv, own ?? null);
    } catch { }
}

function unguardAll() {
    for (const [sv, d] of guards) {
        try {
            if (d) Object.defineProperty(sv, "value", d);
            else delete (sv as any).value;
        } catch { }
    }
    guards.clear();
    for (const [sv, d] of modGuards) {
        try {
            if (d) Object.defineProperty(sv, "modify", d);
            else delete (sv as any).modify;
        } catch { }
    }
    modGuards.clear();
}

const isVideoRenderer = (props: any) => "isCamera" in props || "videoSpinnerContext" in props;

export function isTileElement(args: any[]): boolean {
    const props = args[1];
    return !!props && typeof props === "object" && typeof args[0] !== "string" && !!props.sharedCoords
        && isVideoRenderer(props) && props.streamId != null && typeof props.onSize !== "function";
}

function kindFromProps(props: any, coords: any): TileKind {
    const id = String(coords?.id ?? props.id ?? "");
    if (id.startsWith("call:") || props.streamKey || props.isStream || props.isCamera === false) return "stream";
    const meId = UserStore?.getCurrentUser?.()?.id;
    if (props.isSelf || (meId && (props.userId === meId || id === meId))) return "me";
    return "them";
}

const onSizeWrapped = new WeakMap<Function, Function>();

function sizeFromArgs(args: any[]): { w: number; h: number; } | null {
    const [a, b] = args;
    if (typeof a === "number" && typeof b === "number") return { w: a, h: b };
    const src = a?.nativeEvent ?? a;
    const w = src?.width ?? src?.videoWidth;
    const h = src?.height ?? src?.videoHeight;
    return typeof w === "number" && typeof h === "number" ? { w, h } : null;
}

function snap(a: number) {
    for (const s of SNAPS) if (Math.abs(a / s - 1) < 0.06) return s;
    return a;
}

const same = (a: number, b: number) => Math.abs(a / b - 1) < 0.02;

function noteSize(sid: string, size: { w: number; h: number; }) {
    videoSizes.set(sid, size);
    const a = snap(size.w / size.h);
    const cur = aspects.get(sid);
    if (!cur) {
        aspects.set(sid, { value: a });
        aspectChanged();
        if (active) scheduleApply();
        return;
    }
    if (same(a, cur.value)) {
        if (cur.timer) clearTimeout(cur.timer);
        cur.pending = cur.timer = undefined;
        return;
    }
    if (cur.pending !== undefined && same(a, cur.pending)) return;
    if (cur.timer) clearTimeout(cur.timer);
    cur.pending = a;
    cur.timer = setTimeout(safe("split shape", () => {
        if (cur.pending === undefined) return;
        cur.value = cur.pending;
        cur.pending = cur.timer = undefined;
        aspectChanged();
        if (active) scheduleApply();
    }), SETTLE_MS);
}

function noteCoords(sv: any) {
    if (!sv || typeof sv !== "object") return;
    let id = coordsIds.get(sv);
    if (id === undefined) {
        id = String(readCoords(sv)?.id ?? "");
        coordsIds.set(sv, id);
    }
    if (!id) return;
    const prev = coordsById.get(id);
    coordsById.set(id, { coords: sv, seenAt: Date.now() });
    if (active && prev?.coords !== sv && id.startsWith("call:")) scheduleApply();
}

export function registerTile(args: any[]) {
    const props = args[1];
    if (!props || typeof props !== "object") return;
    if (props.sharedCoords) noteCoords(props.sharedCoords);

    if (props.streamId != null && typeof props.onSize === "function" && typeof args[0] !== "string") {
        const orig = props.onSize;
        let w = onSizeWrapped.get(orig);
        if (!w) {
            const sid = String(props.streamId);
            w = (...a: any[]) => {
                try {
                    const size = sizeFromArgs(a);
                    if (size && size.w > 0 && size.h > 0) noteSize(sid, size);
                } catch (e) {
                    caught("split video size", e);
                }
                return orig(...a);
            };
            onSizeWrapped.set(orig, w);
        }
        args[1] = { ...props, onSize: w };
        return args;
    }

    if (props.sharedCoords) kickTiles();
    if (!props.sharedCoords || !isVideoRenderer(props) || props.streamId == null) return;

    const current = readCoords(props.sharedCoords);
    const key = `v:${props.streamId}`;
    const existing = tiles.get(key);
    const now = Date.now();
    if (existing && existing.coords !== props.sharedCoords) targets.delete(existing.coords);
    tiles.set(key, {
        key,
        kind: existing?.kind ?? kindFromProps(props, current),
        coords: props.sharedCoords,
        streamId: String(props.streamId),
        seenAt: now,
        firstSeen: existing?.firstSeen ?? now,
    });
    if (active && existing?.coords !== props.sharedCoords) scheduleApply();
}

interface Part { id: string; userId?: string; streamId?: string; kind: TileKind; video: boolean; }

export function hasVideo(p: any): boolean {
    if (p.stream) return true;
    const self = p.voiceState?.selfVideo;
    if (typeof self === "boolean") return self;
    if (typeof p.userVideo === "boolean") return p.userVideo;
    return p.streamId != null;
}

let voiceHidden = false;

function callParts(): Part[] | null {
    try {
        const channelId = SelectedChannelStore?.getVoiceChannelId?.();
        const store = findByStoreName("ChannelRTCStore");
        const parts: any[] | undefined = channelId ? store?.getParticipants?.(channelId) : undefined;
        if (!Array.isArray(parts)) return null;
        const meId = UserStore?.getCurrentUser?.()?.id;
        try {
            voiceHidden = !!store?.getVoiceParticipantsHidden?.(channelId);
        } catch {
            voiceHidden = false;
        }
        return parts.filter(p => p && p.id != null).map(p => {
            const userId = p.user?.id ?? (p.stream ? undefined : p.id);
            return {
                id: String(p.id),
                userId: userId != null ? String(userId) : undefined,
                streamId: p.streamId != null ? String(p.streamId) : undefined,
                kind: p.stream ? "stream" : userId === meId ? "me" : "them",
                video: hasVideo(p),
            };
        });
    } catch {
        return null;
    }
}

function previewTile(p: Part, used: Set<any>): Tile | undefined {
    let hit = coordsById.get(p.id);
    if (!hit || used.has(hit.coords)) {
        hit = undefined;
        for (const [id, e] of coordsById) {
            if (!id.startsWith("call:") || used.has(e.coords)) continue;
            if (p.userId && !id.includes(p.userId)) continue;
            if (!hit || e.seenAt > hit.seenAt) hit = e;
        }
    }
    if (!hit) return;
    const key = `p:${p.id}`;
    const prev = previews.get(key);
    const t: Tile = { key, kind: "stream", coords: hit.coords, seenAt: hit.seenAt, firstSeen: prev?.firstSeen ?? Date.now() };
    previews.set(key, t);
    return t;
}

let voice: Tile[] = [];

function liveTiles(): Tile[] {
    const all = callParts();
    const parts = all?.filter(p => p.video) ?? null;
    const now = Date.now();
    const out: Tile[] = [];
    const used = new Set<any>();
    voice = [];

    if (!parts) {
        for (const t of tiles.values()) {
            if (now - t.seenAt < 60_000 && !used.has(t.coords)) {
                used.add(t.coords);
                out.push(t);
            }
        }
        return out;
    }

    const live = new Set<string>();
    const waiting: Part[] = [];
    for (const p of parts) {
        const t = p.streamId != null ? tiles.get(`v:${p.streamId}`) : undefined;
        if (!t) {
            if (p.kind === "stream") waiting.push(p);
            continue;
        }
        live.add(t.key);
        t.kind = p.kind;
        if (used.has(t.coords)) continue;
        used.add(t.coords);
        out.push(t);
    }
    for (const p of waiting) {
        const t = previewTile(p, used);
        if (!t) continue;
        used.add(t.coords);
        out.push(t);
    }
    if (!voiceHidden) {
        for (const p of all ?? []) {
            if (p.video || p.kind === "stream") continue;
            const coords = coordsById.get(p.id)?.coords ?? (p.streamId != null ? tiles.get(`v:${p.streamId}`)?.coords : undefined);
            if (!coords || used.has(coords)) continue;
            used.add(coords);
            voice.push({ key: `a:${p.id}`, kind: p.kind, coords, seenAt: now, firstSeen: now });
        }
    }
    for (const [key, t] of tiles) {
        if (!live.has(key) && now - t.seenAt > 10_000) tiles.delete(key);
    }
    for (const [id, e] of coordsById) {
        if (now - e.seenAt > 120_000) coordsById.delete(id);
    }
    return out;
}

export const currentOrder = () => [...new Set([...(splitViewSettings.order ?? []), ...DEFAULT_ORDER])] as TileKind[];

function orderedTiles(): Tile[] {
    const order = currentOrder();
    const rank = (k: TileKind) => {
        const i = order.indexOf(k);
        return i === -1 ? 99 : i;
    };
    return liveTiles().sort((a, b) => rank(a.kind) - rank(b.kind) || a.firstSeen - b.firstSeen || a.key.localeCompare(b.key));
}

const aspectListeners = new Set<() => void>();

export function onAspectChange(l: () => void) {
    aspectListeners.add(l);
    return () => void aspectListeners.delete(l);
}

const aspectChanged = () => aspectListeners.forEach(l => {
    try {
        l();
    } catch (e) {
        caught("split shape listener", e);
    }
});

export const streamAspect = (sid: string): number | null => aspects.get(sid)?.value ?? null;

export function knownMainAspect(): number | null {
    const list = orderedTiles();
    const pick = list.find(t => t.kind === "stream" && t.streamId) ?? list.find(t => t.kind === "them" && t.streamId);
    return pick?.streamId ? streamAspect(pick.streamId) : null;
}

function aspectOf(t: Tile): number {
    if (t.kind !== "stream") return 16 / 9;
    return (t.streamId && aspects.get(t.streamId)?.value) || 16 / 9;
}

function gridWidth(list: Tile[], ww: number): number {
    let w = 0;
    for (const t of list) {
        const o = intended.get(t.coords);
        if (o) w = Math.max(w, (o.x ?? 0) + (o.width ?? 0));
    }
    if (w >= ww - 48 && w <= ww) gridW = { ww, w };
    return gridW?.ww === ww ? gridW.w : Math.max(200, ww - 24);
}

const GRID_TOP = 112;

interface Frame { origin: { x: number; y: number; }; parent: string; hidden: boolean; top: number; bottom: number; }

let frame: Frame | null = null;
let lastOrigin: { x: number; y: number; } | null = null;
const maxTop = new Map<string, number>();

const statusBar = () => (typeof StatusBar?.currentHeight === "number" ? StatusBar.currentHeight : 24);

const restSince = new WeakMap<object, { r: Rect; since: number; }>();
let frameNote = "";
let pendingFrame: { f: Frame; since: number; } | null = null;
let frameAt = 0;
let frameMode = "";
const frameLog: string[] = [];
const shownH = new Map<string, number>();
const shownTop = new Map<string, number>();

function updateFrame(win: { width: number; height: number; }) {
    const p = measured.parent;
    if (!p || Date.now() - p.at > 1000 || !isCoords(p.coords)) return;
    const rest = restSince.get(p.sv);
    if (!rest || !near(p.coords, rest.r) || Date.now() - rest.since < 700) {
        frameNote = "moving";
        return;
    }
    if (Math.abs(p.width - p.coords.width) > 16 || Math.abs(p.height - p.coords.height) > 16) {
        frameNote = `skipped ${Math.round(p.width)}x${Math.round(p.height)}`;
        return;
    }
    let o = { x: p.x - p.coords.x - (p.coords.width - p.width) / 2, y: p.y - p.coords.y - (p.coords.height - p.height) / 2 };
    const stable = lastOrigin && Math.abs(lastOrigin.x - o.x) < 1.5 && Math.abs(lastOrigin.y - o.y) < 1.5;
    lastOrigin = o;
    if (!stable) {
        frameNote = "checking";
        return;
    }
    frameNote = "";
    const mode = fullscreen ? "full" : "grid";
    const sameMode = !!frame && frameMode === mode;
    if (sameMode && mode === "full") {
        if (Math.abs(frame!.origin.x - o.x) < 60 && Math.abs(frame!.origin.y - o.y) < 60) {
            pendingFrame = null;
            return;
        }
    }
    if (frame && Math.abs(frame.origin.x - o.x) < 12 && Math.abs(frame.origin.y - o.y) < 12) o = frame.origin;
    const land = win.width > win.height;
    const key = `${Math.round(win.width)}x${Math.round(win.height)}`;
    const top0 = Math.max(maxTop.get(key) ?? o.y, o.y);
    maxTop.set(key, top0);
    const tb = measured.toolbar && Date.now() - measured.toolbar.at < 2000 ? measured.toolbar : undefined;
    const useToolbar = toolbarKnown() && splitViewSettings.showButton !== false;
    const hidden = useToolbar ? !tb || tb.y >= win.height - 4 : o.y < top0 - 30;
    const top = hidden ? (land ? 8 : statusBar() + 6) : o.y + 4;
    const bottom = hidden ? win.height - (land ? 8 : 56) : (tb && tb.y < win.height - 4 ? tb.y - 16 : win.height - (land ? 90 : 136)) - 8;
    const next: Frame = { origin: o, parent: "tile", hidden, top: Math.round(top), bottom: Math.round(bottom) };
    const now = Date.now();
    if (!hidden) shownH.set(key, next.bottom - next.top);
    if (!hidden && mode === "grid") shownTop.set(key, next.top);
    if (sameMode && sameFrame(frame!, next)) {
        pendingFrame = null;
        frame = { ...frame!, origin: next.origin };
        return;
    }
    if (sameMode) {
        if (!pendingFrame || !sameFrame(pendingFrame.f, next)) {
            pendingFrame = { f: next, since: now };
            frameNote = "waiting";
            return;
        }
        if (now - pendingFrame.since < 500 || now - frameAt < 1500) {
            frameNote = "waiting";
            return;
        }
    }
    pendingFrame = null;
    frame = next;
    frameMode = mode;
    frameAt = now;
    frameLog.push(`${new Date(now).toISOString().slice(17, 23)} area ${Math.round(o.x)},${Math.round(o.y)} ${hidden ? "hidden" : "shown"} fit ${next.top}-${next.bottom}${tb ? ` toolbar ${Math.round(tb.y)}` : ""}`);
    if (frameLog.length > 6) frameLog.shift();
}

function sameFrame(a: Frame, b: Frame) {
    return a.hidden === b.hidden && Math.abs(a.origin.x - b.origin.x) < 6 && Math.abs(a.origin.y - b.origin.y) < 6
        && Math.abs(a.top - b.top) < 6 && Math.abs(a.bottom - b.bottom) < 6;
}

function sizeHeight(regionH: number, win: { width: number; height: number; }) {
    const cap = shownH.get(`${Math.round(win.width)}x${Math.round(win.height)}`);
    return cap && cap > 120 ? Math.min(regionH, cap) : regionH;
}

export function setTilesFullscreen(v: boolean) {
    if (fullscreen === v) return;
    fullscreen = v;
    origin = null;
    if (active) scheduleApply();
}

const LS_INSET = 12;

function landscapeRects(list: Tile[], win: { width: number; height: number; }): Map<string, Rect> {
    const out = new Map<string, Rect>();
    const W = Math.max(120, win.width - LS_INSET * 2);
    const viewportTop = frame?.top ?? statusBar() + LS_INSET;
    const viewportBottom = frame?.bottom ?? win.height - LS_INSET;
    const full = Math.max(120, viewportBottom - viewportTop);
    const H = sizeHeight(full, win);
    const X0 = LS_INSET - (frame?.origin.x ?? 0);
    const top = viewportTop - (frame?.origin.y ?? 0) + (full - H) / 2;
    const n = voice.length;
    const S = n ? Math.max(36, Math.min(72, (H - GRID_GAP * (n - 1)) / n)) : 0;
    const Wv = n ? W - S - GRID_GAP : W;
    const asp = list.map(aspectOf);
    const widest = Math.max(...asp);
    let best = { rows: 1, cols: list.length, h: 0 };
    for (let rows = 1; rows <= list.length; rows++) {
        const cols = Math.ceil(list.length / rows);
        const h = Math.min((H - GRID_GAP * (rows - 1)) / rows, (Wv - GRID_GAP * (cols - 1)) / cols / widest);
        if (h > best.h) best = { rows, cols, h };
    }
    const { rows, cols, h } = best;
    let y = top + Math.max(0, (H - (rows * h + GRID_GAP * (rows - 1))) / 2);
    for (let r = 0; r < rows; r++) {
        const idx = list.map((_, i) => i).slice(r * cols, (r + 1) * cols);
        const widths = idx.map(i => h * asp[i]);
        let x = X0 + Math.max(0, (Wv - widths.reduce((a, b) => a + b, 0) - GRID_GAP * (idx.length - 1)) / 2);
        idx.forEach((i, j) => {
            out.set(list[i].key, { x, y, width: widths[j], height: h });
            x += widths[j] + GRID_GAP;
        });
        y += h + GRID_GAP;
    }
    if (n) {
        const rects = [...out.values()];
        const left = Math.min(...rects.map(r => r.x));
        const right = Math.max(...rects.map(r => r.x + r.width));
        const shift = X0 + Math.max(0, (W - (right - left + GRID_GAP + S)) / 2) - left;
        for (const [k, r] of out) out.set(k, { ...r, x: r.x + shift });
        let vy = top + Math.max(0, (H - (n * S + GRID_GAP * (n - 1))) / 2);
        for (const t of voice) {
            out.set(t.key, { x: right + shift + GRID_GAP, y: vy, width: S, height: S });
            vy += S + GRID_GAP;
        }
    }
    return rounded(out);
}

function rounded(out: Map<string, Rect>) {
    for (const [k, r] of out) out.set(k, { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) });
    return out;
}

function computeRects(list: Tile[]): Map<string, Rect> {
    const out = new Map<string, Rect>();
    if (!list.length) return out;

    const win = Dimensions.get("window");
    if (win.width > win.height) return landscapeRects(list, win);
    let W: number, H: number, X0: number, Y0: number, GAP: number;
    if (fullscreen) {
        origin = frame?.origin ?? origin ?? { x: (win.width - gridWidth(list, win.width)) / 2, y: GRID_TOP };
        const under = shownTop.get(`${Math.round(win.width)}x${Math.round(win.height)}`);
        const top = Math.max(statusBar() + 6, under != null ? under - HEADER_GAP : statusBar() + 44);
        const bottom = win.height - 56;
        W = win.width;
        H = Math.max(300, bottom - top);
        X0 = -origin.x;
        Y0 = top - origin.y;
        GAP = FS_GAP;
    } else {
        W = gridWidth(list, win.width);
        const full = frame ? Math.max(200, frame.bottom - frame.top) : Math.max(300, win.height - 245);
        H = frame ? sizeHeight(full, win) : full;
        X0 = 0;
        Y0 = frame ? frame.top - frame.origin.y + (full - H) / 2 : 0;
        GAP = GRID_GAP;
    }
    const n = voice.length;
    const S = n ? Math.max(40, Math.min(96, (W - GAP * (n - 1)) / n)) : 0;
    const fullH = H;
    if (n) H = Math.max(160, H - S - GAP);
    const asp = list.map(aspectOf);
    const tall = (i: number) => asp[i] < 1;

    const rows: number[][] = [];
    list.forEach((_, i) => {
        const last = rows[rows.length - 1];
        if (tall(i) && last && tall(last[0]) && last.length < 3) last.push(i);
        else rows.push([i]);
    });

    const wide = rows.filter(r => !tall(r[0]));
    const narrow = rows.filter(r => tall(r[0]));
    const gaps = GAP * (rows.length - 1);
    const inv = wide.reduce((s, r) => s + 1 / asp[r[0]], 0);
    const fitWidth = (r: number[]) => (W - GAP * (r.length - 1)) / r.reduce((s, i) => s + asp[i], 0);

    let w = W;
    let p = 0;
    if (narrow.length) {
        const pMax = Math.min(wide.length ? H * 0.5 : H, ...narrow.map(fitWidth));
        const pMin = Math.min(H * 0.25, pMax);
        p = Math.min(pMax, (H - gaps - W * inv) / narrow.length);
        if (p < pMin) {
            p = pMin;
            if (inv) w = Math.min(W, Math.max(60, (H - gaps - narrow.length * p) / inv));
        }
    } else if (inv) {
        w = Math.min(W, (H - gaps) / inv);
    }

    const extra = new Map<number[], number>();
    if (fullscreen) {
        const cams = wide.filter(r => r.length === 1 && list[r[0]].kind !== "stream");
        const slack = H - (rows.reduce((s, r) => s + (tall(r[0]) ? p : w / asp[r[0]]), 0) + gaps);
        if (cams.length && slack > 1) {
            for (const r of cams) extra.set(r, Math.max(0, Math.min(slack / cams.length, w / CAM_MIN_ASPECT - w / asp[r[0]])));
        }
    }
    const heightOf = (r: number[]) => (tall(r[0]) ? p : w / asp[r[0]] + (extra.get(r) ?? 0));
    const used = rows.reduce((s, r) => s + heightOf(r), 0) + gaps;
    let y = Math.max(0, (H - used) / 2);
    for (const r of rows) {
        const h = heightOf(r);
        const widths = extra.get(r) ? [w] : r.map(i => h * asp[i]);
        const rowW = widths.reduce((a, b) => a + b, 0) + GAP * (r.length - 1);
        let x = Math.max(0, (W - rowW) / 2);
        r.forEach((i, j) => {
            out.set(list[i].key, { x: X0 + x, y: Y0 + y, width: widths[j], height: h });
            x += widths[j] + GAP;
        });
        y += h + GAP;
    }
    if (n) {
        const rects = [...out.values()];
        const top = Math.min(...rects.map(r => r.y));
        const bottom = Math.max(...rects.map(r => r.y + r.height));
        const shift = Y0 + Math.max(0, (fullH - (bottom - top + GAP + S)) / 2) - top;
        for (const [k, r] of out) out.set(k, { ...r, y: r.y + shift });
        let vx = X0 + Math.max(0, (W - (n * S + GAP * (n - 1))) / 2);
        for (const t of voice) {
            out.set(t.key, { x: vx, y: bottom + shift + GAP, width: S, height: S });
            vx += S + GAP;
        }
    }
    return rounded(out);
}

const fmt = (c: any) => `${Math.round(c?.x)},${Math.round(c?.y)} ${Math.round(c?.width)}x${Math.round(c?.height)}`;

function noteMove(t: Tile, cur: any, now: number) {
    moved++;
    const since = lastWrite.get(t.coords);
    moves.push(`${new Date(now).toISOString().slice(17, 23)} ${t.kind} to ${fmt(cur)}${since ? ` ${now - since}ms after mine` : ""}`);
    if (moves.length > 8) moves.shift();
}

function applyLayout() {
    if (!active || !mine()) return;
    const list = orderedTiles();
    const square = (t: Tile) => !t.streamId || Math.abs((aspects.get(t.streamId)?.value ?? 16 / 9) - aspectOf(t)) < 0.1;
    measureAll(readCoords, (list.find(t => t.kind === "stream" && square(t)) ?? list.find(square))?.coords);
    updateFrame(Dimensions.get("window"));
    noteChrome();
    if (!list.length) {
        if (touched.size) restoreAll();
        return;
    }
    const all = [...list, ...voice];
    const current = new Map<any, any>();
    for (const t of all) {
        const cur = readCoords(t.coords);
        current.set(t.coords, cur);
        if (isCoords(cur) && t.coords && !intended.has(t.coords)) intended.set(t.coords, { ...cur });
    }
    const rects = computeRects(list);
    const now = Date.now();
    const inUse = new Set(all.map(t => t.coords));
    for (const sv of touched) {
        if (inUse.has(sv)) continue;
        const o = intended.get(sv);
        targets.delete(sv);
        if (o) writeCoords(sv, { ...readCoords(sv), zIndex: 0, ...o });
        intended.delete(sv);
        touched.delete(sv);
    }
    for (const t of all) {
        const r = rects.get(t.key);
        if (!r || !t.coords) continue;
        const prev = targets.get(t.coords);
        targets.set(t.coords, r);
        const rs = restSince.get(t.coords);
        if (!rs || !near(rs.r, r)) restSince.set(t.coords, { r, since: now });
        touched.add(t.coords);
        guard(t.coords);
        const cur = current.get(t.coords);
        if (cur && !near(cur, r)) {
            if (prev && near(prev, r)) {
                noteMove(t, cur, now);
                if (isCoords(cur) && !(written.get(t.coords) ?? []).some(w => near(cur, w))) intended.set(t.coords, { ...cur });
                burstUntil = now + 3000;
            }
            write(t.coords, { ...cur, ...r, zIndex: 1 }, r);
        }
    }
}

const safeApply = safe("split layout", applyLayout);

function poll() {
    pollTimer = null;
    if (!active || !mine()) return;
    safeApply();
    pollTimer = setTimeout(poll, Date.now() < burstUntil ? 40 : 150);
}

export function kickTiles() {
    const now = Date.now();
    if (!active || now < burstUntil) return;
    burstUntil = now + 1500;
    setTimeout(safeApply, 30);
}

let applyScheduled = false;
function scheduleApply() {
    if (applyScheduled) return;
    applyScheduled = true;
    setTimeout(() => {
        applyScheduled = false;
        safeApply();
    }, 50);
}

function restoreAll() {
    for (const sv of touched) {
        const o = intended.get(sv);
        targets.delete(sv);
        if (o) writeCoords(sv, { ...readCoords(sv), zIndex: 0, ...o });
        intended.delete(sv);
    }
    touched.clear();
}

let chrome = true;
const chromeListeners = new Set<() => void>();

function setChrome(v: boolean) {
    if (chrome === v) return;
    chrome = v;
    setTimeout(() => chromeListeners.forEach(l => {
        try {
            l();
        } catch { }
    }), 0);
}

const CALL_STORE = "modules/video_calls/native/ChannelCallStore.tsx";
let storeOff: (() => void) | null = null;
let focusVal: boolean | undefined;
let focusAt = 0;
let seenShown: boolean | undefined;
let seenHidden: boolean | undefined;
let mismatch = 0;
let chromeFrom = "measuring";

function callStore(): any {
    const mods: any = (window as any).modules ?? {};
    for (const id of Object.keys(mods)) {
        const m = mods[id];
        if (m?.__filePath !== CALL_STORE) continue;
        const st = m.isInitialized ? m.publicModule?.exports?.useChannelCallStore : undefined;
        return st && typeof st.getState === "function" && typeof st.subscribe === "function" ? st : null;
    }
    return null;
}

const trusted = () => typeof splitViewSettings.focusWhenShown === "boolean";

const onCallStore = safe("split call store", (state: any) => {
    const f = state?.focus;
    if (typeof f !== "boolean" || f === focusVal) return;
    focusVal = f;
    focusAt = Date.now();
    if (trusted()) {
        chromeFrom = "discord";
        setChrome(f === splitViewSettings.focusWhenShown);
    }
});

function fromMeasure(shown: boolean) {
    if (typeof focusVal === "boolean" && Date.now() - focusAt > 800) {
        if (shown) seenShown = focusVal;
        else seenHidden = focusVal;
        if (!trusted() && typeof seenShown === "boolean" && typeof seenHidden === "boolean" && seenShown !== seenHidden) {
            splitViewSettings.focusWhenShown = seenShown;
            mismatch = 0;
        } else if (trusted()) {
            if ((focusVal === splitViewSettings.focusWhenShown) !== shown) {
                if (++mismatch >= 4) {
                    splitViewSettings.focusWhenShown = null;
                    seenShown = seenHidden = undefined;
                    mismatch = 0;
                }
            } else {
                mismatch = 0;
            }
        }
    }
    if (!trusted() || typeof focusVal !== "boolean") {
        chromeFrom = "measuring";
        setChrome(shown);
    }
}

function noteChrome() {
    const tb = measured.toolbar;
    if (!tb || Date.now() - tb.at > 2000) return;
    fromMeasure(tb.y < Dimensions.get("window").height - 4);
}

export const chromeDebug = () => `controls: ${chrome ? "shown" : "hidden"} (from ${chromeFrom}), discord focus ${focusVal ?? "?"}, shown when focus ${splitViewSettings.focusWhenShown ?? "not learned yet"}`;

export const chromeShown = () => chrome;

let watchers = 0;
let watchTimer: ReturnType<typeof setInterval> | null = null;

const checkChrome = safe("split chrome", () => {
    if (!storeOff) {
        const st = callStore();
        if (st) {
            storeOff = st.subscribe(onCallStore);
            onCallStore(st.getState());
        }
    }
    if (active) return;
    if (!hasToolbarRef()) {
        if (toolbarKnown()) fromMeasure(false);
        return;
    }
    measureToolbarNow();
    noteChrome();
});

export function watchChrome(): () => void {
    watchers++;
    if (!watchTimer) watchTimer = setInterval(checkChrome, 300);
    checkChrome();
    return () => {
        watchers = Math.max(0, watchers - 1);
        if (!watchers && watchTimer) {
            clearInterval(watchTimer);
            watchTimer = null;
        }
        if (!watchers && storeOff) {
            try {
                storeOff();
            } catch { }
            storeOff = null;
            focusVal = undefined;
        }
    };
}

export function onChrome(l: () => void) {
    chromeListeners.add(l);
    return () => void chromeListeners.delete(l);
}

export function setTilesActive(v: boolean, handoff = false) {
    active = v;
    if (v) {
        shared.owner = copy;
        burstUntil = Date.now() + 3000;
        if (!pollTimer) poll();
    } else {
        if (pollTimer) clearTimeout(pollTimer);
        pollTimer = null;
        try {
            if (!handoff && mine()) restoreAll();
        } catch (e) {
            caught("split restore", e);
        }
        unguardAll();
    }
}

export function moveTo(from: number, to: number) {
    const order = currentOrder();
    if (from === to || from < 0 || to < 0 || from >= order.length || to >= order.length) return;
    const [kind] = order.splice(from, 1);
    order.splice(to, 0, kind);
    splitViewSettings.order = order;
    safeApply();
}

export function moveKind(kind: TileKind, dir: -1 | 1) {
    const order = currentOrder();
    const i = order.indexOf(kind);
    const j = i + dir;
    if (i === -1 || j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    splitViewSettings.order = order;
    safeApply();
}

export function tilesDebug(): string[] {
    const list = orderedTiles();
    return [
        `copy ${copy} of ${shared.copies}, owner ${shared.owner}, ${hotStatus.source} ${hotStatus.revision.slice(0, 7)}`,
        `window: ${Math.round(Dimensions.get("window").width)}x${Math.round(Dimensions.get("window").height)}, tiles: ${list.length} (registered ${tiles.size}), call videos: ${(callParts() ?? []).filter(p => p.video).map(p => p.streamId ?? "preview").join(",") || "none"}, camera off: ${voice.length}`,
        `mode: ${fullscreen ? "full screen" : "grid"}, ${frame ? `area ${Math.round(frame.origin.x)},${Math.round(frame.origin.y)} (${frame.parent}), controls ${frame.hidden ? "hidden" : "shown"}, fit ${Math.round(frame.top)}-${Math.round(frame.bottom)}` : "area not measured"}${frameNote ? ` (${frameNote})` : ""}${measured.toolbar ? `, toolbar y ${Math.round(measured.toolbar.y)}` : ""}`,
        `held: ${held}, moved: ${moved}, guarded: ${guards.size}, touched: ${touched.size}, grid: ${gridW ? `${Math.round(gridW.w)}/${gridW.ww}` : "?"}`,
        ...(moves.length ? ["last moves:", ...moves.map(m => `  ${m}`)] : []),
        ...(frameLog.length ? ["area changes:", ...frameLog.map(m => `  ${m}`)] : []),
        `order setting: ${currentOrder().join(" > ")}`,
        `video sizes: ${[...videoSizes.entries()].map(([id, s]) => `${id}=${s.w}x${s.h}${aspects.has(id) ? ` (${aspects.get(id)!.value.toFixed(2)}${aspects.get(id)!.pending ? ` -> ${aspects.get(id)!.pending!.toFixed(2)}` : ""})` : ""}`).join(", ") || "none yet"}`,
        ...[...list, ...voice].map(t => {
            const c = readCoords(t.coords);
            const o = intended.get(t.coords);
            return `  ${t.kind} sid=${t.streamId ?? "-"}: ${fmt(c)}${o ? ` (discord ${fmt(o)})` : ""}${guards.has(t.coords) ? "" : " unguarded"}`;
        }),
    ];
}
