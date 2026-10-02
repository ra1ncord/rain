import { findAsset } from "@api/assets";
import { after } from "@api/patcher";
import { findByProps } from "@metro";
import { React } from "@metro/common";
import { Animated as RNAnimated, Image, Pressable, StyleSheet, View } from "react-native";

import { caught, safe } from "../crash";
import { accentColor } from "../style/colors";
import { isPipRender, mineParticipant, onPinChange, participantForPin, pinnedPip, pinPip } from "./pip";
import { useSplitViewSettings } from "./storage";
import { chromeShown, noteControls, noteSafeArea, onChrome, safeAreaNote } from "./tiles";

const ICONS = ["PinIcon", "PictureInPictureIcon", "PipIcon", "ic_pip"];
const MARK = "__cheeseburgerNativePin";
const CONFIG = "__cheeseburgerPinConfig";
const MARKER = "cheeseburger-pin-marker";
const INLINE = "cheeseburger-inline-pin";
const FOCUS = /^(?:un)?focus\s/i;
const MOTION = /^(?:opacity|transform)$/;
const LAYOUTISH = /^(?:width|height|top|left|right|bottom|x|y|position|flex|aspectRatio|margin|padding|min|max)/i;
const FILL = { position: "absolute", left: 0, top: 0, right: 0, bottom: 0 } as const;
const HIDDEN = { ...FILL, opacity: 0 } as const;
const RELATIVE = { position: "relative", top: undefined, left: undefined, right: undefined, bottom: undefined, margin: 0, marginTop: 0, marginLeft: 0, marginRight: 0, marginBottom: 0, marginHorizontal: 0, marginVertical: 0 } as const;

interface Level { name: string; handles: any[]; motion: any; entering?: any; exiting?: any; pointerEvents?: string; moving: string; }
interface Box { x: number; y: number; width: number; height: number; }
interface Template { type: any; props: any; }
interface MarkerRec { size?: { width: number; height: number; }; button: any; node: any; fiber: any; chain: any[]; outer: number; template: Template | null; rect?: Box & { at: number; }; sig: string; }
interface Inset { right: number; bottom: number; from: string; }
interface PinConfig { label: string; onPress: () => void; source: number; tint?: string; }
interface InlineRec { pid: string | null; mine: boolean; placed: boolean; why: string; }

const iconWrappers = new WeakMap<object, any>();
const markers = new Set<MarkerRec>();
const listeners = new Set<() => void>();
const owners = new Map<string, object>();
const insets = new Map<string, Inset>();
const seenButtons: string[] = [];
const seenSizes: string[] = [];
const inlines = new Map<string, InlineRec>();
let latest: MarkerRec | null = null;
let active = false;
let icon: number | null | undefined;
let iconRetryAt = 0;
let reanimated: any;
let injected = 0;
let markersEver = 0;
let fibersFound = 0;
let fibersMissing = 0;
let hosts = 0;
let cloneRenders = 0;
let fallbackRenders = 0;
let cloneErrors = 0;
let matchedByTree = 0;
let matchedByBox = 0;
let inlineMounts = 0;
let inlineRenders = 0;
const inlineNotes: string[] = [];
let lastSeen: string[] = [];
export let pinIconName = "";

const nameOf = (type: any): string => typeof type === "string" ? type : type?.displayName ?? type?.name ?? type?.render?.displayName ?? type?.render?.name ?? type?.type?.displayName ?? type?.type?.name ?? "";

function notifyNow() {
    listeners.forEach(l => {
        try {
            l();
        } catch (e) {
            caught("pip pin listener", e);
        }
    });
    noteControls(markers.size > 0);
}

function animatedView(): any {
    if (reanimated !== undefined) return reanimated;
    reanimated = null;
    try {
        const m = findByProps("useAnimatedStyle", "withTiming");
        reanimated = m?.default?.View ?? m?.View ?? (typeof m?.createAnimatedComponent === "function" ? m.createAnimatedComponent(View) : null);
    } catch (e) {
        caught("pip pin animated", e);
    }
    return reanimated;
}

function pinIcon(): number | null {
    if (icon != null || Date.now() < iconRetryAt) return icon ?? null;
    icon = null;
    iconRetryAt = Date.now() + 2000;
    for (const name of ICONS) {
        const asset = findAsset(name);
        if (asset?.name === name && typeof asset.id === "number" && Number.isFinite(asset.id) && asset.id > 0) {
            icon = asset.id;
            pinIconName = name;
            break;
        }
    }
    return icon;
}

class Guard extends React.Component<{ children?: any; fallback?: any; }, { failed: boolean; }> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(e: any) {
        cloneErrors++;
        caught("pip pin", e);
    }

    render() {
        return this.state.failed ? this.props.fallback ?? null : this.props.children;
    }
}

function flat(style: any): any {
    const out: any = {};
    const walk = (value: any) => {
        if (Array.isArray(value)) return value.forEach(walk);
        if (typeof value === "function") return walk(value({ pressed: false, hovered: false, focused: false }));
        if (value?.initial?.value && value.viewDescriptors) return walk(value.initial.value);
        if (value && typeof value === "object") Object.assign(out, StyleSheet.flatten(value));
    };
    try {
        walk(style);
    } catch { }
    return out;
}

function placement(style: any): string {
    const f = flat(style);
    const out: any = {};
    for (const key of ["position", "top", "right", "bottom", "left", "width", "height", "padding", "flexDirection", "justifyContent", "alignItems"]) {
        if (f[key] !== undefined && typeof f[key] !== "object") out[key] = f[key];
    }
    return JSON.stringify(out).slice(0, 160);
}

const isNode = (v: any) => !!v && typeof v === "object" && typeof v.__getValue === "function";

function levelOf(type: any, props: any): Level {
    const handles: any[] = [];
    const moving: string[] = [];
    let motion: any = null;
    const walk = (s: any) => {
        if (!s || typeof s !== "object") return;
        if (Array.isArray(s)) return s.forEach(walk);
        if (s.viewDescriptors && s.initial) {
            const keys = Object.keys(s.initial.value ?? {});
            moving.push(...keys);
            if (keys.length && keys.every(k => MOTION.test(k))) handles.push(s);
            return;
        }
        if (isNode(s.opacity)) (motion ??= {}).opacity = s.opacity;
        if (Array.isArray(s.transform) && s.transform.some((t: any) => t && Object.values(t).some(isNode))) (motion ??= {}).transform = s.transform;
    };
    if (typeof props?.style !== "function") walk(props?.style);
    return {
        name: nameOf(type) || "anonymous",
        handles,
        motion,
        entering: props?.entering,
        exiting: props?.exiting,
        pointerEvents: typeof props?.pointerEvents === "string" ? props.pointerEvents : undefined,
        moving: [...new Set(moving.filter(k => !LAYOUTISH.test(k) || MOTION.test(k)))].join(" ") + (moving.some(k => LAYOUTISH.test(k)) ? " +layout" : ""),
    };
}

const animatedLevel = (l: Level) => l.handles.length > 0 || !!l.motion || l.entering != null || l.exiting != null;

const isFiber = (f: any) => !!f && typeof f === "object" && "return" in f && "memoizedProps" in f && "tag" in f;

function fiberOf(inst: any): any {
    if (!inst || typeof inst !== "object") return null;
    try {
        for (const key of ["__internalInstanceHandle", "_internalInstanceHandle", "_internalFiberInstanceHandleDEV"]) if (isFiber(inst[key])) return inst[key];
        for (const sym of Object.getOwnPropertySymbols(inst)) if (isFiber(inst[sym])) return inst[sym];
        for (const key of Object.keys(inst)) if (/internal|fiber|handle/i.test(key) && isFiber(inst[key])) return inst[key];
        if (isFiber(inst.canonical?.internalInstanceHandle)) return inst.canonical.internalInstanceHandle;
    } catch { }
    return null;
}

const same = (a: any, b: any) => a === b || !!a && !!b && a.alternate === b;
const focusLabel = (props: any) => typeof props?.accessibilityLabel === "string" && FOCUS.test(props.accessibilityLabel);

function withoutMarker(props: any): any {
    const ch = props?.children;
    if (!Array.isArray(ch) || !ch.some((c: any) => c?.key === MARKER)) return props;
    const rest = ch.filter((c: any) => c?.key !== MARKER);
    return { ...props, children: rest.length === 1 ? rest[0] : rest };
}

function noteButton(line: string) {
    if (seenButtons.includes(line)) return;
    seenButtons.push(line);
    if (seenButtons.length > 6) seenButtons.shift();
}

function inspect(rec: MarkerRec) {
    const chain: any[] = [];
    let outer = -1;
    for (let f = rec.fiber?.return, i = 0; f && i < 80; f = f.return, i++) {
        const props = f.memoizedProps;
        if (props && typeof props === "object" && props.sharedCoords != null) break;
        chain.push(f);
        if (focusLabel(props)) outer = chain.length - 1;
    }
    rec.chain = chain;
    rec.outer = outer;
    if (outer >= 0) {
        const f = chain[outer];
        rec.template = { type: f.elementType ?? f.type, props: withoutMarker(f.memoizedProps) };
    } else if (rec.button) {
        rec.template = { type: rec.button.type, props: withoutMarker(rec.button.props) };
    } else rec.template = null;
    const levels = chain.slice(outer + 1, outer + 13).map(f => levelOf(f.elementType ?? f.type, f.memoizedProps));
    lastSeen = [
        `maximize button (last seen ${new Date().toISOString().slice(11, 19)}): ${nameOf(rec.template?.type) || "anonymous"} depth ${outer}, keys=${Object.keys(rec.template?.props ?? {}).slice(0, 14).join(",")}`,
        `maximize parents: ${levels.map((l, i) => `${i}:${l.name}${l.moving ? ` moves ${l.moving}` : ""}${l.handles.length ? ` handles ${l.handles.length}` : ""}${l.motion ? " rn-animated" : ""}${l.entering ? " entering" : ""}${l.exiting ? " exiting" : ""}${l.pointerEvents ? ` pe=${l.pointerEvents}` : ""}`).join(" < ") || "none"}`,
    ];
    rec.sig = `${outer}:${nameOf(rec.template?.type)}:${levels.map(l => `${l.name}${l.handles.length}${l.motion ? "m" : ""}${l.entering ? "e" : ""}${l.exiting ? "x" : ""}${l.pointerEvents ?? ""}`).join(",")}`;
}

function Marker({ button }: { button: any; }) {
    const ref = React.useRef<any>(null);
    const rec = React.useRef<MarkerRec>({ button, node: null, fiber: null, chain: [], outer: -1, template: null, sig: "" }).current;
    rec.button = button;
    React.useLayoutEffect(() => {
        markers.add(rec);
        markersEver++;
        return () => {
            markers.delete(rec);
            if (latest === rec) latest = null;
            notifyNow();
        };
    }, []);
    React.useLayoutEffect(() => {
        try {
            const node = ref.current;
            const fresh = rec.node !== node;
            rec.node = node;
            const fiber = fiberOf(node);
            if (fresh) {
                if (fiber) fibersFound++;
                else fibersMissing++;
            }
            rec.fiber = fiber;
            const before = rec.sig;
            inspect(rec);
            latest = rec;
            if (!fcType) patchControls(rec.chain);
            if (fresh || before !== rec.sig) notifyNow();
        } catch (e) {
            caught("pip pin marker", e);
        }
    });
    const onLayout = safe("pip pin marker layout", (e: any) => {
        const l = e?.nativeEvent?.layout;
        if (l) rec.size = { width: l.width, height: l.height };
        measureNode(ref.current, b => {
            rec.rect = { ...b, at: Date.now() };
        });
    });
    return <View ref={ref} collapsable={false} pointerEvents="none" style={HIDDEN} onLayout={onLayout} />;
}

export const watchControls = safe("pip pin controls", (args: any[], ret: any) => {
    if (!active || !ret || typeof ret !== "object" || isPipRender()) return;
    const props = ret.props;
    if (!props || props[MARK] || !focusLabel(props)) return;
    const name = nameOf(args[0]) || "anonymous";
    noteButton(`${name} ${placement(props.style)} keys=${Object.keys(props).slice(0, 12).join(",")}${typeof props.children === "function" ? " children=fn" : ""}`);
    const ch = props.children;
    if (!/Pressable|Touchable/i.test(name) || ch == null || typeof ch !== "object") return;
    if (Array.isArray(ch) && ch.some((c: any) => c?.key === MARKER)) return;
    injected++;
    const marker = React.createElement(Shell, { key: MARKER, part: "Marker", props: { button: ret } });
    return { ...ret, props: { ...props, children: Array.isArray(ch) ? [...ch, marker] : [ch, marker] } };
});

function measureNode(node: any, done: (b: Box) => void) {
    if (typeof node?.measureInWindow !== "function") return;
    try {
        node.measureInWindow(safe("pip pin measure", (x: number, y: number, width: number, height: number) => {
            if ([x, y, width, height].every(n => typeof n === "number" && Number.isFinite(n)) && width > 0 && height > 0) done({ x, y, width, height });
        }));
    } catch (e) {
        caught("pip pin measure", e);
    }
}

const G = globalThis as any;
const shells: Set<() => void> = G.__cheeseburgerPinShells ??= new Set();

class Shell extends React.Component<{ part: string; props: any; }, { failed: boolean; n: number; }> {
    state = { failed: false, n: 0 };

    bump = () => this.setState(s => ({ failed: false, n: s.n + 1 }));

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidMount() {
        shells.add(this.bump);
    }

    componentWillUnmount() {
        shells.delete(this.bump);
    }

    componentDidCatch(e: any) {
        cloneErrors++;
        caught("pip pin shell", e);
    }

    render() {
        if (this.state.failed) return null;
        const Impl = G.__cheeseburgerPinImpl?.[this.props.part];
        return Impl ? React.createElement(Impl, this.props.props) : null;
    }
}

export function startPins() {
    active = true;
    G.__cheeseburgerPinImpl = { TilePin: Pin, InlinePin, Marker };
    for (const bump of [...shells]) {
        try {
            bump();
        } catch { }
    }
}

export function stopPins() {
    active = false;
    for (const u of fcUnpatches.splice(0)) {
        try {
            u();
        } catch { }
    }
    fcType = null;
    fcTypes.clear();
    owners.clear();
    markers.clear();
    latest = null;
    notifyNow();
}

function glyph(el: any, config: PinConfig): any {
    const props = el.props ?? {};
    const f: any = typeof props.style === "function" ? {} : StyleSheet.flatten(props.style) ?? {};
    const size = typeof props.size === "number" ? props.size : 20;
    return React.createElement(Image, {
        key: el.key ?? undefined,
        source: config.source,
        style: [{ width: props.width ?? f.width ?? size, height: props.height ?? f.height ?? size }, typeof props.style === "function" ? undefined : props.style, { tintColor: config.tint ?? f.tintColor ?? props.color ?? f.color ?? "#ffffff" }],
        accessible: false,
    });
}

function PinGlyph(props: any): any {
    const source = pinIcon();
    return source == null ? null : glyph({ props }, { source, label: "", onPress() { } });
}

function iconType(type: any): any {
    if (!type || typeof type !== "function" && typeof type !== "object") return type;
    const found = iconWrappers.get(type);
    if (found) return found;
    const name = nameOf(type);
    if (/^(?:RCT|Native|Animated|View$|Pressable|Touchable|Gesture|Image|Text|Svg|Cut$|Notches$)/i.test(name)) return type;
    const run = (original: Function, self: any, props: any, ref?: any) => {
        const config = props[CONFIG];
        const clean = { ...props };
        delete clean[CONFIG];
        const result = original.call(self, clean, ref);
        return config ? walkButton(result, config, false) : result;
    };
    let wrapper: any;
    if (typeof type === "function" && type.prototype?.isReactComponent) {
        wrapper = class extends type {
            render() {
                const result = super.render();
                return this.props[CONFIG] ? walkButton(result, this.props[CONFIG], false) : result;
            }
        };
    } else if (typeof type === "function") wrapper = function (this: any, props: any) { return run(type, this, props); };
    else if (type.$$typeof === Symbol.for("react.forward_ref") && typeof type.render === "function") wrapper = React.forwardRef((props: any, ref: any) => run(type.render, undefined, props, ref));
    else if (type.$$typeof === Symbol.for("react.memo") && type.type) wrapper = React.memo(iconType(type.type), type.compare);
    else return type;
    wrapper.displayName = name;
    if (type.defaultProps) wrapper.defaultProps = type.defaultProps;
    iconWrappers.set(type, wrapper);
    iconWrappers.set(wrapper, wrapper);
    return wrapper;
}

function relative(style: any): any {
    if (typeof style === "function") return (state: any) => [style(state), RELATIVE];
    return style == null ? RELATIVE : [style, RELATIVE];
}

function walkButton(el: any, config: PinConfig, top = true): any {
    if (Array.isArray(el)) return el.map(child => walkButton(child, config, false));
    if (typeof el === "string" && el.trim().length <= 3 && /[^\w\s]/.test(el)) return glyph({ props: {} }, config);
    if (!el || typeof el !== "object" || !("$$typeof" in el)) return el;
    const props = el.props ?? {};
    const name = nameOf(el.type);
    const next: any = { ...props };
    const pressable = typeof props.onPress === "function";
    if (pressable) {
        next.onPress = config.onPress;
        next.onLongPress = undefined;
        next.accessibilityLabel = config.label;
        next.accessibilityHint = undefined;
        next.onLayout = undefined;
        next.style = relative(props.style);
        next.ref = null;
        next[MARK] = true;
    } else if (top) {
        next.style = relative(props.style);
        next.ref = null;
        next[MARK] = true;
    }
    if (el.type === PinGlyph) return el;
    if (/Text/i.test(name) && typeof props.children === "string" && props.children.trim().length <= 3) return glyph(el, config);
    if (/Icon$|Svg(?:View)?$/i.test(name) || props.viewBox != null || el.type === Image || /Image(?:View)?$/i.test(name) && props.source != null || typeof props.source === "number") return glyph(el, config);
    for (const key of ["icon", "Icon", "IconComponent", "iconComponent", "leadingIcon", "trailingIcon", "leftIcon", "rightIcon"]) {
        const value = props[key];
        if (value == null) continue;
        if (typeof value === "object" && value.props) next[key] = glyph(value, config);
        else if (typeof value === "function" || value && typeof value === "object" && value.$$typeof) next[key] = PinGlyph;
        else if (typeof value === "number") next[key] = config.source;
        else if (typeof value === "string") next[key] = pinIconName;
        else next[key] = undefined;
    }
    if (typeof props.renderIcon === "function") next.renderIcon = safe("pip pin icon", (...args: any[]) => walkButton(props.renderIcon(...args), config, false));
    if (typeof props.children === "function") {
        const children = props.children;
        next.children = safe("pip pin children", (...args: any[]) => walkButton(children(...args), config, false));
    } else if (props.children != null) next.children = walkButton(props.children, config, false);
    const type = iconType(el.type);
    if (type !== el.type || iconWrappers.has(type)) next[CONFIG] = config;
    return { ...el, key: top ? "cheeseburger-pin-button" : el.key, type, props: next, ...(pressable || top ? { ref: null } : {}) };
}

function Fallback({ config }: { config: PinConfig; }) {
    const shownNow = chromeShown();
    const fade = React.useRef(new RNAnimated.Value(shownNow ? 1 : 0)).current;
    React.useEffect(() => {
        const anim = RNAnimated.timing(fade, { toValue: shownNow ? 1 : 0, duration: 200, useNativeDriver: true });
        anim.start();
        return () => anim.stop();
    }, [shownNow]);
    return <RNAnimated.View pointerEvents={shownNow ? "auto" : "none"} style={{ opacity: fade }}>
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={config.label}
            hitSlop={6}
            onPress={config.onPress}
            style={({ pressed }: any) => ({ backgroundColor: "#00000085", borderRadius: 8, padding: 6, opacity: pressed ? 0.7 : 1 })}
        >
            <Image source={config.source} style={{ width: 20, height: 20, tintColor: config.tint ?? "#ffffff" }} />
        </Pressable>
    </RNAnimated.View>;
}

function Levels({ levels, children }: { levels: Level[]; children: any; }) {
    const A = animatedView();
    let node = children;
    levels.forEach((l, i) => {
        if (l.motion) node = <RNAnimated.View key={`m${i}`} pointerEvents="box-none" style={l.motion}>{node}</RNAnimated.View>;
        if (A && (l.handles.length || l.entering != null || l.exiting != null)) node = <A key={`r${i}`} pointerEvents="box-none" style={l.handles} entering={l.entering} exiting={l.exiting}>{node}</A>;
    });
    return node;
}

function contains(outer: Box, inner: Box) {
    return inner.x >= outer.x - 2 && inner.y >= outer.y - 2 && inner.x + inner.width <= outer.x + outer.width + 2 && inner.y + inner.height <= outer.y + outer.height + 2;
}

const clampInset = (v: number) => Math.min(48, Math.max(0, Math.round(v)));

function insetFrom(tile: Box, button: Box): Inset {
    const right = clampInset(tile.x + tile.width - (button.x + button.width));
    const top = clampInset(button.y - tile.y);
    const bottom = clampInset(tile.y + tile.height - (button.y + button.height));
    if (button.y + button.height / 2 > tile.y + tile.height / 2) return { right: right + Math.round(button.width) + Math.max(6, right), bottom, from: "left of maximize" };
    return { right, bottom: top, from: "mirrors maximize" };
}

function sizeOk(layout: { width: number; height: number; }, coords: any) {
    const w = typeof coords?.width === "number" ? coords.width : 0;
    const h = typeof coords?.height === "number" ? coords.height : 0;
    if (!w || !h) return false;
    const tol = (v: number) => Math.max(4, v * 0.03);
    const wOk = Math.abs(layout.width - w) <= tol(w);
    const hOk = Math.abs(layout.height - h) <= tol(h);
    return wOk && hOk || layout.width <= w + tol(w) && layout.height <= h + tol(h) && (wOk || hOk);
}

function readCoords(sv: any): any {
    try {
        return typeof sv?.get === "function" ? sv.get() : sv?.value;
    } catch {
        return undefined;
    }
}

function noteSize(line: string) {
    if (seenSizes.includes(line)) return;
    seenSizes.push(line);
    if (seenSizes.length > 4) seenSizes.shift();
}

interface Match { rec: MarkerRec; levels: Level[]; by: string; }

function matchFor(pinFiber: any, tile: Box | null): Match | null {
    const mine: any[] = [];
    for (let f = pinFiber, i = 0; f && i < 16; f = f.return, i++) mine.push(f);
    let best: { rec: MarkerRec; j: number; k: number; } | null = null;
    if (mine.length) {
        for (const rec of markers) {
            if (!rec.chain.length) continue;
            for (let j = rec.outer + 1; j < rec.chain.length; j++) {
                const k = mine.findIndex(f => same(f, rec.chain[j]));
                if (k < 0) continue;
                if (!best || k < best.k) best = { rec, j, k };
                break;
            }
        }
    }
    if (best) {
        const levels = best.rec.chain.slice(best.rec.outer + 1, best.j).map(f => levelOf(f.elementType ?? f.type, f.memoizedProps));
        return { rec: best.rec, levels, by: "tree" };
    }
    if (!tile) return null;
    const hit = [...markers].filter(m => m.rect && Date.now() - m.rect.at < 3000 && contains(tile, m.rect)).sort((a, b) => b.rect!.at - a.rect!.at)[0];
    return hit ? { rec: hit, levels: [], by: "box" } : null;
}

let insetsSource: { context: any; hook: any; } | null | undefined;
function useInsets(): any {
    if (insetsSource === undefined) {
        insetsSource = null;
        try {
            const m = findByProps("SafeAreaInsetsContext") ?? findByProps("useSafeAreaInsets");
            if (m?.SafeAreaInsetsContext) insetsSource = { context: m.SafeAreaInsetsContext, hook: null };
            else if (typeof m?.useSafeAreaInsets === "function") insetsSource = { context: null, hook: m.useSafeAreaInsets };
        } catch { }
    }
    if (!insetsSource) return null;
    if (insetsSource.context) return React.useContext(insetsSource.context);
    try {
        return insetsSource.hook();
    } catch {
        return null;
    }
}

function Pin({ coords, pid, stream }: { coords: any; pid: string; stream: boolean; }) {
    const safeArea = useInsets();
    const on = useSplitViewSettings((s: any) => s.pipPins !== false);
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    const owner = React.useRef({}).current;
    const host = React.useRef<any>(null);
    const pinFiber = React.useRef<any>(null);
    const tileBox = React.useRef<Box | null>(null);
    const misses = React.useRef(0);
    const [valid, setValid] = React.useState(false);
    const kind = stream ? "stream" : "camera";

    if (safeArea) noteSafeArea(safeArea);

    React.useLayoutEffect(() => {
        hosts++;
        listeners.add(force);
        const offPin = onPinChange(force);
        const offChrome = onChrome(force);
        return () => {
            hosts--;
            listeners.delete(force);
            offPin();
            offChrome();
            if (owners.get(pid) === owner) {
                owners.delete(pid);
                notifyNow();
            }
        };
    }, []);

    React.useLayoutEffect(() => {
        if (!pinFiber.current && host.current) pinFiber.current = fiberOf(host.current);
        if (valid && !owners.has(pid)) {
            owners.set(pid, owner);
            force();
        } else if (!valid && owners.get(pid) === owner) {
            owners.delete(pid);
            notifyNow();
        }
    });

    const check = safe("pip pin host", (layout: { width: number; height: number; }) => {
        const c = readCoords(coords);
        if (sizeOk(layout, c)) {
            misses.current = 0;
            if (!valid) setValid(true);
            return;
        }
        noteSize(`${kind} host ${Math.round(layout.width)}x${Math.round(layout.height)} vs tile ${Math.round(c?.width)}x${Math.round(c?.height)}`);
        if (++misses.current >= 2 && valid) setValid(false);
    });

    const onLayout = safe("pip pin layout", (e: any) => {
        const layout = e?.nativeEvent?.layout;
        if (!layout) return;
        check(layout);
    });

    const visible = active && on && valid && owners.get(pid) === owner;
    const match = visible ? matchFor(pinFiber.current, tileBox.current) : null;
    if (match) {
        if (match.by === "tree") matchedByTree++;
        else matchedByBox++;
    }

    React.useEffect(() => {
        if (!visible) return;
        const locate = safe("pip pin locate", () => {
            for (const m of markers) measureNode(m.node, b => {
                m.rect = { ...b, at: Date.now() };
            });
            setTimeout(safe("pip pin match", () => measureNode(host.current, tile => {
                tileBox.current = tile;
                const m = matchFor(pinFiber.current, tile);
                if (!m?.rec.rect || !contains(tile, m.rec.rect)) return;
                const next = insetFrom(tile, m.rec.rect);
                const prev = insets.get(kind);
                if (!prev || prev.right !== next.right || prev.bottom !== next.bottom || prev.from !== next.from) {
                    insets.set(kind, next);
                    notifyNow();
                }
            })), 120);
        });
        locate();
        const timer = setInterval(locate, 2000);
        return () => clearInterval(timer);
    }, [visible, match?.rec]);

    let content: any = null;
    const source = visible ? pinIcon() : null;
    const inline = inlines.get(pid);
    if (visible && source != null && !fcType && !inline) {
        const config = pinConfig(pid, source);
        const inset = insets.get(kind) ?? insets.get(stream ? "camera" : "stream") ?? { right: 8, bottom: 8, from: "default" };
        const fallback = <Fallback config={config} />;
        const rec = match?.rec ?? (markers.size ? null : undefined);
        let inner: any = null;
        if (rec?.template) {
            const blocked = match!.levels.some(l => l.pointerEvents === "none" || l.pointerEvents === "box-only");
            let clone: any = null;
            clone = cloneOf(rec.template, config);
            if (clone) {
                cloneRenders++;
                inner = <View pointerEvents={blocked ? "none" : "box-none"}><Levels levels={match!.levels}><Guard fallback={fallback}>{clone}</Guard></Levels></View>;
            } else inner = fallback;
        } else if (rec === undefined && !markersEver) {
            fallbackRenders++;
            inner = fallback;
        }
        content = <View key="cheeseburger-pin-spot" pointerEvents="box-none" style={{ position: "absolute", right: inset.right, bottom: inset.bottom }}>
            {inner}
        </View>;
    }

    return <View ref={host} collapsable={false} pointerEvents="box-none" style={[FILL, { zIndex: 50 }]} onLayout={onLayout}>
        {content}
    </View>;
}

function pinConfig(pid: string, source: number): PinConfig {
    const here = pinnedPip() === pid;
    return {
        label: here ? "pop out pip, pinned" : "pop out pip",
        onPress: safe("pip pin press", () => pinPip(here ? null : pid)),
        source,
        tint: here ? accentColor("#ff0048") : undefined,
    };
}

function cloneOf(template: Template, config: PinConfig): any {
    try {
        const el = React.createElement(template.type, { ...template.props, accessibilityLabel: config.label, [MARK]: true });
        return walkButton(el, config);
    } catch (e) {
        cloneErrors++;
        caught("pip pin clone", e);
        return null;
    }
}

function noteInline(line: string) {
    if (inlineNotes.includes(line)) return;
    inlineNotes.push(line);
    if (inlineNotes.length > 4) inlineNotes.shift();
}

function findDown(root: any, limit: number): any {
    const stack = [root?.child];
    let seen = 0;
    while (stack.length && seen < limit) {
        const f = stack.pop();
        if (!f) continue;
        seen++;
        const props = f.memoizedProps;
        if (props && typeof props === "object" && props.sharedCoords != null) {
            const part = participantForPin(props);
            if (part) return part;
        }
        if (f.sibling) stack.push(f.sibling);
        if (f.child) stack.push(f.child);
    }
    return null;
}

function participantNear(fiber: any): any {
    const ups: any[] = [];
    for (let f = fiber?.return, i = 0; f && i < 40; f = f.return, i++) ups.push(f);
    for (const f of ups.slice(0, 12)) {
        const props = f.memoizedProps;
        if (!props || typeof props !== "object") continue;
        const part = participantForPin(props);
        if (part) return part;
    }
    for (const f of ups.slice(0, 24)) {
        const part = findDown(f, 400);
        if (part) return part;
    }
    return null;
}

const isControls = (f: any) => !!f && (fcTypes.has(f.elementType) || fcTypes.has(f.type) || fcTypes.has(f.elementType?.type) || fcTypes.has(f.type?.type) || fcTypes.size > 0 && /FloatingControls/.test(nameOf(f.elementType ?? f.type)));

function InlinePin({ owner }: { owner: any; }) {
    const on = useSplitViewSettings((s: any) => s.pipPins !== false);
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    const ref = React.useRef<any>(null);
    const me = React.useRef<InlineRec>({ pid: null, mine: false, placed: false, why: "starting" }).current;
    const fc = React.useRef<any>(null);
    const stream = React.useRef(false);
    const box = React.useRef<{ width: number; height: number; } | null>(null);

    React.useLayoutEffect(() => {
        inlineMounts++;
        listeners.add(force);
        const offPin = onPinChange(force);
        try {
            const fiber = fiberOf(ref.current);
            if (!fiber) me.why = "no fiber";
            for (let f = fiber?.return, i = 0; f && i < 12; f = f.return, i++) {
                if (isControls(f)) {
                    fc.current = f;
                    break;
                }
            }
            const part = participantForPin(owner ?? {}) ?? participantNear(fiber);
            if (!part || part.id == null) me.why = fiber ? "no participant" : me.why;
            else if (mineParticipant(part)) {
                me.mine = true;
                me.why = "yours";
            } else {
                me.pid = String(part.id);
                stream.current = part.type === 0 || me.pid.startsWith("call:");
                me.why = "found";
                inlines.set(me.pid, me);
            }
        } catch (e) {
            caught("pip inline pin", e);
        }
        force();
        return () => {
            listeners.delete(force);
            offPin();
            if (me.pid && inlines.get(me.pid) === me) inlines.delete(me.pid);
        };
    }, []);

    const rec = fc.current ? [...markers].find(m => m.chain.some(f => same(f, fc.current))) ?? null : null;
    const kind = stream.current ? "stream" : "camera";

    const place = safe("pip inline place", (tries = 0) => {
        if (!me.pid || !rec?.node || !ref.current || !box.current) return;
        measureNode(ref.current, parent => measureNode(rec.node, btn => {
            const scale = parent.width / box.current!.width;
            const bscale = rec.size ? btn.width / rec.size.width : 1;
            if (Math.abs(scale - 1) > 0.02 || Math.abs(bscale - 1) > 0.02) {
                me.why = `waiting, scaled ${scale.toFixed(2)}/${bscale.toFixed(2)}`;
                if (tries < 12) setTimeout(() => place(tries + 1), 250);
                return;
            }
            const next = insetFrom(parent, btn);
            noteInline(`${kind} area ${Math.round(parent.width)}x${Math.round(parent.height)}, maximize ${Math.round(btn.x - parent.x)},${Math.round(btn.y - parent.y)} ${Math.round(btn.width)}x${Math.round(btn.height)}, pin right ${next.right} bottom ${next.bottom} (${next.from})`);
            me.placed = true;
            me.why = "placed";
            const prev = insets.get(kind);
            if (!prev || prev.right !== next.right || prev.bottom !== next.bottom || prev.from !== next.from) {
                insets.set(kind, next);
                notifyNow();
            }
        }));
    });

    React.useEffect(() => {
        place();
    }, [rec, me.pid]);

    const source = active && on && me.pid && !me.mine && rec?.template ? pinIcon() : null;
    let content: any = null;
    if (source != null && rec?.template && me.pid) {
        const clone = cloneOf(rec.template, pinConfig(me.pid, source));
        const inset = insets.get(kind) ?? insets.get(stream.current ? "camera" : "stream") ?? { right: 8, bottom: 8, from: "default" };
        if (clone) {
            inlineRenders++;
            content = <View key="cheeseburger-inline-spot" pointerEvents="box-none" style={{ position: "absolute", right: inset.right, bottom: inset.bottom }}>
                <Guard>{clone}</Guard>
            </View>;
        }
    } else if (me.pid && !rec) me.why = fc.current ? "maximize not matched" : "controls not found above";
    if (!content && me.why !== "starting") noteInline(`not shown: ${me.why}${me.pid ? "" : " (no tile)"}${rec ? "" : `, markers ${markers.size}`}`);
    return <View
        ref={ref}
        collapsable={false}
        pointerEvents="box-none"
        style={FILL}
        onLayout={safe("pip inline layout", (e: any) => {
            const l = e?.nativeEvent?.layout;
            if (!l) return;
            box.current = { width: l.width, height: l.height };
            place();
        })}
    >
        {content}
    </View>;
}

let fcType: any = null;
const fcTypes = new Set<any>();
let fcNote = "waiting for discord's controls";
const fcUnpatches: (() => unknown)[] = [];

const addInline = safe("pip pin controls host", (args: any[], ret: any) => {
    if (!active || !ret || typeof ret !== "object" || !("$$typeof" in ret) || isPipRender()) return;
    const props = ret.props ?? {};
    const ch = props.children;
    if (typeof ch === "function") return;
    const list = ch == null ? [] : Array.isArray(ch) ? ch : [ch];
    if (list.some((c: any) => c?.key === INLINE)) return;
    return { ...ret, props: { ...props, children: [...list, React.createElement(Shell, { key: INLINE, part: "InlinePin", props: { owner: args?.[0] } })] } };
});

function patchControls(chain: any[]) {
    if (fcType) return;
    const f = chain.find(x => /FloatingControls/.test(nameOf(x.elementType ?? x.type)));
    if (!f) {
        fcNote = `no controls component in ${chain.slice(0, 4).map(x => nameOf(x.elementType ?? x.type) || "anonymous").join(" < ")}`;
        return;
    }
    const type = f.elementType ?? f.type;
    const mods: any = (window as any).modules ?? {};
    for (const id of Object.keys(mods)) {
        const m = mods[id];
        if (!m?.isInitialized) continue;
        const exp = m.publicModule?.exports;
        if (!exp || typeof exp !== "object" && typeof exp !== "function") continue;
        let keys: string[];
        try {
            keys = Object.keys(exp);
        } catch {
            continue;
        }
        for (const key of keys) {
            let v: any;
            try {
                v = exp[key];
            } catch {
                continue;
            }
            if (v !== type) continue;
            try {
                fcTypes.add(type);
                if (typeof v === "function") {
                    fcUnpatches.push(after(key, exp, addInline));
                    fcTypes.add(exp[key]);
                } else if (typeof v?.type === "function") {
                    fcTypes.add(v.type);
                    fcUnpatches.push(after("type", v, addInline));
                    fcTypes.add(v.type);
                } else if (typeof v?.render === "function") {
                    fcTypes.add(v.render);
                    fcUnpatches.push(after("render", v, addInline));
                    fcTypes.add(v.render);
                } else continue;
                fcType = type;
                fcNote = `hooked ${String(m.__filePath ?? id).split("/").pop()}#${key}`;
                return;
            } catch (e) {
                caught("pip pin controls patch", e);
            }
        }
    }
    fcNote = `controls component not exported (${nameOf(type)})`;
}


export function tilePinFor(props: any): any {
    if (!active || !props?.sharedCoords || isPipRender()) return null;
    const participant = participantForPin(props);
    if (!participant || participant.id == null || mineParticipant(participant)) return null;
    const stream = participant.type === 0 || String(participant.id).startsWith("call:");
    return React.createElement(Shell, { key: `cheeseburger-pin-${participant.id}`, part: "TilePin", props: { coords: props.sharedCoords, pid: String(participant.id), stream } });
}

export function pinControlsDebug(): string[] {
    const A = animatedView();
    const rec = latest ?? [...markers][0] ?? null;
    return [
        `pins: hosts ${hosts}, owners ${owners.size}, markers ${markers.size} (ever ${markersEver}, injected ${injected}), fibers ${fibersFound} found ${fibersMissing} missing, matched tree ${matchedByTree} box ${matchedByBox}, clone renders ${cloneRenders}, plain renders ${fallbackRenders}, clone errors ${cloneErrors}, reanimated ${A ? "found" : "missing"}, safe area ${safeAreaNote()}`,
        `controls hook: ${fcNote}`,
        `inline pins: mounts ${inlineMounts}, renders ${inlineRenders}, ${[...inlines.values()].map(r => `${r.pid ? "tile" : "?"} ${r.why}`).join(", ") || "none live"}`,
        ...inlineNotes.map(n => `  inline ${n}`),
        `pin spots: ${[...insets.entries()].map(([k, v]) => `${k} right ${v.right} bottom ${v.bottom} (${v.from})`).join(", ") || "default 8,8"}`,
        ...(rec ? [`maximize button now: ${nameOf(rec.template?.type) || "anonymous"}${rec.rect ? ` at ${Math.round(rec.rect.x)},${Math.round(rec.rect.y)} ${Math.round(rec.rect.width)}x${Math.round(rec.rect.height)}` : ""}`] : []),
        ...lastSeen,
        ...seenButtons.map(p => `  labelled ${p}`),
        ...seenSizes.map(s => `  skipped ${s}`),
    ];
}
