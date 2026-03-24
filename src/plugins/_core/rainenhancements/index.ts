import { definePlugin } from "@plugins";
import { Contributors,Developers } from "@rain/Developers";
import { Strings } from "@rain/i18n";

import { patchConsole, patchMiscellaneous, patchNetwork, patchSentry } from "./notrack";
import patchEmojiActionSheet from "./realmoji/patches/patchEmojiActionSheet";
import transformEmoji from "./realmoji/patches/transformEmoji";
import transformSticker from "./realmoji/patches/transformSticker";
import settings from "./settings";

let patches: any[] = [];

export default definePlugin({
    name: Strings.PLUGIN__CORE_RAINENHANCEMENTS,
    description: Strings.PLUGIN__CORE_RAINENHANCEMENTS_DESC,
    author: [Developers.cocobo1, Developers.j, Contributors.rico040, Contributors.redstonekasi],
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
        patches.push(patchEmojiActionSheet());
    },
    settings: settings
});
