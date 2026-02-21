import { before, after } from "@api/patcher";
import { showToast } from "@api/ui/toasts";
import findInReactTree from "@lib/utils/findInReactTree";
import { findByProps, findByStoreName, findByName } from "@metro";
import { definePlugin } from "@plugins";
import Settings from "./settings";
import { useMessageLoggerSettings } from "./storage";
import { createFileStorage } from "@api/storage";

let patches: Array<() => void> = [];
const selfDeletedMessages = new Set<string>();
let MessageStore: any;
let UserStore: any;
const deleteable: string[] = [];

// Database logging (Public folder compatible)
const dbStorage = createFileStorage("public/message_logs.json");

async function logToDatabase(message: any, type: "DELETE" | "UPDATE") {
    try {
        const rawLogs = await dbStorage.getItem("logs");
        let currentLogs = [];
        if (typeof rawLogs === "string") {
            try { currentLogs = JSON.parse(rawLogs); } catch (e) { currentLogs = []; }
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
        await dbStorage.setItem("logs", JSON.stringify(currentLogs));
    } catch (e) {
        console.error("[MessageLogger] DB Log Error:", e);
    }
}

function isBot(author: any): boolean {
    return !!(author?.bot || author?.discriminator === "0000" || author?.system);
}

function patchMessageDeleteHandler() {
    const FluxDispatcher = findByProps("dispatch", "_subscriptions");
    const moment = findByProps("utc", "unix", "duration");
    if (!FluxDispatcher || !moment) return () => {};

    // Use a 'before' patch on 'dispatch' to intercept and potentially stop the event
    return before("dispatch", FluxDispatcher, (args: any[]) => {
        try {
            const event = args[0];
            if (!event || event.type !== "MESSAGE_DELETE") return args;

            const storage = useMessageLoggerSettings.getState();
            if (!UserStore) UserStore = findByStoreName("UserStore");
            if (!MessageStore) MessageStore = findByStoreName("MessageStore");

            const currentUserId = UserStore?.getCurrentUser()?.id;
            const { id, channelId } = event;
            const message = MessageStore.getMessage(channelId, id);
            
            if (!message) return args;

            const authorId = message.author?.id;
            const isSelf = authorId === currentUserId;
            const wasSelfDeleted = selfDeletedMessages.has(id);
            
            // CLEAN UP self-delete set
            if (wasSelfDeleted) selfDeletedMessages.delete(id);

            // 1. Bot Filter
            if (storage.ignore.bots && isBot(message.author)) return args;

            // 2. User Blacklist Filter
            if (storage.ignore.users.includes(authorId)) return args;
            
            // 3. Ignore Self Logic
            // If the toggle is ON AND (it's your message OR you deleted it manually)
            if (storage.ignore.self && (isSelf || wasSelfDeleted)) {
                return args;
            }

            // If we reach here, we are LOGGING the message.
            if (deleteable.includes(id)) {
                deleteable.splice(deleteable.indexOf(id), 1);
                return args;
            }

            // Log to DB
            if (storage.databaseLogging) {
                logToDatabase(message, "DELETE").catch(() => {});
            }

            deleteable.push(id);
            
            // AGGRESSIVE: Completely cancel the original MESSAGE_DELETE event
            // by returning null/undefined if the patcher supports it, 
            // or by transforming it into a harmless event.
            // In Rain's patcher, we transform it into a non-destructive event.
            
            let automodMessage = "This message was deleted";
            if (storage.timestamps) {
                automodMessage += ` (${moment().format(storage.ew ? "hh:mm:ss.SS a" : "HH:mm:ss.SS")})`;
            }

            // This transformation prevents Discord's internal stores from removing the message
            args[0] = {
                type: "MESSAGE_EDIT_FAILED_AUTOMOD",
                messageData: {
                    type: 1,
                    message: { channelId, messageId: id },
                },
                errorResponseBody: { code: 200000, message: automodMessage },
            };
            
            // Immediately update the message state in the store to mark it as deleted visually
            // without actually removing it from the store.
            setTimeout(() => {
                FluxDispatcher.dispatch({
                    type: "MESSAGE_UPDATE",
                    message: {
                        ...message,
                        flags: (message.flags || 0) | 8192,
                        content: storage.onlyTimestamps ? "" : message.content
                    }
                });
            }, 0);

            return args;
        } catch (e) {
            console.error("[MessageLogger] Dispatch Patch Error:", e);
        }
        return args;
    });
}

function patchRowManager() {
    const RowManager = findByName("RowManager");
    if (!RowManager) return () => {};

    const originalGenerate = RowManager.prototype.generate;
    RowManager.prototype.generate = function(data: any) {
        try {
            const msg = data?.message;
            if (msg) {
                const storage = useMessageLoggerSettings.getState();
                const currentUserId = findByProps("getCurrentUser")?.getCurrentUser()?.id;

                // Robust check for deleted state
                const isDeleted = msg.was_deleted || msg.deleted || (typeof msg.flags === "number" && (msg.flags & 8192)) || msg.type === 6 || deleteable.includes(msg.id);
                
                if (isDeleted) {
                    // Filter check for UI rendering
                    if (storage.ignore.bots && isBot(msg.author)) return originalGenerate.call(this, data);
                    if (storage.ignore.self && msg.author?.id === currentUserId) return originalGenerate.call(this, data);
                    if (storage.ignore.users.includes(msg.author?.id)) return originalGenerate.call(this, data);

                    msg.style = {
                        backgroundColor: "rgba(240, 71, 71, 0.1)",
                        borderLeftWidth: 4,
                        borderLeftColor: "#F04747"
                    };
                }
            }
        } catch (e) {
            console.error("[MessageLogger] RowManager Error:", e);
        }
        return originalGenerate.call(this, data);
    };

    return () => { RowManager.prototype.generate = originalGenerate; };
}

export default definePlugin({
    name: "MessageLogger",
    description: "Prevents deleted messages from being lost by storing them in memory",
    author: [{ name: "LampDelivery", id: 650805815623680030n }],
    id: "messagelogger",
    version: "v1.5.4",
    settings: Settings,
    start() {
        const MessageActions = findByProps("deleteMessage");
        if (MessageActions) {
            patches.push(before("deleteMessage", MessageActions, (args) => {
                const [, messageId] = args;
                if (messageId) selfDeletedMessages.add(messageId);
            }));
        }

        // Edit history separator
        const EDIT_HISTORY_SEPARATOR = "`[ EDITED ]`";
        const FluxDispatcher = findByProps("dispatch", "_subscriptions");
        const MessageStore = findByStoreName("MessageStore");
        // Patch MESSAGE_UPDATE to track edit history
        patches.push(before("dispatch", FluxDispatcher, (args: any[]) => {
            const event = args[0];
            if (!event || event.type !== "MESSAGE_UPDATE" || !event.message) return;
            const storage = useMessageLoggerSettings.getState();
            const message = event.message;
            if (message.content && message.id) {
                const prevMessage = MessageStore.getMessage(message.channel_id || message.channelId, message.id);
                if (prevMessage && prevMessage.content && prevMessage.content !== message.content) {
                    message.content = prevMessage.content + "\n\n" + EDIT_HISTORY_SEPARATOR + "\n\n" + message.content;
                }
            }
        }));

        // RowManager patch for remove edit history button
        const RowManager = findByName("RowManager");
        if (RowManager) {
            const React = require("react");
            const ActionSheet = findByName("ActionSheet");
            const FormRow = findByName("FormRow");
            const getAssetIDByName = findByProps("getAssetIDByName")?.getAssetIDByName;
            const originalGenerate = RowManager.prototype.generate;
            RowManager.prototype.generate = function(data: any) {
                try {
                    const msg = data?.message;
                    if (msg && typeof msg.content === "string" && msg.content.includes(EDIT_HISTORY_SEPARATOR)) {
                        const separator = new RegExp(EDIT_HISTORY_SEPARATOR, 'gmi');
                        const checkIfBufferExist = separator.test(msg.content);
                        if (checkIfBufferExist && data.buttons) {
                            data.buttons.push(
                                React.createElement(FormRow, {
                                    label: "Remove Edit History",
                                    leading: React.createElement("img", { style: { opacity: 1 }, src: getAssetIDByName ? getAssetIDByName("ic_edit_24px") : undefined }),
                                    onPress: () => {
                                        let Edited = EDIT_HISTORY_SEPARATOR + "\n\n";
                                        const lats = msg.content.split(Edited);
                                        const targetMessage = lats[lats.length - 1];
                                        FluxDispatcher.dispatch({
                                            type: "MESSAGE_UPDATE",
                                            message: {
                                                ...msg,
                                                content: `${targetMessage}`,
                                                embeds: msg.embeds ?? [],
                                                attachments: msg.attachments ?? [],
                                                mentions: msg.mentions ?? [],
                                                guild_id: msg.guild_id,
                                            },
                                            otherPluginBypass: true
                                        });
                                        ActionSheet.hideActionSheet && ActionSheet.hideActionSheet();
                                        showToast && showToast("[MessageLogger] Edit history removed", getAssetIDByName ? getAssetIDByName("ic_edit_24px") : undefined);
                                    }
                                })
                            );
                        }
                    }
                } catch (e) {
                    console.error("[MessageLogger] RowManager Error:", e);
                }
                return originalGenerate.call(this, data);
            };
            patches.push(() => { RowManager.prototype.generate = originalGenerate; });
        }

        patches.push(patchMessageDeleteHandler());
    },
    stop() {
        for (const unpatch of patches) unpatch();
        patches = [];
        selfDeletedMessages.clear();
        deleteable.length = 0;
    },
});
