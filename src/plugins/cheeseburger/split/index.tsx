import { before } from "@api/patcher";
import { deleteJsxCreate, jsxRuntime, onJsxCreate } from "@api/react/jsx";
import { waitForHydration } from "@api/storage";
import { React } from "@metro/common";

import { startLayoutPatches, stopLayoutPatches } from "./layout";
import { startPip, stopPip } from "./pip";
import { SplitViewButton } from "./SplitView";
import { useSplitViewSettings } from "./storage";
import { registerTile } from "./tiles";

const ANCHOR = "VideoButton";
const unpatches: (() => unknown)[] = [];

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
    },
    stop() {
        deleteJsxCreate(ANCHOR, inject);
        stopPip();
        stopLayoutPatches();
        for (const u of unpatches.splice(0)) u();
    },
};
