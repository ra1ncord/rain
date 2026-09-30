import { after, before } from "@api/patcher";
import { deleteJsxCreate, jsxRuntime, onJsxCreate } from "@api/react/jsx";
import { waitForHydration } from "@api/storage";
import { React } from "@metro/common";

import { safe } from "../crash";
import { useToolbar } from "../toolbar";
import { isFullscreenSplit, isLandscapeAuto, isSplitActive, resumeSplit, startLayoutPatches, stopLayoutPatches } from "./layout";
import { startPip, stopPip } from "./pip";
import { PipPin } from "./PipPin";
import { TileProbe } from "./probe";
import { SplitViewButton } from "./SplitView";
import { useSplitViewSettings } from "./storage";
import { isTileElement, registerTile } from "./tiles";

const ANCHOR = "VideoButton";
const unpatches: (() => unknown)[] = [];
const g = globalThis as any;

const addProbe = safe("split probe", (args: any[], ret: any) => {
    if (!ret || !isTileElement(args)) return;
    return React.createElement(
        React.Fragment,
        { key: ret.key ?? undefined },
        ret,
        <TileProbe key="cheeseburger-probe" coords={args[1].sharedCoords} />,
        <PipPin key="cheeseburger-pip" streamId={args[1].streamId} />,
    );
});

const register = safe("split tiles", registerTile);

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
