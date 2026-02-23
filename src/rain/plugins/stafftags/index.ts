import { definePlugin } from "@plugins";
import { Developers, Contributors } from "@rain/Developers"

import patchChat from "./patches/chat";
import patchDetails from "./patches/details";
import patchName from "./patches/name";
import patchTag from "./patches/tag";
import Settings from "./Settings";

const patches: any[] = [];

export default definePlugin({
    name: "StaffTags",
    description: "Shows extra tags for staff members.",
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
