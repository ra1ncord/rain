import { before } from "@api/patcher";
import { createFileStorage } from "@api/storage";
import { showToast } from "@api/ui/toasts";
import { findByName, findByProps, findByStoreName } from "@metro";
import { definePlugin } from "@plugins";
import { Contributors, Developers } from "@rain/Developers";

import Settings from "./settings";
import { useMessageLoggerSettings } from "./storage";

let patches: Array<() => void> = [];
const selfDeletedMessages = new Set<string>();
let MessageStore: any;
let UserStore: any;
const deleteable: string[] = [];

const dbStorage = createFileStorage("public/message_logs.json");

async function logToDatabase(message: any, type: "DELETE" | "UPDATE") {
    try {
        const rawLogs = dbStorage.getItem("logs");
        let currentLogs: any[] = [];
        if (typeof rawLogs === "string") {
            try { currentLogs = JSON.parse(rawLogs); } catch { currentLogs = []; }
        }
        const logEntry = {
            timestamp: new Date().toISOString(),
            type,
            messageId: message.id,
            channelId: message.channelId,
            author: {
                id: message.author?.id,
                username: message.author?.username,
                discriminator: message.author?.discriminator,
                bot: !!message.author?.bot
            },
            content: message.content,
            attachments: message.attachments?.map((a: any) => a.url) || []
        };
        currentLogs.push(logEntry);
        if (currentLogs.length > 1000) currentLogs.shift();
        dbStorage.setItem("logs", JSON.stringify(currentLogs));
    } catch (e) {
        console.error("[MessageLogger] DB Log Error:", e);
    }
}

function isBot(author: any): boolean {
    if (!author) return false;
    return !!(author.bot || author.discriminator === "0000" || author.system);
}

function shouldIgnoreMessage(message: any, storage: any): boolean {
    try {
        if (!message?.author?.id) return false;

        if (storage.filters?.ignoreBots && isBot(message.author)) return true;

        if (message?.__rainenhancements) return true;

        return false;
    } catch {
        return false;
    }
}

function formatTimestamp(use12Hour: boolean): string {
    try {
        const moment = findByProps("utc", "unix", "duration");
        if (!moment) return "";
        return moment().format(use12Hour ? "hh:mm:ss.SS a" : "HH:mm:ss.SS");
    } catch {
        return "";
    }
}

function patchMessageDeleteHandler() {
    try {
        const FluxDispatcher = findByProps("dispatch", "_subscriptions");
        const moment = findByProps("utc", "unix", "duration");
        if (!FluxDispatcher || !moment) return () => {};

        return before("dispatch", FluxDispatcher, (args: any[]) => {
            try {
                const event = args[0];
                if (!event || event.type !== "MESSAGE_DELETE") return args;
                if (event.otherPluginBypass) return args;

                const storage = useMessageLoggerSettings.getState();
                if (!storage.deleted?.enabled) return args;

                if (!UserStore) UserStore = findByStoreName("UserStore");
                if (!MessageStore) MessageStore = findByStoreName("MessageStore");

                if (!UserStore || !MessageStore) return args;

                const currentUserId = UserStore.getCurrentUser?.()?.id;
                const { id, channelId } = event;
                const message = MessageStore.getMessage?.(channelId, id);

                if (!message) return args;
                if(storage.ignoreList.split(" ").indexOf(message?.author?.id.toString()) != -1) return args;

                if (shouldIgnoreMessage(message, storage)) return args;

                const wasSelfDeleted = selfDeletedMessages.has(id);
                if (wasSelfDeleted) selfDeletedMessages.delete(id);

                if (deleteable.includes(id)) {
                    const idx = deleteable.indexOf(id);
                    deleteable.splice(idx, 1);
                    return args;
                }

                if (storage.databaseLogging) {
                    logToDatabase(message, "DELETE").catch(() => {});
                }

                deleteable.push(id);

                let automodMessage = "This message was deleted";
                
                if(storage.customDeleteTextEnabled) automodMessage = storage.customDeletedText;
                if (storage.deleted?.showTimestamps) {
                    automodMessage += ` (${formatTimestamp(storage.deleted.use12Hour)})`;
                }

                args[0] = {
                    type: "MESSAGE_EDIT_FAILED_AUTOMOD",
                    messageData: {
                        type: 1,
                        message: { channelId, messageId: id },
                    },
                    errorResponseBody: { code: 200000, message: automodMessage },
                };

                setTimeout(() => {
                    try {
                        FluxDispatcher.dispatch({
                            type: "MESSAGE_UPDATE",
                            otherPluginBypass: true,
                            message: {
                                ...message,
                                flags: (message.flags || 0) | 8192,
                                content: storage.deleted?.showOnlyTimestamp ? "" : message.content
                            }
                        });
                    } catch (e) {
                        console.error("[MessageLogger] Failed to dispatch MESSAGE_UPDATE:", e);
                    }
                }, 0);

                return args;
            } catch (e) {
                console.error("[MessageLogger] Dispatch Patch Error:", e);
            }
            return args;
        });
    } catch (e) {
        console.error("[MessageLogger] Failed to patch delete handler:", e);
        return () => {};
    }
}

function patchMessageEditHandler() {
    try {
        const FluxDispatcher = findByProps("dispatch", "_subscriptions");
        const MessageStore = findByStoreName("MessageStore");
        const emojiRegex = /https:\/\/cdn\.discordapp\.com\/emojis\/\d+\.\w+/g;

        if (!FluxDispatcher || !MessageStore) return () => {};

        return before("dispatch", FluxDispatcher, (args: any[]) => {
            try {
                const event = args[0];
                if (!event || event.type !== "MESSAGE_UPDATE" || !event.message) return args;
                if (event.otherPluginBypass) return args;

                let EDIT_HISTORY_SEPARATOR = "-# `[ EDITED ]`";
                const storage = useMessageLoggerSettings.getState();
                if(storage.customEditTextEnabled) EDIT_HISTORY_SEPARATOR = storage.customEditText;

                if (!storage.edited?.enabled) return args;

                const message = event.message;
                if (!message?.content || !message?.id) return args;

                if (storage.filters?.ignoreSelfEdits && message?.author?.id == findByStoreName("UserStore").getCurrentUser().id) return args;
                
                if(storage.ignoreList.split(" ").indexOf(message?.author?.id.toString()) != -1) return args;
                const prevMessage = MessageStore.getMessage?.(message.channel_id || message.channelId, message.id);
                if (!prevMessage || !prevMessage.content || prevMessage.content === message.content) return args;

                if (prevMessage?.__rainenhancements || message?.__rainenhancements) return args;

                const separator = storage.edited?.showSeparator !== false ? EDIT_HISTORY_SEPARATOR : "";
                const oldContent = prevMessage.content.replace(emojiRegex, "").trim();
                const newContent = oldContent + (separator ? `\n\n${separator}\n\n` : "\n") + message.content;

                event.message = {
                    ...message,
                    content: newContent
                };
            } catch (e) {
                console.error("[MessageLogger] MESSAGE_UPDATE Error:", e);
            }
            return args;
        });
    } catch (e) {
        console.error("[MessageLogger] Failed to patch edit handler:", e);
        return () => {};
    }
}

function patchRowManager() {
    try {
        const RowManager = findByName("RowManager");
        if (!RowManager) return () => {};

        const EDIT_HISTORY_SEPARATOR = "`[ EDITED ]`";

        return before("generate", RowManager.prototype, args => {
            try {
                const data = args[0];
                if (!data?.message) return args;

                const msg = data.message;
                const storage = useMessageLoggerSettings.getState();

                const isDeleted = msg.was_deleted || msg.deleted || (typeof msg.flags === "number" && (msg.flags & 8192)) || msg.type === 6 || deleteable.includes(msg.id);

                if (isDeleted && storage.deleted?.enabled) {
                    if (shouldIgnoreMessage(msg, storage)) return args;

                    msg.style = {
                        backgroundColor: "rgba(240, 71, 71, 0.1)",
                        borderLeftWidth: 4,
                        borderLeftColor: "#F04747"
                    };
                }

                if (storage.edited?.enabled && typeof msg.content === "string" && msg.content.includes(EDIT_HISTORY_SEPARATOR)) {
                    const separator = new RegExp(EDIT_HISTORY_SEPARATOR, "gmi");
                    if (separator.test(msg.content) && data.buttons) {
                        const React = require("react");
                        const ActionSheet = findByName("ActionSheet");
                        const FormRow = findByName("FormRow");
                        const getAssetIDByName = findByProps("getAssetIDByName")?.getAssetIDByName;
                        const FluxDispatcher = findByProps("dispatch", "_subscriptions");

                        data.buttons.push(
                            React.createElement(FormRow, {
                                label: "Remove Edit History",
                                leading: React.createElement("img", { style: { opacity: 1 }, src: getAssetIDByName ? getAssetIDByName("ic_edit_24px") : undefined }),
                                onPress: () => {
                                    try {
                                        const Edited = EDIT_HISTORY_SEPARATOR + "\n\n";
                                        const parts = msg.content.split(Edited);
                                        const targetMessage = parts[parts.length - 1];

                                        if (FluxDispatcher) {
                                            FluxDispatcher.dispatch({
                                                type: "MESSAGE_UPDATE",
                                                otherPluginBypass: true,
                                                message: {
                                                    ...msg,
                                                    content: targetMessage,
                                                    embeds: msg.embeds ?? [],
                                                    attachments: msg.attachments ?? [],
                                                    mentions: msg.mentions ?? [],
                                                    guild_id: msg.guild_id,
                                                },
                                            });
                                        }

                                        if (ActionSheet?.hideActionSheet) {
                                            ActionSheet.hideActionSheet();
                                        }

                                        showToast("[MessageLogger] Edit history removed", getAssetIDByName ? getAssetIDByName("ic_edit_24px") : undefined);
                                    } catch (e) {
                                        console.error("[MessageLogger] Remove edit history error:", e);
                                    }
                                }
                            })
                        );
                    }
                }
            } catch (e) {
                console.error("[MessageLogger] RowManager Error:", e);
            }
            return args;
        });
    } catch (e) {
        console.error("[MessageLogger] Failed to patch RowManager:", e);
        return () => {};
    }
}

function patchDeleteAction() {
    try {
        const MessageActions = findByProps("deleteMessage");
        if (!MessageActions) return () => {};

        return before("deleteMessage", MessageActions, args => {
            try {
                const [, messageId] = args;
                if (messageId) selfDeletedMessages.add(messageId);
            } catch (e) {
                console.error("[MessageLogger] Delete action patch error:", e);
            }
            return args;
        });
    } catch (e) {
        console.error("[MessageLogger] Failed to patch delete action:", e);
        return () => {};
    }
}

export default definePlugin({
    name: "MessageLogger",
    description: "Prevents deleted messages from being lost by storing them in memory",
    author: [Contributors.LampDelivery, Developers.kmmiio99o],
    id: "messagelogger",
    version: "2.0.0",
    settings: Settings,
    start() {
        patches.push(patchDeleteAction());
        patches.push(patchMessageDeleteHandler());
        patches.push(patchMessageEditHandler());
        patches.push(patchRowManager());
    },
    stop() {
        for (const unpatch of patches) {
            try {
                unpatch();
            } catch (e) {
                console.error("[MessageLogger] Error unpatching:", e);
            }
        }
        patches = [];
        selfDeletedMessages.clear();
        deleteable.length = 0;
    },
});
