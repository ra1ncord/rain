import { definePlugin } from "@plugins";
import viewraw from "@plugins/viewraw/patches/viewraw";
import { Contributors,Developers } from "@rain/Developers";

const patches: any[] = [];

export default definePlugin({
    name: "ViewRaw",
    description: "View raw message data",
    author: [Contributors.sapphire, Contributors.Vendicated, Contributors.Bwlok, Developers.j],
    id: "viewraw",
    version: "1.0.0",
    start() {
        patches.push(...viewraw());
    },
    stop() {
        for (const unpatch of patches) unpatch();
    },
});
