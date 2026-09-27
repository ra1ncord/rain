import { after } from "@api/patcher";
import { jsxRuntime } from "@api/react/jsx";
import { FluxDispatcher, React } from "@metro/common";

import { orientationDebug, resetOrientation, startOrientation, stopOrientation } from "./orientation";
import { RotateButton } from "./RotateButton";

const ANCHOR_LABEL = "Change Audio Output";

const unpatches: (() => unknown)[] = [];
let placed = 0;

function onJsx(args: any[], ret: any) {
    const props = args[1];
    if (!ret || !props || props.accessibilityLabel !== ANCHOR_LABEL) return;
    placed++;
    return <React.Fragment><RotateButton key="cheeseburger-rotate" />{ret}</React.Fragment>;
}

function onRtc(e: any) {
    if (/DISCONNECTED/.test(String(e?.state))) resetOrientation();
}

export function rotateDebug(): string[] {
    return [...orientationDebug(), `button: ${placed ? "in top bar" : "not placed yet"}`];
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
        placed = 0;
    },
};
