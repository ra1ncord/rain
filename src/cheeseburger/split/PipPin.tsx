import { findAssetId } from "@api/assets";
import { React } from "@metro/common";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { caught, safe } from "../crash";
import { accentColor } from "../style/colors";
import { mineParticipant, onPinChange, participantForStream, participantForTile, pinnedPip, pinPip } from "./pip";
import { useSplitViewSettings } from "./storage";
import { watchChrome } from "./tiles";

interface Scope { sid: any; depth: number; }
interface PinProps { streamId: any; template: any; }
const ICONS = ["PictureInPictureIcon", "PipIcon", "ic_pip", "PopoutIcon", "WindowLaunchIcon", "ScreenArrowIcon"];
const LABEL = /^(?:focus|unfocus|full ?screen|enter full ?screen|exit full ?screen|maximi[sz]e|expand)\b/i;
const SKIP = /Icon$|Text|Image|Avatar|Spinner|Svg|Lottie|Rive|Gesture|Portal|Modal|Tooltip/;
const core = new Set([View, Pressable, Text, Image, Pin, PipPin]);
const wrappers = new Map<string, WeakMap<object, any>>();
const wrapperTypes = new WeakSet<object>();
const buttons = new WeakMap<object, Scope>();
const samples = new Set<string>();
let current: Scope | null = null;
let icon: number | null | undefined;
let mounted = 0;
let rows = 0;
export let pinIconName = "";

const nameOf = (t: any) => t?.displayName ?? t?.name ?? t?.render?.name ?? t?.type?.name ?? "";

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
    componentDidCatch(e: any) { caught("pip pin", e); }
    render() { return this.state.failed ? null : this.props.children; }
}

function wrapType(type: any, scope: Scope): any {
    if (!type || typeof type === "string" || typeof type === "symbol" || core.has(type) || wrapperTypes.has(type) || SKIP.test(nameOf(type))) return null;
    let inner = type;
    while (inner?.$$typeof === Symbol.for("react.memo")) inner = inner.type;
    const render = typeof inner === "function" && !inner.prototype?.isReactComponent ? inner : inner?.render;
    if (typeof render !== "function") return null;
    const key = `${scope.sid}:${scope.depth}`;
    let cache = wrappers.get(key);
    if (!cache) wrappers.set(key, cache = new WeakMap());
    const existing = cache.get(type);
    if (existing) return existing;
    const Render = React.forwardRef((props: any, ref: any) => {
        const previous = current;
        current = scope;
        try {
            const out = render(props, ref);
            const buttonScope = out && typeof out === "object" ? buttons.get(out) : null;
            if (!buttonScope || props.cheeseburgerPinSibling) return out;
            const part = participantForStream(buttonScope.sid);
            if (!part || mineParticipant(part)) return out;
            rows++;
            return React.createElement(React.Fragment, null, out, React.createElement(PipPin, { key: "cheeseburger-pip", streamId: buttonScope.sid, template: out }));
        } finally {
            current = previous;
        }
    });
    const Wrapped = React.forwardRef((props: any, ref: any) => React.createElement(Guard, null, React.createElement(Render, { ...props, ref })));
    Wrapped.displayName = nameOf(type);
    if (type.defaultProps) (Wrapped as any).defaultProps = type.defaultProps;
    wrapperTypes.add(Render);
    wrapperTypes.add(Wrapped);
    cache.set(type, Wrapped);
    return Wrapped;
}

export function scopePinControls(args: any[]) {
    const props = args[1];
    if (!props || props.cheeseburgerPin) return;
    const part = props.sharedCoords ? participantForTile(props) : null;
    let scope: Scope | null = part?.streamId != null ? { sid: part.streamId, depth: 0 } : current && current.depth < 6 ? { ...current, depth: current.depth + 1 } : null;
    if (!scope) {
        const streams = new Set<any>();
        collectStreams(props.children, streams);
        if (streams.size === 1) scope = { sid: [...streams][0], depth: 0 };
    }
    if (!scope) return;
    if (props.children != null && typeof props.children !== "function") args[1] = { ...props, children: decorateControls(props.children, scope) };
    const wrapped = wrapType(args[0], scope);
    if (wrapped) args[0] = wrapped;
}

function collectStreams(el: any, streams: Set<any>, depth = 0) {
    if (!el || typeof el !== "object" || depth > 4 || streams.size > 1) return;
    if (Array.isArray(el)) {
        if (el.length <= 12) el.forEach(c => collectStreams(c, streams, depth + 1));
        return;
    }
    if (el.props?.sharedCoords && el.props.streamId != null) streams.add(String(el.props.streamId));
    collectStreams(el.props?.children, streams, depth + 1);
}

function decorateControls(el: any, scope: Scope, depth = 0): any {
    if (Array.isArray(el)) return el.map(c => decorateControls(c, scope, depth));
    if (!React.isValidElement(el) || depth > 6) return el;
    const props = el.props as any;
    if (props.cheeseburgerPin || el.key === "cheeseburger-pip") return el;
    const label = props.accessibilityLabel ?? "";
    if (typeof props.onPress === "function" && (!label || LABEL.test(label)) && containsPill(props.children)) buttons.set(el, scope);
    const children = props.children;
    const next = children != null && typeof children !== "function" ? React.cloneElement(el as any, undefined, decorateControls(children, scope, depth + 1)) : el;
    const tagged = buttons.get(el);
    if (tagged) buttons.set(next, tagged);
    const wrapped = scope.depth + depth < 6 ? wrapType(next.type, { sid: scope.sid, depth: scope.depth + depth }) : null;
    const decorated = wrapped ? { ...next, type: wrapped } : next;
    if (tagged) buttons.set(decorated, tagged);
    return integratePinControls(decorated);
}

function containsPill(el: any, depth = 0): boolean {
    if (!el || typeof el !== "object" || depth > 5) return false;
    if (Array.isArray(el)) return el.some(c => containsPill(c, depth));
    return /ButtonPill/.test(nameOf(el.type)) || el.type === React.Fragment && containsPill(el.props?.children, depth + 1);
}

export function integratePinControls(el: any): any {
    if (!React.isValidElement(el)) return el;
    const props = el.props as any;
    if (props.cheeseburgerPin) return el;
    const label = props.accessibilityLabel ?? "";
    if (current && typeof props.onPress === "function" && (!label || LABEL.test(label)) && containsPill(props.children)) buttons.set(el, current);
    const children = props.children;
    if (children == null || typeof children === "function") return el;
    const list = Array.isArray(children) ? children : [children];
    const index = list.findIndex(c => c && typeof c === "object" && buttons.has(c));
    if (index === -1 || list.some(c => c?.props?.cheeseburgerPin || c?.key === "cheeseburger-pip")) return el;
    const template = list[index];
    const scope = buttons.get(template)!;
    const part = participantForStream(scope.sid);
    if (!part || mineParticipant(part)) return el;
    rows++;
    if (samples.size < 6) samples.add(`${nameOf(el.type) || "view"} > ${template.props.accessibilityLabel}, stream ${scope.sid}`);
    const pin = <PipPin key="cheeseburger-pip" streamId={scope.sid} template={template} />;
    const original = React.cloneElement(template, { cheeseburgerPinSibling: true });
    return React.cloneElement(el as any, undefined, [...list.slice(0, index), original, pin, ...list.slice(index + 1)]);
}

function replaceIcon(el: any, content: any, depth = 0): any {
    if (Array.isArray(el)) return el.map(c => replaceIcon(c, content, depth));
    if (!React.isValidElement(el) || depth > 6) return el;
    const props = el.props as any;
    if (/Icon$/.test(nameOf(el.type)) || props.source != null) return content;
    return props.children == null ? el : React.cloneElement(el as any, undefined, replaceIcon(props.children, content, depth + 1));
}

function pinStyle(style: any, pressed: any) {
    const original = typeof style === "function" ? style(pressed) : style;
    const flat = StyleSheet.flatten(original) ?? {};
    const size = typeof flat.width === "number" ? flat.width : 32;
    return [original, { position: "absolute", left: undefined, right: (typeof flat.right === "number" ? flat.right : 0) + size + 8, top: typeof flat.top === "number" ? flat.top : 0, bottom: undefined }];
}

function Pin({ streamId, template }: PinProps) {
    const enabled = useSplitViewSettings((s: any) => s.pipPins !== false);
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => {
        const offPin = onPinChange(safe("pip pin refresh", force));
        const offWatch = watchChrome();
        mounted++;
        return () => {
            offPin();
            offWatch();
            mounted = Math.max(0, mounted - 1);
        };
    }, []);
    const part = participantForStream(streamId);
    if (!enabled || !part || mineParticipant(part)) return null;
    const pinned = pinnedPip() === part.id;
    const source = pinIcon();
    const color = pinned ? accentColor("#ff0048") : "#ffffff";
    const content = source != null
        ? <Image key="pip-icon" source={source} style={{ width: 20, height: 20, tintColor: color }} />
        : <Text key="pip-icon" style={{ color, fontSize: 11, fontWeight: "700" }}>PiP</Text>;
    const originalStyle = template.props.style;
    return React.cloneElement(template, {
        ref: undefined,
        cheeseburgerPin: true,
        accessibilityRole: "button",
        accessibilityLabel: pinned ? "Unpin from picture in picture" : "Pin to picture in picture",
        accessibilityHint: undefined,
        accessibilityState: { selected: pinned },
        accessibilityActions: undefined,
        onAccessibilityAction: undefined,
        disabled: false,
        onPressIn: typeof template.props.onPressIn === "function" ? safe("pip pin down", template.props.onPressIn) : undefined,
        onPressOut: typeof template.props.onPressOut === "function" ? safe("pip pin up", template.props.onPressOut) : undefined,
        onLongPress: undefined,
        onPress: safe("pip pin press", () => pinPip(pinned ? null : part.id)),
        style: typeof originalStyle === "function" ? safe("pip pin style", (state: any) => pinStyle(originalStyle, state)) : pinStyle(originalStyle, null),
    }, replaceIcon(template.props.children, content));
}

function PipPin(props: PinProps) {
    return <Guard><Pin {...props} /></Guard>;
}

export const pinDebug = () => `pin controls: native parents ${rows}, mounted ${mounted}, animation inherited from parent, icon ${pinIconName || "not seen yet"}; ${[...samples].join("; ") || "no native tile controls yet"}`;
