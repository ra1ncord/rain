/*!
 * https://github.com/amsyarasyiq/aliucordrn-plugins/blob/6c0be39ca673c6ebcf48c0f397246b76d578aa26/MoarConfirm/index.tsx
 *
 * Copyright (c) 2022 Amsyar Rasyiq
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import patcher from "@api/patcher";
import { logger } from "@lib/utils/logger";
import { findByProps, findByStoreName } from "@metro/wrappers";
import { definePlugin } from "@plugins";

const dialog = findByProps("show", "confirm", "close");
const relationshipManager = findByProps("addRelationship");
const callManager = findByProps("handleStartCall");
const actionSheetManager = findByProps("hideActionSheet");
const UserStore = findByStoreName("UserStore");

const patches: (() => void)[] = [];

export default definePlugin({
    name: "MoreConfirm",
    description: "Prompts confirmations before making irreversible actions.",
    author: [{ name: "pylix", id: 492949202121261067n }],
    id: "moreconfirm",
    version: "v1.0.0",

    start() {
        patches.push(patcher.instead("handleStartCall", callManager, (args, orig) => {
            const [{ rawRecipients: [{ username, discriminator }, multiple] }, isVideo] = args;
            const action = isVideo ? "video call" : "call";

            // if `multiple` is defined, it's probably a group call
            dialog.show({
                title: multiple ? `Start a group ${action}?` : `Start a ${action} with ${username}#${discriminator}?`,
                body: multiple ? "Are you sure you want to start the group call?" : `Are you sure you want to ${action} ${username}#${discriminator}?`,
                confirmText: "Yes",
                cancelText: "Cancel",
                confirmColor: "brand",
                onConfirm: () => {
                    try {
                        orig(...args);
                    } catch (e) {
                        logger.error("Failed to start call", e);
                    }
                },
            });
        }));

        patches.push(patcher.instead("addRelationship", relationshipManager, (args, orig) => {
            if (typeof args[0] !== "object" || !args[0].userId) return orig.apply(this, args);
            const { username, discriminator } = UserStore.getUser(args[0].userId);

            // This is hacky, but it *works*
            const hideASInterval = setInterval(() => actionSheetManager.hideActionSheet(), 100);
            setTimeout(() => clearInterval(hideASInterval), 3000);

            const block = args[0].type === 2;
            return new Promise(r => {
                dialog.show({
                    title: `${block ? "Block" : "Friend"} ${username}#${discriminator}?`,
                    body: `Are you sure you want to ${block ? "block" : "friend"} ${username}#${discriminator}?`,
                    confirmText: "Yes",
                    cancelText: "Cancel",
                    confirmColor: "brand",
                    onConfirm: () => {
                        try {
                            r(orig.apply(this, args));
                        } catch (e) {
                            logger.error("Failed to add relationship", e);
                        } finally {
                            clearInterval(hideASInterval);
                        }
                    },
                    onCancel: () => void clearInterval(hideASInterval)
                });
            });
        }));
    },

    stop() {
        for (const unpatch of patches) unpatch();
    }
});
