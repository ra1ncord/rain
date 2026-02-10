import { before } from "@api/patcher";
import { findByName, findByProps } from "@metro";
import { FluxDispatcher } from "@metro/common";

import { hideblockedandignoredmessagesSettings as storage } from "../storage";

const RowManager = findByName("RowManager");
const { isBlocked, isIgnored } = findByProps("isBlocked", "isIgnored");

// User filter logic
const isFilteredUser = (id: any) => {
    if (!id) return false;
    if (storage.blocked && isBlocked(id)) return true;
    return storage.ignored && isIgnored(id);
};

// Full message filter
const filterReplies = (msg: { author: { id: any; }; referenced_message: { author: { id: any; }; }; }) => {
    if (!msg) return false;
    if (isFilteredUser(msg.author?.id)) return true;

    if (storage.removeReplies && msg.referenced_message) {
        if (isFilteredUser(msg.referenced_message.author?.id)) return true;
    }

    return false;
};

export default [
    before("dispatch", FluxDispatcher, ([event]) => {
        if (event.type === "LOAD_MESSAGES_SUCCESS") {
            event.messages = event.messages.filter(
                (msg: any) => !filterReplies(msg)
            );
        }

        if (event.type === "MESSAGE_CREATE" || event.type === "MESSAGE_UPDATE") {
            if (filterReplies(event.message)) {
                event.channelId = "0"; // Drop it
            }
        }
    }),
    before("generate", RowManager.prototype, ([data]) => {
        if (filterReplies(data.message)) {
            data.renderContentOnly = true;
            data.message.content = null;
            data.message.reactions = [];
            data.message.canShowComponents = false;
            if (data.rowType === 2) {
                data.roleStyle = "";
                data.text = "[Filtered message. Check plugin settings.]";
                data.revealed = false;
                data.content = [];
            }
        }
    })
];
