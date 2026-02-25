import { after } from "@api/patcher";
import { findByNameLazy, findByProps, findByPropsLazy, findByStoreName, findByTypeDisplayName } from "@metro";
import { ReactNative } from "@metro/common";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";
import React from "react";

import ChatboxAvatarSettings from "./settings";
import { useChatboxAvatarSettings } from "./storage";

const Flux = findByProps("useStateFromStores");
const ChatInputActions = findByTypeDisplayName("ChatInputActions");
const ChatInputSendButton = findByTypeDisplayName("ChatInputSendButton");
let hasText = false;
let sendBtnRef: { setHasText?: (hasText: boolean) => void } | undefined;
const { Pressable, View } = ReactNative;

const Avatar = findByPropsLazy("default", "AvatarSizes", "getStatusSize")?.default;

const UserStore = findByStoreName("UserStore");
const SelectedChannelStore = findByStoreName("SelectedChannelStore");
const ChannelStore = findByStoreName("ChannelStore");
const SelfPresenceStore = findByStoreName("SelfPresenceStore");
const showUserProfileActionSheet = findByNameLazy("showUserProfileActionSheet");
const showYouAccountActionSheetByProp = findByPropsLazy("showYouAccountActionSheet");

function AvatarAction() {
    const self = Flux?.useStateFromStores?.([UserStore], () => UserStore?.getCurrentUser?.());
    const status = Flux?.useStateFromStores?.([SelfPresenceStore], () => SelfPresenceStore?.getStatus?.());
    const settings = useChatboxAvatarSettings();
    const channelId = Flux?.useStateFromStores?.([SelectedChannelStore], () => SelectedChannelStore?.getCurrentlySelectedChannelId?.());
    const channel = Flux?.useStateFromStores?.([ChannelStore], () => ChannelStore?.getChannel?.(channelId), [channelId]);

    if (!self) return null;

    const openAccountSheet = () => {
        const fn = showYouAccountActionSheetByProp?.showYouAccountActionSheet;
        if (typeof fn === "function") {
            try {
                fn(true, true);
                return;
            } catch (err) {
            }
        }
        showUserProfileActionSheet?.({ userId: self.id, channelId: channel?.id ?? channelId });
    };

    const handlePress = () => {
        switch (settings.pressAction) {
            case "profile":
                showUserProfileActionSheet?.({ userId: self.id, channelId: channel?.id ?? channelId });
                break;
            case "server":
                openAccountSheet();
                break;
            default:
                break;
        }
    };

    const handleLongPress = () => {
        switch (settings.longPressAction) {
            case "profile":
                showUserProfileActionSheet?.({ userId: self.id, channelId: channel?.id ?? channelId });
                break;
            case "server":
                openAccountSheet();
                break;
            default:
                break;
        }
    };

    return (
        <Pressable
            style={{
                height: 40,
                width: 40,
                marginHorizontal: 4,
                flexShrink: 0,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
            }}
            onPress={handlePress}
            onLongPress={handleLongPress}
        >
            {Avatar && (
                <Avatar
                    user={self}
                    guildId={channel?.guild_id}
                    status={settings.showStatusCutout ? status : undefined}
                    avatarDecoration={self?.avatarDecoration}
                    animate={true}
                />
            )}
        </Pressable>
    );
}

const unpatches: (() => void)[] = [];

export default definePlugin({
    name: "ChatboxAvatar",
    description: "Adds your avatar to the chatbox.",
    author: [Developers.LampDelivery],
    id: "chatboxavatar",
    version: "v1.0.0",
    settings: ChatboxAvatarSettings,
    start() {
        if (!ChatInputActions?.type || !ChatInputSendButton?.type) return;
        unpatches.push(
            after("render", ChatInputSendButton.type, (args, ret) => {
                setImmediate(() => {
                    setImmediate(() => {
                        if (args?.[1]?.current) {
                            sendBtnRef = args[1].current;
                            const origSetHasText = sendBtnRef?.setHasText;
                            unpatches.push(() => { if (sendBtnRef && origSetHasText) sendBtnRef.setHasText = origSetHasText; });
                            if (sendBtnRef) {
                                sendBtnRef.setHasText = (hasText_: boolean) => {
                                    hasText = hasText_;
                                    if (origSetHasText) return origSetHasText.call(sendBtnRef, hasText_);
                                };
                            }
                        }
                    });
                });
            })
        );
        unpatches.push(
            after("render", ChatInputActions.type, (args, ret) => {
                const settings = useChatboxAvatarSettings.getState();
                if (settings.collapseWhileTyping && hasText) {
                    return ret;
                }
                return React.createElement(
                    View,
                    { style: { flexDirection: "row", alignItems: "center" } },
                    ret,
                    React.createElement(AvatarAction)
                );
            })
        );
    },
    stop() {
        for (const unpatch of unpatches) unpatch?.();
        unpatches.length = 0;
    },
});
