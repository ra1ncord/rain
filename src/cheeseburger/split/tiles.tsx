import { hotStatus } from "@api/hot/status";
import { logger } from "@lib/utils/logger";
import { findByStoreName } from "@metro";
import { SelectedChannelStore, UserStore } from "@metro/common/stores";
import { Dimensions, StatusBar } from "react-native";

import { caught, safe } from "../crash";
import { splitRects, VIDEO_FOOTER } from "./geometry";
import { hasTileProbe, hasToolbarRef, measureAll, measured, measureToolbarNow, probeDebug, resetTileMeasurements, toolbarKnown, viewportKey } from "./probe";
import { splitViewSettings } from "./storage";

export type TileKind = "stream" | "them" | "me";

interface Tile {
    key: string;
    kind: TileKind;
    coords: any;
    streamId?: string;
    seenAt: number;
    firstSeen: number;
    onSize?: boolean;
}

interface Rect { x: number; y: number; width: number; height: number; }

interface Aspect { value: number; pending?: number; timer?: ReturnType<typeof setTimeout>; }
interface CoordsSource { coords: any; seenAt: number; outer?: boolean; name?: string; keys?: string; onSize?: boolean; streamId?: string; layout?: string; }

interface Shared {
    tiles: Map<string, Tile>;
    previews: Map<string, Tile>;
    coordsById: Map<string, CoordsSource>;
    coordsCandidates?: Map<string, Map<object, CoordsSource>>;
    videoSizes: Map<string, { w: number; h: number; }>;
    aspects: Map<string, Aspect>;
    intended: WeakMap<object, any>;
    touched: Set<object>;
    copies: number;
    owner: number;
    origins?: Map<string, { x: number; y: number; }>;
    originPolicy?: "native-latch";
    participantOrder?: Map<string, number>;
    tileCandidates?: Map<string, Map<object, Tile>>;
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
const tileCandidates = shared.tileCandidates ??= new Map<string, Map<object, Tile>>();
const coordsCandidates = shared.coordsCandidates ??= new Map<string, Map<object, CoordsSource>>();
for (const [id, source] of coordsById) if (!coordsCandidates.has(id)) coordsCandidates.set(id, new Map([[source.coords, source]]));
for (const [key, tile] of tiles) if (!tileCandidates.has(key)) tileCandidates.set(key, new Map([[tile.coords, tile]]));
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
let layoutWrites = 0;
let targetChanges = 0;

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
    layoutWrites++;
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
    if ((typeof v === "function" && v.__isAnimationDefinition || v && typeof v === "object" && (typeof v.onFrame === "function" || typeof v.onStart === "function")) && intended.has(sv)) {
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
    guardModify(sv);
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
        && isVideoRenderer(props) && props.streamId != null;
}

function kindFromProps(props: any, coords: any): TileKind {
    const id = String(coords?.id ?? props.id ?? "");
    if (id.startsWith("call:") || props.streamKey || props.isStream || props.isCamera === false) return "stream";
    const meId = UserStore?.getCurrentUser?.()?.id;
    if (props.isSelf || (meId && (props.userId === meId || id === meId))) return "me";
    return "them";
}

const onSizeWrapped = new WeakMap<Function, Map<string, Function>>();
const sizeWrappers = new WeakSet<Function>();

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
    if (!Number.isFinite(size.w) || !Number.isFinite(size.h) || size.w <= 0 || size.h <= 0) return;
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

function coordsForId(id: string): CoordsSource | undefined {
    const previous = coordsById.get(id);
    const candidates = coordsCandidates.get(id);
    if (!candidates) return previous;
    for (const [sv, source] of candidates) {
        if (coordsIds.has(sv) && coordsIds.get(sv) !== id || !hasTileProbe(sv) && Date.now() - source.seenAt > 120_000) candidates.delete(sv);
    }
    const mounted = [...candidates.values()].filter(source => hasTileProbe(source.coords));
    const outer = mounted.filter(source => source.outer);
    const available = outer.length ? outer : mounted.length ? mounted : [...candidates.values()];
    const frames = available.filter(source => !source.onSize);
    const pool = frames.length ? frames : available;
    const picked = pool.find(source => source.coords === previous?.coords) ?? pool.sort((a, b) => b.seenAt - a.seenAt)[0];
    if (picked) coordsById.set(id, picked);
    else coordsById.delete(id);
    return picked;
}

function dataShape(value: any, depth: number): string {
    if (value === null) return "null";
    const type = typeof value;
    if (type === "string") return `string:${JSON.stringify(value.slice(0, 64))}`;
    if (type === "number" || type === "boolean" || type === "bigint") return `${type}:${String(value)}`;
    if (type !== "object") return type;
    const kind = Array.isArray(value) ? "array" : "object";
    if (!depth) return kind;
    const fields = Object.entries(Object.getOwnPropertyDescriptors(value)).slice(0, 8).map(([key, descriptor]) => {
        const shape = !Object.prototype.hasOwnProperty.call(descriptor, "value") ? "accessor"
            : /^(?:code|stack|__closure|__initData)$/.test(key) ? "omitted" : dataShape(descriptor.value, depth - 1);
        return `${key.slice(0, 48)}:${shape}`;
    });
    return `${kind}{${fields.join(",")}}`.slice(0, 640);
}

function layoutShape(props: any) {
    const descriptor = Object.getOwnPropertyDescriptor(props, "layout");
    if (!descriptor) return "absent";
    return Object.prototype.hasOwnProperty.call(descriptor, "value") ? dataShape(descriptor.value, 2) : "accessor";
}

function noteCoords(sv: any, props: any, type: any) {
    if (!sv || typeof sv !== "object") return;
    const name = type?.displayName ?? type?.name ?? type?.render?.displayName ?? type?.render?.name ?? (typeof type === "string" ? type : "unnamed");
    const participantId = props.participant?.id ?? props.participantId ?? props.id;
    const outer = !isVideoRenderer(props) && participantId != null && !/Avatar|VideoRenderer|CameraRenderer|VideoSurface|VideoTexture/i.test(name);
    const identity = participantId ?? readCoords(sv)?.id ?? props.userId ?? coordsIds.get(sv);
    const id = typeof identity === "string" || typeof identity === "number" ? String(identity) : "";
    if (!id) return;
    coordsIds.set(sv, id);
    const prev = coordsById.get(id);
    let candidates = coordsCandidates.get(id);
    if (!candidates) coordsCandidates.set(id, candidates = new Map());
    candidates.set(sv, {
        coords: sv,
        seenAt: Date.now(),
        outer: outer || candidates.get(sv)?.outer === true,
        name,
        keys: Object.keys(props).filter(key => !["children", "style"].includes(key)).slice(0, 24).join(","),
        onSize: typeof props.onSize === "function",
        streamId: props.streamId != null ? String(props.streamId) : undefined,
        layout: layoutShape(props),
    });
    const picked = coordsForId(id);
    if (active && prev?.coords !== picked?.coords) scheduleApply();
}

export function registerTile(args: any[]) {
    let props = args[1];
    if (!props || typeof props !== "object") return;
    if (active && props.streamId != null && typeof props.isCamera === "boolean") {
        const mode = props.isCamera ? "cover" : "contain";
        for (const key of ["resizeMode", "objectFit"]) {
            if (props[key] !== "cover" && props[key] !== "contain" || props[key] === mode) continue;
            props = { ...props, [key]: mode };
        }
        args[1] = props;
    }
    if (props.sharedCoords) noteCoords(props.sharedCoords, props, args[0]);

    if (props.streamId != null && typeof props.onSize === "function" && typeof args[0] !== "string") {
        const orig = props.onSize;
        const sid = String(props.streamId);
        let wrappers = onSizeWrapped.get(orig);
        if (!wrappers) onSizeWrapped.set(orig, wrappers = new Map());
        let w = wrappers.get(sid);
        if (!w && !sizeWrappers.has(orig)) {
            w = (...a: any[]) => {
                try {
                    const size = sizeFromArgs(a);
                    if (size && size.w > 0 && size.h > 0) noteSize(sid, size);
                } catch (e) {
                    caught("split video size", e);
                }
                return orig(...a);
            };
            wrappers.set(sid, w);
            sizeWrappers.add(w);
        }
        if (w) {
            props = { ...props, onSize: w };
            args[1] = props;
        }
    }

    if (props.sharedCoords) kickTiles();
    if (!props.sharedCoords || !isVideoRenderer(props) || props.streamId == null) return;

    const current = readCoords(props.sharedCoords);
    const key = `v:${props.streamId}`;
    const existing = tiles.get(key);
    const now = Date.now();
    const tile = {
        key,
        kind: existing?.kind ?? kindFromProps(props, current),
        coords: props.sharedCoords,
        streamId: String(props.streamId),
        seenAt: now,
        firstSeen: existing?.firstSeen ?? now,
        onSize: typeof props.onSize === "function",
    };
    let candidates = tileCandidates.get(key);
    if (!candidates) tileCandidates.set(key, candidates = new Map());
    candidates.set(props.sharedCoords, tile);
    if (!existing || existing.coords === props.sharedCoords || !hasTileProbe(existing.coords)) {
        if (existing && existing.coords !== props.sharedCoords) targets.delete(existing.coords);
        tiles.set(key, tile);
        if (active && existing?.coords !== props.sharedCoords) scheduleApply();
    }
    return args;
}

function tileFor(key: string): Tile | undefined {
    const previous = tiles.get(key);
    const candidates = [...(tileCandidates.get(key)?.values() ?? [])];
    const mounted = candidates.filter(t => hasTileProbe(t.coords));
    const available = mounted.length ? mounted : candidates;
    const frames = available.filter(t => !t.onSize);
    const pool = frames.length ? frames : available;
    const picked = pool.find(t => t.coords === previous?.coords) ?? pool.sort((a, b) => b.seenAt - a.seenAt)[0] ?? previous;
    if (picked && picked !== previous) {
        if (previous) targets.delete(previous.coords);
        tiles.set(key, picked);
    }
    return picked;
}

interface Part { id: string; userId?: string; streamId?: string; kind: TileKind; video: boolean; }

export function hasVideo(p: any): boolean {
    if (p.stream || p.type === 0 || String(p.id ?? "").startsWith("call:")) return true;
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
            const stream = !!p.stream || p.type === 0 || String(p.id).startsWith("call:");
            const userId = p.user?.id ?? (stream ? undefined : p.id);
            return {
                id: String(p.id),
                userId: userId != null ? String(userId) : undefined,
                streamId: p.streamId != null ? String(p.streamId) : undefined,
                kind: stream ? "stream" : userId === meId ? "me" : "them",
                video: hasVideo(p),
            };
        });
    } catch {
        return null;
    }
}

function previewTile(p: Part, used: Set<any>): Tile | undefined {
    let hit = coordsForId(p.id);
    if (!hit || used.has(hit.coords)) {
        hit = undefined;
        for (const [id, e] of coordsById) {
            if (!id.startsWith("call:") || used.has(e.coords)) continue;
            if (!p.userId || !id.includes(p.userId)) continue;
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
const participantOrder = shared.participantOrder ??= new Map<string, number>();

function orderOf(id: string, now: number) {
    const participant = `${String(SelectedChannelStore?.getVoiceChannelId?.() ?? "")}:${id}`;
    if (!participantOrder.has(participant)) {
        participantOrder.set(participant, now + participantOrder.size / 1000);
        if (participantOrder.size > 200) participantOrder.delete(participantOrder.keys().next().value!);
    }
    return participantOrder.get(participant)!;
}

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
        const firstSeen = orderOf(p.id, now);
        const video = p.streamId != null ? tileFor(`v:${p.streamId}`) : undefined;
        const outer = coordsForId(p.id);
        const frame = outer?.outer && hasTileProbe(outer.coords) ? outer : undefined;
        const t = video ?? (frame ? { key: `v:${p.streamId ?? p.id}`, kind: p.kind, coords: frame.coords, streamId: p.streamId, seenAt: frame.seenAt, firstSeen } : undefined);
        if (!t) {
            if (p.kind === "stream") waiting.push(p);
            continue;
        }
        if (video) live.add(t.key);
        t.kind = p.kind;
        t.firstSeen = firstSeen;
        const coords = frame?.coords ?? t.coords;
        if (used.has(coords)) continue;
        used.add(coords);
        out.push(coords === t.coords ? t : { ...t, coords });
    }
    for (const p of waiting) {
        const t = previewTile(p, used);
        if (!t) continue;
        t.firstSeen = orderOf(p.id, now);
        used.add(t.coords);
        out.push(t);
    }
    if (!voiceHidden) {
        for (const p of all ?? []) {
            if (p.video || p.kind === "stream") continue;
            const coords = coordsForId(p.id)?.coords ?? (p.streamId != null ? tiles.get(`v:${p.streamId}`)?.coords : undefined);
            if (!coords || used.has(coords)) continue;
            used.add(coords);
            voice.push({ key: `a:${p.id}`, kind: p.kind, coords, seenAt: now, firstSeen: orderOf(p.id, now) });
        }
    }
    for (const [key, t] of tiles) {
        if (!live.has(key) && now - t.seenAt > 10_000) {
            tiles.delete(key);
            tileCandidates.delete(key);
        }
    }
    for (const [id, e] of coordsById) {
        if (now - e.seenAt > 120_000 && !hasTileProbe(e.coords)) {
            coordsById.delete(id);
            coordsCandidates.delete(id);
        }
    }
    voice.sort((a, b) => a.firstSeen - b.firstSeen || a.key.localeCompare(b.key));
    return out;
}

export const currentOrder = () => [...new Set([...(splitViewSettings.order ?? []), ...DEFAULT_ORDER])] as TileKind[];

function orderedTiles(): Tile[] {
    const order = currentOrder();
    const rank = (k: TileKind) => {
        const i = order.indexOf(k);
        return i === -1 ? 99 : i;
    };
    return liveTiles().sort((a, b) => rank(a.kind) - rank(b.kind) || a.firstSeen - b.firstSeen || (a.key === b.key ? 0 : a.key < b.key ? -1 : 1));
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
    return (t.streamId && aspects.get(t.streamId)?.value) || 16 / 9;
}

interface Frame { origin: { x: number; y: number; }; parent: string; hidden: boolean; top: number; bottom: number; }

let frame: Frame | null = null;
let viewport = "";
let layoutChannel = "";
let pendingOrigin: { x: number; y: number; at: number; since: number; samples: number; coords: Rect; } | null = null;
const origins = shared.origins ??= new Map<string, { x: number; y: number; }>();
if (shared.originPolicy !== "native-latch") origins.clear();
shared.originPolicy = "native-latch";
let lastOriginAt = 0;
let calibrating = true;
let calibrationAt = 0;
let originFrom = "native";
const frameLog: string[] = [];
let frameNote = "";

const statusBar = () => (typeof StatusBar?.currentHeight === "number" ? StatusBar.currentHeight : 24);

function syncViewport() {
    const key = viewportKey();
    const channel = String(SelectedChannelStore?.getVoiceChannelId?.() ?? "");
    if (key === viewport && channel === layoutChannel) return;
    const inherited = !viewport && touched.size ? origins.get(`${channel}|${key}`) : undefined;
    if (!inherited && touched.size) releaseForCalibration();
    viewport = key;
    layoutChannel = channel;
    frame = null;
    origin = inherited ?? null;
    calibrating = !inherited;
    calibrationAt = Date.now();
    originFrom = inherited ? "handoff" : "native";
    pendingOrigin = null;
    lastOriginAt = 0;
    gridW = null;
    resetTileMeasurements();
    frameNote = "screen changed";
}

function updateFrame(win: { width: number; height: number; }) {
    const now = Date.now();
    const land = win.width > win.height;
    const key = `${layoutChannel}|${viewport}`;
    const p = measured.parent;
    if (calibrating && p?.viewport === viewport && p.at >= calibrationAt && p.at !== lastOriginAt && now - p.at < 700 && !targets.has(p.sv) && !touched.has(p.sv) && isCoords(p.coords) && near(readCoords(p.sv) ?? {}, p.coords)) {
        lastOriginAt = p.at;
        const candidate = {
            x: p.x - p.coords.x - (p.coords.width - p.width) / 2,
            y: p.y - p.coords.y - (p.coords.height - p.height) / 2,
        };
        if (Number.isFinite(candidate.x) && Number.isFinite(candidate.y) && Math.abs(candidate.x) < win.width && Math.abs(candidate.y) < win.height) {
            if (!pendingOrigin || !near(p.coords, pendingOrigin.coords) || Math.abs(pendingOrigin.x - candidate.x) > 1.5 || Math.abs(pendingOrigin.y - candidate.y) > 1.5) {
                pendingOrigin = { ...candidate, at: p.at, since: now, samples: 1, coords: { x: p.coords.x, y: p.coords.y, width: p.coords.width, height: p.coords.height } };
            } else if (pendingOrigin.at !== p.at) {
                pendingOrigin.at = p.at;
                pendingOrigin.samples++;
            }
            if (pendingOrigin.samples >= 3 && now - pendingOrigin.since >= 400) {
                origin = { x: Math.round(candidate.x * 2) / 2, y: Math.round(candidate.y * 2) / 2 };
                calibrating = false;
                origins.set(key, origin);
                if (origins.size > 24) origins.delete(origins.keys().next().value!);
                frameLog.push(`${new Date(now).toISOString().slice(17, 23)} native origin latched ${viewport} ${origin.x},${origin.y}`);
                if (frameLog.length > 6) frameLog.shift();
                pendingOrigin = null;
            }
        }
    }
    if (calibrating && now - calibrationAt >= 2000) {
        origin = { x: 12, y: statusBar() + (land ? 8 : 40) };
        calibrating = false;
        originFrom = "fallback";
        origins.set(key, origin);
        if (origins.size > 24) origins.delete(origins.keys().next().value!);
        pendingOrigin = null;
        frameLog.push(`${new Date(now).toISOString().slice(17, 23)} fixed fallback ${viewport} ${origin.x},${origin.y}`);
        if (frameLog.length > 6) frameLog.shift();
    }
    const top = fullscreen ? (land ? 8 : statusBar() + 6) : statusBar() + (land ? 8 : 40);
    const bottom = fullscreen ? win.height - (land ? 8 : 56) : win.height - (land ? 90 : 136);
    frame = { origin: origin ?? { x: 12, y: statusBar() + (land ? 8 : 40) }, parent: calibrating ? "native calibration" : `latched ${originFrom}`, hidden: !chrome, top, bottom: Math.max(top + 1, Math.min(win.height, bottom)) };
    frameNote = calibrating ? `waiting for native geometry${pendingOrigin ? ` (${pendingOrigin.samples}/3)` : ""}` : "fixed bounds and origin";
}
export function setTilesFullscreen(v: boolean) {
    if (fullscreen === v) return;
    fullscreen = v;
    if (active) scheduleApply();
}

function computeRects(list: Tile[]): Map<string, Rect> {
    const win = Dimensions.get("window");
    const inset = fullscreen ? 0 : 12;
    const area = {
        left: inset,
        right: win.width - inset,
        top: frame?.top ?? statusBar() + 40,
        bottom: frame?.bottom ?? win.height - 136,
    };
    gridW = { ww: win.width, w: area.right - area.left };
    return splitRects(list.map(t => ({ key: t.key, aspect: aspectOf(t), footer: t.kind === "me" || splitViewSettings.pipPins === false ? 0 : VIDEO_FOOTER })), voice.map(t => t.key), area, frame?.origin ?? { x: 12, y: area.top }, win.width > win.height, fullscreen);
}
const fmt = (c: any) => `${Math.round(c?.x)},${Math.round(c?.y)} ${Math.round(c?.width)}x${Math.round(c?.height)}`;

function noteMove(t: Tile, cur: any, now: number, target: Rect) {
    moved++;
    const since = lastWrite.get(t.coords);
    moves.push(`${new Date(now).toISOString().slice(17, 23)} ${t.kind} native ${fmt(cur)} vs target ${fmt(target)}${since ? ` ${now - since}ms after mine` : ""}`);
    if (moves.length > 8) moves.shift();
}

function applyLayout() {
    if (!active || !mine()) return;
    syncViewport();
    const list = orderedTiles();
    const probe = list.find(t => t.kind === "stream" && hasTileProbe(t.coords)) ?? list.find(t => hasTileProbe(t.coords));
    measureAll(readCoords, probe?.coords, probe ? aspectOf(probe) : undefined);
    noteChrome();
    updateFrame(Dimensions.get("window"));
    if (!list.length) {
        if (touched.size) restoreAll();
        return;
    }
    if (calibrating) return;
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
        if (!prev || !near(prev, r)) targetChanges++;
        targets.set(t.coords, r);
        touched.add(t.coords);
        guard(t.coords);
        const cur = current.get(t.coords);
        if (cur && !near(cur, r)) {
            if (prev && near(prev, r)) {
                noteMove(t, cur, now, r);
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
    pollTimer = setTimeout(safe("split poll", poll), 150);
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
    setTimeout(safe("split schedule", () => {
        applyScheduled = false;
        safeApply();
    }), 50);
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

function releaseForCalibration() {
    for (const sv of touched) {
        const current = readCoords(sv);
        const target = targets.get(sv);
        const native = intended.get(sv);
        targets.delete(sv);
        if (native && (!target || near(current ?? {}, target))) writeCoords(sv, { ...current, zIndex: 0, ...native });
        intended.delete(sv);
    }
    touched.clear();
    unguardAll();
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
    if (!hasToolbarRef() && toolbarKnown()) {
        fromMeasure(false);
        return;
    }
    const tb = measured.toolbar;
    if (!tb || tb.viewport !== viewportKey() || Date.now() - tb.at > 2000) return;
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
    const wasActive = active;
    active = v;
    if (v) {
        shared.owner = copy;
        if (!wasActive) viewport = "";
        burstUntil = Date.now() + 3000;
        if (!pollTimer) poll();
    } else {
        if (pollTimer) clearTimeout(pollTimer);
        pollTimer = null;
        resetTileMeasurements();
        for (const a of aspects.values()) {
            if (a.timer) clearTimeout(a.timer);
            if (a.pending !== undefined) a.value = a.pending;
            a.pending = a.timer = undefined;
        }
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
        `layout writes: ${layoutWrites}, target changes: ${targetChanges}, native resets: ${moved}`,
        probeDebug(),
        `coordinate sources: ${[...coordsCandidates.entries()].slice(0, 16).map(([id, candidates]) => `${id}=${[...candidates.values()].slice(0, 4).map(source => `${source.outer ? "frame" : "renderer"}:${source.name ?? "unnamed"}${source.streamId ? ` sid${source.streamId}` : ""}${source.onSize ? " size callback" : ""}${hasTileProbe(source.coords) ? " mounted" : ""} ${fmt(readCoords(source.coords))} [${source.keys ?? ""}] layout=${source.layout ?? "unknown"}`).join(" | ")}`).join("; ") || "none"}`,
        `frames: equal 16:9, outer participants ${list.filter(t => [...coordsById.values()].some(source => source.outer && source.coords === t.coords)).length}, avatar sources ${voice.length}`,
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
