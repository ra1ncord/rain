/*
CANCER ALERT
I swear reading this is not a good idea at all
*/
import { logger } from "@lib/utils/logger";

import Constants from "./constants";
import { Activity } from "./defs";
import { SelfPresenceStore } from "./modules";
import { serviceFactory } from "./services/ServiceFactory";
import { currentSettings, pluginState } from "./storage";
import { clearActivity, fetchAsset, sendRequest } from "./utils/activity";
import {
    incrementApiCall,
    recordServiceError,
    recordSuccessfulUpdate,
    setDebugInfo,
} from "./utils/debug";
import {
    formatDuration,
    getCurrentTimestamp,
} from "./utils/time";

enum ActivityType {
  PLAYING = 0,
  STREAMING = 1,
  LISTENING = 2,
  COMPETING = 5,
}

const log = (...message: any[]) => logger.verbose("[Scrobble Plugin]", ...message);
const logError = (...message: any[]) =>
    logger.error("[Scrobble Plugin] Error:", ...message);
const logVerbose = (...message: any[]) =>
    currentSettings.verboseLogging &&
  logger.verbose("[Scrobble Plugin] Verbose:", ...message);

class PluginManager {
    private static instance: PluginManager;
    private updateTimer?: any;
    private reconnectTimer?: any;
    private consecutiveFailures = 0;
    private isReconnecting = false;
    private currentActivity?: Activity;
    private lastUpdateTime = 0;

    public static getInstance(): PluginManager {
        if (!PluginManager.instance) {
            PluginManager.instance = new PluginManager();
        }
        return PluginManager.instance;
    }

    // Check for new tracks and update Discord status when something changes
    async updateActivity() {
        if (pluginState.pluginStopped) {
            log("Plugin is stopped; skipping activity updates and clearing timers");
            logVerbose("Plugin is stopped, skipping update");
            try {
                this.stopUpdates();
                logVerbose("Update timers cleared due to stopped plugin");
            } catch (e) {
                logError("Error while stopping updates for stopped plugin:", e);
            }
            return;
        }

        const serviceName = serviceFactory.getCurrentService().getServiceName();
        logVerbose(`Fetching latest track from ${serviceName}...`);

        // keep track of whether we actually need to update Discord
        let willUpdateRPC = false;

        try {
            // Check if any ignored app is active
            if (currentSettings.ignoreList && currentSettings.ignoreList.length > 0) {
                const ignoredActivity = SelfPresenceStore.findActivity(act => {
                    if (!act.name) return false;
                    return currentSettings.ignoreList.some((ignoredApp: string) =>
                        act.name.toLowerCase().includes(ignoredApp.toLowerCase()),
                    );
                });

                if (ignoredActivity) {
                    logger.verbose(`Ignored app (${ignoredActivity.name}) is currently active; clearing activity and skipping updates`);
                    logVerbose(
                        `Ignored app (${ignoredActivity.name}) is currently playing, clearing activity`,
                    );
                    try {
                        setDebugInfo("ignoredActivity", ignoredActivity.name);
                    } catch (e) {
                        logVerbose("Failed to set debug info for ignored activity:", e);
                    }
                    clearActivity();
                    return;
                }
            }

            incrementApiCall();
            // MUST BE AWAIT, I AM NOT GOING TO CHANGE EVERYTHING
            const lastTrack = await serviceFactory
                .getCurrentService()
                .fetchLatestScrobble();
            setDebugInfo("lastTrack", lastTrack);

            if (!lastTrack.nowPlaying) {
                logVerbose("No currently playing track reported by service; clearing activity and skipping RPC update");
                logVerbose("Track is not currently playing");
                try {
                    setDebugInfo("lastTrack_nowPlaying", false);
                } catch (e) {
                    logVerbose("Failed to set debug info for nowPlaying:", e);
                }
                clearActivity();
                return;
            }

            if (currentSettings.lastTrackUrl === lastTrack.url) {
                logVerbose("Track unchanged; skipping Discord RPC update");
                logVerbose("Track hasn't changed");
                recordSuccessfulUpdate();
                this.consecutiveFailures = 0;
                return;
            }

            willUpdateRPC = true;

            logVerbose(`Track changed: ${lastTrack.artist} - ${lastTrack.name}`);

            // set up timestamps for the track
            let activityTimestamps: { start: number; end?: number } | undefined = undefined;
            if (
                lastTrack.nowPlaying &&
        currentSettings.showTimestamp &&
        lastTrack.from
            ) {
                // figure out when this track actually started
                const now = getCurrentTimestamp();
                let startTime = lastTrack.from;

                // if the timestamp is way old, estimate when it started
                if (startTime < now - 3600) {
                    // more than an hour old - probably wrong
                    if (lastTrack.duration && lastTrack.duration > 0) {
                        // guess we're about 10% in or 30 seconds, whatever's smaller
                        const estimatedElapsed = Math.min(lastTrack.duration * 0.1, 30);
                        startTime = now - estimatedElapsed;
                    } else {
                        startTime = now;
                    }
                    logVerbose("had to estimate start time");
                }

                activityTimestamps = {
                    start: startTime * 1000,
                };

                if (lastTrack.to) {
                    activityTimestamps.end = lastTrack.to * 1000;
                }
            }

            logVerbose(
                `Preparing RPC update for: ${lastTrack.artist} - ${lastTrack.name}`,
            );

            const activity: Activity = {
                name: currentSettings.appName || Constants.DEFAULT_APP_NAME,
                flags: 0,
                type: currentSettings.listeningTo
                    ? ActivityType.LISTENING
                    : ActivityType.PLAYING,
                details: lastTrack.name,
                state: `${lastTrack.artist}`,
                status_display_type: 1,
                application_id: Constants.APPLICATION_ID,
            };

            // replace template variables in app name if user is using them
            if (activity.name.includes("{{")) {
                const variables = {
                    artist: lastTrack.artist,
                    name: lastTrack.name,
                    album: lastTrack.album,
                    service: serviceName,
                };

                for (const [key, value] of Object.entries(variables)) {
                    activity.name = activity.name.replace(
                        new RegExp(`{{${key}}}`, "g"),
                        value || "",
                    );
                }
            }

            // add the timestamps
            if (activityTimestamps) {
                activity.timestamps = activityTimestamps;

                logVerbose("Timestamps set:", {
                    start: new Date(activityTimestamps.start).toISOString(),
                    end: activityTimestamps.end
                        ? new Date(activityTimestamps.end).toISOString()
                        : "none",
                    duration: lastTrack.duration
                        ? formatDuration(lastTrack.duration)
                        : "unknown",
                });
            }

            // set up album art and tooltip text
            if (lastTrack.album || lastTrack.albumArt) {
                const assetUrls = lastTrack.albumArt ? [lastTrack.albumArt] : [];
                // must stay as await, in other, it won't work
                // but it shouldn't fuck up anything, its just manager
                const assets = await fetchAsset(assetUrls);
                const largeImageAsset = assets[0];

                if (largeImageAsset) {
                    activity.assets = {
                        large_image: largeImageAsset,
                    };

                    if (currentSettings.showLargeText) {
                        let largeText = "";

                        if (currentSettings.showAlbumInTooltip && lastTrack.album) {
                            largeText += `on ${lastTrack.album}`;
                        }

                        if (currentSettings.showDurationInTooltip && lastTrack.duration) {
                            const durationText = formatDuration(lastTrack.duration);
                            if (largeText) {
                                largeText += ` • ${durationText}`;
                            } else {
                                largeText = durationText;
                            }
                        }

                        if (largeText) {
                            activity.assets.large_text = largeText;
                        }
                    }

                    logVerbose("Album art set:", largeImageAsset);
                    if (activity.assets.large_text) {
                        logVerbose("Tooltip text set:", activity.assets.large_text);
                    }
                } else if (
                    lastTrack.album &&
          currentSettings.showLargeText &&
          currentSettings.showAlbumInTooltip
                ) {
                    activity.assets = {
                        large_text: `on ${lastTrack.album}`,
                    };
                }
            }

            logVerbose("Setting Discord activity:", activity);
            setDebugInfo("lastActivity", activity);

            sendRequest(activity);
            currentSettings.lastTrackUrl = lastTrack.url;
            this.currentActivity = activity;
            pluginState.lastActivity = activity;
            this.consecutiveFailures = 0;
            this.lastUpdateTime = getCurrentTimestamp();
            recordSuccessfulUpdate();

            logVerbose(
                `RPC updated successfully: ${lastTrack.artist} - ${lastTrack.name}`,
            );
        } catch (error) {
            logError("Update failed:", error);
            try {
                recordServiceError(currentSettings.service ?? "lastfm", (error as Error).message);
            } catch (e) {
                logError("Failed to record service error:", e);
            }
            try {
                setDebugInfo("lastUpdateError", {
                    message: (error as Error).message,
                    service: currentSettings.service,
                    lastTrackUrl: currentSettings.lastTrackUrl,
                });
            } catch (e) {
                logVerbose("Failed to set debug info for last update error:", e);
            }
            this.handleError(error as Error);
        }
    }

    private handleError(error: Error) {
        this.consecutiveFailures++;
        setDebugInfo("lastError", error);

        logError(
            `Failure ${this.consecutiveFailures}/${Constants.MAX_RETRY_ATTEMPTS}:`,
            error.message,
        );

        if (this.consecutiveFailures >= Constants.MAX_RETRY_ATTEMPTS) {
            logError("Max retry attempts reached, initiating reconnection...");
            this.startReconnection();
        }
    }

    private startReconnection() {
        if (this.isReconnecting) return;

        this.isReconnecting = true;
        this.stopUpdates();

        logVerbose("Starting reconnection process...");
        this.reconnectTimer = setInterval(() => {
            logVerbose("Attempting to reconnect...");
            this.initialize()
                .then(() => {
                    logVerbose("Reconnection successful!");
                    this.stopReconnection();
                })
                .catch(error => {
                    logError("Reconnection attempt failed:", error.message);
                });
        }, Constants.RETRY_DELAY);
    }

    private stopReconnection() {
        try {
            if (this.reconnectTimer) {
                clearInterval(this.reconnectTimer);
                this.reconnectTimer = undefined;
            }
            this.isReconnecting = false;
            this.consecutiveFailures = 0;
        } catch (error) {
            logger.error("[Scrobble Plugin] Reconnection cleanup error:", error);
        }
    }

    // clean up all timers
    private stopUpdates() {
        try {
            if (this.updateTimer) {
                clearInterval(this.updateTimer);
                this.updateTimer = undefined;
            }
        } catch (error) {
            logger.error("[Scrobble Plugin] Timer cleanup error:", error);
        }
    }

    // start everything up
    public initialize(): Promise<void> {
        if (pluginState.pluginStopped) {
            throw new Error("Plugin is stopped");
        }

        const serviceName = serviceFactory.getCurrentService().getServiceName();
        logger.verbose(`Initializing with ${serviceName}...`);

        // make sure credentials work before starting
        return serviceFactory.validateCurrentService()
            .then(isValid => {
                if (!isValid) {
                    throw new Error(`Invalid credentials for ${serviceName}`);
                }
                logger.verbose(`${serviceName} credentials validated successfully`);
            })
            .then(() => {
                this.stopUpdates();

                // Fetch current track and check if we should update
                // Don't set lastTrackUrl here, let updateActivity handle it
                return serviceFactory.getCurrentService().fetchLatestScrobble()
                    .then(currentTrack => {
                        if (currentTrack) {
                            // what should it do? Not update the RPC if track already is playing
                            if (currentSettings.lastTrackUrl && currentSettings.lastTrackUrl === currentTrack.url) {
                                logger.verbose("Track unchanged from previous session; skipping immediate update");
                                return;
                            }
                            // Update the URL and trigger activity update
                            this.updateActivity();
                        }
                    })
                    .catch(error => {
                        logVerbose("Could not fetch initial track:", error);
                    });
            })
            .then(() => {
                const interval = Math.max(
                    (Number(currentSettings.timeInterval) ||
            Constants.DEFAULT_SETTINGS.timeInterval) * 1000,
                    Constants.MIN_UPDATE_INTERVAL * 1000,
                );

                this.updateTimer = setInterval(() => this.updateActivity(), interval);
                logger.verbose(
                    `Update timer started with interval: ${interval}ms (${interval / 1000}s)`,
                );
            })
            .catch(error => {
                logError("Failed to initialize:", error);
                throw error;
            });
    }

    // stop everything and clean up
    public stop() {
        if (pluginState.pluginStopped) {
            return;
        }

        log("Stopping plugin...");
        pluginState.pluginStopped = true;

        try {
            this.stopUpdates();
            this.stopReconnection();
            clearActivity();
            log("Plugin stopped successfully");
        } catch (error) {
            logger.error("[Scrobble Plugin] Stop error:", error);
        }
    }

    // change to a different scrobble service
    public async switchService(newService: string) {
        if (pluginState.pluginStopped) {
            return;
        }

        log(`Switching to ${newService}...`);

        // stop what we're doing first
        const wasRunning = !pluginState.pluginStopped;
        this.stop();

        try {
            // clear cache so we get fresh service instances
            serviceFactory.clearCache();

            // Reset track state when switching services
            currentSettings.lastTrackUrl = undefined;
            this.currentActivity = undefined;
            this.lastUpdateTime = 0;

            // start back up with the new service
            if (wasRunning) {
                pluginState.pluginStopped = false;
                this.initialize();
            }
        } catch (error) {
            logError("Failed to switch service:", error);
        }
    }

    // get info about what's currently happening
    public getStatus() {
        const serviceName = serviceFactory.getCurrentService().getServiceName();
        return {
            running: !pluginState.pluginStopped,
            service: serviceName,
            consecutiveFailures: this.consecutiveFailures,
            isReconnecting: this.isReconnecting,
            lastTrackUrl: currentSettings.lastTrackUrl,
            updateInterval: this.updateTimer ? "Active" : "Inactive",
        };
    }
}

// expose the manager functions
const manager = PluginManager.getInstance();
export const initialize = () => manager.initialize();
export const stop = () => manager.stop();
export const switchService = (service: string) =>
    manager.switchService(service);
export const getStatus = () => manager.getStatus();
export const updateActivity = () => manager.updateActivity();
