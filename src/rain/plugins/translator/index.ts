import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";

import patchActionSheet from "./patches/ActionSheet";
import Settings from "./settings/index";
import { settings } from "./storage";

settings.target_lang ??= "en";
settings.translator ??= 1;
settings.immersive_enabled ??= true;

const patches: any[] = [];

export default definePlugin({
    name: "Translator",
    description: "Translate messages using DeepL or Google Translate",
    author: [
        Developers.Acquite,
        Developers.sapphire,
        Developers.rico040,
        Developers.chrysoljq,
        Developers.kmmiio99o
    ],
    id: "translator",
    version: "1.0.0",
    start() {
        patches.push(patchActionSheet());
    },
    stop() {
        for (const unpatch of patches) unpatch();
    },
    settings: Settings
});
