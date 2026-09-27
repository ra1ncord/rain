import { after } from "@api/patcher";
import { jsxRuntime } from "@api/react/jsx";
import { FluxDispatcher, React } from "@metro/common";

import { orientationDebug, resetOrientation, startOrientation, stopOrientation, toggleLandscape } from "./orientation";
import { RotateFace } from "./RotateButton";

const SPEAKER = "Change Audio Output";
const CAMERA = /^Switch to (back|front) camera$/;

const unpatches: (() => unknown)[] = [];
let anchorType: any = null;
let cameraType: any = null;
let cameraProps: any = null;
let placed = 0;
let source = "";

function mergeStyle(style: any, extra: any) {
    if (typeof style === "function") return (s: any) => [style(s), extra];
    return [style, extra];
}

function makeClone(type: any, props: any) {
    const useCamera = cameraProps && cameraType === type;
    const base = useCamera ? cameraProps : props;
    source = useCamera ? "camera button" : "speaker button";
    const { children: _c, onLongPress: _l, onPress: _p, accessibilityState: _s, ...rest } = base;
    return React.createElement(type, {
        ...rest,
        key: "cheeseburger-rotate",
        accessibilityLabel: "Rotate",
        accessibilityRole: "button",
        onPress: toggleLandscape,
        style: useCamera ? base.style : mergeStyle(base.style, { backgroundColor: "rgba(0,0,0,0.55)" }),
        children: <RotateFace />,
    });
}

function onJsx(args: any[], ret: any) {
    const [type, props] = args;
    const label = props?.accessibilityLabel;
    if (!ret || typeof label !== "string") return;
    if (CAMERA.test(label)) {
        cameraType ??= type;
        if (type === cameraType) cameraProps = props;
        return;
    }
    if (label !== SPEAKER) return;
    anchorType ??= type;
    if (type !== anchorType) return;
    placed++;
    return <React.Fragment>{makeClone(type, props)}{ret}</React.Fragment>;
}

function onRtc(e: any) {
    if (/DISCONNECTED/.test(String(e?.state))) resetOrientation();
}

export function rotateDebug(): string[] {
    return [
        ...orientationDebug(),
        `button: ${placed ? `top bar, copied from ${source}, ${anchorType?.displayName ?? anchorType?.name ?? typeof anchorType}` : "not placed yet"}`,
    ];
}

export default {
    start() {
        startOrientation();
        unpatches.push(after("jsx", jsxRuntime, onJsx));
        unpatches.push(after("jsxs", jsxRuntime, onJsx));
        FluxDispatcher.subscribe("RTC_CONNECTION_STATE", onRtc);
        unpatches.push(() => FluxDispatcher.unsubscribe("RTC_CONNECTION_STATE", onRtc));
    },
    stop() {
        for (const u of unpatches.splice(0)) u();
        stopOrientation();
        anchorType = cameraType = cameraProps = null;
        placed = 0;
    },
};
