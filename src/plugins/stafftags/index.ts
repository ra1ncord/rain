import { definePlugin } from "@plugins";
import { Contributors,Developers } from "@rain/Developers";
import { Strings } from "@rain/i18n";

import patchChat from "./patches/chat";
import patchDetails from "./patches/details";
import patchName from "./patches/name";
import patchTag from "./patches/tag";
import Settings from "./Settings";

const patches: any[] = [];

export default definePlugin({
    name: Strings.PLUGINS.CUSTOM.STAFFTAGS.NAME,
    description: Strings.PLUGINS.CUSTOM.STAFFTAGS.DESCRIPTION,
    author: [Contributors.Fiery, Contributors.siguma, Developers.kmmiio99o],
    id: "stafftags",
    version: "1.0.0",
    start() {
        patches.push(patchChat());
        patches.push(patchTag());
        patches.push(patchName());
        patches.push(patchDetails());
    },
    stop() {
        for (const unpatch of patches) unpatch();
        patches.length = 0;
    },
    settings: Settings,
});
