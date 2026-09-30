import { findAssetId } from "@api/assets";
import { React } from "@metro/common";
import { Image, StyleSheet, Text } from "react-native";

import { caught, safe } from "../crash";
import { accentColor } from "../style/colors";
import { mineParticipant, onPinChange, participantForStream, pinnedPip, pinPip } from "./pip";
import { useSplitViewSettings } from "./storage";

const ICONS = ["PictureInPictureIcon", "PipIcon", "ic_pip", "PopoutIcon", "WindowLaunchIcon", "ScreenArrowIcon"];
const KEY = "cheeseburger-pip";
const LABEL = /^(?:stop watching|focus\b|more options$)/i;
const info = new WeakMap<object, { streams: Set<string>; pinned: boolean; }>();
const scopes = new WeakMap<object, Map<string, any>>();
const scoped = new WeakSet<object>();
const streamStack: string[] = [];
let rows = 0;
let mounted = 0;
let templateName = "";
let icon: number | null | undefined;
export let pinIconName = "";

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

const nameOf = (el: any) => el?.type?.displayName ?? el?.type?.name ?? "";

function replaceIcon(el: any, pinned: boolean, depth = 0): any {
    if (Array.isArray(el)) return el.map(c => replaceIcon(c, pinned, depth));
    if (!React.isValidElement(el) || depth > 6) return el;
    const props = el.props as any;
    if (/Icon$/.test(nameOf(el)) || props.source != null) {
        const source = pinIcon();
        return source != null
            ? <Image key={el.key ?? undefined} source={source} style={{ width: 20, height: 20, tintColor: pinned ? accentColor("#ff0048") : "#ffffff" }} />
            : <Text key={el.key ?? undefined} style={{ color: "#ffffff", fontSize: 11, fontWeight: "700" }}>PiP</Text>;
    }
    return props.children == null ? el : React.cloneElement(el as any, undefined, replaceIcon(props.children, pinned, depth + 1));
}

function Pin({ streamId, base }: { streamId: string; base: any; }) {
    const enabled = useSplitViewSettings((s: any) => s.pipPins !== false);
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => onPinChange(force), []);
    React.useEffect(() => {
        mounted++;
        return () => { mounted = Math.max(0, mounted - 1); };
    }, []);
    const part = participantForStream(streamId);
    if (!enabled || !part || mineParticipant(part)) return null;
    const pinned = pinnedPip() === part.id;
    return React.cloneElement(base, {
        key: KEY,
        ref: undefined,
        accessibilityLabel: pinned ? "Unpin from picture in picture" : "Pin to picture in picture",
        accessibilityHint: undefined,
        accessibilityState: { selected: pinned },
        accessibilityActions: undefined,
        onAccessibilityAction: undefined,
        onLongPress: undefined,
        onPress: safe("pip pin press", () => pinPip(pinned ? null : part.id)),
    }, replaceIcon(base.props.children, pinned));
}

function PipPin(props: { streamId: string; base: any; }) {
    return <Guard><Pin {...props} /></Guard>;
}

export function markVideoElement(el: any, streamId: any) {
    if (el && typeof el === "object") info.set(el, { streams: new Set([String(streamId)]), pinned: false });
}

function collect(el: any, depth = 0): { streams: Set<string>; pinned: boolean; } {
    const out = { streams: new Set<string>(), pinned: false };
    if (!el || typeof el !== "object" || depth > 6) return out;
    if (!Array.isArray(el)) {
        const hit = info.get(el);
        if (hit) return hit;
        if (el.key === KEY || el.type === PipPin) out.pinned = true;
        const sid = el.props?.streamId ?? el.props?.participant?.streamId;
        if (sid != null) out.streams.add(String(sid));
    }
    const children = Array.isArray(el) ? el : el.props?.children;
    for (const child of Array.isArray(children) ? children.slice(0, 20) : [children]) {
        const hit = collect(child, depth + 1);
        hit.streams.forEach(sid => out.streams.add(sid));
        out.pinned ||= hit.pinned;
    }
    if (!Array.isArray(el)) info.set(el, out);
    return out;
}

function insert(el: any, sid: string, depth = 0): any {
    if (!React.isValidElement(el) || depth > 6) return el;
    const props = el.props as any;
    const children = props.children;
    if (Array.isArray(children)) {
        const buttons = children.filter(c => typeof c?.props?.onPress === "function" && LABEL.test(c.props.accessibilityLabel ?? ""));
        const style = typeof props.style === "function" ? null : StyleSheet.flatten(props.style);
        if (buttons.length && (style?.flexDirection === "row" || buttons.length > 1)) {
            const base = buttons.find(c => /stop watching|focus/i.test(c.props.accessibilityLabel)) ?? buttons[0];
            if (base.props.children == null) return el;
            rows++;
            templateName = (nameOf(base) || "pressable") + " > " + (nameOf(Array.isArray(base.props.children) ? base.props.children[0] : base.props.children) || "icon");
            const next = React.cloneElement(el as any, undefined, [...children, <PipPin key={KEY} streamId={sid} base={base} />]);
            info.set(next, { streams: new Set([sid]), pinned: true });
            return next;
        }
    }
    if (children == null || typeof children === "function") return el;
    let changed = false;
    const next = (Array.isArray(children) ? children : [children]).map(child => {
        if (changed) return child;
        const out = insert(child, sid, depth + 1);
        changed ||= out !== child;
        return out;
    });
    if (!changed) return el;
    const out = React.cloneElement(el as any, undefined, Array.isArray(children) ? next : next[0]);
    info.set(out, { streams: new Set([sid]), pinned: true });
    return out;
}

export function integratePinControls(el: any) {
    if (!el?.props?.children) return el;
    const found = collect(el);
    if (found.pinned || found.streams.size > 1) return el;
    const sid = [...found.streams][0] ?? streamStack[streamStack.length - 1];
    if (sid == null) return el;
    const part = participantForStream(sid);
    return part && !mineParticipant(part) ? insert(el, sid) : el;
}

export function scopePinControls(args: any[]) {
    const [type, props] = args;
    if (typeof type !== "function" || type.prototype?.isReactComponent || scoped.has(type) || !props) return;
    if ("isCamera" in props || "videoSpinnerContext" in props || typeof props.onSize === "function") return;
    const name = type.displayName ?? type.name ?? "";
    const own = props.streamId ?? props.participant?.streamId;
    const sid = own != null ? String(own) : /Overlay|Controls|Actions|Buttons/.test(name) ? streamStack[streamStack.length - 1] : undefined;
    if (sid == null) return;
    let cache = scopes.get(type);
    if (!cache) scopes.set(type, cache = new Map());
    let wrapped = cache.get(sid);
    if (!wrapped) {
        wrapped = function (this: any, ...a: any[]) {
            streamStack.push(sid);
            try {
                const out = type.apply(this, a);
                try {
                    return integratePinControls(out);
                } catch (e) {
                    caught("pip native controls", e);
                    return out;
                }
            } finally {
                streamStack.pop();
            }
        };
        wrapped.displayName = name;
        if (type.defaultProps) wrapped.defaultProps = type.defaultProps;
        scoped.add(wrapped);
        cache.set(sid, wrapped);
    }
    args[0] = wrapped;
}

export const pinDebug = () => "pin controls: native rows " + rows + ", mounted " + mounted + ", template " + (templateName || "not seen yet") + ", icon " + (pinIconName || "not seen yet");
