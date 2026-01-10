import { instead } from "spitroast";
import { findAssetId } from "@api/assets";
import { definePlugin } from "@plugins";
import * as ThemerPatches from "../painter/patches";
import { getStoredTheme } from "../painter/kettu/themes";
import { applyPlus } from "./plus";
import { initIconpacks, patchAssetOverrides, unpatchAssetOverrides } from "./iconpacks";
import { registerSection, registeredSections } from "../settings";
import { findByStoreNameLazy } from "@metro/wrappers";

let unpatchUpdate: (() => void) | null = null;
let unsubscribeThemeStore: (() => void) | null = null;
const ThemeStore = findByStoreNameLazy("ThemeStore");

export default definePlugin({
    name: "Themes+",
    description: "Themes+ core support (iconpacks, mention/unread colors, v0 spec)",
    author: [{ name: "Themes+", id: 0n }],
    id: "core.painterplus",
    version: "v1.0.0",

    async start() {
        await initIconpacks();
        patchAssetOverrides();

        // Iconpack application is handled when themes are loaded
        // The Themer plugin calls applyPlus which sets the iconpack
        // Themes+ controls are available in the Themes page header
    },

    stop() {
        unpatchUpdate?.();
        unpatchUpdate = null;
        unpatchAssetOverrides();
        unsubscribeThemeStore?.();
        unsubscribeThemeStore = null;
    },
});
