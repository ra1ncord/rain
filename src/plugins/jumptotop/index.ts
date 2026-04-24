import { definePlugin } from "@plugins";
import { Contributors } from "@rain/Developers";

import Settings from "./components/settings";
import { patchActionSheets } from "./patches/actionsheets";
import { patchJumpToPresent } from "./patches/jumptopresent";

export let patches: (() => void)[] = [];

export default definePlugin({
    name: "JumpToTop",
    description: "Adds a button to jump to the first message in a chat. The opposite of jump to present.",
    author: [Contributors.tralwdwd],
    id: "jumptotop",
    version: "1.0.0",
    settings: Settings,

    start() {
        patches.push(patchJumpToPresent());
        patches.push(patchActionSheets());
    },

    stop() {
        for (const unpatch of patches) {
            unpatch();
        }

        patches = [];
    },
});
