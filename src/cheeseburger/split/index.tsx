import { after, before } from "@api/patcher";
import { deleteJsxCreate, jsxRuntime, onJsxCreate } from "@api/react/jsx";
import { waitForHydration } from "@api/storage";
import { React } from "@metro/common";

import { safe } from "../crash";
import { useToolbar } from "../toolbar";
import { isFullscreenSplit, isLandscapeAuto, isSplitActive, resumeSplit, startLayoutPatches, stopLayoutPatches } from "./layout";
import { isPipRender, startPip, stopPip } from "./pip";
import { addPipPin, scopePinTile, startPins, stopPins } from "./PipPin";
import { withTileProbe } from "./probe";
import { SplitViewButton } from "./SplitView";
import { useSplitViewSettings } from "./storage";
import { isTileElement, registerTile, watchChrome } from "./tiles";

const ANCHOR = "VideoButton";
const unpatches: (() => unknown)[] = [];
const g = globalThis as any;

const addProbe = safe("split probe", (args: any[], ret: any) => {
    const props = args[1];
    if (isPipRender() || !ret || !props?.sharedCoords) return;
    if (!isTileElement(args) && props.participant == null && props.participantId == null && props.id == null) return;
    return withTileProbe(ret, props.sharedCoords);
});

const register = safe("split tiles", (args: any[]) => isPipRender() ? undefined : registerTile(args));

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
        unpatches.push(watchChrome());
        startPip();
        startPins();
        onJsxCreate(ANCHOR, inject);
        unpatches.push(before("jsx", jsxRuntime, register));
        unpatches.push(before("jsxs", jsxRuntime, register));
        unpatches.push(before("createElement", React, register));
        unpatches.push(before("jsx", jsxRuntime, scopePinTile));
        unpatches.push(before("jsxs", jsxRuntime, scopePinTile));
        unpatches.push(before("createElement", React, scopePinTile));
        unpatches.push(after("jsx", jsxRuntime, addProbe));
        unpatches.push(after("jsxs", jsxRuntime, addProbe));
        unpatches.push(after("createElement", React, addProbe));
        unpatches.push(after("jsx", jsxRuntime, addPipPin));
        unpatches.push(after("jsxs", jsxRuntime, addPipPin));
        unpatches.push(after("createElement", React, addPipPin));
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
        stopPins();
        stopPip();
        stopLayoutPatches(swapping);
        for (const u of unpatches.splice(0)) u();
    },
};
