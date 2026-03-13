import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";

import getUploaderPatch from "./patches/upload";
import settings from "./settings";

const patches: (() => boolean)[] = [];

export default definePlugin({
    name: "BypassUploadLimit",
    description: "Bypass Discord's file size limit by uploading to Catbox, Litterbox or Zipline",
    author: [Developers.LampDelivery, Developers.SerStars],
    id: "bypassuploadlimit",
    version: "1.1.1",
    start() {
        patches.push(...getUploaderPatch());
    },
    stop() {
        for (const unpatch of patches) unpatch();
        patches.length = 0;
    },
    settings,
});
