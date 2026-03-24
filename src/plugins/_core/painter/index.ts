import { settings } from "@api/settings";
import { definePlugin } from "@plugins";
import { Contributors, Developers } from "@rain/Developers";
import { Strings } from "@rain/i18n";

import { initFonts } from "./fonts";
import { initMonet } from "./monet";
import { initThemes } from "./themes";

// thanks pylix for the name
export default definePlugin({
    name: "Painter",
    description: Strings.PLUGINS.CORE.PAINTER.DESCRIPTION,
    author: [Developers.cocobo1, Contributors.nexpid],
    id: "painter",
    version: "1.0.0",
    async eagerStart() {
        initThemes();
        initMonet();

        // todo: more this into initFonts
        if (settings().safeMode) { initFonts(); }
    },
});
