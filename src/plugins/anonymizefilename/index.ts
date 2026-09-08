import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";

import getUploadPatch from "./patches/upload";
import settings from "./settings";

const patches: (() => void)[] = [];

export default definePlugin({
    name: "AnonymizeFileName",
    description: "Changes the name of any file you send to a random or custom name",
    author: [Developers.Livie],
    id: "anonymizefilename",
    version: "1.0.0",
    start() {
        patches.push(...getUploadPatch());
    },
    stop() {
        for (const unpatch of patches) unpatch();
        patches.length = 0;
    },
    settings,
});
