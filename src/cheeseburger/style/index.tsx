import { findAsset } from "@api/assets";
import { before, instead } from "@api/patcher";
import { jsxRuntime } from "@api/react/jsx";
import { waitForHydration } from "@api/storage";
import { React } from "@metro/common";
import { Image, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { caught, safe } from "../crash";
import { noteCallIcon } from "../look";
import { accentColor, baseColor, parseColor, RGBA, toHex, withAlpha } from "./colors";
import { Cut, Notches } from "./shapes";
import { styleSettings, useStyleSettings } from "./storage";

export { Notches } from "./shapes";

type Kind = "overlay" | "solid";

const unpatches: (() => unknown)[] = [];
const scoped = new Set<string>();
const callNames = new Set<string>();
const failed: string[] = [];
const labels: string[] = [];
const callStack: string[] = [];
const samples: string[] = [];
const seen = new Map<string, string>();
const wrappedTypes = new Map<string, WeakMap<object, any>>();
const assetNames = new Map<number, string>();
let depth = 0;
let callsFound = false;
let lastScan = 0;
let scanTimer: ReturnType<typeof setTimeout> | null = null;
let bevelled = 0;
let cut = 0;

const MAX_LEVEL = 3;
const SKIP = /Text|Image|Icon|Svg|Lottie|Avatar|Spinner|Badge|Rive|Portal|Tooltip|Touchable|Gesture|List|Scroll|Input|Modal|Sheet/i;
const BOXES = /^(?:View|RCTView|Pressable\w*|\w*Pressable|AnimatedComponent|AnimatedView|AnimatedPressable\w*)$|^Animated(?:Component)?\((?:View|Pressable\w*)\)$/;
const FORWARD_REF = Symbol.for("react.forward_ref");
const MEMO = Symbol.for("react.memo");

const OVERLAY_ICON = /^(?:X|Close|Dismiss|CircleX)(?:Small|Medium|Large)?Icon$|^(?:Maximize|Minimize|Fullscreen|FullScreen|ArrowsExpand|ArrowsCollapse|ArrowsMaximize|ArrowsMinimize|ArrowsOut|ArrowsIn|Expand|Collapse|Enlarge|Shrink|PopOut|Popout)\w*Icon$|^ic_(?:close|x_|clear|fullscreen|full_screen|maximi|minimi|expand|collapse)/i;
const OVERLAY_LABEL = /^(?:close|dismiss|hide|stop (?:watching|viewing|stream)|leave stream|close stream|full ?screen|enter full ?screen|exit full ?screen|maximi[sz]e|minimi[sz]e|expand|collapse|enlarge|focus|unfocus|pop ?out)\b/i;

let core: Set<any> | null = null;
const isCore = (t: any) => (core ??= new Set([View, Pressable, Text, Image, ScrollView, TouchableOpacity].filter(Boolean))).has(t);

const nameOf = (t: any): string => {
    try {
        return t?.displayName ?? t?.name ?? t?.render?.displayName ?? t?.render?.name ?? t?.type?.displayName ?? t?.type?.name ?? "";
    } catch {
        return "";
    }
};

const num = (v: any) => (typeof v === "number" ? v : 0);

function clear(c: any) {
    if (c == null) return true;
    if (typeof c === "object") return false;
    const p = parseColor(c);
    if (p) return p.a <= 0.01;
    return typeof c !== "string" || c.trim().toLowerCase() === "transparent";
}

function resolveStyle(style: any): any {
    const out: any = {};
    const walk = (s: any) => {
        if (!s) return;
        if (Array.isArray(s)) return void s.forEach(walk);
        if (typeof s === "number") {
            try {
                Object.assign(out, StyleSheet.flatten(s));
            } catch { }
            return;
        }
        if (typeof s !== "object") return;
        if (s.initial && s.viewDescriptors) return void walk(s.initial.value);
        Object.assign(out, s);
    };
    walk(style);
    return out;
}

function animatedBg(style: any): boolean {
    let found = false;
    const walk = (s: any) => {
        if (!s || found) return;
        if (Array.isArray(s)) return void s.forEach(walk);
        if (typeof s !== "object") return;
        if (s.initial && s.viewDescriptors) {
            if (s.initial.value && "backgroundColor" in s.initial.value) found = true;
            return;
        }
        if (s.backgroundColor && typeof s.backgroundColor === "object") found = true;
    };
    walk(style);
    return found;
}

function styleOf(props: any) {
    let style = props?.style;
    if (typeof style === "function") {
        try {
            style = style({ pressed: false, hovered: false, focused: false });
        } catch {
            return null;
        }
    }
    try {
        return resolveStyle(style);
    } catch {
        return null;
    }
}

const radiusOf = (f: any) => Math.max(num(f.borderRadius), num(f.borderTopLeftRadius), num(f.borderBottomRightRadius));

function roundBox(flat: any, maxSide = Infinity): boolean {
    if (!flat || clear(flat.backgroundColor)) return false;
    const r = radiusOf(flat);
    if (r < 4 || r >= 999) return false;
    const { width: w, height: h } = flat;
    if (typeof w === "number" && typeof h === "number") {
        if (r >= Math.min(w, h) / 2 - 0.5) return false;
        if (Math.max(w, h) > maxSide) return false;
    }
    return true;
}

function boxStyle(type: any, props: any): any {
    if (typeof type === "string" || !type || SKIP.test(nameOf(type))) return null;
    const flat = styleOf(props);
    return roundBox(flat) ? flat : null;
}

const SQUARE = { borderTopLeftRadius: 0, borderBottomRightRadius: 0, borderTopRightRadius: 4, borderBottomLeftRadius: 4 };

const MARK = "__cheeseburgerBevel";

const WRAP = "cheeseburger-cut";

function isBevelled(props: any): boolean {
    const ch = props?.children;
    if (typeof ch === "function") return !!ch[MARK];
    if (ch && typeof ch === "object" && !Array.isArray(ch)) return ch.key === WRAP;
    if (!Array.isArray(ch) || ch.length !== 2) return false;
    return ch[1]?.type === Notches;
}

const wrapCut = (cutEl: any, ch: any) => (
    <React.Fragment key={WRAP}>
        {cutEl}
        <React.Fragment key="c">{ch}</React.Fragment>
    </React.Fragment>
);

function markFn<F extends Function>(f: F): F {
    try {
        (f as any)[MARK] = true;
    } catch { }
    return f;
}

function bevel(props: any, size: number, color: string) {
    const notches = <Notches key="cheeseburger-bevel" size={size} color={color} />;
    const ch = props.children;
    const children = typeof ch === "function"
        ? markFn((s: any) => [<React.Fragment key="c">{ch(s)}</React.Fragment>, notches])
        : [<React.Fragment key="c">{ch}</React.Fragment>, notches];
    if (!styleSettings.squareCorners) return { ...props, children };
    const st = props.style;
    const style = typeof st === "function" ? (s: any) => [st(s), SQUARE] : [st, SQUARE];
    return { ...props, style, children };
}

function notchSize(flat: any) {
    const r = radiusOf(flat);
    return Math.max(4, styleSettings.squareCorners ? num(styleSettings.bevelSize) || 8 : Math.max(num(styleSettings.bevelSize) || 8, Math.min(r, 18)));
}

function cutSize(flat: any) {
    const base = Math.max(3, Math.min(24, num(styleSettings.bevelSize) || 8));
    const { width: w, height: h } = flat;
    if (typeof w === "number" && typeof h === "number") return Math.max(3, Math.min(base, Math.round(Math.min(w, h) * 0.26)));
    return base;
}

const hex = (c: unknown) => {
    const p = parseColor(c);
    return p ? toHex(p) : String(c);
};

function fillFor(kind: Kind, flat: any, pressed = false): string {
    if (kind === "overlay") return withAlpha(accentColor("#ff0048"), pressed ? 0.62 : 0.45);
    return hex(flat.backgroundColor);
}

function cutProps(props: any, flat: any, kind: Kind) {
    const size = cutSize(flat);
    const corner = styleSettings.squareCorners ? 4 : Math.min(radiusOf(flat), 12);
    const clearStyle = { backgroundColor: "transparent", borderTopLeftRadius: 0, borderBottomRightRadius: 0, borderTopRightRadius: corner, borderBottomLeftRadius: corner };
    const st = props.style;
    const ch = props.children;
    if (typeof ch === "function") {
        const children = markFn((state: any) => {
            let f = flat;
            let pressed = false;
            if (typeof st === "function") {
                try {
                    f = resolveStyle(st(state)) ?? flat;
                    pressed = !!state?.pressed;
                } catch { }
            }
            return wrapCut(<Cut key="cut" size={size} radius={corner} color={fillFor(kind, clear(f.backgroundColor) ? flat : f, pressed)} />, ch(state));
        });
        const style = typeof st === "function" ? (state: any) => [st(state), clearStyle] : [st, clearStyle];
        return { ...props, style, children };
    }
    const style = typeof st === "function" ? (state: any) => [st(state), clearStyle] : [st, clearStyle];
    return { ...props, style, children: wrapCut(<Cut key="cut" size={size} radius={corner} color={fillFor(kind, flat)} />, ch) };
}

function assetName(id: number): string {
    let n = assetNames.get(id);
    if (n === undefined) {
        try {
            n = findAsset(id)?.name ?? "";
        } catch {
            n = "";
        }
        assetNames.set(id, n);
    }
    return n;
}

interface Scan { found: boolean; name: string; text: boolean; }
interface TypeInfo { name: string; text: boolean; icon: boolean; box: boolean; }

const typeInfos = new WeakMap<object, TypeInfo>();
const stringInfos = new Map<string, TypeInfo>();

function infoOf(t: any): TypeInfo {
    const obj = t && (typeof t === "object" || typeof t === "function");
    const hit = obj ? typeInfos.get(t) : typeof t === "string" ? stringInfos.get(t) : undefined;
    if (hit) return hit;
    const name = typeof t === "string" ? t : typeof t === "symbol" ? "" : nameOf(t);
    const info: TypeInfo = {
        name,
        text: /Text/i.test(name),
        icon: typeof t !== "string" && /Icon$/.test(name) && !/^Image/i.test(name),
        box: !!name && BOXES.test(name) && !SKIP.test(name),
    };
    if (obj) typeInfos.set(t, info);
    else if (typeof t === "string" && stringInfos.size < 200) stringInfos.set(t, info);
    return info;
}

function scanChildren(ch: any, level: number, out: Scan) {
    if (ch == null || typeof ch === "boolean" || out.text) return;
    if (typeof ch === "string" || typeof ch === "number") {
        if (String(ch).trim()) out.text = true;
        return;
    }
    if (Array.isArray(ch)) {
        if (ch.length > 5) {
            out.text = true;
            return;
        }
        for (const c of ch) scanChildren(c, level, out);
        return;
    }
    if (typeof ch !== "object" || !("type" in ch)) return;
    const t = ch.type;
    if (t === Cut || t === Notches) return;
    const p = ch.props ?? {};
    const info = infoOf(t);
    if (info.text) {
        out.text = true;
        return;
    }
    if (info.icon) {
        out.found = true;
        out.name ||= info.name;
        return;
    }
    if (typeof p.source === "number") {
        out.found = true;
        out.name ||= assetName(p.source) || "image";
        return;
    }
    if (level > 0 && p.children != null && typeof p.children !== "function") scanChildren(p.children, level - 1, out);
}

function iconOnly(children: any): Scan {
    const scan: Scan = { found: false, name: "", text: false };
    if (children == null || typeof children === "function") {
        scan.text = true;
        return scan;
    }
    scanChildren(children, 1, scan);
    return scan;
}

function buttonish(flat: any) {
    return !(num(flat.flex) > 0 || num(flat.flexGrow) > 0 || typeof flat.width === "string" || typeof flat.height === "string");
}

const accentLike = (c: RGBA | null) => !!c && c.a >= 0.85 && Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b) >= 90 && Math.max(c.r, c.g, c.b) >= 150;
const seeThrough = (c: RGBA | null) => !!c && c.a >= 0.12 && c.a <= 0.92;

function decide(flat: any, animated: boolean, overlayHint: boolean): { kind: Kind | null; why: string; } {
    const c = parseColor(flat.backgroundColor);
    const bordered = num(flat.borderWidth) > 0 && !clear(flat.borderColor);
    if (overlayHint && (seeThrough(c) || (animated && !accentLike(c)))) return { kind: "overlay", why: "overlay" };
    if (accentLike(c)) return { kind: "solid", why: bordered ? "solid, has border" : "solid" };
    return { kind: null, why: overlayHint ? "overlay icon on solid bg" : "not accent" };
}

function remember(label: string, icon: string, flat: any, result: string) {
    const key = `${label}|${icon}|${hex(flat?.backgroundColor)}`;
    if (!seen.has(key) && seen.size >= 40) return;
    const w = typeof flat?.width === "number" ? ` ${Math.round(flat.width)}x${Math.round(num(flat.height))}` : "";
    seen.set(key, `${label ? `"${label.slice(0, 40)}" ` : ""}${icon || "icon"} bg=${hex(flat?.backgroundColor).slice(0, 12)} r=${radiusOf(flat ?? {})}${w} → ${result}`);
}

function apply(props: any, flat: any, kind: Kind) {
    if (animatedBg(props.style) || (num(flat.borderWidth) > 0 && !clear(flat.borderColor))) {
        const color = baseColor();
        if (!color) return null;
        bevelled++;
        return { props: bevel(props, notchSize(flat), color), how: "notches" };
    }
    cut++;
    return { props: cutProps(props, flat, kind), how: kind === "overlay" ? "red cut" : "cut" };
}

function clone(el: any, props: any) {
    try {
        return React.cloneElement(el, props);
    } catch {
        return el;
    }
}

const boxType = (t: any) => infoOf(t).box;

function target(type: any, props: any, overlayHint: boolean, label: string, icon: string): any {
    const self = boxType(type) ? styleOf(props) : null;
    if (self && roundBox(self, 72) && buttonish(self) && !isBevelled(props)) {
        const d = decide(self, animatedBg(props.style), overlayHint);
        if (!d.kind) {
            remember(label, icon, self, d.why);
            return null;
        }
        const done = apply(props, self, d.kind);
        remember(label, icon, self, done ? done.how : "no theme color");
        return done?.props ?? null;
    }
    const ch = props.children;
    if (ch == null || typeof ch === "function") return null;
    const list = Array.isArray(ch) ? ch : [ch];
    if (list.length > 4) return null;
    for (let i = 0; i < list.length; i++) {
        const c = list[i];
        if (!c || typeof c !== "object" || !("props" in c) || !boxType(c.type)) continue;
        if (isBevelled(c.props)) return null;
        const f = styleOf(c.props);
        if (!roundBox(f, 72) || !buttonish(f)) continue;
        const inner = iconOnly(c.props.children);
        if (!inner.found || inner.text) continue;
        const d = decide(f, animatedBg(c.props.style), overlayHint);
        if (!d.kind) {
            remember(label, icon, f, d.why);
            return null;
        }
        const done = apply(c.props, f, d.kind);
        remember(label, icon, f, done ? done.how : "no theme color");
        if (!done) return null;
        const next = clone(c, done.props);
        const children = Array.isArray(ch) ? list.map((x, j) => (j === i ? next : x)) : next;
        return { ...props, children };
    }
    return null;
}

function describe(type: any, props: any) {
    const f = props && typeof props === "object" && props.style ? styleOf(props) : null;
    const bg = f ? (typeof f.backgroundColor === "object" && f.backgroundColor ? "animated" : f.backgroundColor ?? "-") : "-";
    return `${nameOf(type) || (typeof type === "string" ? type : typeof type)}${f ? ` bg=${String(bg).slice(0, 12)} r=${radiusOf(f)}` : ""}`;
}

function captureCallIcon(type: any, props: any) {
    const who = callStack[callStack.length - 1];
    if (!who) return;
    if (typeof type !== "string" && /Icon$/.test(nameOf(type))) {
        const f = props.style ? styleOf(props) : null;
        noteCallIcon(who, typeof props.color === "string" ? props.color : f?.tintColor ?? f?.color, typeof props.size === "number" ? props.size : f?.width);
    } else if (typeof props.source === "number") {
        const f = styleOf(props);
        if (f?.tintColor) noteCallIcon(who, f.tintColor, f.width);
    }
}

function inScope(args: any[], type: any, props: any): boolean {
    if (callStack.length) captureCallIcon(type, props);
    const flat = boxStyle(type, props);
    if (samples.length < 40 && props.style) samples.push(`${labels[labels.length - 1] ?? "?"} > ${describe(type, props)}${flat ? " ✓" : ""}`);
    if (!flat || isBevelled(props)) return false;
    const color = baseColor();
    if (!color) return false;
    bevelled++;
    args[1] = bevel(props, notchSize(flat), color);
    return true;
}

function onJsx(args: any[]) {
    const type = args[0];
    if (!callsFound && typeof type === "function" && type.name === "VideoButton") scheduleScan();
    const props = args[1];
    if (!props || typeof props !== "object") return;
    if (depth > 0 && inScope(args, type, props)) return args;
    if (typeof type === "string" || props.children == null || typeof props.children !== "object") return;
    const scan = iconOnly(props.children);
    if (!scan.found || scan.text) return;
    const label = typeof props.accessibilityLabel === "string" ? props.accessibilityLabel : "";
    const overlayHint = OVERLAY_ICON.test(scan.name) || OVERLAY_LABEL.test(label);
    const next = target(type, props, overlayHint, label, scan.name);
    if (!next) return;
    args[1] = next;
    return args;
}

function run(label: string, level: number, orig: Function, self: any, args: any[], inCall: string | null = null) {
    depth++;
    labels.push(label);
    const call = inCall ?? (callNames.has(label) ? label : null);
    if (call) callStack.push(call);
    try {
        return deepen(orig.apply(self, args), level, call);
    } finally {
        if (call) callStack.pop();
        labels.pop();
        depth--;
    }
}

function wrapType(t: any, level: number, call: string | null): any {
    const key = `${level}|${call ?? ""}`;
    let cache = wrappedTypes.get(key);
    if (!cache) wrappedTypes.set(key, cache = new WeakMap());
    const cached = cache.get(t);
    if (cached) return cached;
    const name = nameOf(t);
    let w: any = null;
    if (typeof t === "function") {
        if (t.prototype?.isReactComponent) return null;
        w = function (this: any, ...a: any[]) {
            return run(name, level, t, this, a, call);
        };
        try {
            Object.defineProperty(w, "name", { value: name });
        } catch { }
        if (t.defaultProps) w.defaultProps = t.defaultProps;
    } else if (t?.$$typeof === FORWARD_REF && typeof t.render === "function") {
        const render = t.render;
        w = React.forwardRef((props: any, ref: any) => run(name, level, render, undefined, [props, ref], call));
        if (t.defaultProps) w.defaultProps = t.defaultProps;
    } else if (t?.$$typeof === MEMO && t.type) {
        const inner = wrapType(t.type, level, call);
        if (inner) w = React.memo(inner, t.compare);
    }
    if (!w) return null;
    w.displayName = t.displayName ?? name;
    cache.set(t, w);
    return w;
}

function deepen(el: any, level: number, call: string | null): any {
    try {
        if (level >= MAX_LEVEL || !el || typeof el !== "object" || Array.isArray(el) || !("$$typeof" in el)) return el;
        const t = el.type;
        if (!t || typeof t === "string" || typeof t === "symbol" || isCore(t) || SKIP.test(nameOf(t))) return el;
        const w = wrapType(t, level + 1, call);
        return w ? { ...el, type: w } : el;
    } catch (e) {
        caught("style deepen", e);
        return el;
    }
}

function scope(exp: any, key: string, label: string, call: boolean) {
    const name = label.replace(/^.*#/, "");
    if (call) callNames.add(name === "default" ? nameOf(exp[key]) || label : name);
    if (scoped.has(label)) return;
    scoped.add(label);
    try {
        unpatches.push(instead(key, exp, function (this: any, args: any[], orig: Function) {
            return run(name === "default" ? nameOf(exp[key]) || label : name, 0, orig, this, args);
        }));
    } catch {
        failed.push(label);
    }
}

function eachModule(fn: (path: string, exp: any) => void) {
    const mods: any = (window as any).modules ?? {};
    for (const id of Object.keys(mods)) {
        const m = mods[id];
        if (!m?.isInitialized) continue;
        const exp = m.publicModule?.exports;
        if (!exp || (typeof exp !== "object" && typeof exp !== "function")) continue;
        try {
            fn(String(m.__filePath ?? id), exp);
        } catch { }
    }
}

const isButton = (v: any) => typeof v === "function" && /Button$/.test(v.name ?? "");

function scan() {
    lastScan = Date.now();
    let videoPath: string | null = null;
    eachModule((path, exp) => {
        const keys = Object.keys(exp);
        if (keys.length === 1 && (keys[0] === "Button" || keys[0] === "IconButton") && typeof exp[keys[0]] === "function") {
            scope(exp, keys[0], `${path}#${keys[0]}`, false);
        }
        if (exp.default?.name === "VideoButton" || typeof exp.VideoButton === "function") videoPath = path;
    });
    if (!videoPath) return;
    callsFound = true;
    const dir = (videoPath as string).slice(0, (videoPath as string).lastIndexOf("/") + 1);
    const parent = dir.slice(0, dir.slice(0, -1).lastIndexOf("/") + 1) || dir;
    eachModule((path, exp) => {
        if (!path.startsWith(parent)) return;
        for (const key of Object.keys(exp)) {
            let v: any;
            try {
                v = exp[key];
            } catch {
                continue;
            }
            if (isButton(v)) scope(exp, key, `${path}#${key}`, true);
        }
    });
}

function scheduleScan() {
    if (scanTimer || Date.now() - lastScan < 3000) return;
    scanTimer = setTimeout(safe("style scan", () => {
        scanTimer = null;
        scan();
    }), 0);
}

export function styleDebug(): string[] {
    return [
        `bevel color: ${baseColor() ?? "none (no theme)"}, size ${styleSettings.bevelSize}, square ${styleSettings.squareCorners}, red ${withAlpha(accentColor("#ff0048"), 0.45)}`,
        `button types: ${scoped.size}${failed.length ? `, failed ${failed.length}` : ""}, call buttons ${callsFound ? "found" : "not yet"}, bevelled ${bevelled}, cut ${cut}`,
        ...[...scoped].slice(0, 30).map(s => `  ${s.replace(/^.*\/(?=[^/]+#)/, "")}`),
        "icon buttons seen:",
        ...(seen.size ? [...seen.values()].map(s => `  ${s}`) : ["  nothing yet"]),
        "inside buttons:",
        ...(samples.length ? samples.map(s => `  ${s}`) : ["  nothing yet"]),
    ];
}

export default {
    async start() {
        await waitForHydration(useStyleSettings);
        const hook = safe("style jsx", onJsx);
        unpatches.push(before("jsx", jsxRuntime, hook));
        unpatches.push(before("jsxs", jsxRuntime, hook));
        safe("style scan", scan)();
    },
    stop() {
        for (const u of unpatches.splice(0)) u();
        scoped.clear();
        callNames.clear();
        failed.length = 0;
        samples.length = 0;
        labels.length = 0;
        callStack.length = 0;
        seen.clear();
        wrappedTypes.clear();
        callsFound = false;
        depth = 0;
        if (scanTimer) clearTimeout(scanTimer);
        scanTimer = null;
    },
};
