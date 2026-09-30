import { after, before } from "@api/patcher";
import { deleteJsxCreate, jsxRuntime, onJsxCreate } from "@api/react/jsx";
import { waitForHydration } from "@api/storage";
import { React } from "@metro/common";

import { safe } from "../crash";
import { useToolbar } from "../toolbar";
import { isFullscreenSplit, isLandscapeAuto, isSplitActive, refreshSplitLayout, resumeSplit, startLayoutPatches, stopLayoutPatches } from "./layout";
import { isInternalPipElement, isInternalPipRender, startPip, stopPip } from "./pip";
import { integratePinControls, markVideoElement, startPinControls, stopPinControls } from "./PipPin";
import { captureCallGeometry, TileProbe } from "./probe";
import { SplitViewButton } from "./SplitView";
import { useSplitViewSettings } from "./storage";
import { isTileElement, registerTile } from "./tiles";

const ANCHOR = "VideoButton";
const unpatches: (() => unknown)[] = [];
const g = globalThis as any;

const addProbe = safe("split probe", (args: any[], ret: any) => {
    if (!ret) return;
    if (isInternalPipRender() || isInternalPipElement(args)) return ret;
    ret = captureCallGeometry(args, ret);
    if (!isTileElement(args)) return integratePinControls(ret);
    const out = React.createElement(
        React.Fragment,
        { key: ret.key ?? undefined },
        ret,
        <TileProbe key="cheeseburger-probe" coords={args[1].sharedCoords} />,
    );
    markVideoElement(out, args[1].streamId);
    return out;
});

const register = safe("split tiles", (args: any[]) => {
    if (isInternalPipRender() || isInternalPipElement(args)) return;
    return registerTile(args) ?? args;
});

const inject = safe("split button", (_Component: any, ret: any) => {
    if (!ret) return ret;
    return <React.Fragment>{ret}<SplitViewButton key="cheeseburger-split" /></React.Fragment>;
});

export default {
    async start() {
        await waitForHydration(useSplitViewSettings);
        const s = useSplitViewSettings.getState();
        if (!s.sized) s.updateSettings({ sized: true, ...(s.iconSize === 26 ? { iconSize: 24 } : {}) });
        startLayoutPatches();
        startPip();
        startPinControls();
        onJsxCreate(ANCHOR, inject);
        unpatches.push(before("jsx", jsxRuntime, register));
        unpatches.push(before("jsxs", jsxRuntime, register));
        unpatches.push(after("jsx", jsxRuntime, addProbe));
        unpatches.push(after("jsxs", jsxRuntime, addProbe));
        unpatches.push(useToolbar());
        const handoff = g.__cheeseburgerSplit;
        if (handoff) {
            delete g.__cheeseburgerSplit;
            resumeSplit(!!handoff.fullscreen, !!handoff.auto);
        }
        refreshSplitLayout();
    },
    stop() {
        const swapping = !!g.__cheeseburgerSwapping;
        if (swapping && isSplitActive()) g.__cheeseburgerSplit = { fullscreen: isFullscreenSplit(), auto: isLandscapeAuto() };
        deleteJsxCreate(ANCHOR, inject);
        stopPinControls();
        stopPip();
        stopLayoutPatches(swapping);
        for (const u of unpatches.splice(0)) u();
    },
};
