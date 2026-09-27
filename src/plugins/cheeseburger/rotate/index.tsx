import { findAsset } from "@api/assets";
import { after } from "@api/patcher";
import { deleteJsxCreate, jsxRuntime, onJsxCreate } from "@api/react/jsx";
import { FluxDispatcher, React } from "@metro/common";

import { orientationDebug, resetOrientation } from "./orientation";
import { CallUiTracker, isCallUiOpen, RotateButton } from "./RotateButton";

const HEADER_BUTTONS = [
    "ChannelCallChatButton", "CallChatButton", "VoicePanelChatButton", "ChatButton", "OpenChatButton", "TextChatButton", "VoiceChatButton",
    "ChannelCallCameraSwitchButton", "CameraSwitchButton", "SwitchCameraButton", "FlipCameraButton", "CameraFlipButton",
    "ChannelCallAudioOutputButton", "AudioOutputButton", "AudioOutputSelectButton", "SpeakerButton", "AudioDeviceButton",
];

const unpatches: (() => unknown)[] = [];
const found = new Map<string, number>();
const assetNames = new Map<number, string>();
let chosen: string | null = null;

function trackerInject(_c: any, ret: any) {
    if (!ret) return ret;
    return <React.Fragment>{ret}<CallUiTracker key="cheeseburger-rotate-tracker" /></React.Fragment>;
}

function headerInject(Component: any, ret: any) {
    if (!ret) return ret;
    chosen ??= Component?.name ?? null;
    if (Component?.name !== chosen) return ret;
    return <React.Fragment><RotateButton key="cheeseburger-rotate" />{ret}</React.Fragment>;
}

function assetName(id: number) {
    let n = assetNames.get(id);
    if (n === undefined) {
        try {
            n = findAsset(id)?.name ?? String(id);
        } catch {
            n = String(id);
        }
        assetNames.set(id, n);
    }
    return n;
}

function discover(args: any[]) {
    if (found.size >= 40 || !isCallUiOpen()) return;
    const [type, props] = args;
    if (typeof type !== "function" || !props) return;
    const id = typeof props.icon === "number" ? props.icon : typeof props.source === "number" ? props.source : undefined;
    if (id === undefined && typeof props.accessibilityLabel !== "string") return;
    const key = `${type.displayName ?? type.name ?? "?"}${id !== undefined ? `:${assetName(id)}` : ""}${typeof props.accessibilityLabel === "string" ? ` "${props.accessibilityLabel}"` : ""}`;
    found.set(key, (found.get(key) ?? 0) + 1);
}

function onRtc(e: any) {
    if (/DISCONNECTED/.test(String(e?.state))) resetOrientation();
}

export function rotateDebug(): string[] {
    return [
        ...orientationDebug(),
        `button spot: ${chosen ?? "not found"}, call screen open: ${isCallUiOpen()}`,
        "call screen buttons:",
        ...(found.size ? [...found.keys()].map(k => `  ${k}`) : ["  none yet"]),
    ];
}

export default {
    start() {
        onJsxCreate("VideoButton", trackerInject);
        for (const name of HEADER_BUTTONS) onJsxCreate(name, headerInject);
        unpatches.push(after("jsx", jsxRuntime, discover));
        unpatches.push(after("jsxs", jsxRuntime, discover));
        FluxDispatcher.subscribe("RTC_CONNECTION_STATE", onRtc);
        unpatches.push(() => FluxDispatcher.unsubscribe("RTC_CONNECTION_STATE", onRtc));
    },
    stop() {
        deleteJsxCreate("VideoButton", trackerInject);
        for (const name of HEADER_BUTTONS) deleteJsxCreate(name, headerInject);
        for (const u of unpatches.splice(0)) u();
        resetOrientation();
        chosen = null;
    },
};
