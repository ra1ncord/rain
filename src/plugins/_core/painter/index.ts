import { settings } from "@api/settings";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";
import { Strings } from "@rain/i18n";

import { initFonts } from "./fonts";
import { initThemes } from "./themes";

// thanks pylix for the name
export default definePlugin({
    name: Strings.PLUGIN__CORE_PAINTER,
    description: Strings.PLUGIN__CORE_PAINTER_DESC,
    author: [Developers.cocobo1],
    id: "painter",
    version: "1.0.0",
    async eagerStart() {
        initThemes();

        // todo: more this into initFonts
        if (settings().safeMode) { initFonts(); }
    },
});
