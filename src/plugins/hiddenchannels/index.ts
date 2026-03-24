import { findAssetId } from "@api/assets";
import { after, instead } from "@api/patcher";
import { showConfirmationAlert } from "@api/ui/alerts";
import { findByName,findByProps } from "@metro";
import { constants, React, ReactNative as RN } from "@metro/common";
import { definePlugin } from "@plugins";
import { Contributors,Developers } from "@rain/Developers";
import { Strings } from "@rain/i18n";

import AlertContent from "./AlertContent";
import Settings from "./settings";
import { hiddenChannelsSettings } from "./storage";

const Permissions = findByProps("getChannelPermissions", "can");
const ChannelTypesModule = findByProps("ChannelTypes") ?? {};
const ChannelTypes = ChannelTypesModule.ChannelTypes ?? {};
const getChannelModule = findByProps("getChannel") || findByName("getChannel", false);
const getChannel = getChannelModule?.getChannel ?? getChannelModule;

const skipChannels = [ChannelTypes?.DM, ChannelTypes?.GROUP_DM, ChannelTypes?.GUILD_CATEGORY].filter(Boolean);

// Store original can function to avoid recursion
const originalCan = Permissions?.can;

function isHidden(channel: any): boolean {
    if (!channel) return false;
    if (typeof channel === "string") {
        if (!getChannel) return false;
        channel = getChannel(channel);
    }
    if (!channel || skipChannels.includes(channel.type)) return false;

    try {
        if (originalCan) {
            const res = !originalCan(constants.Permissions.VIEW_CHANNEL, channel);
            return res;
        }
    } catch {
        return false;
    }
    return false;
}

const unpatches: (() => void)[] = [];

export default definePlugin({
    name: "HiddenChannels",
    description: Strings.PLUGINS.CUSTOM.HIDDENCHANNELS.DESCRIPTION,
    author: [
        Contributors.cloudburst,
        Contributors.TrainingDummy,
        Contributors.Lioncat6,
        Developers.kmmiio99o
    ],
    id: "hiddenchannels",
    version: "1.0.0",

    start() {
        // Patch Permissions.can to bypass hidden channel checks
        if (Permissions && originalCan) {
            unpatches.push(
                after("can", Permissions, (args: any[], res: any) => {
                    const permID = args[0];
                    const channel = args[1];

                    // Only bypass for VIEW_CHANNEL permission
                    if (permID === constants.Permissions.VIEW_CHANNEL && channel) {
                        // Check if channel is hidden
                        if (isHidden(channel)) {
                            return true;
                        }
                    }
                    return res;
                })
            );
        }

        // Patch navigation to show popup for hidden channels
        const transitionToGuild = findByProps("transitionToGuild");
        if (transitionToGuild && getChannel) {
            for (const key of Object.keys(transitionToGuild)) {
                // Yes, all of them need to be patched. No, I don't know why. The key that's actually responsible is 'forward'
                if (typeof transitionToGuild[key] === "function") {
                    unpatches.push(
                        instead(key, transitionToGuild, (args: any[], orig: Function) => {
                            try {
                                if (typeof args[0] === "string") {
                                    const pathMatch = args[0].match(/(\d+)$/);
                                    if (pathMatch?.[1]) {
                                        const channelId = pathMatch[1];
                                        const channel = getChannel(channelId);
                                        if (channel && isHidden(channel)) {
                                            if (hiddenChannelsSettings.showPopup) {
                                                showConfirmationAlert({
                                                    title: "This channel is hidden.",
                                                    content: React.createElement(AlertContent, { channel }),
                                                    confirmText: "View Anyway",
                                                    cancelText: "Cancel",
                                                    onConfirm: () => { orig(...args); },
                                                });
                                                return;
                                            } else {
                                                return orig(...args);
                                            }
                                        }
                                    }
                                }
                            } catch (e) {
                                console.error("[HiddenChannels] Error in transitionToGuild patch:", e);
                            }
                            return orig(...args);
                        })
                    );
                }
            }
        }

        // Show lock icon on hidden channels
        const ChannelInfo = findByName("ChannelInfo", false);
        if (ChannelInfo && hiddenChannelsSettings.showIcon) {
            unpatches.push(
                after("default", ChannelInfo, (args: any[], ret: any) => {
                    try {
                        const channel = args[0]?.channel;
                        if (channel && isHidden(channel)) {
                            return React.createElement(
                                React.Fragment,
                                {},
                                React.createElement(
                                    RN.Image,
                                    {
                                        source: findAssetId("ic_lock"),
                                        style: { width: 20, height: 20, marginRight: 4 },
                                    }
                                ),
                                ret,
                            );
                        }
                    } catch (e) {
                        console.error("[HiddenChannels] Error in ChannelInfo patch:", e);
                    }
                    return ret;
                })
            );
        }
    },

    stop() {
        for (const unpatch of unpatches) {
            try {
                unpatch();
            } catch (e) {
                console.error("[HiddenChannels] Error during unpatch:", e);
            }
        }
        unpatches.length = 0;
    },
    settings: Settings,
});
