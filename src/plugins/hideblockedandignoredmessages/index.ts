import { definePlugin } from "@plugins";
import { Contributors,Developers } from "@rain/Developers";
import { Strings } from "@rain/i18n";

import getPatches from "./patches/hidemessages";
import settings from "./settings";

const patches: any[] = [];

export default definePlugin({
    name: "HideBlockedAndIgnoredMessages",
    description: Strings.PLUGINS.CUSTOM.HIDEBLOCKEDANDIGNOREDMESSAGES.DESCRIPTION,
    author: [Contributors.Zykrah, Contributors.siguma, Developers.j],
    id: "hideblockedandignoredmessages",
    version: "1.0.0",
    start() {
        patches.push(...getPatches());
    },
    stop() {
        for (const unpatch of patches) unpatch();
        patches.length = 0;
    },
    settings: settings,
});
