import { waitForHydration } from "@api/storage";
import { logger } from "@lib/utils/logger";
import { definePlugin } from "@plugins";
import {Contributors, Developers} from "@rain/Developers";

import { setupPatches } from "./patcher";
import { useRulesStore } from "./rulesStore";
import CleanUrlsSettings from "./settings";
import { useCleanUrlsSettings } from "./storage";

type Unpatch = () => void;

let patches: Unpatch[] = [];

export default definePlugin({
    name: "CleanURLs",
    description: "Remove tracking parameters and redirect wrappers from URLs",
    author: [Developers.cocobo1, Contributors.nexpid],
    id: "cleanurls",
    version: "1.0.0",
    async start() {
        Promise.all([
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
