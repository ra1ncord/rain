import { before } from "@api/patcher";
import { showToast } from "@api/ui/toasts";
import findInReactTree from "@lib/utils/findInReactTree";
import { findByProps, findByStoreName } from "@metro";
import { definePlugin } from "@plugins";

import Settings from "./settings";
import type { MessageLoggerSettings } from "./storage";

let MessageStore: any;
const deleteable: string[] = [];
let patches: Array<() => void> = [];

function patchMessageDeleteHandler(storage: MessageLoggerSettings) {
    const FluxDispatcher = findByProps("dispatch", "_subscriptions");
    const moment = findByProps("utc", "unix", "duration");
    if (!FluxDispatcher || !moment) return () => {};
    return before("dispatch", FluxDispatcher, (args: any[]) => {
        try {
            if (!MessageStore) MessageStore = findByStoreName("MessageStore");
            const event = args[0];
            if (!event || event?.type !== "MESSAGE_DELETE") return;
            if (!event?.id || !event?.channelId) return;
            const message = MessageStore.getMessage(event.channelId, event.id);
            if (storage.ignore.users.includes(message?.author?.id)) return;
            if (storage.ignore.bots && message?.author?.bot) return;
            if (deleteable.includes(event.id)) {
                deleteable.splice(deleteable.indexOf(event.id), 1);
                return args;
            }
            deleteable.push(event.id);
            let automodMessage = "This message was deleted";
            if (storage.timestamps) automodMessage += ` (${moment().format(storage.ew ? "hh:mm:ss.SS a" : "HH:mm:ss.SS")})`;
            args[0] = {
                type: "MESSAGE_EDIT_FAILED_AUTOMOD",
                messageData: {
                    type: 1,
                    message: {
                        channelId: event.channelId,
                        messageId: event.id,
                    },
                },
                errorResponseBody: {
                    code: 200000,
                    message: automodMessage,
                },
            };
            return args;
        } catch (e) {
            console.error(e);
        }
    });
}

function patchUserProfileContextMenu(storage: MessageLoggerSettings) {
    const ScrollView = findByProps("ScrollView");
    if (!ScrollView) return () => {};
    return before("render", ScrollView.View, (args: any[]) => {
        try {
            const a = findInReactTree(args, (r: any) => r.key === ".$UserProfileOverflow");
            if (!a || !a.props || a.props.sheetKey !== "UserProfileOverflow") return;
            const props = a.props.content.props;
            const addLabel = "Add to ignored users list";
            const removeLabel = "Remove from ignored users list";
            if (props.options.some((option: any) => [addLabel, removeLabel].includes(option?.label))) return;
            const focusedUserId = Object.keys(a._owner.stateNode._keyChildMapping)
                .find(str => a._owner.stateNode._keyChildMapping[str] && str.match(/(?<=\\$UserProfile)\\d+/))
                ?.slice?.(".$UserProfile".length);
            const optionPosition = props.options.findLastIndex((option: any) => option.isDestructive);
            if (typeof focusedUserId === "string") {
                if (!storage.ignore.users.includes(focusedUserId)) {
                    props.options.splice(optionPosition + 1, 0, {
                        isDestructive: true,
                        label: addLabel,
                        onPress: () => {
                            storage.ignore.users.push(focusedUserId);
                            showToast(`Added ${props.header.title} to the ignored users list`);
                            props.hideActionSheet();
                        },
                    });
                } else {
                    props.options.splice(optionPosition + 1, 0, {
                        label: removeLabel,
                        onPress: () => {
                            storage.ignore.users.splice(
                                storage.ignore.users.findIndex((userId: string) => userId === focusedUserId),
                                1
                            );
                            showToast(`Removed ${props.header.title} from the ignored users list`);
                            props.hideActionSheet();
                        },
                    });
                }
            }
        } catch (e) {
            console.error(e);
        }
    });
}

const defaultSettings: MessageLoggerSettings = {
    ignore: {
        users: [],
        channels: [],
        bots: false,
    },
    timestamps: false,
    ew: false,
    onlyTimestamps: false,
};

export default definePlugin({
    name: "MessageLogger",
    description: "Prevents deleted messages from being lost by storing them in memory",
    author: [{ name: "LampDelivery", id: 650805815623680030n }],
    id: "messagelogger",
    version: "v1.0.0",
    settings: Settings,
    start() {
        const storage = require("./storage").useMessageLoggerSettings.getState();
        Object.assign(storage, JSON.parse(JSON.stringify(defaultSettings)), storage);
        patches.push(patchMessageDeleteHandler(storage));
        patches.push(patchUserProfileContextMenu(storage));
    },
    stop() {
        for (const unpatch of patches) unpatch();
        patches = [];
    },
});
