import { settings } from "@api/settings";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";
import { Strings } from "@rain/i18n";

import { initFonts } from "./fonts";
import { initThemes } from "./themes";

export default definePlugin({
    name: Strings.PLUGIN__CORE_PAINTER,
    description: Strings.PLUGIN__CORE_PAINTER_DESC,
    author: [Developers.cocobo1, Developers.LampDelivery],
    id: "painter",
    version: "1.0.0",
    async start() {
        initThemes();

        // todo: more this into initFonts
        if (settings().safeMode) { initFonts(); }
    },
});
