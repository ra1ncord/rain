import { definePlugin } from "@plugins";
import viewraw from "@plugins/viewraw/patches/viewraw";

const patches: any[] = [];

export default definePlugin({
    name: "ViewRaw",
    description: "View raw message data",
    author: [{ name: "sapphire", id: 757982547861962752n }, { name: "Vendicated", id: 343383572805058560n }, { name: "Bwlok", id: 501827585806827520n }],
    id: "viewraw",
    version: "v1.0.0",
    start() {
        patches.push(...viewraw);
    },
    stop() {
        for (const unpatch of patches) unpatch();
    },
});
