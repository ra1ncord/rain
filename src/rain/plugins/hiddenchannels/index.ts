import { findAssetId } from "@api/assets";
import { after, instead } from "@api/patcher";
import { showConfirmationAlert } from "@api/ui/alerts";
import { findByName,findByProps } from "@metro";
import { constants, React, ReactNative as RN } from "@metro/common";
import { definePlugin } from "@plugins";

import AlertContent from "./AlertContent";
import Settings from "./settings";
import { hiddenChannelsSettings } from "./storage";

const Permissions = findByProps("getChannelPermissions", "can");
const { ChannelTypes } = findByProps("ChannelTypes");
const { getChannel } = findByProps("getChannel") || findByName("getChannel", false);

const skipChannels = [ChannelTypes.DM, ChannelTypes.GROUP_DM, ChannelTypes.GUILD_CATEGORY];



function isHidden(channel: any | undefined) {
    if (channel === undefined) return false;
    if (typeof channel === "string") channel = getChannel(channel);
    if (!channel || skipChannels.includes(channel.type)) return false;
    channel.realCheck = true;
    const res = !Permissions.can(constants.Permissions.VIEW_CHANNEL, channel);
    delete channel.realCheck;
    return res;
}

const unpatches: (() => void)[] = [];

export default definePlugin({
    name: "HiddenChannels",
    description: "View hidden channels with permission bypass",
    author: [
        { name: "cloudburst", id: 892128204150685769n },
        { name: "Training Dummy", id: 601137505739472908n },
        { name: "Lioncat6", id: 917903273514663957n }
    ],
    id: "hiddenchannels",
    version: "1.0.0",

    start() {
        const ChannelMessages = findByProps("ChannelMessages") || findByName("ChannelMessages", false);
        if (!ChannelMessages) {
            console.error("Hidden Channels plugin: 'ChannelMessages' module not found.");
            return () => { };
        }

        unpatches.push(
            after("can", Permissions, ([permID, channel], res) => {
                // console.log("[HiddenChannels] Permissions.can called " + (!channel?.realCheck && permID === constants.Permissions.VIEW_CHANNEL));
                if (!channel?.realCheck && permID === constants.Permissions.VIEW_CHANNEL) return true;
                return res;
            })
        );

        const transitionToGuild = findByProps("transitionToGuild");
        if (transitionToGuild) {
            for (const key of Object.keys(transitionToGuild)) {
                // Yes, all of them need to be patched. No, I don't know why. The key that's actually responsible is 'forward'
                if (typeof transitionToGuild[key] === "function") {
                    unpatches.push(
                        instead(key, transitionToGuild, (args, orig) => {
                            if (typeof args[0] === "string") {
                                const pathMatch = args[0].match(/(\d+)$/);
                                if (pathMatch?.[1]) {
                                    const channelId = pathMatch[1];
                                    const channel = getChannel(channelId);
                                    if (channel && isHidden(channel)) {
                                        // console.log(key.toString())
                                        if (hiddenChannelsSettings.showPopup) {
	                                        showConfirmationAlert({
	                                            title: "This channel is hidden.",
	                                            content: React.createElement(AlertContent, { channel }),
	                                            confirmText: "View Anyway",
	                                            cancelText: "Cancel",
	                                            onConfirm: () => { return orig(...args); },
	                                        });
                                        } else { return orig(...args); }
                                        return {};
                                    }
                                }
                            }
                            return orig(...args);
                        })
                    );
                }
            }
        } else {
            console.warn("[HiddenChannels] transitionToGuild not found.");
        }

        const ChannelInfo = findByName("ChannelInfo", false);
        if (ChannelInfo && hiddenChannelsSettings.showIcon) {
            unpatches.push(
                after("default", ChannelInfo, ([{ channel }], ret) =>
                    React.createElement(
                        React.Fragment,
                        {},
                        channel && isHidden(channel)
                            ? React.createElement(
                                RN.Image,
                                {
                                    source: findAssetId("ic_lock"),
                                    style: { width: 20, height: 20, marginRight: 4 },
                                }
                            )
                            : null,
                        ret,
                    )
                )
            );
        }

    },

    stop() {
        for (const unpatch of unpatches) unpatch();
    },
    settings: Settings,
});
