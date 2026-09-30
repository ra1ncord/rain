import { findAssetId } from "@api/assets";
import { after } from "@api/patcher";
import { React } from "@metro/common";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { caught, safe } from "../crash";
import { accentColor } from "../style/colors";
import { mineParticipant, onPinChange, participantForStream, participantForTile, pinnedPip, pinPip } from "./pip";
import { useSplitViewSettings } from "./storage";

interface PinProps { streamId: any; template: any; }
const ICONS = ["PictureInPictureIcon", "PipIcon", "ic_pip", "PopoutIcon", "WindowLaunchIcon", "ScreenArrowIcon"];
const FOCUS = /^(?:focus|unfocus|full ?screen|enter full ?screen|exit full ?screen|maximi[sz]e|expand)\b/i;
const NATIVE_VIEW = /^(?:View|RCTView|REAWorkaroundView|AnimatedView|AnimatedComponent\(View\)|Animated\(View\))$/;
const elements = new WeakMap<object, string>();
const patched = new Set<string>();
const unpatches: (() => unknown)[] = [];
const shapes = new Map<string, string>();
let timer: ReturnType<typeof setTimeout> | null = null;
let icon: number | null | undefined;
let mounted = 0;
let rows = 0;
export let pinIconName = "";

const nameOf = (t: any) => t?.displayName ?? t?.name ?? t?.render?.name ?? t?.type?.name ?? "";

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
    return (el.type === Pressable || /Pressable/.test(nameOf(el.type))) && (!label || FOCUS.test(label)) && containsPill(props.children);
}

export function integratePinControls(el: any, streamId?: any): any {
    if (!React.isValidElement(el)) return el;
    if (streamId == null) {
        const streams = new Set<string>();
        streamsIn(el, streams);
        if (streams.size !== 1) return el;
        streamId = [...streams][0];
    }
    const part = participantForStream(streamId);
    if (!part || mineParticipant(part)) return el;
    let added = false;
    const visit = (node: any, depth = 0): any => {
        if (Array.isArray(node)) {
            const next = node.map(c => visit(c, depth));
            return next.some((c, i) => c !== node[i]) ? next : node;
        }
        if (!React.isValidElement(node) || depth > 6 || node.key === "cheeseburger-pip") return node;
        const props = node.props as any;
        if (props.cheeseburgerPin || props.children == null || typeof props.children === "function") return node;
        const children = props.children;
        const list = Array.isArray(children) ? children : [children];
        if (list.some(c => c?.key === "cheeseburger-pip")) {
            added = true;
            return node;
        }
        const index = !added && (node.type === View || NATIVE_VIEW.test(nameOf(node.type))) ? list.findIndex(nativeControl) : -1;
        if (index !== -1) {
            added = true;
            rows++;
            const pin = React.createElement(PipPin, { key: "cheeseburger-pip", streamId, template: list[index] });
            return React.cloneElement(node as any, undefined, [...list, pin]);
        }
        const next = visit(children, depth + 1);
        return next === children ? node : React.cloneElement(node as any, undefined, next);
    };
    return visit(el);
}

function scan(tries = 0) {
    timer = null;
    const modules: any = (window as any).modules ?? {};
    for (const module of Object.values(modules) as any[]) {
        const path = module?.__filePath;
        if (typeof path !== "string" || !module.isInitialized || !/video_calls\/native\//.test(path) || /\/use\w+|PictureInPicture|Pip/i.test(path) || !/Tile|Participant|Controls|Overlay|VideoGrid/.test(path)) continue;
        const exports = module.publicModule?.exports;
        for (const key of Object.keys(exports ?? {})) {
            const id = `${path}#${key}`;
            if (patched.has(id) || /^use[A-Z]/.test(key)) continue;
            let target = exports;
            let method = key;
            let value = exports[key];
            for (let depth = 0; value?.$$typeof === Symbol.for("react.memo") && depth < 4; depth++) {
                target = value;
                method = "type";
                value = value.type;
            }
            if (value?.$$typeof === Symbol.for("react.forward_ref")) {
                target = value;
                method = "render";
                value = value.render;
            }
            if (typeof value !== "function" || value.prototype?.isReactComponent) continue;
            patched.add(id);
            try {
                unpatches.push(after(method, target, safe("pip native controls", (args: any[], ret: any) => {
                    const props = args[0];
                    const part = props && typeof props === "object" ? participantForTile(props) : null;
                    if (shapes.size < 12 || shapes.has(id)) shapes.set(id, `${path.split("/").pop()}#${key} [${Object.keys(props ?? {}).slice(0, 16).join(",")}]${part?.streamId != null ? ` stream ${part.streamId}` : ""}`);
                    return part?.streamId != null ? integratePinControls(ret, part.streamId) : undefined;
                })));
            } catch (e) {
                caught("pip control patch", e);
            }
        }
    }
    if (tries < 12) timer = setTimeout(safe("pip control discovery", () => scan(tries + 1)), 2000);
}

export function startPinControls() { scan(); }

export function stopPinControls() {
    if (timer) clearTimeout(timer);
    timer = null;
    for (const unpatch of unpatches.splice(0)) unpatch();
    patched.clear();
}

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

function replaceIcon(el: any, content: any, depth = 0): any {
    if (Array.isArray(el)) return el.map(c => replaceIcon(c, content, depth));
    if (!React.isValidElement(el) || depth > 5) return el;
    const props = el.props as any;
    if (/Icon$/.test(nameOf(el.type)) || props.source != null) return content;
    return React.cloneElement(el as any, { ref: undefined }, ...(props.children == null ? [] : [replaceIcon(props.children, content, depth + 1)]));
}

function Pin({ streamId, template }: PinProps) {
    const enabled = useSplitViewSettings((s: any) => s.pipPins !== false);
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => {
        const off = onPinChange(safe("pip pin refresh", force));
        mounted++;
        return () => { off(); mounted = Math.max(0, mounted - 1); };
    }, []);
    const part = participantForStream(streamId);
    if (!enabled || !part || mineParticipant(part)) return null;
    const pinned = pinnedPip() === part.id;
    const source = pinIcon();
    const color = pinned ? accentColor("#ff0048") : "#ffffff";
    const content = source != null ? <Image source={source} style={{ width: 20, height: 20, tintColor: color }} /> : <Text style={{ color, fontSize: 11 }}>PiP</Text>;
    const original = template.props.style;
    const style = (state: any) => {
        const base = typeof original === "function" ? original(state) : original;
        const flat = StyleSheet.flatten(base) ?? {};
        return [base, { position: "absolute", left: undefined, right: (typeof flat.right === "number" ? flat.right : 0) + (typeof flat.width === "number" ? flat.width : 32) + 8, top: typeof flat.top === "number" ? flat.top : 0, bottom: undefined }];
    };
    return <Pressable {...{ cheeseburgerPin: true }} accessibilityRole="button" accessibilityLabel={pinned ? "Unpin from picture in picture" : "Pin to picture in picture"} accessibilityState={{ selected: pinned }} style={safe("pip pin style", style)} onPress={safe("pip pin press", () => pinPip(pinned ? null : part.id))}>{replaceIcon(template.props.children, content)}</Pressable>;
}

function PipPin(props: PinProps) { return <Guard><Pin {...props} /></Guard>; }

export const pinDebug = () => `pin controls: native parents ${rows}, mounted ${mounted}, icon ${pinIconName || "not seen yet"}; ${[...shapes.values()].join("; ") || "no native controls rendered yet"}`;
