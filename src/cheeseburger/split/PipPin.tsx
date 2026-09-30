import { findAssetId } from "@api/assets";
import { findByStoreName } from "@metro";
import { React } from "@metro/common";
import { SelectedChannelStore } from "@metro/common/stores";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { caught, safe } from "../crash";
import { accentColor } from "../style/colors";
import { iconComponent } from "../toolbar";
import { mineParticipant, onPinChange, participantForStream, participantForTile, pinnedPip, pinPip } from "./pip";
import { useSplitViewSettings } from "./storage";

interface PinProps { streamId?: any; template: any; parentName: string; animation: string; }
const ICONS = ["PinIcon", "PinSmallIcon", "PinMediumIcon", "PinFilledIcon", "PictureInPictureIcon", "PipIcon", "ic_pip"];
const FOCUS = /^(?:focus|unfocus|full ?screen|enter full ?screen|exit full ?screen|maximi[sz]e|expand)\b/i;
const NATIVE_VIEW = /^(?:View|RCTView|REAWorkaroundView|AnimatedComponent|AnimatedView|AnimatedComponent\(View\)|Animated\(View\))$/;
const elements = new WeakMap<object, string>();
const bindings = new Map<number, string>();
const examples = new Set<string>();
let icon: number | null | undefined;
let mounted = 0;
let rows = 0;
let seenControls = 0;
let serial = 0;
export let pinIconName = "";

const nameOf = (t: any) => typeof t === "string" ? t : t?.displayName ?? t?.name ?? t?.render?.displayName ?? t?.render?.name ?? t?.type?.displayName ?? t?.type?.name ?? "";

export function markVideoElement(el: any, streamId: any) {
    if (el && typeof el === "object" && streamId != null) elements.set(el, String(streamId));
}

function streamsIn(el: any, out: Set<string>, depth = 0) {
    if (!el || typeof el !== "object" || depth > 6 || out.size > 1) return;
    if (Array.isArray(el)) {
        if (el.length <= 12) el.forEach(c => streamsIn(c, out, depth + 1));
        return;
    }
    const sid = elements.get(el) ?? (el.props?.sharedCoords && el.props.streamId != null ? String(el.props.streamId) : null);
    if (sid) out.add(sid);
    streamsIn(el.props?.children, out, depth + 1);
}

function containsPill(el: any, depth = 0): boolean {
    if (!el || typeof el !== "object" || depth > 4) return false;
    if (Array.isArray(el)) return el.some(c => containsPill(c, depth));
    return /ButtonPill/.test(nameOf(el.type)) || el.type === React.Fragment && containsPill(el.props?.children, depth + 1);
}

function nativeControl(el: any): boolean {
    const props = el?.props;
    if (!props || props.cheeseburgerPin || typeof props.onPress !== "function") return false;
    const label = props.accessibilityLabel ?? "";
    return (el.type === Pressable || /Pressable/.test(nameOf(el.type))) && FOCUS.test(label) && containsPill(props.children);
}

function focusChild(node: any, depth = 0): any {
    if (!node || depth > 8) return null;
    if (Array.isArray(node)) {
        for (const child of node) {
            const found = focusChild(child, depth + 1);
            if (found) return found;
        }
        return null;
    }
    if (nativeControl(node)) return node;
    return node.type === React.Fragment ? focusChild(node.props?.children, depth + 1) : null;
}

function hasOwnPin(node: any, depth = 0): boolean {
    if (!node || depth > 8) return false;
    if (Array.isArray(node)) return node.some(child => hasOwnPin(child, depth + 1));
    return node.key === "cheeseburger-pip" || node.type === React.Fragment && hasOwnPin(node.props?.children, depth + 1);
}

function partFromProps(props: any): any {
    if (!props || typeof props !== "object") return null;
    if (props.sharedCoords || props.streamId != null || props.participant?.id != null) {
        const direct = participantForTile(props);
        if (direct?.streamId != null) return direct;
    }
    const channel = SelectedChannelStore?.getVoiceChannelId?.();
    const list = channel ? findByStoreName("ChannelRTCStore")?.getParticipants?.(channel) : null;
    if (!Array.isArray(list)) return null;
    for (const key of ["participant", "videoParticipant", "tile"]) {
        const value = props[key];
        const id = value?.participant?.id ?? value?.id;
        const part = id != null ? list.find(p => String(p.id) === String(id)) : value?.streamId != null ? participantForStream(value.streamId) : null;
        if (part?.streamId != null) return part;
    }
    for (const key of ["participantId", "id"]) {
        if (props[key] == null) continue;
        const part = list.find(p => String(p.id) === String(props[key]));
        if (part?.streamId != null) return part;
    }
    return null;
}

function animationKeys(style: any): string {
    const keys = new Set<string>();
    const visit = (value: any, depth = 0) => {
        if (!value || depth > 4) return;
        if (Array.isArray(value)) return void value.forEach(c => visit(c, depth + 1));
        if (typeof value !== "object" || !value.viewDescriptors || !value.initial?.value) return;
        for (const key of ["transform", "opacity"]) if (key in value.initial.value) keys.add(key);
    };
    visit(style);
    return [...keys].join("+");
}

export function integratePinControls(el: any, streamId?: any): any {
    if (!React.isValidElement(el)) return el;
    if (streamId == null) {
        const streams = new Set<string>();
        streamsIn(el, streams);
        if (streams.size === 1) streamId = [...streams][0];
    }
    let added = false;
    const visit = (node: any, depth = 0, inherited = ""): any => {
        if (Array.isArray(node)) {
            const next = node.map(c => visit(c, depth, inherited));
            return next.some((c, i) => c !== node[i]) ? next : node;
        }
        if (!React.isValidElement(node) || depth > 6 || node.key === "cheeseburger-pip") return node;
        const props = node.props as any;
        if (props.cheeseburgerPin || props.children == null || typeof props.children === "function") return node;
        const children = props.children;
        const list = Array.isArray(children) ? children : [children];
        if (hasOwnPin(children)) {
            added = true;
            return node;
        }
        const animation = [...new Set([...inherited.split("+"), ...animationKeys(props.style).split("+")].filter(Boolean))].join("+");
        const template = focusChild(children);
        if (template && examples.size < 8) examples.add(`${nameOf(node.type) || "node"}: focus parent, native ${animation || "none"}`);
        if (template && !added && (node.type === View || NATIVE_VIEW.test(nameOf(node.type)))) {
            added = true;
            rows++;
            const bound = partFromProps(props) ?? partFromProps(template.props);
            if (bound && mineParticipant(bound)) return node;
            const parentName = nameOf(node.type) || "view";
            if (examples.size < 8) examples.add(`${parentName} > ${nameOf(template.type)}, native ${animation || "ancestor"}`);
            const pin = React.createElement(PipPin, { key: "cheeseburger-pip", streamId: bound?.streamId ?? streamId, template, parentName, animation });
            return React.cloneElement(node as any, undefined, [...list, pin]);
        }
        if (nativeControl(node)) seenControls++;
        const next = visit(children, depth + 1, animation);
        return next === children ? node : React.cloneElement(node as any, undefined, next);
    };
    return visit(el);
}

export function startPinControls() { bindings.clear(); }
export function stopPinControls() { bindings.clear(); }

function pinIcon() {
    if (icon !== undefined) return icon;
    icon = null;
    for (const name of ICONS) {
        const id = findAssetId(name);
        if (id !== undefined) {
            icon = id;
            pinIconName = name;
            break;
        }
    }
    return icon;
}

class Guard extends React.Component<{ children?: any; }, { failed: boolean; }> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch(e: any) { caught("pip pin button", e); }
    render() { return this.state.failed ? null : this.props.children; }
}

function replaceIcon(el: any, color: string, pinned: boolean, depth = 0): any {
    if (Array.isArray(el)) return el.map(c => replaceIcon(c, color, pinned, depth));
    if (!React.isValidElement(el) || depth > 5) return el;
    const props = el.props as any;
    if (/Icon$/.test(nameOf(el.type)) || props.source != null) {
        for (const name of pinned ? ["UnpinIcon", ...ICONS] : ICONS) {
            const component = iconComponent(name);
            if (!component) continue;
            pinIconName = name;
            return React.createElement(component, { ...props, ref: null, color, source: undefined, nativeID: undefined, testID: undefined, id: undefined, style: [props.style, { tintColor: color }], cheeseburgerPin: true });
        }
        const flat = StyleSheet.flatten(props.style) ?? {};
        const size = typeof props.size === "number" ? props.size : typeof flat.width === "number" ? flat.width : 20;
        const source = pinIcon();
        return source != null ? <Image source={source} style={{ width: size, height: size, tintColor: color }} /> : <Text style={{ color, fontSize: Math.max(10, size * 0.55) }}>PiP</Text>;
    }
    return React.cloneElement(el as any, { ref: null }, ...(props.children == null ? [] : [replaceIcon(props.children, color, pinned, depth + 1)]));
}

function hostFiber(node: any): any {
    const direct = node?._internalInstanceHandle ?? node?.__internalInstanceHandle ?? node?._internalFiberInstanceHandleDEV;
    if (direct) return direct;
    const renderers = (globalThis as any).__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers;
    if (renderers && typeof renderers.values === "function") {
        let count = 0;
        for (const renderer of renderers.values()) {
            if (++count > 4) break;
            try {
                const fiber = renderer.findFiberByHostInstance?.(node) ?? renderer.findFiberByHostInstance?.(node?._nativeTag ?? node?.__nativeTag);
                if (fiber) return fiber;
            } catch { }
        }
    }
    return null;
}

function Pin(props: PinProps) {
    const enabled = useSplitViewSettings((s: any) => s.pipPins !== false);
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    const [id] = React.useState(() => ++serial);
    const latest = React.useRef(props);
    latest.current = props;
    const host = React.useRef<any>(null);
    const binding = React.useRef<any>(null);
    const inspect = React.useCallback(safe("pip pin bind", () => {
        const scope = latest.current;
        let part = scope.streamId != null ? participantForStream(scope.streamId) : null;
        let from = part ? "tile" : "unbound";
        if (!host.current && !part && binding.current?.id) {
            const channel = SelectedChannelStore?.getVoiceChannelId?.();
            const current = channel ? findByStoreName("ChannelRTCStore")?.getParticipants?.(channel) : null;
            part = Array.isArray(current) ? current.find(p => p.id === binding.current.id) ?? null : null;
            if (part) from = "retained native binding";
        }
        let animation = scope.animation;
        let fiber = hostFiber(host.current);
        const foundFiber = !!fiber;
        const ancestry: string[] = [];
        let foundAncestor = false;
        const explicit = !!part && from === "tile";
        for (let depth = 0; fiber && depth < 22; depth++, fiber = fiber.return) {
            const values = fiber.memoizedProps ?? fiber.pendingProps;
            animation = [...new Set([...animation.split("+"), ...animationKeys(values?.style).split("+")].filter(Boolean))].join("+");
            if (ancestry.length < 8) ancestry.push(`${nameOf(fiber.type) || "node"}[${Object.keys(values ?? {}).slice(0, 8).join(",")}]`);
            const sources = new Set<string>();
            streamsIn(values?.children, sources);
            if (sources.size > 1) break;
            if (!explicit && sources.size === 1) {
                const source = participantForStream([...sources][0]);
                if (source) {
                    part = source;
                    from = `native video sibling ${depth}`;
                    foundAncestor = true;
                    break;
                }
            }
            if (!part && !foundAncestor && !values?.cheeseburgerPin && !values?.template) {
                const candidate = partFromProps(values);
                if (candidate) {
                    part = candidate;
                    from = `native ancestor ${depth}`;
                    foundAncestor = true;
                }
            }
        }
        if (!part && scope.template?._owner) {
            let owner = scope.template._owner;
            for (let depth = 0; owner && depth < 12; depth++, owner = owner.return) {
                const candidate = partFromProps(owner.memoizedProps ?? owner.pendingProps);
                if (candidate) { part = candidate; from = `element owner ${depth}`; break; }
            }
        }
        bindings.set(id, `${scope.parentName}: ${from}${part ? ` stream ${part.streamId}${mineParticipant(part) ? " (self)" : ""}` : `, host fiber ${foundFiber ? "yes" : "no"}`}, slide ${animation || "not found"}${!part ? `, ${ancestry.join(" > ")}` : ""}`);
        const changed = binding.current?.id !== part?.id || String(binding.current?.streamId) !== String(part?.streamId);
        binding.current = part;
        if (changed) force();
    }), []);
    const ownRef = React.useCallback(safe("pip pin ref", (node: any) => {
        host.current = node;
        if (node) inspect();
    }), []);
    React.useEffect(() => {
        const off = onPinChange(safe("pip pin refresh", () => { inspect(); force(); }));
        mounted++;
        return () => { off(); bindings.delete(id); mounted = Math.max(0, mounted - 1); };
    }, []);
    React.useEffect(() => { inspect(); });
    const part = binding.current ?? (props.streamId != null ? participantForStream(props.streamId) : null);
    const usable = part?.streamId != null;
    const visible = enabled && usable && !mineParticipant(part);
    const pinned = usable && pinnedPip() === part.id;
    const color = pinned ? accentColor("#ff0048") : "#ffffff";
    const original = props.template.props.style;
    const style = safe("pip pin style", (state: any) => {
        const base = typeof original === "function" ? original(state) : original;
        const flat = StyleSheet.flatten(base) ?? {};
        return [base, { position: "absolute", left: undefined, right: (typeof flat.right === "number" ? flat.right : 0) + (typeof flat.width === "number" ? flat.width : 32) + 8, top: typeof flat.top === "number" ? flat.top : 0, bottom: undefined }];
    });
    const button = visible ? React.createElement(props.template.type, {
        cheeseburgerPin: true,
        accessibilityRole: "button",
        accessibilityLabel: pinned ? "Unpin from picture in picture" : "Pin to picture in picture",
        accessibilityState: { selected: pinned, disabled: !usable },
        disabled: !usable,
        hitSlop: props.template.props.hitSlop,
        pressRetentionOffset: props.template.props.pressRetentionOffset,
        android_ripple: props.template.props.android_ripple,
        android_disableSound: props.template.props.android_disableSound,
        unstable_pressDelay: props.template.props.unstable_pressDelay,
        delayLongPress: props.template.props.delayLongPress,
        collapsable: props.template.props.collapsable,
        style: typeof original === "function" ? style : style({ pressed: false }),
        onPress: safe("pip pin press", () => {
            inspect();
            const target = binding.current;
            if (target?.streamId != null && !mineParticipant(target)) pinPip(pinnedPip() === target.id ? null : target.id);
        }),
    }, replaceIcon(props.template.props.children, color, pinned)) : null;
    return <React.Fragment><View ref={ownRef} collapsable={false} onLayout={inspect} pointerEvents="none" style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} />{button}</React.Fragment>;
}

function PipPin(props: PinProps) { return <Guard><Pin {...props} /></Guard>; }

export const pinDebug = () => `pin controls: native parents ${rows}, focus controls ${seenControls}, mounted ${mounted}, icon ${pinIconName || "not seen yet"}; ${[...examples].join("; ") || "no native focus parent seen"}; bindings ${[...bindings.values()].slice(0, 8).join("; ") || "none"}`;
