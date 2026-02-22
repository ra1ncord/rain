import { definePlugin } from "@plugins";

import { patchConsole, patchMiscellaneous, patchNetwork, patchSentry } from "./notrack";
import transformEmoji from "./realmoji/patches/transformEmoji";
import transformSticker from "./realmoji/patches/transformSticker";
import settings from "./settings";

let patches: any[] = [];

export default definePlugin({
    name: "RainEnhancements",
    description: "Combines many plugins into one to improve your experience",
    author: [{ name: "cocobo1", id: 767650984175992833n }, { name: "j", id: 1356632712861192242n }, { name: "rico040", id: 619474349845643275n }, { name: "redstonekasi", id: 265064055490871297n }],
    id: "rainenhancements",
    version: "1.0.0",
    start() {
        // NoTrack
        patches = [
            patchNetwork(),
            patchConsole(),
            patchMiscellaneous(),
            patchSentry(),
        ].filter(Boolean);

        // Realmoji
        patches.push(...transformEmoji);
        patches.push(...transformSticker);
    },
    settings: settings
});
