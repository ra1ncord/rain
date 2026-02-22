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
    author: [{ name: "John", id: 780819226839220265n }, { name: "cocobo1", id: 767650984175992833n }, { name: "kmmiio99o", id: 879393496627306587n }, { name: "LampDelivery", id: 650805815623680030n }],
    id: "fakenitro",
    version: "1.1.0",
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
