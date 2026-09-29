import { after } from "@api/patcher";
import { jsxRuntime } from "@api/react/jsx";
import { FluxDispatcher, React } from "@metro/common";

import { safe } from "../crash";
import { orientationDebug, resetOrientation, setLandscape, startOrientation, stopOrientation } from "./orientation";
import { TopBarRotate } from "./RotateButton";

const SPEAKER = "Change Audio Output";

const unpatches: (() => unknown)[] = [];
let anchorType: any = null;
let placed = 0;

const onJsx = safe("rotate button", (args: any[], ret: any) => {
    const [type, props] = args;
    const label = props?.accessibilityLabel;
    if (!ret || typeof label !== "string") return;
    if (label !== SPEAKER) return;
    anchorType ??= type;
    if (type !== anchorType) return;
    placed++;
    return <React.Fragment><TopBarRotate key="cheeseburger-rotate" />{ret}</React.Fragment>;
});

const onRtc = safe("rotate rtc", (e: any) => {
    if (/DISCONNECTED/.test(String(e?.state))) resetOrientation();
});

export function rotateDebug(): string[] {
    return [
        ...orientationDebug(),
        `button: ${placed ? "top bar" : "not placed yet"}`,
    ];
}

export default {
    start() {
        startOrientation();
        if ((globalThis as any).__cheeseburgerLandscape) {
            delete (globalThis as any).__cheeseburgerLandscape;
            setLandscape(true);
        }
        unpatches.push(after("jsx", jsxRuntime, onJsx));
        unpatches.push(after("jsxs", jsxRuntime, onJsx));
        FluxDispatcher.subscribe("RTC_CONNECTION_STATE", onRtc);
        unpatches.push(() => FluxDispatcher.unsubscribe("RTC_CONNECTION_STATE", onRtc));
    },
    stop() {
        for (const u of unpatches.splice(0)) u();
        stopOrientation();
        anchorType = null;
        placed = 0;
    },
};
