import { logger } from "@lib/utils/logger";
import { findByStoreName } from "@metro";
import { SelectedChannelStore, UserStore } from "@metro/common/stores";
import { Dimensions } from "react-native";

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

const tiles = new Map<string, Tile>();
const previews = new Map<string, Tile>();
const coordsIds = new WeakMap<object, string>();
const coordsById = new Map<string, { coords: any; seenAt: number; }>();
const originals = new WeakMap<object, any>();
const targets = new WeakMap<object, Rect>();
const guards = new Map<object, PropertyDescriptor | null>();
const modGuards = new Map<object, PropertyDescriptor | null>();
const videoSizes = new Map<string, { w: number; h: number; }>();
const aspects = new Map<string, Aspect>();

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
const FS_TOP = 36;
const FS_BOTTOM = 136;
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

const near = (a: any, r: Rect) => Math.abs((a.x ?? 0) - r.x) < 0.5 && Math.abs((a.y ?? 0) - r.y) < 0.5
    && Math.abs((a.width ?? 0) - r.width) < 0.5 && Math.abs((a.height ?? 0) - r.height) < 0.5;

function steer(sv: any, v: any) {
    if (!active) return v;
    const r = targets.get(sv);
    if (!r) return v;
    if (v && typeof v === "object" && typeof v.x === "number") {
        if (near(v, r)) return v;
        held++;
        return { ...v, ...r, zIndex: 1 };
    }
    if (typeof v === "function" && v.__isAnimationDefinition && originals.has(sv)) {
        held++;
        return { ...originals.get(sv), ...r, zIndex: 1 };
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
                const r = active ? targets.get(sv) : undefined;
                if (!r) return orig.apply(this, a);
                held++;
                burstUntil = Date.now() + 3000;
                const cur = readCoords(sv);
                if (cur && !near(cur, r)) writeCoords(sv, { ...cur, ...r, zIndex: 1 });
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
    cur.timer = setTimeout(() => {
        if (cur.pending === undefined) return;
        cur.value = cur.pending;
        cur.pending = cur.timer = undefined;
        aspectChanged();
        if (active) scheduleApply();
    }, SETTLE_MS);
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
                const size = sizeFromArgs(a);
                if (size && size.w > 0 && size.h > 0) noteSize(sid, size);
                return orig(...a);
            };
            onSizeWrapped.set(orig, w);
        }
        args[1] = { ...props, onSize: w };
        return args;
    }

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

interface Part { id: string; userId?: string; streamId?: string; kind: TileKind; }

function callParts(): Part[] | null {
    try {
        const channelId = SelectedChannelStore?.getVoiceChannelId?.();
        const store = findByStoreName("ChannelRTCStore");
        const parts: any[] | undefined = channelId ? store?.getParticipants?.(channelId) : undefined;
        if (!Array.isArray(parts)) return null;
        const meId = UserStore?.getCurrentUser?.()?.id;
        return parts.filter(p => p && (p.stream || p.streamId != null)).map(p => {
            const userId = p.user?.id ?? (p.stream ? undefined : p.id);
            return {
                id: String(p.id),
                userId: userId != null ? String(userId) : undefined,
                streamId: p.streamId != null ? String(p.streamId) : undefined,
                kind: p.stream ? "stream" : userId === meId ? "me" : "them",
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

function liveTiles(): Tile[] {
    const parts = callParts();
    const now = Date.now();
    const out: Tile[] = [];
    const used = new Set<any>();

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
    return liveTiles().sort((a, b) => rank(a.kind) - rank(b.kind) || a.firstSeen - b.firstSeen || (a.key < b.key ? -1 : 1));
}

const aspectListeners = new Set<() => void>();

export function onAspectChange(l: () => void) {
    aspectListeners.add(l);
    return () => void aspectListeners.delete(l);
}

const aspectChanged = () => aspectListeners.forEach(l => l());

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
        const o = originals.get(t.coords);
        if (o) w = Math.max(w, (o.x ?? 0) + (o.width ?? 0));
    }
    if (w >= ww - 48 && w <= ww) gridW = { ww, w };
    return gridW?.ww === ww ? gridW.w : Math.max(200, ww - 24);
}

const GRID_TOP = 112;

export function setTilesFullscreen(v: boolean) {
    if (fullscreen === v) return;
    fullscreen = v;
    origin = null;
    if (active) scheduleApply();
}

function computeRects(list: Tile[]): Map<string, Rect> {
    const out = new Map<string, Rect>();
    if (!list.length) return out;

    const win = Dimensions.get("window");
    let W: number, H: number, X0: number, Y0: number, GAP: number;
    if (fullscreen) {
        origin ??= { x: (win.width - gridWidth(list, win.width)) / 2, y: GRID_TOP };
        W = win.width;
        H = Math.max(300, win.height - FS_TOP - FS_BOTTOM);
        X0 = -origin.x;
        Y0 = FS_TOP - origin.y;
        GAP = FS_GAP;
    } else {
        W = gridWidth(list, win.width);
        H = Math.max(300, win.height - 245);
        X0 = 0;
        Y0 = 0;
        GAP = GRID_GAP;
    }
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

    const heightOf = (r: number[]) => (tall(r[0]) ? p : w / asp[r[0]]);
    const used = rows.reduce((s, r) => s + heightOf(r), 0) + gaps;
    let y = Math.max(0, (H - used) / 2);
    for (const r of rows) {
        const h = heightOf(r);
        const widths = r.map(i => h * asp[i]);
        const rowW = widths.reduce((a, b) => a + b, 0) + GAP * (r.length - 1);
        let x = Math.max(0, (W - rowW) / 2);
        r.forEach((i, j) => {
            out.set(list[i].key, { x: Math.round(X0 + x), y: Math.round(Y0 + y), width: Math.round(widths[j]), height: Math.round(h) });
            x += widths[j] + GAP;
        });
        y += h + GAP;
    }
    return out;
}

function applyLayout() {
    if (!active) return;
    const list = orderedTiles();
    const current = new Map<any, any>();
    for (const t of list) {
        const cur = readCoords(t.coords);
        current.set(t.coords, cur);
        if (cur && t.coords && !originals.has(t.coords)) originals.set(t.coords, { ...cur });
    }
    const rects = computeRects(list);
    for (const t of list) {
        const r = rects.get(t.key);
        if (!r || !t.coords) continue;
        const prev = targets.get(t.coords);
        targets.set(t.coords, r);
        guard(t.coords);
        const cur = current.get(t.coords);
        if (cur && !near(cur, r)) {
            if (prev && near(prev, r)) {
                moved++;
                burstUntil = Date.now() + 3000;
            }
            writeCoords(t.coords, { ...cur, ...r, zIndex: 1 });
        }
    }
}

function poll() {
    pollTimer = null;
    if (!active) return;
    applyLayout();
    pollTimer = setTimeout(poll, Date.now() < burstUntil ? 40 : 150);
}

let applyScheduled = false;
function scheduleApply() {
    if (applyScheduled) return;
    applyScheduled = true;
    setTimeout(() => {
        applyScheduled = false;
        applyLayout();
    }, 50);
}

function restoreOriginals() {
    for (const t of [...tiles.values(), ...previews.values()]) {
        const o = t.coords && originals.get(t.coords);
        if (o) writeCoords(t.coords, { ...readCoords(t.coords), ...o });
        if (t.coords) {
            originals.delete(t.coords);
            targets.delete(t.coords);
        }
    }
}

export function setTilesActive(v: boolean) {
    active = v;
    if (v) {
        burstUntil = Date.now() + 3000;
        if (!pollTimer) poll();
    } else {
        if (pollTimer) clearTimeout(pollTimer);
        pollTimer = null;
        restoreOriginals();
        unguardAll();
    }
}

export function moveKind(kind: TileKind, dir: -1 | 1) {
    const order = currentOrder();
    const i = order.indexOf(kind);
    const j = i + dir;
    if (i === -1 || j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    splitViewSettings.order = order;
    applyLayout();
}

export function tilesDebug(): string[] {
    const list = orderedTiles();
    return [
        `window: ${Math.round(Dimensions.get("window").width)}x${Math.round(Dimensions.get("window").height)}, tiles: ${list.length} (registered ${tiles.size}), call videos: ${(callParts() ?? []).map(p => p.streamId ?? "preview").join(",") || "?"}`,
        `mode: ${fullscreen ? `full screen, origin ${origin ? `${Math.round(origin.x)},${Math.round(origin.y)}` : "?"}` : "grid"}`,
        `held: ${held}, moved: ${moved}, guarded: ${guards.size}, grid: ${gridW ? `${gridW.w}/${gridW.ww}` : "?"}`,
        `order setting: ${currentOrder().join(" > ")}`,
        `video sizes: ${[...videoSizes.entries()].map(([id, s]) => `${id}=${s.w}x${s.h}${aspects.has(id) ? ` (${aspects.get(id)!.value.toFixed(2)}${aspects.get(id)!.pending ? ` -> ${aspects.get(id)!.pending!.toFixed(2)}` : ""})` : ""}`).join(", ") || "none yet"}`,
        ...list.map(t => {
            const c = readCoords(t.coords);
            const o = originals.get(t.coords);
            return `  ${t.kind} sid=${t.streamId ?? "-"}: x=${Math.round(c?.x)} y=${Math.round(c?.y)} w=${Math.round(c?.width)} h=${Math.round(c?.height)}${o ? ` (was ${Math.round(o.x)},${Math.round(o.y)} ${Math.round(o.width)}x${Math.round(o.height)})` : ""}`;
        }),
    ];
}
