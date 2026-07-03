import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";

import patchServer from "./patches/patchServer";
import patchChannel from "./patches/patchChannel";
import patchUserProfile from "./patches/patchUserProfile";

const patches: (() => void)[] = [];

export default definePlugin({
    name: "PermissionViewer",
    description: "View the permissions a user or channel has, and the roles of a server",
    author: [Developers.Livie],
    id: "permissionviewer",
    version: "1.0.0",
    start() {
        patches.push(patchServer());
        patches.push(patchChannel());
        patches.push(patchUserProfile());
    },
    stop() {
        for (const unpatch of patches) unpatch();
        patches.length = 0;
    },
});
