import { definePlugin } from "@plugins";

import getAppIcons from "./patches/appIcons";
import getHidePaymentItems from "./patches/hidePaymentItems";
import getNitroChecks from "./patches/nitroChecks";
import getNitroThemes from "./patches/nitroThemes";
import getRemoveGetNitroButton from "./patches/removeGetNitroButton";
import getSendMessage from "./patches/sendMessage";
import settings from "./settings";
import {Developers} from "@rain/Developers";

const patches: any[] = [];

export default definePlugin({
    name: "FakeNitro",
    description: "Gives you Client-Side Nitro",
    author: [Developers.John, Developers.cocobo1, Developers.kmmiio99o, Developers.LampDelivery],
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
