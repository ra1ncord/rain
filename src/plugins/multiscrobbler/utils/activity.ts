import { logger } from "@lib/utils/logger";
import { FluxDispatcher } from "@metro/common";

import Constants from "../constants";
import { Activity } from "../defs";
import { stop } from "../manager";
import { AssetManager } from "../modules";
import { pluginState } from "../storage";

/** Clears the user's activity */
export function clearActivity() {
    return sendRequest(null);
}

/** Sends the activity details to Discord */
export function sendRequest(activity: Activity | null) {
    if (pluginState.pluginStopped) {
        stop();
        activity = null;
    }

    pluginState.lastActivity = activity;

    FluxDispatcher.dispatch({
        type: "LOCAL_ACTIVITY_UPDATE",
        activity: activity,
        pid: 2312,
        socketId: "Multi-Scrobbler@Rain",
    });
}

/** Fetches Discord application assets */
export async function fetchAsset(
    asset: string[],
    appId: string = Constants.APPLICATION_ID,
): Promise<string[]> {
    if (!asset?.length) return [];

    try {
        return AssetManager.fetchAssetIds(appId, asset);
    } catch (error) {
        logger.error("[Multi-Scrobbler] Failed to fetch assets:", error);
        return [];
    }
}
