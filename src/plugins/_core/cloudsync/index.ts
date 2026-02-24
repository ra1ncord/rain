import { logger } from "@lib/utils/logger";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";

import { saveData } from "./api";
import Settings from "./components/Settings";
import { grabEverything } from "./lib/syncStuff";
import { useCloudSyncSettings } from "./storage";
import { useAuthorizationStore } from "./stores/AuthorizationStore";
import { useCacheStore } from "./stores/CacheStore";

let syncTimeout: any = 0;
function debounceSync(run: () => void) {
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(run, 1500);
}

const autoSync = async () => {
    const settings = useCloudSyncSettings.getState();
    const auth = useAuthorizationStore.getState();
    if (!settings.autoSync || !auth.isAuthorized()) return;

    debounceSync(async () => {
        try {
            const everything = await grabEverything();
            await saveData(everything);
            logger.log("[CloudSync] Auto-synced data.");
        } catch (e) {
            // Suppress logger for Cloudflare 1102 timeout
            const msg = typeof e === "string" ? e : e instanceof Error ? e.message : "";
            if (!(msg.includes("error code: 1102") || msg.includes("1102"))) {
                logger.error("[CloudSync] Auto-sync failed:", e);
            }
        }
    });
};

export default definePlugin({
    name: "CloudSync",
    description: "Sync your plugins, themes, and fonts to the cloud.",
    author: [Developers.LampDelivery],
    id: "cloudsync",
    version: "1.0.0",
    start() {
        // In Rain, we don't have a direct emitter for plugin/theme changes yet,
        // but we can subscribe to the stores.
        useCloudSyncSettings.subscribe(autoSync);
        useAuthorizationStore.subscribe(autoSync);
        useCacheStore.subscribe(autoSync);
    },
    stop() {
        // Cleanup if needed
    },
    settings: Settings,
});
