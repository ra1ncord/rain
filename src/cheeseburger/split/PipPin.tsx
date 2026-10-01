import { findAsset } from "@api/assets";
import { React } from "@metro/common";
import { Image, StyleSheet, View } from "react-native";

import { caught, safe } from "../crash";
import { VIDEO_FOOTER } from "./geometry";
import { isSplitActive, onSplitChange } from "./layout";
import { floatingPinParticipant, isPipRender, mineParticipant, onPinChange, participantForPin, pinnedPip, pinPip } from "./pip";
import { useSplitViewSettings } from "./storage";

const ICONS = ["PinIcon", "PictureInPictureIcon", "PipIcon", "ic_pip"];
const MARK = "__cheeseburgerNativePin";
const CONFIG = "__cheeseburgerPinConfig";
const iconWrappers = new WeakMap<object, any>();
const injected = new WeakSet<object>();
const wrapped = new WeakSet<object>();
const wrappers = new Map<string, WeakMap<object, any>>();
interface PinScope { participant: any; floating: boolean; row?: boolean; }
interface NativeTemplate { button: any; animation: any[]; }
const SourceContext = React.createContext<PinScope | null>(null);
const provided = new WeakSet<object>();
const rowHosts = new WeakSet<object>();
const rowWrappers = new WeakMap<object, any>();
const sourceTemplates = new Map<string, NativeTemplate>();
const templateListeners = new Set<() => void>();
const rowOwners = new Map<string, object>();
const rowListeners = new Set<() => void>();
let nativeTemplate: NativeTemplate | null = null;
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
let sourceHosts = 0;
let contextPins = 0;
let nativeStyle = "not seen yet";
let parentStyle = "not seen yet";
let icon: number | null | undefined;
let iconRetryAt = 0;
export let pinIconName = "";

const nameOf = (type: any) => type?.displayName ?? type?.name ?? type?.render?.name ?? "";
const pipType = (type: any) => /PipAware|VoicePanelPIP|ExternalPip/i.test(nameOf(type));

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

function walkButton(el: any, config: PinConfig, clearRefs = true): any {
    if (Array.isArray(el)) return el.map(child => walkButton(child, config, clearRefs));
    if (typeof el === "string" && el.trim().length <= 3 && /[^\w\s]/.test(el)) return glyph({ props: {} }, config);
    if (!el || typeof el !== "object" || !("$$typeof" in el)) return el;
    const props = el.props ?? {};
    const name = nameOf(el.type);
    const next: any = { ...props };
    if (typeof props.onPress === "function") {
        if (clearRefs) next.ref = null;
        next.onPress = config.onPress;
        next.onLongPress = undefined;
        next.accessibilityLabel = config.label;
        next.accessibilityHint = undefined;
        if (clearRefs) next.onLayout = undefined;
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
        next.children = safe("pip native pin children", (...args: any[]) => walkButton(children(...args), config, false));
    } else if (props.children != null) next.children = walkButton(props.children, config, clearRefs);
    const type = iconType(el.type);
    if (type !== el.type || iconWrappers.has(type)) next[CONFIG] = config;
    return { ...el, type, props: next, ...(clearRefs && typeof props.onPress === "function" ? { ref: null } : {}) };
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

function Pin({ template, participant, floating, footer }: { template: any; participant: any; floating?: boolean; footer?: boolean; }) {
    const context = React.useContext(SourceContext);
    if (context && !floating) {
        participant = context.participant;
        floating = context.floating;
    }
    const on = useSplitViewSettings((s: any) => s.pipPins !== false);
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    const owner = React.useRef({}).current;
    const source = participant?.id != null ? `${floating ? "floating" : "call"}:${participant.id}` : null;
    React.useEffect(() => {
        mounted++;
        if (floating) floatingMounted++;
        const off = onPinChange(force);
        const offSplit = onSplitChange(force);
        return () => {
            mounted--;
            if (floating) floatingMounted--;
            off();
            offSplit();
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
    if (!floating && !!footer !== isSplitActive()) return null;
    if (source && floatingOwners.get(source) !== owner) return null;
    const here = pinnedPip() === String(participant.id);
    const label = here ? "Unpin from picture in picture" : "Pin to picture in picture";
    return cloneButton(template, label, safe("pip pin press", () => pinPip(here ? null : String(participant.id))));
}

export function PipPin(props: { template: any; participant: any; floating?: boolean; footer?: boolean; }) {
    return <Guard><Pin {...props} /></Guard>;
}

function scopedType(type: any, scope: PinScope, host = false): any {
    if (!type || wrapped.has(type) || pipType(type)) return type;
    const name = nameOf(type);
    if (/^(?:RCT|Animated|View$|Pressable|Touchable|Gesture|Text|Image|Icon|Scroll|Svg|Guard|PipPin|PinScope|SourceHost|MainPinRow)/i.test(name) || !host && /^Native/i.test(name)) return type;
    const id = `${scope.floating ? "floating" : "call"}:${scope.participant.id}:${host}`;
    let cache = wrappers.get(id);
    if (!cache) wrappers.set(id, cache = new WeakMap());
    const found = cache.get(type);
    if (found) return found;
    const run = (original: Function, self: any, args: any[]) => {
        if (!active) return original.apply(self, args);
        scopes.push(scope);
        try {
            const tree = bindPinTree(original.apply(self, args), scope);
            return host && !scope.floating ? withMainRow(tree) : tree;
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
    else if (type.$$typeof === Symbol.for("react.memo") && type.type) wrapper = React.memo(scopedType(type.type, scope, host), type.compare);
    else return type;
    wrapper.displayName = name;
    if (type.defaultProps) wrapper.defaultProps = type.defaultProps;
    cache.set(type, wrapper);
    wrapped.add(wrapper);
    return wrapper;
}

export const scopePinTile = safe("pip pin scope", (args: any[]) => {
    const props = args[1];
    if (!active || !props || props[MARK] || typeof args[0] === "string" || !isPipRender() && pipType(args[0])) return;
    const floating = floatingPinParticipant(props);
    const inherited = scopes[scopes.length - 1];
    if (isPipRender() && !floating) return;
    if (!floating && !inherited && props.sharedCoords == null) return;
    const participant = floating ?? participantForPin(props) ?? inherited?.participant;
    if (!participant) return;
    const scope = { participant, floating: !!floating || !!inherited?.floating };
    const type = scopedType(args[0], scope, props.sharedCoords != null);
    if (type === args[0]) return;
    args[0] = type;
    return args;
});

function sourceHost(props: any): boolean {
    return props?.sharedCoords != null || props?.streamId != null || props?.isCamera !== undefined
        || props?.participant != null || props?.pipParticipant != null || props?.videoParticipant != null
        || props?.id != null && (props.type === 0 || props.type === 2 || props.streamKey != null || props.userId != null);
}

function animationStyles(style: any): any[] {
    if (Array.isArray(style)) return style.flatMap(animationStyles);
    const initial = style?.viewDescriptors && style.initial?.value;
    if (initial && (initial.transform != null || initial.opacity != null)
        && !Object.keys(initial).some(key => /^(?:width|height|top|left|right|bottom|x|y|position|flex|aspectRatio|margin|padding|min|max)/i.test(key))) return [style];
    return [];
}

function captureTemplate(tree: any, scope?: PinScope, animation: any[] = []) {
    const label = tree.props?.accessibilityLabel;
    if (typeof label !== "string" || !/^(?:unfocus|focus)\s+/i.test(label) || !iconControl(tree)) return;
    const first = !nativeTemplate;
    const previous = scope?.participant?.id != null ? sourceTemplates.get(String(scope.participant.id)) : nativeTemplate;
    const template = { button: tree, animation: animation.length ? animation : previous?.animation ?? [] };
    nativeTemplate = template;
    if (scope?.participant?.id != null && !scope.floating) sourceTemplates.set(String(scope.participant.id), template);
    if (first) templateListeners.forEach(safe("pip native template", listener => listener()));
}

function MainPinRow() {
    const scope = React.useContext(SourceContext);
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    const owner = React.useRef({}).current;
    const source = scope?.row && !scope.floating && !mineParticipant(scope.participant) ? String(scope.participant.id) : null;
    React.useEffect(() => {
        templateListeners.add(force);
        const off = onSplitChange(force);
        return () => {
            templateListeners.delete(force);
            off();
        };
    }, []);
    React.useEffect(() => {
        if (!source) return;
        rowListeners.add(force);
        return () => {
            rowListeners.delete(force);
            if (rowOwners.get(source) === owner) {
                rowOwners.delete(source);
                rowListeners.forEach(safe("pip row owner", listener => listener()));
            }
        };
    }, [source]);
    React.useEffect(() => {
        if (source && !rowOwners.has(source)) {
            rowOwners.set(source, owner);
            rowListeners.forEach(safe("pip row owner", listener => listener()));
        }
    });
    if (!active || !scope?.row || scope.floating || mineParticipant(scope.participant)) return null;
    if (!source || rowOwners.get(source) !== owner) return null;
    const split = isSplitActive();
    if (!split && sourceTemplates.has(source)) return null;
    const template = sourceTemplates.get(String(scope.participant.id)) ?? nativeTemplate;
    if (!template) return null;
    const relative = { position: "relative", top: undefined, left: undefined, right: undefined, bottom: undefined, maxHeight: VIDEO_FOOTER, maxWidth: VIDEO_FOOTER };
    const native = template.button.props.style;
    const style = typeof native === "function" ? (state: any) => [native(state), relative] : [native, relative];
    const button = { ...template.button, props: { ...template.button.props, style } };
    return <View pointerEvents="box-none" style={[{ position: "absolute", ...(split ? { top: "100%" } : { bottom: 0 }), left: 0, right: 0, height: VIDEO_FOOTER, alignItems: "flex-end", justifyContent: "center" }, ...template.animation]}>
        <PipPin template={button} participant={scope.participant} footer={split} />
    </View>;
}

function SourceHost({ scope, children }: { scope: PinScope; children?: any; }) {
    React.useContext(SourceContext);
    if (!active) return children;
    const row = !scope.floating;
    return <SourceContext.Provider value={{ ...scope, row }}>{children}</SourceContext.Provider>;
}

function rowType(type: any): any {
    if (!type || typeof type !== "function" && typeof type !== "object") return type;
    const found = rowWrappers.get(type);
    if (found) return found;
    const name = nameOf(type);
    if (pipType(type) || /^(?:RCT|View$|Pressable|Touchable|Gesture|Image|Text|Icon|Svg|Guard|PipPin|SourceHost|MainPinRow)/i.test(name)) return type;
    let wrapper: any;
    const run = (original: Function, self: any, args: any[]) => {
        const tree = original.apply(self, args);
        return active ? withMainRow(tree) : tree;
    };
    if (typeof type === "function" && type.prototype?.isReactComponent) wrapper = class extends type { render() { return run(super.render, this, []); } };
    else if (typeof type === "function") wrapper = function (this: any, ...args: any[]) { return run(type, this, args); };
    else if (type.$$typeof === Symbol.for("react.forward_ref") && typeof type.render === "function") wrapper = React.forwardRef((props: any, ref: any) => run(type.render, undefined, [props, ref]));
    else if (type.$$typeof === Symbol.for("react.memo") && type.type) wrapper = React.memo(rowType(type.type), type.compare);
    else return type;
    wrapper.displayName = name;
    if (type.defaultProps) wrapper.defaultProps = type.defaultProps;
    rowWrappers.set(type, wrapper);
    rowWrappers.set(wrapper, wrapper);
    return wrapper;
}

function withMainRow(tree: any, level = 0): any {
    if (Array.isArray(tree)) {
        let done = false;
        return tree.map(child => {
            if (done) return child;
            const next = withMainRow(child, level);
            done = next !== child;
            return next;
        });
    }
    if (!tree || typeof tree !== "object" || !("$$typeof" in tree) || level > 5 || rowHosts.has(tree) || provided.has(tree)) return tree;
    const name = nameOf(tree.type);
    const props = tree.props ?? {};
    if (/^(?:RCTView|View|Animated.*View|Pressable|Touchable.*)$/i.test(name) && props.children != null && !iconControl(tree)) {
        const style = flatControlStyle(props.style);
        let children = props.children;
        let nextStyle = props.style;
        if (style.overflow === "hidden") {
            const clip: any = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" };
            for (const key of ["borderRadius", "borderTopLeftRadius", "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius", "borderCurve"]) if (style[key] !== undefined) clip[key] = style[key];
            children = React.createElement(View, { key: "cheeseburger-video-clip", pointerEvents: "box-none", style: clip }, children);
            nextStyle = typeof props.style === "function" ? (state: any) => [props.style(state), { overflow: "visible" }] : [props.style, { overflow: "visible" }];
        }
        const out = { ...tree, props: { ...props, style: nextStyle, children: [children,
            React.createElement(Guard, { key: "cheeseburger-pin-row" }, React.createElement(MainPinRow))] } };
        rowHosts.add(out);
        return out;
    }
    const type = rowType(tree.type);
    if (type !== tree.type) return { ...tree, type };
    if (Array.isArray(props.children)) {
        let done = false;
        const children = props.children.map((child: any) => {
            if (done) return child;
            const next = withMainRow(child, level + 1);
            done = next !== child;
            return next;
        });
        return done ? { ...tree, props: { ...props, children } } : tree;
    }
    const children = withMainRow(props.children, level + 1);
    return children === props.children ? tree : { ...tree, props: { ...props, children } };
}

function bindPinTree(tree: any, scope: PinScope, level = 0, animation: any[] = []): any {
    if (Array.isArray(tree)) return tree.map(child => bindPinTree(child, scope, level, animation));
    if (!tree || typeof tree !== "object" || !("$$typeof" in tree) || level > 10 || tree.props?.[MARK] || provided.has(tree) || injected.has(tree)) return tree;
    const props = tree.props ?? {};
    const participant = sourceHost(props) ? participantForPin(props) : null;
    const nested = participant && !scope.floating && participant.id !== scope.participant?.id ? { participant, floating: false } : scope;
    const ownAnimation = sourceHost(props) ? [] : animationStyles(props.style);
    const nativeAnimation = sourceHost(props) ? [] : ownAnimation.length ? ownAnimation : animation;
    if (!nested.floating) captureTemplate(tree, nested, nativeAnimation);
    const children = props.children;
    const nextChildren = children != null && typeof children !== "function" ? bindPinTree(children, nested, level + 1, nativeAnimation) : children;
    const type = scopedType(tree.type, nested, props.sharedCoords != null);
    const next = nextChildren === children && type === tree.type ? tree : { ...tree, type, props: { ...props, children: nextChildren } };
    scopes.push(nested);
    try {
        const out = addPipPin([tree.type, props], next) ?? next;
        if (nested === scope) return out;
        const host = React.createElement(SourceHost, { scope: nested }, out);
        provided.add(host);
        sourceHosts++;
        return host;
    } finally {
        scopes.pop();
    }
}

export const bindPinScope = safe("pip pin source host", (args: any[], ret: any) => {
    if (!active || !ret || typeof ret !== "object" || ret.props?.[MARK] || provided.has(ret)) return;
    const props = args[1];
    if (!sourceHost(props) || !isPipRender() && pipType(args[0])) return;
    const floating = floatingPinParticipant(props);
    if (isPipRender() && !floating) return;
    if (!floating && props.sharedCoords == null) return;
    const participant = floating ?? participantForPin(props);
    if (!participant) return;
    const scope = { participant, floating: !!floating };
    let tree = bindPinTree(ret, scope);
    if (!scope.floating && /^(?:RCTView|View|Animated.*View|Pressable|Touchable.*)$/i.test(nameOf(args[0]))) tree = withMainRow(tree);
    const out = React.createElement(SourceHost, { scope }, tree);
    provided.add(out);
    sourceHosts++;
    return out;
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
    if (!floating) {
        focusControls++;
        captureTemplate(ret, inherited);
        if (isSplitActive()) return;
    }
    if (floating && !iconControl(ret)) {
        unsafeControls++;
        return;
    }
    focusControls++;
    nativeStyle = placement(props.style);
    const participant = floating ?? participantForPin(props) ?? inherited?.participant;
    if (!participant) {
        noParticipant++;
        contextPins++;
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
    rowOwners.clear();
    sourceTemplates.clear();
    nativeTemplate = null;
}

export function pinControlsDebug(): string {
    return `pin controls: native clones ${cloned}, focus controls ${focusControls}, mounted ${mounted}, floating ${floatingMounted}, hosts ${sourceHosts}, context pins ${contextPins}, unsafe ${unsafeControls}, missing participant ${noParticipant}, missing icon ${noIcon}, icon ${pinIconName || "not seen yet"}; native placement ${nativeStyle}, parent ${parentStyle}; floating controls ${[...floatingControls].join("; ") || "not rendered"}`;
}
