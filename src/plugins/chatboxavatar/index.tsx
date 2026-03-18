import { after } from "@api/patcher";
import { findByNameLazy, findByProps, findByPropsLazy, findByStoreName, findByTypeDisplayName } from "@metro";
import { ReactNative } from "@metro/common";
import { definePlugin } from "@plugins";
import { Developers } from "@rain/Developers";
import React, { useEffect, useRef } from "react";

import ChatboxAvatarSettings from "./settings";
import { useChatboxAvatarSettings } from "./storage";

const Flux = findByProps("useStateFromStores");
const ChatInputActions = findByTypeDisplayName("ChatInputActions");
const ChatInputSendButton = findByTypeDisplayName("ChatInputSendButton");
let hasText = false;
let sendBtnRef: { setHasText?: (hasText: boolean) => void } | undefined;
const { Pressable, View, Animated } = ReactNative;

const avatarCollapse = new Animated.Value(0);

const Avatar = findByPropsLazy("default", "AvatarSizes", "getStatusSize")?.default;

const UserStore = findByStoreName("UserStore");
const SelectedChannelStore = findByStoreName("SelectedChannelStore");
const ChannelStore = findByStoreName("ChannelStore");
const SelfPresenceStore = findByStoreName("SelfPresenceStore");
const showUserProfileActionSheet = findByNameLazy("showUserProfileActionSheet");
const showYouAccountActionSheetByProp = findByPropsLazy("showYouAccountActionSheet");

function AvatarAction() {
    const [textState, setTextState] = React.useState(false);
    const self = Flux?.useStateFromStores?.([UserStore], () => UserStore?.getCurrentUser?.());
    const status = Flux?.useStateFromStores?.([SelfPresenceStore], () => SelfPresenceStore?.getStatus?.());
    const settings = useChatboxAvatarSettings();
    const channelId = Flux?.useStateFromStores?.([SelectedChannelStore], () => SelectedChannelStore?.getCurrentlySelectedChannelId?.());
    const channel = Flux?.useStateFromStores?.([ChannelStore], () => ChannelStore?.getChannel?.(channelId), [channelId]);

    const animated = useRef(avatarCollapse).current;

    React.useEffect(() => {
        const interval = setInterval(() => {
            setTextState(hasText);
        }, 100);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const shouldCollapse = settings.collapseWhileTyping && textState;
        Animated.parallel([
            Animated.timing(animated, {
                toValue: shouldCollapse ? 1 : 0,
                duration: 200,
                useNativeDriver: false,
            }),
        ]).start();
    }, [textState, settings.collapseWhileTyping, animated]);

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
        <Animated.View
            style={{
                height: 40,
                width: animated.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }),
                marginHorizontal: animated.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }),
                flexShrink: 0,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                overflow: settings.collapseWhileTyping ? "hidden" : "visible",
            }}
        >
            <Pressable
                onPress={handlePress}
                onLongPress={handleLongPress}
            >
                {Avatar && (
                    <Avatar
                        user={self}
                        guildId={channel?.guild_id}
                        status={settings.showStatusCutout ? status : undefined}
                        avatarDecoration={self?.avatarDecoration}
                        animate={!settings.collapseWhileTyping || !textState}
                    />
                )}
            </Pressable>
        </Animated.View>
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
    async start() {
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

    },
    async eagerStart() {
        if (!ChatInputActions?.type || !ChatInputSendButton?.type) return;
        unpatches.push(
            after("render", ChatInputActions.type, (args, ret) => {
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
