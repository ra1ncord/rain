import { settings } from "@api/settings";
import { definePlugin } from "@plugins";
import { Contributors, Developers } from "@rain/Developers";
import { Strings } from "@rain/i18n";

import { initFonts } from "./fonts";
import { initMonet } from "./monet";
import initPlus from "./plus/stuff/loader";
import { initThemes } from "./themes";

export default definePlugin({
    name: Strings.PLUGIN__CORE_PAINTER,
    description: Strings.PLUGIN__CORE_PAINTER_DESC,
    author: [Developers.cocobo1, Contributors.nexpid],
    id: "painter",
    version: "1.0.0",
    async eagerStart() {
        await initPlus();
        initThemes();
        initMonet();

        // todo: more this into initFonts
        if (settings().safeMode) { initFonts(); }
    },
});
