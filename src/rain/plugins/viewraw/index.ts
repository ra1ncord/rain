import { definePlugin } from "@plugins";
import viewraw from "@plugins/viewraw/patches/viewraw";
import {Developers} from "@rain/Developers";

const patches: any[] = [];

export default definePlugin({
    name: "ViewRaw",
    description: "View raw message data",
    author: [Developers.sapphire, Developers.Vendicated, Developers.Bwlok],
    id: "viewraw",
    version: "1.0.0",
    start() {
        patches.push(...viewraw());
    },
    stop() {
        for (const unpatch of patches) unpatch();
    },
});
