import { definePlugin } from "@plugins";

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
      {
        name: "Acquite",
        id: 581573474296791211n
      },
      {
        name: "sapphire",
        id: 757982547861962752n
      },
      {
        name: "Rico",
        id: 619474349845643275n
      },
      {
        name: "chrysoljq",
        id: 791663810594603028n
      }
    ],
    id: "translator",
    version: "v1.0.0",
    start() {
        patches.push(patchActionSheet());
    },
    stop() {
        for (const unpatch of patches) unpatch();
    },
    settings: Settings
});
