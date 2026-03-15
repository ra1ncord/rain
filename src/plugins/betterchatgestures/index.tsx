import { after, instead } from "@api/patcher";
import { logger } from "@lib/utils/logger";
import { findByProps, findByStoreName } from "@metro";
import { definePlugin } from "@plugins";
import { Contributors, Developers } from "@rain/Developers";

import Settings from "./components/Settings";
import { DefaultNativeEvent, DoubleTapStateProps } from "./def";
import { useBetterChatGesturesSettings } from "./storage";

// Try to find modules with fallbacks
const ChatInputRef = findByProps("insertText");
const ChannelStore = findByStoreName("ChannelStore");
const MessageStore = findByStoreName("MessageStore");
const UserStore = findByStoreName("UserStore");
const Messages = findByProps("sendMessage", "startEditMessage");
const ReplyManager = findByProps("createPendingReply");

// Multiple attempts to find MessagesHandlers with different methods
let MessagesHandlersModule;
try {
    MessagesHandlersModule = findByProps("MessagesHandlers");
} catch (e) {
    logger.warn("BetterChatGestures: Could not find MessagesHandlers via findByProps");
}

// Fallback: try to find it via class name
if (!MessagesHandlersModule) {
    try {
        const allModules = window.vendetta?.metro?.cache || new Map();
        for (const [key, module] of allModules) {
            if (module?.exports?.MessagesHandlers) {
                MessagesHandlersModule = module.exports;
                logger.log("BetterChatGestures: Found MessagesHandlers via cache iteration");
                break;
            }
        }
    } catch (e) {
        logger.error("BetterChatGestures: Failed to find MessagesHandlers via cache", e);
    }
}

const MessagesHandlers = MessagesHandlersModule?.MessagesHandlers;

// Plugin state
let unpatchGetter: Function | null = null;
let unpatchHandlers: Function | null = null;
let currentTapIndex = 0;
let currentMessageID: string | null = null;
let timeoutTap: ReturnType<typeof setTimeout> | null = null;
let patches: Array<() => void> = [];
let handlersInstances = new WeakSet();

function doubleTapState({ state = "UNKNOWN", nativeEvent }: DoubleTapStateProps) {
    try {
        const stateObject = {
            state,
            data: nativeEvent
        };

        if (state === "INCOMPLETE" && nativeEvent) {
            Object.assign(stateObject, {
                reason: {
                    required: {
                        taps: 2,
                        isAuthor: true
                    },
                    received: {
                        taps: nativeEvent.taps,
                        isAuthor: nativeEvent.isAuthor
                    }
                }
            });
        }

        const currentUser = UserStore?.getCurrentUser();
        // Only log for debugging if needed
        if (useBetterChatGesturesSettings.getState().debugMode && currentUser) {
            console.log("DoubleTapState", stateObject);
        }
    } catch (error) {
        logger.error("BetterChatGestures: Error in doubleTapState", error);
    }
}

function resetTapState() {
    try {
        if (timeoutTap) {
            clearTimeout(timeoutTap);
            timeoutTap = null;
        }
        currentTapIndex = 0;
        currentMessageID = null;
    } catch (error) {
        logger.error("BetterChatGestures: Error in resetTapState", error);
    }
}

function patchHandlers(handlers: any) {
    if (handlersInstances.has(handlers)) return;
    handlersInstances.add(handlers);

    try {
        const state = useBetterChatGesturesSettings.getState();

        // Intercept native double-tap handler - handles FAST double taps
        if (handlers.handleDoubleTapMessage) {
            const doubleTapPatch = instead("handleDoubleTapMessage", handlers, (args, orig) => {
                try {
                    if (!args?.[0]?.nativeEvent) return;

                    const { nativeEvent } = args[0];
                    const ChannelID = nativeEvent.channelId;
                    const MessageID = nativeEvent.messageId;

                    if (!ChannelID || !MessageID) return;

                    const channel = ChannelStore?.getChannel(ChannelID);
                    const message = MessageStore?.getMessage(ChannelID, MessageID);

                    if (!message) return;

                    const currentUser = UserStore?.getCurrentUser();
                    const isAuthor = currentUser && message.author ? message.author.id === currentUser.id : false;

                    // Execute custom logic
                    if (isAuthor && state.userEdit) {
                        Messages?.startEditMessage(
                            ChannelID,
                            MessageID,
                            message.content || ""
                        );
                    } else if (state.reply && channel) {
                        ReplyManager?.createPendingReply({
                            channel,
                            message,
                            shouldMention: true
                        });
                    }

                    return;

                } catch (error) {
                    logger.error("BetterChatGestures: Error in handleDoubleTapMessage patch", error);
                }
            });

            patches.push(doubleTapPatch);
        }

        // Patch username tapping
        if (handlers.handleTapUsername && state.tapUsernameMention) {
            const tapUsernamePatch = instead("handleTapUsername", handlers, (args, orig) => {
                try {
                    if (!useBetterChatGesturesSettings.getState().tapUsernameMention) return orig.apply(handlers, args);
                    if (!args?.[0]?.nativeEvent) return orig.apply(handlers, args);

                    const ChatInput = ChatInputRef?.refs?.[0]?.current;
                    const { messageId } = args[0].nativeEvent;

                    if (!ChatInput?.props?.channel?.id) return orig.apply(handlers, args);

                    const message = MessageStore.getMessage(
                        ChatInput.props.channel.id,
                        messageId
                    );

                    if (!message?.author) return orig.apply(handlers, args);

                    const discriminatorText = message.author.discriminator !== "0"
                        ? `#${message.author.discriminator}`
                        : "";
                    ChatInputRef.insertText(`@${message.author.username}${discriminatorText}`);
                } catch (error) {
                    logger.error("BetterChatGestures: Error in handleTapUsername patch", error);
                    return orig.apply(handlers, args);
                }
            });
            patches.push(tapUsernamePatch);
        }

        // Patch tap message - handles SLOW double taps
        if (handlers.handleTapMessage) {
            const tapMessagePatch = after("handleTapMessage", handlers, args => {
                try {
                    if (!args?.[0]) return;

                    const { nativeEvent }: { nativeEvent: DefaultNativeEvent } = args[0];
                    if (!nativeEvent) return;

                    const ChannelID = nativeEvent.channelId;
                    const MessageID = nativeEvent.messageId;
                    if (!ChannelID || !MessageID) return;

                    const channel = ChannelStore?.getChannel(ChannelID);
                    const message = MessageStore?.getMessage(ChannelID, MessageID);

                    if (!message) return;

                    // Track taps
                    if (currentMessageID === MessageID) {
                        currentTapIndex++;
                    } else {
                        resetTapState();
                        currentTapIndex = 1;
                        currentMessageID = MessageID;
                    }

                    let delayMs = 1000;
                    const currentDelay = useBetterChatGesturesSettings.getState().delay;
                    if (currentDelay) {
                        const parsedDelay = parseInt(currentDelay, 10);
                        if (!isNaN(parsedDelay) && parsedDelay >= 200) {
                            delayMs = parsedDelay;
                        }
                    }

                    if (timeoutTap) {
                        clearTimeout(timeoutTap);
                    }

                    timeoutTap = setTimeout(() => {
                        resetTapState();
                    }, delayMs);

                    const currentUser = UserStore?.getCurrentUser();
                    const isAuthor = currentUser && message.author ? message.author.id === currentUser.id : false;

                    const enrichedNativeEvent = {
                        ...nativeEvent,
                        taps: currentTapIndex,
                        content: message.content || "",
                        authorId: message.author?.id,
                        isAuthor
                    };

                    if (currentTapIndex !== 2) {
                        doubleTapState({
                            state: "INCOMPLETE",
                            nativeEvent: enrichedNativeEvent
                        });
                        return;
                    }

                    // Double tap detected!
                    const detectedMessageID = currentMessageID;
                    resetTapState();

                    const currentState = useBetterChatGesturesSettings.getState();
                    if (isAuthor) {
                        if (currentState.userEdit) {
                            Messages?.startEditMessage(
                                ChannelID,
                                detectedMessageID!,
                                enrichedNativeEvent.content
                            );
                        } else if (currentState.reply && channel) {
                            ReplyManager?.createPendingReply({
                                channel,
                                message,
                                shouldMention: true
                            });
                        }
                    } else if (currentState.reply && channel) {
                        ReplyManager?.createPendingReply({
                            channel,
                            message,
                            shouldMention: true
                        });
                    }

                    doubleTapState({
                        state: "COMPLETE",
                        nativeEvent: enrichedNativeEvent
                    });
                } catch (error) {
                    logger.error("BetterChatGestures: Error in handleTapMessage patch", error);
                    resetTapState();
                }
            });
            patches.push(tapMessagePatch);
        }

        unpatchHandlers = () => {
            try {
                patches.forEach(unpatch => {
                    if (typeof unpatch === "function") {
                        unpatch();
                    }
                });
                patches = [];
                handlersInstances = new WeakSet();
            } catch (error) {
                logger.error("BetterChatGestures: Error in unpatchHandlers", error);
            }
        };
    } catch (error) {
        logger.error("BetterChatGestures: Error in patchHandlers", error);
    }
}

export default definePlugin({
    name: "BetterChatGestures",
    description: "Enhanced chat gestures for double-tap actions",
    author: [Contributors.Acquite, Contributors.mystravil, { name: "S-cript-kiddie02", id: 1081004946872352958n }, Developers.SerStars],
    id: "betterchatgestures",
    version: "1.0.0",
    settings: Settings,

    start() {
        try {
            if (!MessagesHandlers) {
                logger.error("BetterChatGestures: MessagesHandlers module not found! Plugin will not work.");
                return;
            }

            const state = useBetterChatGesturesSettings.getState();

            // Validate delay with minimum of 200ms
            if (!state.delay || state.delay === "" || isNaN(parseInt(state.delay, 10)) || parseInt(state.delay, 10) < 200) {
                useBetterChatGesturesSettings.getState().updateSettings({ delay: "1000" });
            }

            logger.log("BetterChatGestures: initialized with delay =", state.delay);

            // Try multiple property names
            const possiblePropertyNames = ["params", "handlers", "_params", "messageHandlers"];
            let origGetParams = null;
            let usedPropertyName = null;

            for (const propName of possiblePropertyNames) {
                origGetParams = Object.getOwnPropertyDescriptor(MessagesHandlers.prototype, propName)?.get;
                if (origGetParams) {
                    usedPropertyName = propName;
                    logger.log(`BetterChatGestures: Found property '${propName}'`);
                    break;
                }
            }

            if (origGetParams && usedPropertyName) {
                Object.defineProperty(MessagesHandlers.prototype, usedPropertyName, {
                    configurable: true,
                    get() {
                        patchHandlers(this);
                        return origGetParams.call(this);
                    }
                });

                unpatchGetter = () => {
                    try {
                        if (origGetParams && usedPropertyName) {
                            Object.defineProperty(MessagesHandlers.prototype, usedPropertyName, {
                                configurable: true,
                                get: origGetParams
                            });
                        }
                    } catch (error) {
                        logger.error("BetterChatGestures: Error in unpatchGetter", error);
                    }
                };
            } else {
                logger.error("BetterChatGestures: Could not find params getter!");
            }
        } catch (error) {
            logger.error("BetterChatGestures: Error in start", error);
        }
    },

    stop() {
        try {
            resetTapState();

            if (unpatchGetter) unpatchGetter();
            if (unpatchHandlers) unpatchHandlers();

            if (timeoutTap) {
                clearTimeout(timeoutTap);
                timeoutTap = null;
            }
        } catch (error) {
            logger.error("BetterChatGestures: Error in stop", error);
        }
    }
});
