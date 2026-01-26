import { definePlugin } from "@plugins";
import { logger } from "@lib/utils/logger";
import CleanUrlsSettings from "./settings";
import { waitForCleanUrlsHydration } from "./storage";
import { waitForRulesHydration, useRulesStore } from "./rulesStore";
import { setupPatches } from "./patcher";

type Unpatch = () => void;

let patches: Unpatch[] = [];

export default definePlugin({
    name: "CleanURLs",
    description: "Remove tracking parameters and redirect wrappers from URLs",
    author: [{ name: "nexpid", id: 853550207039832084n }],
    id: "cleanurls",
    version: "v1.0.0",
    async start() {
        await Promise.all([
            waitForCleanUrlsHydration(),
            waitForRulesHydration()
        ]);
        
        patches = setupPatches();
        
        useRulesStore.getState().update();
    },
    stop() {
        patches.forEach(unpatch => {
            try {
                unpatch();
            } catch (e) {
                logger.error(e);
            }
        });
        patches = [];
    },
    settings() {
        return CleanUrlsSettings();
    }
});