import { definePlugin } from "@plugins";

import appIcons from "./patches/appIcons";
import nitroChecks from "./patches/nitroChecks";
import sendMessage from "./patches/sendMessage";
import settings from "./settings";
import nitroThemes from "./patches/nitroThemes";

const patches: any[] = [];

export default definePlugin({
    name: "FakeNitro",
    description: "Gives you Client-Side Nitro",
    author: [{ name: "John", id: 780819226839220265n }],
    id: "fakenitro",
    version: "v1.1.0",
    start() {
        patches.push(...nitroChecks);
        patches.push(...sendMessage);
        patches.push(...appIcons);
        patches.push(...nitroThemes);
    },
    stop() {
        for (const unpatch of patches) unpatch();
    },
    settings: settings,
});
