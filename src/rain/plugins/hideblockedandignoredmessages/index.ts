import { definePlugin } from "@plugins";

import getPatches from "./patches/hidemessages";
import settings from "./settings";
import {Developers} from "@rain/Developers";

const patches: any[] = [];

export default definePlugin({
    name: "HideBlockedAndIgnoredMessages",
    description: "A plugin that removes the `X blocked or ignored message/s` prompt and replies to the blocked or ignored messages from chat.",
    author: [Developers.Zykrah, Developers.siguma, Developers.j],
    id: "hideblockedandignoredmessages",
    version: "1.0.0",
    start() {
        patches.push(...getPatches());
    },
    stop() {
        for (const unpatch of patches) unpatch();
        patches.length = 0;
    },
    settings: settings,
});
