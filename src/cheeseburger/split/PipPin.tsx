import { findAssetId } from "@api/assets";
import { React } from "@metro/common";
import { Image, StyleSheet } from "react-native";

import { caught, safe } from "../crash";
import { iconComponent } from "../toolbar";
import { isPipRender, mineParticipant, onPinChange, participantForFocus, participantForPin, pinnedPip, pinPip } from "./pip";
import { useSplitViewSettings } from "./storage";

const ICONS = ["PictureInPictureIcon", "PipIcon", "ic_pip", "PopoutIcon", "WindowLaunchIcon", "ScreenArrowIcon"];
const MARK = "__cheeseburgerNativePin";
const injected = new WeakSet<object>();
const wrapped = new WeakSet<object>();
const wrappers = new Map<string, WeakMap<object, any>>();
const scopes: any[] = [];
let active = false;
let focusControls = 0;
let mounted = 0;
let cloned = 0;
let noParticipant = 0;
let noIcon = 0;
let nativeStyle = "not seen yet";
let parentStyle = "not seen yet";
let icon: number | null | undefined;
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

function cloneButton(template: any, label: string, onPress: () => void): any {
    let icons = 0;
    const walk = (el: any): any => {
        if (Array.isArray(el)) return el.map(walk);
        if (!el || typeof el !== "object" || !("$$typeof" in el)) return el;
        const props = el.props ?? {};
        const name = nameOf(el.type);
        const next: any = { ...props, ref: null };
        if (typeof props.onPress === "function") {
            next.onPress = onPress;
            next.onLongPress = undefined;
            next.accessibilityLabel = label;
            next.accessibilityHint = undefined;
            next.onLayout = undefined;
            next[MARK] = true;
        }
        if (/Icon$/.test(name) || typeof props.source === "number") {
            for (const iconName of ICONS) {
                const component = iconComponent(iconName);
                if (!component) continue;
                icons++;
                pinIconName = iconName;
                return { ...el, type: component, props: { ...next, children: undefined } };
            }
            const source = pinIcon();
            if (source != null) {
                icons++;
                if (typeof props.source === "number") next.source = source;
                else return React.createElement(Image, { key: el.key ?? undefined, source, style: [{ width: props.width ?? props.size ?? 20, height: props.height ?? props.size ?? 20, tintColor: props.color ?? "#ffffff" }, props.style] });
            }
        }
        if (typeof props.children === "function") {
            const children = props.children;
            next.children = safe("pip native pin children", (state: any) => walk(children(state)));
        } else if (props.children != null) next.children = walk(props.children);
        return { ...el, props: next, ref: null };
    };
    const out = walk(template);
    if (!icons && typeof template?.props?.children !== "function") {
        noIcon++;
        return null;
    }
    cloned++;
    return out;
}

function Pin({ template, participant }: { template: any; participant: any; }) {
    const on = useSplitViewSettings((s: any) => s.pipPins !== false);
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => {
        mounted++;
        const off = onPinChange(force);
        return () => {
            mounted--;
            off();
        };
    }, []);
    if (!active || !on || !participant || mineParticipant(participant)) return null;
    const here = pinnedPip() === String(participant.id);
    const label = here ? "Unpin from picture in picture" : "Pin to picture in picture";
    return cloneButton(template, label, safe("pip pin press", () => pinPip(here ? null : String(participant.id))));
}

export function PipPin(props: { template: any; participant: any; }) {
    return <Guard><Pin {...props} /></Guard>;
}

function scopedType(type: any, participant: any): any {
    if (!type || wrapped.has(type)) return type;
    const name = nameOf(type);
    if (/^(?:RCT|Native|Animated|View$|Pressable|Touchable|Gesture|Text|Image|Icon|Scroll|Svg|Guard|PipPin|PinScope)/i.test(name)) return type;
    const id = String(participant.id);
    let cache = wrappers.get(id);
    if (!cache) wrappers.set(id, cache = new WeakMap());
    const found = cache.get(type);
    if (found) return found;
    const run = (original: Function, self: any, args: any[]) => {
        scopes.push(participant);
        try {
            return original.apply(self, args);
        } finally {
            scopes.pop();
        }
    };
    let wrapper: any;
    if (typeof type === "function" && !type.prototype?.isReactComponent) wrapper = function (this: any, ...args: any[]) { return run(type, this, args); };
    else if (type.$$typeof === Symbol.for("react.forward_ref") && typeof type.render === "function") wrapper = React.forwardRef((props: any, ref: any) => run(type.render, undefined, [props, ref]));
    else if (type.$$typeof === Symbol.for("react.memo") && type.type) wrapper = React.memo(scopedType(type.type, participant), type.compare);
    else return type;
    wrapper.displayName = name;
    if (type.defaultProps) wrapper.defaultProps = type.defaultProps;
    cache.set(type, wrapper);
    wrapped.add(wrapper);
    return wrapper;
}

export const scopePinTile = safe("pip pin scope", (args: any[]) => {
    const props = args[1];
    if (!active || isPipRender() || !props || props[MARK] || typeof args[0] === "string") return;
    const participant = participantForPin(props) ?? scopes[scopes.length - 1];
    if (!participant) return;
    const type = scopedType(args[0], participant);
    if (type === args[0]) return;
    args[0] = type;
    return args;
});

export const addPipPin = safe("pip native pin", (args: any[], ret: any) => {
    if (!active || isPipRender() || !ret || ret.props?.[MARK] || injected.has(ret)) return;
    const props = args[1];
    if (Array.isArray(ret.props?.children) && ret.props.children.some((child: any) => child && typeof child === "object" && injected.has(child))) parentStyle = placement(props?.style);
    const label = props?.accessibilityLabel;
    if (!/Pressable|Touchable/i.test(nameOf(args[0])) || typeof props?.onPress !== "function" || typeof label !== "string" || !/^(?:unfocus|focus)\s+/i.test(label)) return;
    focusControls++;
    nativeStyle = placement(props.style);
    const participant = participantForPin(props) ?? scopes[scopes.length - 1] ?? participantForFocus(label);
    if (!participant) {
        noParticipant++;
        return;
    }
    if (mineParticipant(participant)) return;
    const out = React.createElement(React.Fragment, { key: ret.key ?? undefined }, ret,
        React.createElement(PipPin, { key: "cheeseburger-native-pin", template: ret, participant }));
    injected.add(out);
    return out;
});

export function startPins() {
    active = true;
}

export function stopPins() {
    active = false;
    wrappers.clear();
    scopes.length = 0;
}

export function pinControlsDebug(): string {
    return `pin controls: native clones ${cloned}, focus controls ${focusControls}, mounted ${mounted}, missing participant ${noParticipant}, missing icon ${noIcon}, icon ${pinIconName || "not seen yet"}; native placement ${nativeStyle}, parent ${parentStyle}`;
}
