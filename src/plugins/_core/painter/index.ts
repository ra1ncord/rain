import { settings } from "@api/settings";
import { definePlugin } from "@plugins";
import { Contributors, Developers } from "@rain/Developers";
import { Strings } from "@rain/i18n";

import { initFonts } from "./fonts";
import { initMonet } from "./monet";
import { initThemes } from "./themes";

export default definePlugin({
    name: Strings.PLUGIN__CORE_PAINTER,
    description: Strings.PLUGIN__CORE_PAINTER_DESC,
    author: [Developers.LampDelivery, Contributors.nexpid],
    id: "painter",
    version: "1.0.0",
    async start() {
        initThemes();
        initMonet();

        // todo: more this into initFonts
        if (settings().safeMode) { initFonts(); }
    },
});
