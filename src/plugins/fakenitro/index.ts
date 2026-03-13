import { definePlugin } from "@plugins";
import { Contributors,Developers } from "@rain/Developers";

import getAppIcons from "./patches/appIcons";
import getNitroChecks from "./patches/nitroChecks";
import getNitroThemes from "./patches/nitroThemes";
import getRemoveGetNitroButton from "./patches/removeGetNitroButton";
import getSendMessage from "./patches/sendMessage";
import settings from "./settings";

const patches: any[] = [];

export default definePlugin({
    name: "FakeNitro",
    description: "Gives you Client-Side Nitro",
    author: [Developers.John, Developers.cocobo1, Developers.kmmiio99o, Developers.LampDelivery, Developers.j, Developers.SerStars],
    id: "fakenitro",
    version: "1.1.1",
    start() {
        patches.push(...getNitroChecks());
        patches.push(...getSendMessage());
        patches.push(...getAppIcons());
        patches.push(...getNitroThemes());
        patches.push(...getRemoveGetNitroButton());
    },
    stop() {
        for (const unpatch of patches) unpatch();
        patches.length = 0;
    },
    settings: settings,
});
