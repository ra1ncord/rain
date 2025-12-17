import { definePlugin } from "@plugins";
import { lazy } from "react";
import { findAssetId } from "@lib/api/assets";
import { initFonts } from "./fonts";
import { ThemeManager } from "./ThemeManager";
import { patchTheme, updateThemeColors } from "./patches";
import { initThemes, getStoredTheme, writeThemeToNative } from "./kettu/themes";
import { registerSection, registeredSections } from "../settings";

async function waitForThemesPlusInit() {
    for (let i = 0; i < 50; i++) {
        try {
            const themesPlus = await import("../painterplus/iconpacks");
            if ((themesPlus as any).isThemesPlusInitialized()) {
                return;
            }
        } catch {}
        await new Promise(r => setTimeout(r, 100));
    }
}

export default definePlugin({
    name: "Painter",
    description: "Customize Discord's appearance with themes and fonts",
    author: [{ name: "LampDelivery", id: 650805815623680030n }],
    id: "painter",
    version: "v1.0.0",
    async start() {
        initFonts();
        
        // Theme initialization
        await ThemeManager.init();
        await initThemes();
        patchTheme();
        
        await waitForThemesPlusInit();
        
        try {
            const current = getStoredTheme();
            if (current) {
                updateThemeColors(current.data);
                await writeThemeToNative(current);
            }
        } catch {}
    },
    stop() {
        ThemeManager.cleanup();
    }
});