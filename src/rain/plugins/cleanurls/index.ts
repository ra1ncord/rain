import { logger } from "@lib/utils/logger";
import { definePlugin } from "@plugins";

import { setupPatches } from "./patcher";
import { useRulesStore } from "./rulesStore";
import CleanUrlsSettings from "./settings";
import { useCleanUrlsSettings } from "./storage";
import { waitForHydration } from "@api/storage";

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
            waitForHydration(useCleanUrlsSettings),
            waitForHydration(useRulesStore)
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
