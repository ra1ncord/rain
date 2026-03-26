import { useSettings } from "@api/settings";
import { logger } from "@lib/utils/logger";
import { FluxDispatcher } from "@metro/common";
import { definePlugin } from "@plugins";
import { Contributors, Developers } from "@rain/Developers";
import Settings from "@rain/pages/CloudSync";

import { saveData } from "./api";
import { grabEverything } from "./lib/syncStuff";
import { useCloudSyncSettings } from "./storage";
import { useAuthorizationStore } from "./stores/AuthorizationStore";

let syncTimeout: number;
let unsubscribeSettings;

const autoSync = () => {
    if (syncTimeout) {
        clearTimeout(syncTimeout);
    }

    syncTimeout = setTimeout(() => {
        performSync();
    }, 5000);
};

const performSync = async () => {
    const settings = useCloudSyncSettings.getState();
    const auth = useAuthorizationStore.getState();
    if (!settings.autoSync || !auth.isAuthorized()) return;

    try {
        const everything = await grabEverything();
        await saveData(everything);
    } catch (e) {
        // Suppress logger for Cloudflare 1102 timeout
        const msg = typeof e === "string" ? e : e instanceof Error ? e.message : "";
        if (!(msg.includes("error code: 1102") || msg.includes("1102"))) {
            logger.error("[CloudSync] Auto-sync failed:", e);
        }
    }
};

export default definePlugin({
    name: "CloudSync",
    description: "Sync your plugins, themes, and fonts to the cloud.",
    author: [Developers.cocobo1, Contributors.LampDelivery, Contributors.nexpid],
    id: "cloudsync",
    version: "1.0.0",
    start() {
        // im too lazy to add this to the ui
        unsubscribeSettings = useSettings.subscribe((state, prevState) => {
            if (JSON.stringify(state) !== JSON.stringify(prevState)) {
                FluxDispatcher.dispatch({ type: "RAIN_SETTING_UPDATED" });
            }
        });

        FluxDispatcher.subscribe("RAIN_SETTING_UPDATED", autoSync);
    },
    settings: Settings,
});
