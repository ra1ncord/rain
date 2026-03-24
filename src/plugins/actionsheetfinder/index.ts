import { findAssetId } from "@api/assets";
import { before } from "@api/patcher";
import { showToast } from "@api/ui/toasts";
import { findByProps } from "@metro/wrappers";
import { definePlugin } from "@plugins";
import { Contributors,Developers } from "@rain/Developers";
import { Strings } from "@rain/i18n";

import settings from "./settings";
import { useActionSheetFinderSettings } from "./storage";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");

let unpatch: () => void;
let lastKey: string | undefined;
let lastTime = 0;

function SheetOutput(text: string) {
    const now = Date.now();
    if (text === lastKey && now - lastTime < 100) return;
    lastKey = text;
    lastTime = now;

    const log = `[${new Date().toLocaleTimeString()}] ${text}`;
    console.log("[ActionSheetFinder] Found ActionSheet: " + text);
    showToast(`[ActionSheetFinder] ${Strings.PLUGINS.CUSTOM.ACTIONSHEETFINDER.SETTINGS.ACTIONSHEED_FOUND} ` + text, findAssetId("Check"));
    useActionSheetFinderSettings.getState().addLog(log);
}

export default definePlugin({
    name: "ActionSheetFinder",
    description: Strings.PLUGINS.CUSTOM.ACTIONSHEETFINDER.DESCRIPTION,
    author: [Contributors.rico040, Contributors.byeoon, Developers.kmmiio99o],
    id: "actionsheetfinder",
    version: "1.0.0",
    devOnly: true,
    start() {
        unpatch = before("openLazy", LazyActionSheet, ([_, key]) => {
            if (key) SheetOutput(key);
        });
    },
    stop() {
        unpatch?.();
    },
    settings,
});
