import { definePlugin } from "@plugins";
import { after, instead } from "@api/patcher";
import { logger } from "@lib/utils/logger";
import { findByProps, findByStoreName } from "@metro/wrappers";
import { ReactNative } from "@metro/common";
import TapTapSettings from "./settings";
import { taptapSettings, waitForTapTapHydration } from "./storage";

type Unpatch = () => void;

let ChannelStore: any;
let MessageStore: any;
let UserStore: any;
let Messages: any;
let ReplyManager: any;
let ChatInputRef: any;
let MessagesHandlers: any;
let getChatInputRef: any;

let unpatchGetter: Unpatch | null = null;
let unpatchHandlers: Unpatch | null = null;
let currentTapIndex = 0;
let currentMessageID: string | null = null;
let timeoutTap: any = null;
let handlerInstances = new WeakSet<any>();
let patches: Unpatch[] = [];

function resetTapState() {
    try {
        if (timeoutTap) {
            clearTimeout(timeoutTap);
            timeoutTap = null;
        }
        currentTapIndex = 0;
        currentMessageID = null;
    } catch (e) {
        logger.error("TapTap: resetTapState error", e);
    }
}

function openKeyboard(channelId: string) {
    if (!taptapSettings.keyboardPopup) return;
    try {
        const ChatInputRef = getChatInputRef(channelId, 0);
        if (ChatInputRef?.openSystemKeyboard) {
            ChatInputRef?.openSystemKeyboard();
            return;
        }
        const keyboardModule = findByProps(
            "openSystemKeyboard",
            "openSystemKeyboardForLastCreatedInput",
        );
        if (keyboardModule?.openSystemKeyboard) {
            keyboardModule.openSystemKeyboard();
            return;
        }
        if (keyboardModule?.openSystemKeyboardForLastCreatedInput) {
            keyboardModule.openSystemKeyboardForLastCreatedInput();
            return;
        }

        const ChatInput = ChatInputRef?.refs?.[0]?.current;
        if (ChatInput?.focus) {
            ChatInput.focus();
            return;
        }

        if (ReactNative.Keyboard?.dismiss) {
            setTimeout(() => {
                if (ChatInput?.focus) ChatInput.focus();
            }, 50);
        }
    } catch (e) {
        if (taptapSettings.debugMode)
            logger.error("TapTap: openKeyboard error", e);
    }
}

function doubleTapState(
    state: "UNKNOWN" | "INCOMPLETE" | "COMPLETE",
    nativeEvent?: any,
) {
    try {
        if (taptapSettings.debugMode) {
            logger.log("TapTap: DoubleTapState", { state, data: nativeEvent });
        }
    } catch (e) {
        // ignore
    }
}

function patchHandlers(handlers: any) {
    if (!handlers || handlerInstances.has(handlers)) return;
    handlerInstances.add(handlers);

    try {
        if (handlers.handleDoubleTapMessage) {
            const un = instead(
                "handleDoubleTapMessage",
                handlers,
                (args, orig) => {
                    try {
                        const evt = args?.[0]?.nativeEvent;
                        if (!evt) return;
                        const channelId = evt.channelId;
                        const messageId = evt.messageId;
                        if (!channelId || !messageId) return;

                        const channel = ChannelStore?.getChannel?.(channelId);
                        const message = MessageStore?.getMessage?.(
                            channelId,
                            messageId,
                        );
                        if (!message) return;

                        const currentUser = UserStore?.getCurrentUser?.();
                        const isAuthor = !!(
                            currentUser &&
                            message.author &&
                            message.author.id === currentUser.id
                        );

                        if (isAuthor && taptapSettings.userEdit) {
                            Messages?.startEditMessage?.(
                                channelId,
                                messageId,
                                message.content ?? "",
                            );
                        } else if (taptapSettings.reply && channel) {
                            ReplyManager?.createPendingReply?.({
                                channel,
                                message,
                                shouldMention: true,
                            });
                        }

                        openKeyboard(channelId);
                        return;
                    } catch (e) {
                        logger.error("TapTap: handleDoubleTapMessage error", e);
                    }
                },
            );
            patches.push(un);
        }

        if (handlers.handleTapUsername) {
            const un = instead("handleTapUsername", handlers, (args, orig) => {
                try {
                    if (!taptapSettings.tapUsernameMention)
                        return orig.apply(handlers, args);
                    const evt = args?.[0]?.nativeEvent;
                    if (!evt) return orig.apply(handlers, args);

                    const ChatInput = ChatInputRef?.refs?.[0]?.current;
                    const messageId = evt.messageId;
                    const channelId = ChatInput?.props?.channel?.id;
                    if (!channelId) return orig.apply(handlers, args);

                    const message = MessageStore?.getMessage?.(
                        channelId,
                        messageId,
                    );
                    if (!message?.author) return orig.apply(handlers, args);

                    const discr =
                        message.author.discriminator !== "0"
                            ? `#${message.author.discriminator}`
                            : "";
                    ChatInputRef?.insertText?.(
                        `@${message.author.username}${discr}`,
                    );
                } catch (e) {
                    logger.error("TapTap: handleTapUsername error", e);
                    return orig.apply(handlers, args);
                }
            });
            patches.push(un);
        }

        if (handlers.handleTapMessage) {
            const un = after("handleTapMessage", handlers, (args) => {
                try {
                    const nativeEvent = args?.[0]?.nativeEvent;
                    if (!nativeEvent) return;
                    const channelId = nativeEvent.channelId;
                    const messageId = nativeEvent.messageId;
                    if (!channelId || !messageId) return;

                    const channel = ChannelStore?.getChannel?.(channelId);
                    const message = MessageStore?.getMessage?.(
                        channelId,
                        messageId,
                    );
                    if (!message) return;

                    if (currentMessageID === messageId) currentTapIndex++;
                    else {
                        resetTapState();
                        currentTapIndex = 1;
                        currentMessageID = messageId;
                    }

                    let delayMs = 1000;
                    const parsed = parseInt(taptapSettings.delay, 10);
                    if (!Number.isNaN(parsed) && parsed >= 200)
                        delayMs = parsed;

                    if (timeoutTap) clearTimeout(timeoutTap);
                    timeoutTap = setTimeout(() => resetTapState(), delayMs);

                    const currentUser = UserStore?.getCurrentUser?.();
                    const isAuthor = !!(
                        currentUser &&
                        message.author &&
                        message.author.id === currentUser.id
                    );

                    const enriched = {
                        ...nativeEvent,
                        taps: currentTapIndex,
                        content: message.content ?? "",
                        authorId: message.author?.id,
                        isAuthor,
                    };

                    if (currentTapIndex !== 2) {
                        doubleTapState("INCOMPLETE", enriched);
                        return;
                    }

                    const mid = currentMessageID;
                    resetTapState();

                    if (isAuthor) {
                        if (taptapSettings.userEdit) {
                            Messages?.startEditMessage?.(
                                channelId,
                                mid,
                                enriched.content,
                            );
                        } else if (taptapSettings.reply && channel) {
                            ReplyManager?.createPendingReply?.({
                                channel,
                                message,
                                shouldMention: true,
                            });
                        }
                    } else if (taptapSettings.reply && channel) {
                        ReplyManager?.createPendingReply?.({
                            channel,
                            message,
                            shouldMention: true,
                        });
                    }

                    openKeyboard(channelId);
                    doubleTapState("COMPLETE", enriched);
                } catch (e) {
                    logger.error("TapTap: handleTapMessage error", e);
                    resetTapState();
                }
            });
            patches.push(un);
        }

        unpatchHandlers = () => {
            try {
                patches.forEach((u) => {
                    try {
                        u?.();
                    } catch {}
                });
                patches = [];
                handlerInstances = new WeakSet();
            } catch (e) {
                logger.error("TapTap: unpatchHandlers error", e);
            }
        };
    } catch (e) {
        logger.error("TapTap: patchHandlers error", e);
    }
}

function hookMessagesHandlersGetter() {
    if (!MessagesHandlers?.prototype) return;
    const propNames = [
        "params",
        "handlers",
        "_params",
        "messageHandlers",
    ] as const;
    let used: string | null = null;
    let origGet: any = null;

    for (const name of propNames) {
        const desc = Object.getOwnPropertyDescriptor(
            MessagesHandlers.prototype,
            name,
        );
        if (desc?.get) {
            used = name;
            origGet = desc.get;
            logger.log(`TapTap: Found handlers getter '${name}'`);
            break;
        }
    }

    if (!used || !origGet) {
        logger.error("TapTap: Could not find handlers getter");
        return;
    }

    Object.defineProperty(MessagesHandlers.prototype, used, {
        configurable: true,
        get: function () {
            try {
                if (this) patchHandlers(this);
            } catch {}
            return origGet.call(this);
        },
    });

    unpatchGetter = () => {
        try {
            Object.defineProperty(MessagesHandlers.prototype, used!, {
                configurable: true,
                get: origGet,
            });
        } catch (e) {
            logger.error("TapTap: unpatchGetter error", e);
        }
    };
}

function resolveRuntimeModules() {
    ChannelStore = findByStoreName("ChannelStore");
    MessageStore = findByStoreName("MessageStore");
    UserStore = findByStoreName("UserStore");
    Messages = findByProps("sendMessage", "startEditMessage");
    ReplyManager = findByProps("createPendingReply");
    ChatInputRef = findByProps("insertText");
    getChatInputRef = findByProps("getChatInputRef").getChatInputRef;

    let mhModule = findByProps("MessagesHandlers");
    MessagesHandlers = mhModule?.MessagesHandlers ?? null;
}

export default definePlugin({
    name: "TapTap",
    description: "Double-tap others to reply, Double-tap self to edit",
    author: [{ name: "LampDelivery", id: 650805815623680030n }],
    id: "taptap",
    version: "v1.0.0",
    async start() {
        await waitForTapTapHydration();

        resolveRuntimeModules();

        if (!MessagesHandlers) {
            logger.error("TapTap: MessagesHandlers not found; plugin inactive");
            return;
        }

        const parsed = parseInt(taptapSettings.delay, 10);
        if (Number.isNaN(parsed) || parsed < 150) {
            taptapSettings.delay = "300";
        }

        hookMessagesHandlersGetter();
    },
    stop() {
        resetTapState();
        try {
            unpatchGetter?.();
        } catch {}
        try {
            unpatchHandlers?.();
        } catch {}
        if (timeoutTap) {
            clearTimeout(timeoutTap);
            timeoutTap = null;
        }
        patches.forEach((u) => {
            try {
                u?.();
            } catch {}
        });
        patches = [];
        handlerInstances = new WeakSet();
    },
    settings() {
        return TapTapSettings();
    },
});