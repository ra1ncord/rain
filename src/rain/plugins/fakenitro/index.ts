import { definePlugin } from "@plugins";

import getAppIcons from "./patches/appIcons";
import getHidePaymentItems from "./patches/hidePaymentItems";
import getNitroChecks from "./patches/nitroChecks";
import getNitroThemes from "./patches/nitroThemes";
import getRemoveGetNitroButton from "./patches/removeGetNitroButton";
import getSendMessage from "./patches/sendMessage";
import settings from "./settings";

const patches: any[] = [];

export default definePlugin({
    name: "FakeNitro",
    description: "Gives you Client-Side Nitro",
    author: [{ name: "John", id: 780819226839220265n }],
    id: "fakenitro",
    version: "v1.1.0",
    start() {
        patches.push(...getNitroChecks());
        patches.push(...getSendMessage());
        patches.push(...getAppIcons());
        patches.push(...getNitroThemes());
        patches.push(...getRemoveGetNitroButton());
        patches.push(...getHidePaymentItems());
    },
    stop() {
        for (const unpatch of patches) unpatch();
        patches.length = 0;
    },
    settings: settings,
});
