import { definePlugin } from "@plugins";
import { Contributors } from "@rain/Developers";

import { logCapabilities } from "./lib/capabilities";
import patchActionSheet from "./patches/ActionSheet";
import Settings from "./settings";

const patches: (() => void)[] = [];

export default definePlugin({
    name: "Quoter",
    description: "Adds a Quote action to message menus and sends a generated quote image as a Discord attachment",
    author: [Contributors.benjii],
    id: "quoter",
    version: "1.1.0",
    start() {
        logCapabilities();
        patches.push(patchActionSheet());
    },
    stop() {
        for (const unpatch of patches) {
            if (typeof unpatch === "function") unpatch();
        }
        patches.length = 0;
    },
    settings: Settings,
});
