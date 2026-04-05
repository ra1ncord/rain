import { logger } from "@lib/utils/logger";
import { findByProps } from "@metro";
import { FluxDispatcher } from "@metro/common";
import { definePlugin } from "@plugins";
import { Contributors, Developers } from "@rain/Developers";

import Settings from "./Settings";
import { type Activity,useRichPresenceSettings } from "./storage";
import { cloneAndFilter } from "./utils";

const assetManager = findByProps("getAssetIds", "fetchAssetIds");
const pluginStartSince = Date.now();

async function sendRequest(activity: Activity | null): Promise<Activity | null> {
    if (activity === null) {
        FluxDispatcher.dispatch({
            type: "LOCAL_ACTIVITY_UPDATE",
            activity: null,
            pid: 1608,
            socketId: "RichPresence@Rain",
        });
        logger.log("[Rich Presence] Cleared activity");
        return null;
    }

    logger.log("[Rich Presence] Preparing activity:", activity);

    const timestampEnabled = activity.timestamps?._enabled;
    activity = cloneAndFilter(activity);

    const ts = activity.timestamps;
    if (timestampEnabled && ts) {
        if (typeof ts.start !== "number") {
            ts.start = pluginStartSince;
        }
        if (typeof ts.end !== "number" || ts.end === 0) {
            delete ts.end;
        }
        if (Object.keys(ts).length === 0) {
            delete activity.timestamps;
        }
    } else {
        delete activity.timestamps;
    }

    if (activity.assets && assetManager) {
        try {
            const args = [activity.application_id, [activity.assets.large_image, activity.assets.small_image]];
            let assetIds = assetManager.getAssetIds?.(...args) ?? [];
            if (!assetIds.length) assetIds = await assetManager.fetchAssetIds?.(...args) ?? [];
            if (assetIds[0]) activity.assets.large_image = assetIds[0];
            if (assetIds[1]) activity.assets.small_image = assetIds[1];
        } catch (e) {
            logger.error("[Rich Presence] Failed to resolve asset IDs:", e);
        }
    }

    if (activity.buttons?.length) {
        activity.buttons = activity.buttons.filter(x => x && x.label);
        if (activity.buttons.length) {
            Object.assign(activity, {
                metadata: { button_urls: activity.buttons.map(x => x.url) },
                buttons: activity.buttons.map(x => x.label),
            });
        } else {
            delete activity.buttons;
        }
    } else {
        delete activity.buttons;
    }

    FluxDispatcher.dispatch({
        type: "LOCAL_ACTIVITY_UPDATE",
        activity,
        pid: 1608,
        socketId: "RichPresence@Rain",
    });

    logger.log("[Rich Presence] Activity sent:", activity);
    return activity;
}

let unsubscribeSettings: (() => void) | null = null;

export default definePlugin({
    name: "RichPresence",
    description: "Set a custom Rich Presence (RPC) with full customization.",
    author: [Contributors.pylix, Contributors.siguma, Developers.kmmiio99o],
    id: "richpresence",
    version: "1.0.0",
    start() {
        const state = useRichPresenceSettings.getState();
        const current = state.profiles?.[state.selectedProfile];
        if (!current) {
            logger.error("[Rich Presence] Invalid selected profile:", state.selectedProfile);
            return;
        }

        sendRequest(current).catch(e => logger.error("[Rich Presence] Send failed:", e));

        unsubscribeSettings = useRichPresenceSettings.subscribe(() => {
            const state = useRichPresenceSettings.getState();
            const current = state.profiles?.[state.selectedProfile];
            if (current) {
                sendRequest(current).catch(e => logger.error("[Rich Presence] Auto-update failed:", e));
            }
        });
    },
    stop() {
        unsubscribeSettings?.();
        unsubscribeSettings = null;
        sendRequest(null);
    },
    settings: Settings,
});
