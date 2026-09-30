import { findAssetId } from "@api/assets";
import { React } from "@metro/common";
import { Image, Pressable, Text, View } from "react-native";

import { caught, safe } from "../crash";
import { accentColor } from "../style/colors";
import { mineParticipant, onPinChange, participantForStream, pinnedPip, pinPip } from "./pip";
import { useSplitViewSettings } from "./storage";
import { chromeShown, onChrome, watchChrome } from "./tiles";

const ICONS = ["PictureInPictureIcon", "PipIcon", "ic_pip", "PopoutIcon", "WindowLaunchIcon", "ScreenArrowIcon"];
const LABEL = /^(?:stop watching|focus\b.*|view voice grid|minimize)$/i;
const listeners = new Set<() => void>();
const FILL = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 } as const;
let template: any = null;
let priority = -1;
let opacity: { type: any; style: any; } | null = null;
let icon: number | null | undefined;
let mounted = 0;
let native = 0;
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

const nameOf = (el: any) => el?.type?.displayName ?? el?.type?.name ?? "";
function pill(el: any, depth = 0): boolean {
    if (!el || typeof el !== "object" || depth > 5) return false;
    if (Array.isArray(el)) return el.some(c => pill(c, depth));
    return /ButtonPill/.test(nameOf(el)) || pill(el.props?.children, depth + 1);
}

function opacityStyle(style: any): any {
    if (Array.isArray(style)) return style.map(opacityStyle).find(Boolean);
    const value = style?.initial?.value;
    return style?.viewDescriptors && typeof value?.opacity === "number" && !value.transform ? style : null;
}

function hasControl(el: any, depth = 0): boolean {
    if (!el || typeof el !== "object" || depth > 5) return false;
    if (Array.isArray(el)) return el.some(c => hasControl(c, depth));
    return LABEL.test(el.props?.accessibilityLabel ?? "") || hasControl(el.props?.children, depth + 1);
}

export function capturePinControl(el: any) {
    const props = el?.props;
    if (!props || props.cheeseburgerPin) return;
    let notify = false;
    const label = props.accessibilityLabel ?? "";
    if (typeof props.onPress === "function" && LABEL.test(label) && pill(props.children)) {
        const rank = /stop watching|focus/i.test(label) ? 1 : 0;
        if (rank >= priority) {
            notify = !template || rank > priority;
            template = el;
            priority = rank;
        }
    }
    if (/View/.test(nameOf(el)) && hasControl(props.children)) {
        const style = opacityStyle(props.style);
        if (style) {
            notify ||= !opacity;
            opacity = { type: el.type, style };
        }
    }
    if (notify) setTimeout(safe("pip pin template", () => listeners.forEach(l => l())), 0);
}

class Guard extends React.Component<{ children?: any; }, { failed: boolean; }> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch(e: any) { caught("pip pin", e); }
    render() { return this.state.failed ? null : this.props.children; }
}

function replaceIcon(el: any, content: any, depth = 0): any {
    if (Array.isArray(el)) return el.map(c => replaceIcon(c, content, depth));
    if (!React.isValidElement(el) || depth > 6) return el;
    const props = el.props as any;
    if (/Icon$/.test(nameOf(el)) || props.source != null) return content;
    return props.children == null ? el : React.cloneElement(el as any, undefined, replaceIcon(props.children, content, depth + 1));
}

function Pin({ streamId }: { streamId: any; }) {
    const enabled = useSplitViewSettings((s: any) => s.pipPins !== false);
    const [, force] = React.useReducer((n: number) => n + 1, 0);
    React.useEffect(() => {
        const offPin = onPinChange(force);
        const offChrome = onChrome(force);
        const offWatch = watchChrome();
        listeners.add(force);
        mounted++;
        return () => {
            offPin();
            offChrome();
            offWatch();
            listeners.delete(force);
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
    const props = {
        ref: undefined,
        cheeseburgerPin: true,
        accessibilityRole: "button" as const,
        accessibilityLabel: pinned ? "Unpin from picture in picture" : "Pin to picture in picture",
        accessibilityHint: undefined,
        accessibilityState: { selected: pinned },
        accessibilityActions: undefined,
        onAccessibilityAction: undefined,
        disabled: false,
        onPressIn: undefined,
        onPressOut: undefined,
        onLongPress: undefined,
        onPress: safe("pip pin press", () => pinPip(pinned ? null : part.id)),
        style: [template?.props?.style, { position: "absolute", right: 8, bottom: 8 }],
    };
    const button = template
        ? React.cloneElement(template, props, replaceIcon(template.props.children, content))
        : <Pressable {...props} style={{ position: "absolute", right: 8, bottom: 8, width: 32, height: 32, borderRadius: 8, backgroundColor: "#00000085", alignItems: "center", justifyContent: "center" }}>{content}</Pressable>;
    if (template) native++;
    return opacity
        ? React.createElement(opacity.type, { pointerEvents: chromeShown() ? "box-none" : "none", style: [FILL, opacity.style], cheeseburgerPin: true }, button)
        : <View pointerEvents="box-none" style={FILL}>{button}</View>;
}

export function PipPin(props: { streamId: any; }) {
    return <Guard><Pin {...props} /></Guard>;
}

export const pinDebug = () => "pin controls: mounted " + mounted + ", native renders " + native + ", template " + (template ? nameOf(template) || "pressable" : "plain fallback") + ", visibility " + (opacity ? "discord animation" : "always available") + ", icon " + (pinIconName || "not seen yet");
