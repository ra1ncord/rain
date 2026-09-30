import { deleteJsxCreate, onJsxCreate } from "@api/react/jsx";
import { waitForHydration } from "@api/storage";
import { React } from "@metro/common";

import { safe } from "../crash";
import { useToolbar } from "../toolbar";
import { watchElementFactories } from "./factories";
import { isFullscreenSplit, isLandscapeAuto, isSplitActive, refreshSplitLayout, resumeSplit, startLayoutPatches, stopLayoutPatches } from "./layout";
import { isInternalPipElement, isInternalPipRender, startPip, stopPip } from "./pip";
import { integratePinControls, markVideoElement, startPinControls, stopPinControls } from "./PipPin";
import { captureCallGeometry, captureTileGeometry, markTileElement } from "./probe";
import { SplitViewButton } from "./SplitView";
import { useSplitViewSettings } from "./storage";
import { isTileElement, registerTile } from "./tiles";

const ANCHOR = "VideoButton";
const unpatches: (() => unknown)[] = [];
const g = globalThis as any;
const decorated = new WeakSet<object>();
let adding = 0;

const addProbe = safe("split probe", (args: any[], ret: any) => {
    if (!ret) return;
    if (adding || typeof ret !== "object" || decorated.has(ret)) return ret;
    if (isInternalPipRender() || isInternalPipElement(args)) return ret;
    decorated.add(ret);
    adding++;
    try {
        if (isTileElement(args)) {
            markTileElement(ret, args[1].sharedCoords);
            markVideoElement(ret, args[1].streamId);
        }
        ret = captureTileGeometry(ret);
        ret = captureCallGeometry(args, ret);
        ret = integratePinControls(ret);
        if (ret && typeof ret === "object") decorated.add(ret);
        return ret;
    } finally {
        adding--;
    }
});

const register = safe("split tiles", (args: any[]) => {
    if (adding || isInternalPipRender() || isInternalPipElement(args)) return;
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
        unpatches.push(watchElementFactories(register, addProbe, refreshSplitLayout));
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
