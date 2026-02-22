import { definePlugin } from "@plugins";

import { patchConsole, patchMiscellaneous, patchNetwork, patchSentry } from "./notrack";
import transformEmoji from "./realmoji/patches/transformEmoji";
import transformSticker from "./realmoji/patches/transformSticker";
import settings from "./settings";
import { Strings } from "@rain/i18n";
import {Developers} from "@rain/Developers";

let patches: any[] = [];

export default definePlugin({
    name: Strings.PLUGIN__CORE_RAINENHANCEMENTS,
    description: Strings.PLUGIN__CORE_RAINENHANCEMENTS_DESC,
    author: [Developers.cocobo1, Developers.j, Developers.rico040, Developers.redstonekasi],
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
