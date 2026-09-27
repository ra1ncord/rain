import { before } from "@api/patcher";
import { deleteJsxCreate, jsxRuntime, onJsxCreate } from "@api/react/jsx";
import { waitForHydration } from "@api/storage";
import { React } from "@metro/common";

import { isFullscreenSplit, isLandscapeAuto, isSplitActive, resumeSplit, startLayoutPatches, stopLayoutPatches } from "./layout";
import { startPip, stopPip } from "./pip";
import { SplitViewButton } from "./SplitView";
import { useSplitViewSettings } from "./storage";
import { registerTile } from "./tiles";

const ANCHOR = "VideoButton";
const unpatches: (() => unknown)[] = [];
const g = globalThis as any;

function inject(_Component: any, ret: any) {
    if (!ret) return ret;
    return <React.Fragment>{ret}<SplitViewButton key="cheeseburger-split" /></React.Fragment>;
}

export default {
    async start() {
        await waitForHydration(useSplitViewSettings);
        startLayoutPatches();
        startPip();
        onJsxCreate(ANCHOR, inject);
        unpatches.push(before("jsx", jsxRuntime, registerTile));
        unpatches.push(before("jsxs", jsxRuntime, registerTile));
        const handoff = g.__cheeseburgerSplit;
        if (handoff) {
            delete g.__cheeseburgerSplit;
            resumeSplit(!!handoff.fullscreen, !!handoff.auto);
        }
    },
    stop() {
        const swapping = !!g.__cheeseburgerSwapping;
        if (swapping && isSplitActive()) g.__cheeseburgerSplit = { fullscreen: isFullscreenSplit(), auto: isLandscapeAuto() };
        deleteJsxCreate(ANCHOR, inject);
        stopPip();
        stopLayoutPatches(swapping);
        for (const u of unpatches.splice(0)) u();
    },
};
