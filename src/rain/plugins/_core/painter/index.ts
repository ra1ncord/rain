import { settings } from "@api/settings";
import { definePlugin } from "@plugins";

import { initFonts } from "./fonts";
import { initThemes } from "./themes";
import { Strings } from "@rain/i18n";

export default definePlugin({
    name: Strings.PLUGIN__CORE_PAINTER,
    description: Strings.PLUGIN__CORE_PAINTER_DESC,
    author: [{ name: "cocobo1", id: 767650984175992833n }, { name: "LampDelivery", id: 650805815623680030n }],
    id: "painter",
    version: "v1.0.0",
    async start() {
        initThemes();

        // todo: more this into initFonts
        if (settings().safeMode) { initFonts(); }
    },
});
