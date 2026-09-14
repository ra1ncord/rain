import { after } from "@api/patcher";
import { logger } from "@lib/utils/logger";
import { chatInput, messageActions, MessageView, replyActions } from "@metro/common";
import { ChannelStore, MessageStore, UserStore } from "@metro/common/stores";
import { definePlugin } from "@plugins";
import { Contributors } from "@rain/Developers";
import React, { type ReactNode } from "react";
import { Platform } from "react-native";

import TapTapSettings from "./settings";
import { taptapSettings } from "./storage";
import type { MessageTapEvent, MessageViewProps } from "./types";

let unpatch: (() => unknown) | undefined;
let active = false;

function openKeyboard(channelId: string) {
    if (!taptapSettings.keyboardPopup) return;

    chatInput.getChatInputRef(channelId, 0)?.openSystemKeyboard();
}

function handleDoubleTap(event: MessageTapEvent) {
    const { channelId, messageId } = event.nativeEvent;
    const message = MessageStore.getMessage(channelId, messageId);

    if (!message) return false;

    const isAuthor = message.author.id === UserStore.getCurrentUser()?.id;

    if (isAuthor && taptapSettings.userEdit) {
        messageActions.startEditMessage(channelId, messageId, message.content);
    } else if (taptapSettings.reply) {
        replyActions.createPendingReply({ channel: ChannelStore.getChannel(channelId), message, shouldMention: true });
    } else {
        return false;
    }

    openKeyboard(channelId);

    if (taptapSettings.debugMode) logger.log("TapTap: native double-tap handled", { channelId, messageId, isAuthor });

    return true;
}

function handleTapUsername(event: MessageTapEvent) {
    if (Platform.OS !== "ios" || !taptapSettings.tapUsernameMention) return false;

    const { channelId, messageId } = event.nativeEvent;
    const message = MessageStore.getMessage(channelId, messageId);
    const input = chatInput.getChatInputRef(channelId, 0);

    if (!message || !input) return false;

    const discriminator = message.author.discriminator !== "0" ? `#${message.author.discriminator}` : "";
    input.insertText(`@${message.author.username}${discriminator}`);

    return true;
}

function patchMessageView(element: ReactNode): ReactNode {
    if (Array.isArray(element)) {
        const children = element.map(patchMessageView);

        return children.some((child, index) => child !== element[index]) ? children : element;
    }

    if (!React.isValidElement<MessageViewProps>(element)) return element;

    const { props } = element;

    if (typeof props.onDoubleTapMessage === "function") {
        const onDoubleTapMessage = props.onDoubleTapMessage;
        const callbacks: Partial<MessageViewProps> = {
            onDoubleTapMessage: event => {
                if (active && handleDoubleTap(event)) return;

                return onDoubleTapMessage(event);
            }
        };

        if (Platform.OS === "ios" && typeof props.onTapUsername === "function") {
            const onTapUsername = props.onTapUsername;
            callbacks.onTapUsername = event => {
                if (active && handleTapUsername(event)) return;

                return onTapUsername(event);
            };
        }

        return React.cloneElement(element, callbacks);
    }

    const children = patchMessageView(props.children);

    return children === props.children ? element : React.cloneElement(element, {}, children);
}

export default definePlugin({
    name: "TapTap",
    description: "Double-tap others to reply, Double-tap self to edit",
    author: [Contributors.LampDelivery, Contributors.benjii],
    id: "taptap",
    version: "1.0.1",

    async start() {
        if (unpatch) return;

        if (typeof MessageView.type.render !== "function") {
            logger.error("TapTap: Messages render target is unavailable");
            return;
        }

        // Native props already hold the callbacks; patch them before the view renders.
        unpatch = after("render", MessageView.type, (_args, result) => patchMessageView(result as ReactNode));
        active = true;
    },

    stop() {
        active = false;
        unpatch?.();
        unpatch = undefined;
    },
    settings: TapTapSettings,
});
