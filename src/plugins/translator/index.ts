import { definePlugin } from "@plugins";
import { Contributors,Developers } from "@rain/Developers";

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
        Contributors.Acquite,
        Contributors.sapphire,
        Contributors.rico040,
        Contributors.chrysoljq,
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
