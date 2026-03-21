import { definePlugin } from "@plugins";
import viewraw from "@plugins/viewraw/patches/viewraw";
import { Contributors,Developers } from "@rain/Developers";
import { Strings } from "@rain/i18n";

const patches: any[] = [];

export default definePlugin({
    name: Strings.PLUGINS.CUSTOM.VIEWRAW.NAME,
    description: Strings.PLUGINS.CUSTOM.VIEWRAW.DESCRIPTION,
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
