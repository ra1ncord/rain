import { definePlugin } from "@plugins";
import { Contributors,Developers } from "@rain/Developers";
import { Strings } from "@rain/i18n";

import { onLoad } from "./patches/showimagelinks";

const patches: any[] = [];

export default definePlugin({
    name: "ShowImageLinks",
    description: Strings.PLUGINS.CUSTOM.SHOWIMAGELINKS.DESCRIPTION,
    author: [Contributors.Cynosphere, Developers.reyyan1],
    id: "showimagelinks",
    version: "1.0.0",
    start() {
        patches.push(
            onLoad()
        );
    },
    stop() {
        for (const unpatch of patches) unpatch();

    },
});
