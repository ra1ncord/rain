import { waitForHydration } from "@api/storage";
import { logger } from "@lib/utils/logger";
import { FluxDispatcher } from "@metro/common";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";

import { initialize, stop } from "./manager";
import { UserStore } from "./modules";
import { serviceFactory } from "./services/ServiceFactory";
import { currentSettings, pluginState, useMultiScrobblerSettings } from "./storage";
import Settings from "./ui/pages/Settings";

export { currentSettings,pluginState };

// Connection status tracking
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;
const RECONNECT_DELAY = 5000;

async function tryInitialize() {
    try {
        initialize();
        connectionAttempts = 0;
        logger.verbose("[Multi-Scrobbler] Successfully connected");
    } catch (error) {
        logger.error("[Multi-Scrobbler] Initialization error:", error);
        connectionAttempts++;

        if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
            logger.verbose(
                `[Multi-Scrobbler] Retrying connection... (attempt ${connectionAttempts})`,
            );
            setTimeout(tryInitialize, RECONNECT_DELAY);
        } else {
            logger.error(
                "[Multi-Scrobbler] Failed to connect after multiple attempts",
            );
        }
    }
}

async function validateAndInitialize() {
    if (!currentSettings.service) {
        logger.verbose("[Multi-Scrobbler] No service selected. Please configure a service in settings.");
        return;
    }

    let serviceName = "Unknown";
    try {
        serviceName = serviceFactory.getCurrentService().getServiceName();
    } catch (e) {
        logger.error("[Multi-Scrobbler] Failed to determine current service name:", e);
    }

    const service = currentSettings.service;
    let hasCredentials = false;

    switch (service) {
        case "lastfm":
            hasCredentials = !!(currentSettings.username && currentSettings.apiKey);
            break;
        case "librefm":
            hasCredentials = !!(currentSettings.librefmUsername && currentSettings.librefmApiKey);
            break;
        case "listenbrainz":
            hasCredentials = !!currentSettings.listenbrainzUsername;
            break;
    }

    if (!hasCredentials) {
        logger.error(`[Multi-Scrobbler] Missing credentials for ${serviceName}. Please configure in settings.`);
        return;
    }

    logger.verbose(`[Multi-Scrobbler] Starting with ${serviceName}...`);

    if (UserStore.getCurrentUser()) {
        tryInitialize();
    } else {
        const waitForUser = () => {
            if (UserStore.getCurrentUser()) {
                tryInitialize();
                FluxDispatcher.unsubscribe("CONNECTION_OPEN", waitForUser);
            }
        };

        FluxDispatcher.subscribe("CONNECTION_OPEN", waitForUser);
    }
}

export default definePlugin({
    name: "MultiScrobbler",
    description: "Show off your music status from Last.fm, Libre.fm, or ListenBrainz on your Discord profile.",
    author: [Developers.kmmiio99o],
    id: "multiscrobbler",
    version: "1.0.0",

    start() {
        logger.log("[Multi-Scrobbler] Loading...");
        pluginState.pluginStopped = false;

        waitForHydration(useMultiScrobblerSettings).then(validateAndInitialize);
    },

    stop() {
        logger.log("[Multi-Scrobbler] Unloading...");
        pluginState.pluginStopped = true;

        stop();
    },

    settings: Settings,
});
