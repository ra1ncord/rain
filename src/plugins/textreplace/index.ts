import { definePlugin } from "@plugins";
import { Contributors, Developers } from "@rain/Developers";
import { Strings } from "@rain/i18n";

import patchMessageLongPressActionSheet from "./patches/MessageLongPressActionSheet";
import patchSendMessage from "./patches/sendMessage";
import { useTextReplaceSettings } from "./storage";
import settings from "./ui/pages/Settings";


const patches: (() => void)[] = [];

export default definePlugin({
    name: "TextReplace",
    description: Strings.PLUGINS.CUSTOM.TEXTREPLACE.DESCRIPTION,
    author: [Developers.SerStars, Contributors.Fiery, Contributors.PurpleEye],
    id: "textreplace",
    version: "1.0.0",
    start() {
        const store = useTextReplaceSettings.getState();
        patches.push(patchSendMessage());
        patches.push(patchMessageLongPressActionSheet());
    },
    stop() {
        for (const unpatch of patches) unpatch();
        patches.length = 0;
    },
    settings,
});
