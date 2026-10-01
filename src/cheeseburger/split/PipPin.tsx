import { findAsset } from "@api/assets";
import { React } from "@metro/common";
import { Image, StyleSheet, View } from "react-native";

import { caught, safe } from "../crash";
import { floatingPinParticipant, isPipRender, mineParticipant, onPinChange, participantForFocus, participantForPin, pinnedPip, pinPip } from "./pip";
import { useSplitViewSettings } from "./storage";

const ICONS = ["PinIcon", "PictureInPictureIcon", "PipIcon", "ic_pip"];
const MARK = "__cheeseburgerNativePin";
const CONFIG = "__cheeseburgerPinConfig";
const iconWrappers = new WeakMap<object, any>();
const injected = new WeakSet<object>();
const wrapped = new WeakSet<object>();
const wrappers = new Map<string, WeakMap<object, any>>();
interface PinScope { participant: any; floating: boolean; }
const scopes: PinScope[] = [];
const floatingControls = new Set<string>();
const floatingOwners = new Map<string, object>();
const floatingListeners = new Set<() => void>();
let floatingMounted = 0;
let unsafeControls = 0;
let active = false;
let focusControls = 0;
let mounted = 0;
let cloned = 0;
let noParticipant = 0;
let noIcon = 0;
let nativeStyle = "not seen yet";
let parentStyle = "not seen yet";
let icon: number | null | undefined;
let iconRetryAt = 0;
export let pinIconName = "";

const nameOf = (type: any) => type?.displayName ?? type?.name ?? type?.render?.name ?? "";

function placement(style: any): string {
    if (typeof style === "function") return "native callback";
    const flat: any = StyleSheet.flatten(style) ?? {};
    const out: any = {};
    for (const key of ["position", "top", "right", "bottom", "left", "width", "height", "margin", "marginHorizontal", "gap", "flexDirection", "alignItems", "justifyContent", "transform"]) {
        if (flat[key] !== undefined) out[key] = flat[key];
    }
    return JSON.stringify(out).slice(0, 300);
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

class Guard extends React.Component<{ children?: any; }, { failed: boolean; }> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(e: any) {
        caught("pip pin", e);
    }

    render() {
        return this.state.failed ? null : this.props.children;
    }
}

interface PinConfig { label: string; onPress: () => void; source: number; }

function glyph(el: any, config: PinConfig): any {
    const props = el.props ?? {};
    const flat: any = typeof props.style === "function" ? {} : StyleSheet.flatten(props.style) ?? {};
    const size = typeof props.size === "number" ? props.size : 20;
    return React.createElement(Image, { key: el.key ?? undefined, source: config.source,
        style: [{ width: props.width ?? flat.width ?? size, height: props.height ?? flat.height ?? size,
            tintColor: flat.tintColor ?? props.color ?? flat.color ?? "#ffffff" }, props.style],
        accessible: false });
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
        return config ? walkButton(result, config) : result;
    };
    let wrapper: any;
    if (typeof type === "function" && type.prototype?.isReactComponent) {
        wrapper = class extends type {
            render() {
                const result = super.render();
                return this.props[CONFIG] ? walkButton(result, this.props[CONFIG]) : result;
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

function walkButton(el: any, config: PinConfig): any {
    if (Array.isArray(el)) return el.map(child => walkButton(child, config));
    if (typeof el === "string" && el.trim().length <= 3 && /[^\w\s]/.test(el)) return glyph({ props: {} }, config);
    if (!el || typeof el !== "object" || !("$$typeof" in el)) return el;
    const props = el.props ?? {};
    const name = nameOf(el.type);
    const next: any = { ...props };
    if (typeof props.onPress === "function") {
        next.ref = null;
        next.onPress = config.onPress;
        next.onLongPress = undefined;
        next.accessibilityLabel = config.label;
        next.accessibilityHint = undefined;
        next.onLayout = undefined;
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
    if (typeof props.renderIcon === "function") next.renderIcon = safe("pip native pin icon", (...args: any[]) => walkButton(props.renderIcon(...args), config));
    if (typeof props.children === "function") {
        const children = props.children;
        next.children = safe("pip native pin children", (...args: any[]) => walkButton(children(...args), config));
    } else if (props.children != null) next.children = walkButton(props.children, config);
    const type = iconType(el.type);
    if (type !== el.type || iconWrappers.has(type)) next[CONFIG] = config;
    return { ...el, type, props: next, ...(typeof props.onPress === "function" ? { ref: null } : {}) };
}

function cloneButton(template: any, label: string, onPress: () => void): any {
    const source = pinIcon();
    if (source == null) {
        noIcon++;
        return null;
    }
    cloned++;
    return walkButton(template, { label, onPress, source });
}

function Pin({ template, participant, floating }: { template: any; participant: any; floating?: boolean; }) {
    const on = useSplitViewSettings((s: any) => s.pipPins !== false);
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    const owner = React.useRef({}).current;
    const source = floating && participant?.id != null ? String(participant.id) : null;
    React.useEffect(() => {
        mounted++;
        if (floating) floatingMounted++;
        const off = onPinChange(force);
        return () => {
            mounted--;
            if (floating) floatingMounted--;
            off();
        };
    }, []);
    React.useEffect(() => {
        if (!source) return;
        floatingListeners.add(force);
        return () => {
            floatingListeners.delete(force);
            if (floatingOwners.get(source) === owner) {
                floatingOwners.delete(source);
                floatingListeners.forEach(safe("pip pin owner", listener => listener()));
            }
        };
    }, [source]);
    React.useEffect(() => {
        if (source && !floatingOwners.has(source)) {
            floatingOwners.set(source, owner);
            floatingListeners.forEach(safe("pip pin owner", listener => listener()));
        }
    });
    if (!active || !on || !participant || mineParticipant(participant)) return null;
    if (source && floatingOwners.get(source) !== owner) return null;
    const here = pinnedPip() === String(participant.id);
    const label = here ? "Unpin from picture in picture" : "Pin to picture in picture";
    return cloneButton(template, label, safe("pip pin press", () => pinPip(here ? null : String(participant.id))));
}

export function PipPin(props: { template: any; participant: any; floating?: boolean; }) {
    return <Guard><Pin {...props} /></Guard>;
}

function scopedType(type: any, scope: PinScope): any {
    if (!type || wrapped.has(type)) return type;
    const name = nameOf(type);
    if (/^(?:RCT|Native|Animated|View$|Pressable|Touchable|Gesture|Text|Image|Icon|Scroll|Svg|Guard|PipPin|PinScope)/i.test(name)) return type;
    const id = `${scope.floating ? "floating" : "call"}:${scope.participant.id}`;
    let cache = wrappers.get(id);
    if (!cache) wrappers.set(id, cache = new WeakMap());
    const found = cache.get(type);
    if (found) return found;
    const run = (original: Function, self: any, args: any[]) => {
        scopes.push(scope);
        try {
            return original.apply(self, args);
        } finally {
            scopes.pop();
        }
    };
    let wrapper: any;
    if (typeof type === "function" && type.prototype?.isReactComponent) {
        wrapper = class extends type {
            render() { return run(super.render, this, []); }
        };
    } else if (typeof type === "function") wrapper = function (this: any, ...args: any[]) { return run(type, this, args); };
    else if (type.$$typeof === Symbol.for("react.forward_ref") && typeof type.render === "function") wrapper = React.forwardRef((props: any, ref: any) => run(type.render, undefined, [props, ref]));
    else if (type.$$typeof === Symbol.for("react.memo") && type.type) wrapper = React.memo(scopedType(type.type, scope), type.compare);
    else return type;
    wrapper.displayName = name;
    if (type.defaultProps) wrapper.defaultProps = type.defaultProps;
    cache.set(type, wrapper);
    wrapped.add(wrapper);
    return wrapper;
}

export const scopePinTile = safe("pip pin scope", (args: any[]) => {
    const props = args[1];
    if (!active || !props || props[MARK] || typeof args[0] === "string") return;
    const floating = floatingPinParticipant(props);
    const inherited = scopes[scopes.length - 1];
    if (isPipRender() && !floating) return;
    const participant = floating ?? participantForPin(props) ?? inherited?.participant;
    if (!participant) return;
    const scope = { participant, floating: !!floating || !!inherited?.floating };
    const type = scopedType(args[0], scope);
    if (type === args[0]) return;
    args[0] = type;
    return args;
});

function flatControlStyle(style: any): any {
    const out: any = {};
    const walk = (value: any) => {
        if (Array.isArray(value)) return value.forEach(walk);
        if (typeof value === "function") return walk(value({ pressed: false, hovered: false, focused: false }));
        if (value?.initial?.value && value.viewDescriptors) return walk(value.initial.value);
        if (value) Object.assign(out, StyleSheet.flatten(value));
    };
    walk(style);
    return out;
}

function iconControl(template: any): boolean {
    const style = flatControlStyle(template.props?.style);
    if (typeof style.width === "number" && style.width > 72 || typeof style.height === "number" && style.height > 72) return false;
    let iconFound = false;
    let videoFound = false;
    let visits = 0;
    const walk = (el: any, level = 0) => {
        if (!el || level > 5 || ++visits > 40) return;
        if (Array.isArray(el)) return el.forEach(child => walk(child, level));
        if (typeof el !== "object" || !("$$typeof" in el)) return;
        const props = el.props ?? {};
        const name = nameOf(el.type);
        if (props.streamId != null && (level > 0 || props.isCamera !== undefined || props.sharedCoords != null)
            || props.videoSpinnerContext != null || /VideoRenderer|VideoView|StreamView|VideoSurface/i.test(name)) videoFound = true;
        if (/Icon$|ButtonPill|Svg(?:View)?$/i.test(name) || el.type === Image || props.viewBox != null || props.icon != null || typeof props.renderIcon === "function") iconFound = true;
        const children = typeof props.children === "function" ? props.children({ pressed: false, hovered: false, focused: false }) : props.children;
        walk(children, level + 1);
    };
    walk(template);
    return iconFound && !videoFound && visits <= 40;
}

function withNativePin(template: any, scope: PinScope): any {
    const style = flatControlStyle(template.props?.style);
    let control = template;
    let position: any = null;
    if (style.position === "absolute") {
        if (style.left != null && style.right != null || style.top != null && style.bottom != null) return null;
        position = { position: "absolute", flexDirection: "row", zIndex: style.zIndex };
        for (const key of ["top", "right", "bottom", "left"]) if (style[key] !== undefined) position[key] = style[key];
        const relative = { position: "relative", left: undefined, right: undefined, top: undefined, bottom: undefined };
        const native = template.props.style;
        const relativeStyle = typeof native === "function" ? (state: any) => [native(state), relative] : [native, relative];
        control = { ...template, props: { ...template.props, style: relativeStyle } };
    }
    const pin = React.createElement(PipPin, { key: "cheeseburger-native-pin", template: control, participant: scope.participant, floating: scope.floating });
    const children = position?.right != null ? [pin, control] : [control, pin];
    const out = position ? React.createElement(View, { key: template.key ?? undefined, pointerEvents: "box-none", style: position }, ...children)
        : React.createElement(React.Fragment, { key: template.key ?? undefined }, ...children);
    injected.add(out);
    return out;
}

export const addPipPin = safe("pip native pin", (args: any[], ret: any) => {
    if (!active || !ret || ret.props?.[MARK] || injected.has(ret)) return;
    const props = args[1];
    const inherited = scopes[scopes.length - 1];
    const floating = floatingPinParticipant(props) ?? (inherited?.floating ? inherited.participant : null);
    if (isPipRender() && !floating) return;
    if (Array.isArray(ret.props?.children) && ret.props.children.some((child: any) => child && typeof child === "object" && injected.has(child))) parentStyle = placement(props?.style);
    const label = props?.accessibilityLabel;
    if (!/Pressable|Touchable/i.test(nameOf(args[0])) || typeof props?.onPress !== "function") return;
    if (floating && floatingControls.size < 8) floatingControls.add(`${nameOf(args[0])} label=${String(label ?? "none").slice(0, 50)} keys=${Object.keys(props).slice(0, 10).join(",")} source=screen style=${placement(props.style)}`);
    const focus = typeof label === "string" && /^(?:unfocus|focus)\s+/i.test(label);
    if (!focus && !floating) return;
    if (floating && !iconControl(ret)) {
        unsafeControls++;
        return;
    }
    focusControls++;
    nativeStyle = placement(props.style);
    const participant = floating ?? participantForPin(props) ?? inherited?.participant ?? participantForFocus(label);
    if (!participant) {
        noParticipant++;
        return;
    }
    if (mineParticipant(participant)) return;
    const out = withNativePin(ret, { participant, floating: !!floating });
    if (!out) unsafeControls++;
    return out;
});

export function startPins() {
    active = true;
}

export function stopPins() {
    active = false;
    wrappers.clear();
    scopes.length = 0;
    floatingOwners.clear();
}

export function pinControlsDebug(): string {
    return `pin controls: native clones ${cloned}, focus controls ${focusControls}, mounted ${mounted}, floating ${floatingMounted}, unsafe ${unsafeControls}, missing participant ${noParticipant}, missing icon ${noIcon}, icon ${pinIconName || "not seen yet"}; native placement ${nativeStyle}, parent ${parentStyle}; floating controls ${[...floatingControls].join("; ") || "not rendered"}`;
}
