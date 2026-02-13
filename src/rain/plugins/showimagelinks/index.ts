import { definePlugin } from "@plugins";

import { onLoad } from "./patches/showimagelinks";

const patches: any[] = [];

export default definePlugin({
    name: "Show Image Links",
    description: "Shows image links if the message is just a linked image.",
    author: [ { name: "Cynosphere", id: 150745989836308480n } ],
    id: "showimagelinks",
    version: "v1.0.0",
    start() {
        patches.push(
            onLoad()
        );
    },
    stop() {
        for (const unpatch of patches) unpatch();

    },
});
