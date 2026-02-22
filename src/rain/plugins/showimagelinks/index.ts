import { definePlugin } from "@plugins";

import { onLoad } from "./patches/showimagelinks";
import {Developers} from "@rain/Developers";

const patches: any[] = [];

export default definePlugin({
    name: "ShowImageLinks",
    description: "Shows image links if the message is just a linked image.",
    author: [Developers.Cynosphere, Developers.reyyan1],
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
