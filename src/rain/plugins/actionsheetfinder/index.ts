import { findAssetId } from "@api/assets";
import { before } from "@api/patcher";
import { showToast } from "@api/ui/toasts";
import { findByProps } from "@metro/wrappers";
import { definePlugin } from "@plugins";

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
    showToast("[ActionSheetFinder] Found ActionSheet: " + text, findAssetId("Check"));
    useActionSheetFinderSettings.getState().addLog(log);
}

export default definePlugin({
    name: "ActionSheetFinder",
    description: "Utility plugin to find ActionSheet key of pressed sheet. Mostly used by developers to find action sheet keys.",
    author: [{ name: "Rico040", id: 619474349845643275n }, { name: "byeoon", id: 1167275288036655133n }, { name: "kmmiio99o", id: 879393496627306587n }],
    id: "actionsheetfinder",
    version: "v1.0.0",
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
