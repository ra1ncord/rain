import { findAsset } from "@api/assets";
import { findByProps } from "@metro";
import { React } from "@metro/common";
import { Animated as RNAnimated, Image, Pressable, StyleSheet, View } from "react-native";

import { caught, safe } from "../crash";
import { accentColor } from "../style/colors";
import { isPipRender, mineParticipant, onPinChange, participantForPin, pinnedPip, pinPip } from "./pip";
import { useSplitViewSettings } from "./storage";
import { chromeShown, onChrome } from "./tiles";

const ICONS = ["PinIcon", "PictureInPictureIcon", "PipIcon", "ic_pip"];
const MARK = "__cheeseburgerNativePin";
const CONFIG = "__cheeseburgerPinConfig";
const FOCUS = /^(?:un)?focus\s/i;
const STOP = /^stop watching$/i;
const MOTION = /^(?:opacity|transform)$/;
const LAYOUTISH = /^(?:width|height|top|left|right|bottom|x|y|position|flex|aspectRatio|margin|padding|min|max)/i;
const FILL = { position: "absolute", left: 0, top: 0, right: 0, bottom: 0 } as const;
const HIDDEN = { ...FILL, opacity: 0 } as const;
const RELATIVE = { position: "relative", top: undefined, left: undefined, right: undefined, bottom: undefined, margin: 0, marginTop: 0, marginLeft: 0, marginRight: 0, marginBottom: 0, marginHorizontal: 0, marginVertical: 0 } as const;

interface Level { name: string; handles: any[]; motion: any; entering?: any; exiting?: any; pointerEvents?: string; place: string; moving: string; }
interface Controls { button: any; levels: Level[]; abs: any; pad: { top: number; right: number; bottom: number; }; stop: string; at: number; }
interface Box { x: number; y: number; width: number; height: number; }
interface MarkerRec { controls: Controls; node: any; rect?: Box & { at: number; }; sig?: string; }
interface Inset { right: number; bottom: number; from: string; }
interface PinConfig { label: string; onPress: () => void; source: number; tint?: string; }

const iconWrappers = new WeakMap<object, any>();
const byButton = new WeakMap<object, Controls>();
const markers = new Set<MarkerRec>();
const listeners = new Set<() => void>();
const owners = new Map<string, object>();
const insets = new Map<string, Inset>();
const seenParents: string[] = [];
const seenSizes: string[] = [];
let latest: Controls | null = null;
let active = false;
let icon: number | null | undefined;
let iconRetryAt = 0;
let reanimated: any;
let composite = 0;
let controlsSeen = 0;
let hosts = 0;
let shown = 0;
let fallbacks = 0;
let cloneErrors = 0;
let notifyQueued = false;
export let pinIconName = "";

const nameOf = (type: any): string => typeof type === "string" ? type : type?.displayName ?? type?.name ?? type?.render?.displayName ?? type?.render?.name ?? type?.type?.displayName ?? type?.type?.name ?? "";

function nativeHost(type: any): boolean {
    if (type === View) return true;
    if (/^(?:RCTView|View|Animated.*View|AnimatedComponent\(View\)|Animated\(View\))$/i.test(nameOf(type))) return true;
    return type?.$$typeof === Symbol.for("react.memo") && nativeHost(type.type);
}

function notify() {
    if (notifyQueued) return;
    notifyQueued = true;
    setTimeout(safe("pip pin notify", () => {
        notifyQueued = false;
        listeners.forEach(l => {
            try {
                l();
            } catch (e) {
                caught("pip pin listener", e);
            }
        });
    }), 0);
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

const num = (v: any) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

function placement(style: any): string {
    const f = flat(style);
    const out: any = {};
    for (const key of ["position", "top", "right", "bottom", "left", "width", "height", "padding", "paddingHorizontal", "paddingVertical", "flexDirection", "justifyContent", "alignItems", "gap"]) {
        if (f[key] !== undefined && typeof f[key] !== "object") out[key] = f[key];
    }
    return JSON.stringify(out).slice(0, 200);
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
        place: placement(props?.style),
        moving: [...new Set(moving.filter(k => !LAYOUTISH.test(k) || MOTION.test(k)))].join(" "),
    };
}

const animatedLevel = (l: Level) => l.handles.length > 0 || !!l.motion || l.entering != null || l.exiting != null;

function flatList(value: any, out: any[] = []): any[] {
    if (Array.isArray(value)) value.forEach(v => flatList(v, out));
    else if (value != null) out.push(value);
    return out;
}

function findFocus(children: any): { el: any; depth: number; } | null {
    let level = flatList(children);
    let visits = 0;
    for (let depth = 1; depth <= 4 && level.length; depth++) {
        const next: any[] = [];
        for (const el of level) {
            if (++visits > 48) return null;
            if (!el || typeof el !== "object" || !("$$typeof" in el)) continue;
            const props = el.props;
            if (!props || props[MARK]) continue;
            if (typeof props.accessibilityLabel === "string" && FOCUS.test(props.accessibilityLabel)) return { el, depth };
            if (props.children != null && typeof props.children === "object") flatList(props.children, next);
        }
        level = next;
    }
    return null;
}

function noteParent(line: string) {
    if (seenParents.includes(line)) return;
    seenParents.push(line);
    if (seenParents.length > 6) seenParents.shift();
}

function attach(type: any, ret: any, button: any): any {
    const props = ret.props ?? {};
    const list = flatList(props.children);
    const pf = flat(props.style);
    const pad = (side: "Top" | "Right" | "Bottom", axis: "Vertical" | "Horizontal") => num(pf[`padding${side}`]) ?? num(pf[`padding${axis}`]) ?? num(pf.padding) ?? 0;
    const stopEl = list.find(c => typeof c?.props?.accessibilityLabel === "string" && STOP.test(c.props.accessibilityLabel));
    const controls: Controls = {
        button,
        levels: [levelOf(type, props)],
        abs: flat(button.props?.style),
        pad: { top: pad("Top", "Vertical"), right: pad("Right", "Horizontal"), bottom: pad("Bottom", "Vertical") },
        stop: stopEl ? placement(stopEl.props.style) : "",
        at: Date.now(),
    };
    byButton.set(button, controls);
    latest = controls;
    controlsSeen++;
    noteParent(`${controls.levels[0].name} ${controls.levels[0].place}${controls.levels[0].moving ? ` moves ${controls.levels[0].moving}` : ""}${controls.levels[0].pointerEvents ? ` pe=${controls.levels[0].pointerEvents}` : ""} > ${nameOf(button.type) || "anonymous"} ${placement(button.props?.style)}${stopEl ? ` + stop ${controls.stop}` : ""}`);
    if (!nativeHost(type)) {
        composite++;
        return;
    }
    if (list.some(c => c?.key === "cheeseburger-controls")) return;
    return { ...ret, props: { ...props, children: [...list, React.createElement(Marker, { key: "cheeseburger-controls", controls })] } };
}

function climb(type: any, props: any, button: any, depth: number) {
    const controls = byButton.get(button);
    if (!controls || controls.levels.length !== depth - 1 || depth > 4) return;
    controls.levels.push(levelOf(type, props));
}

export const watchControls = safe("pip pin controls", (args: any[], ret: any) => {
    if (!active || !ret || typeof ret !== "object" || isPipRender()) return;
    const props = ret.props;
    const children = props?.children;
    if (children == null || typeof children !== "object" || props[MARK]) return;
    const hit = findFocus(children);
    if (!hit) return;
    if (hit.depth === 1) return attach(args[0], ret, hit.el);
    climb(args[0], props, hit.el, hit.depth);
});

const signature = (c: Controls) => c.levels.map(l => `${l.name}:${l.handles.length}:${l.motion ? 1 : 0}:${l.entering ? 1 : 0}:${l.exiting ? 1 : 0}:${l.pointerEvents ?? ""}`).join("|");

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

function Marker({ controls }: { controls: Controls; }) {
    const ref = React.useRef<any>(null);
    const rec = React.useRef<MarkerRec>({ controls, node: null }).current;
    rec.controls = controls;
    React.useEffect(() => {
        markers.add(rec);
        notify();
        return () => {
            markers.delete(rec);
            notify();
        };
    }, []);
    React.useEffect(() => {
        rec.node = ref.current;
        const sig = signature(controls);
        if (sig !== rec.sig) {
            rec.sig = sig;
            notify();
        }
    });
    const onLayout = safe("pip pin marker layout", () => measureNode(ref.current, b => {
        rec.rect = { ...b, at: Date.now() };
    }));
    return <View ref={ref} collapsable={false} pointerEvents="none" style={HIDDEN} onLayout={onLayout} />;
}

export function startPins() {
    active = true;
}

export function stopPins() {
    active = false;
    owners.clear();
    markers.clear();
    latest = null;
    notify();
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

function insetFrom(tile: Box, parent: Box, c: Controls, pin: { width: number; height: number; } | null): Inset {
    const relRight = tile.x + tile.width - (parent.x + parent.width);
    const relTop = parent.y - tile.y;
    const relBottom = tile.y + tile.height - (parent.y + parent.height);
    const abs = c.abs ?? {};
    const absolute = abs.position === "absolute";
    const right = clampInset(relRight + (absolute ? num(abs.right) ?? 0 : c.pad.right + (num(abs.marginRight) ?? 0)));
    const topEdge = absolute ? num(abs.top) : c.pad.top + (num(abs.marginTop) ?? 0);
    const bottomEdge = absolute ? num(abs.bottom) : undefined;
    const atBottom = absolute ? bottomEdge != null && topEdge == null : parent.y + parent.height / 2 > tile.y + tile.height / 2;
    if (atBottom) {
        const bottom = clampInset(relBottom + (bottomEdge ?? c.pad.bottom));
        return { right: right + Math.round(pin?.width ?? 32) + Math.max(6, right), bottom, from: "left of maximize" };
    }
    return { right, bottom: clampInset(relTop + (topEdge ?? 0)), from: "mirrors maximize" };
}

function sizeOk(layout: { width: number; height: number; }, coords: any) {
    const w = num(coords?.width);
    const h = num(coords?.height);
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

function Pin({ coords, pid, stream }: { coords: any; pid: string; stream: boolean; }) {
    const on = useSplitViewSettings((s: any) => s.pipPins !== false);
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    const owner = React.useRef({}).current;
    const host = React.useRef<any>(null);
    const misses = React.useRef(0);
    const [valid, setValid] = React.useState(false);
    const [pinSize, setPinSize] = React.useState<{ width: number; height: number; } | null>(null);
    const [mark, setMark] = React.useState<MarkerRec | null>(null);
    const kind = stream ? "stream" : "camera";

    React.useEffect(() => {
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
                notify();
            }
        };
    }, []);

    React.useEffect(() => {
        if (valid && !owners.has(pid)) {
            owners.set(pid, owner);
            notify();
        } else if (!valid && owners.get(pid) === owner) {
            owners.delete(pid);
            notify();
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
        setTimeout(safe("pip pin recheck", () => {
            if (host.current) measureNode(host.current, b => check(b));
        }), 300);
    });

    const visible = active && on && valid && owners.get(pid) === owner;

    React.useEffect(() => {
        if (!visible) return;
        const locate = safe("pip pin locate", () => {
            for (const m of markers) measureNode(m.node, b => {
                m.rect = { ...b, at: Date.now() };
            });
            setTimeout(safe("pip pin match", () => measureNode(host.current, tile => {
                const hit = [...markers].filter(m => m.rect && Date.now() - m.rect.at < 1500 && contains(tile, m.rect)).sort((a, b) => b.rect!.at - a.rect!.at)[0] ?? null;
                if (hit !== mark) setMark(hit);
                if (hit?.rect) {
                    const next = insetFrom(tile, hit.rect, hit.controls, pinSize);
                    const prev = insets.get(kind);
                    if (!prev || prev.right !== next.right || prev.bottom !== next.bottom || prev.from !== next.from) {
                        insets.set(kind, next);
                        notify();
                    }
                }
            })), 120);
        });
        locate();
        const timer = setInterval(locate, 1500);
        return () => clearInterval(timer);
    }, [visible, mark, pinSize?.width]);

    let content: any = null;
    if (visible) {
        const source = pinIcon();
        const own = mark && markers.has(mark) ? mark : null;
        const controls = own?.controls ?? [...markers].sort((a, b) => b.controls.at - a.controls.at)[0]?.controls ?? (composite ? latest : null);
        const present = own ? true : markers.size > 0 || !!(composite && latest);
        if (source != null) {
            const here = pinnedPip() === pid;
            const config: PinConfig = {
                label: here ? "unpin pip" : "pin to pip",
                onPress: safe("pip pin press", () => pinPip(here ? null : pid)),
                source,
                tint: here ? accentColor("#ff0048") : undefined,
            };
            const inset = insets.get(kind) ?? insets.get(stream ? "camera" : "stream") ?? { right: 8, bottom: 8, from: "default" };
            const blocked = controls?.levels.some(l => l.pointerEvents === "none" || l.pointerEvents === "box-only");
            const fallback = <Fallback config={config} />;
            let inner: any = null;
            if (controls && present) {
                shown++;
                let clone: any = null;
                try {
                    clone = walkButton(controls.button, config);
                } catch (e) {
                    cloneErrors++;
                    caught("pip pin clone", e);
                }
                inner = clone ? <Levels levels={controls.levels}><Guard fallback={fallback}>{clone}</Guard></Levels> : fallback;
            } else if (!controls) {
                fallbacks++;
                inner = fallback;
            }
            content = <View
                key="cheeseburger-pin-spot"
                pointerEvents={blocked ? "none" : "box-none"}
                style={{ position: "absolute", right: inset.right, bottom: inset.bottom }}
                onLayout={safe("pip pin size", (e: any) => {
                    const l = e?.nativeEvent?.layout;
                    if (l && (!pinSize || Math.abs(pinSize.width - l.width) > 1)) setPinSize({ width: l.width, height: l.height });
                })}
            >
                {inner}
            </View>;
        }
    }

    return <View ref={host} collapsable={false} pointerEvents="box-none" style={[FILL, { zIndex: 50 }]} onLayout={onLayout}>
        {content}
    </View>;
}

export function TilePin(props: { coords: any; pid: string; stream: boolean; }) {
    return <Guard><Pin {...props} /></Guard>;
}

export function tilePinFor(props: any): any {
    if (!active || !props?.sharedCoords || isPipRender()) return null;
    const participant = participantForPin(props);
    if (!participant || participant.id == null || mineParticipant(participant)) return null;
    const stream = participant.type === 0 || String(participant.id).startsWith("call:");
    return <TilePin key={`cheeseburger-pin-${participant.id}`} coords={props.sharedCoords} pid={String(participant.id)} stream={stream} />;
}

export function pinControlsDebug(): string[] {
    const A = animatedView();
    const c = latest;
    return [
        `pins: hosts ${hosts}, owners ${owners.size}, discord controls seen ${controlsSeen}, markers ${markers.size}, composite parents ${composite}, renders with discord's button ${shown}, plain fallback ${fallbacks}, clone errors ${cloneErrors}, reanimated ${A ? "found" : "missing"}`,
        `pin spots: ${[...insets.entries()].map(([k, v]) => `${k} right ${v.right} bottom ${v.bottom} (${v.from})`).join(", ") || "default 8,8"}`,
        `maximize chain: ${c ? c.levels.map((l, i) => `${i}:${l.name}${l.moving ? ` moves ${l.moving}` : ""}${l.handles.length ? ` handles ${l.handles.length}` : ""}${l.motion ? " rn-animated" : ""}${l.entering ? " entering" : ""}${l.exiting ? " exiting" : ""}${l.pointerEvents ? ` pe=${l.pointerEvents}` : ""}${animatedLevel(l) ? "" : " still"}`).join(" < ") : "not seen"}`,
        `maximize button: ${c ? `${nameOf(c.button.type) || "anonymous"} ${placement(c.button.props?.style)} keys=${Object.keys(c.button.props ?? {}).slice(0, 12).join(",")}` : "not seen"}`,
        ...seenParents.map(p => `  parent ${p}`),
        ...seenSizes.map(s => `  skipped ${s}`),
    ];
}
