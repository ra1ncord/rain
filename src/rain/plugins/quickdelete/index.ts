import { instead } from "@api/patcher";
import { waitForHydration } from "@api/storage";
import { findByProps } from "@metro/wrappers";
import { definePlugin } from "@plugins";

import Settings from "./Settings";
import { quickDeleteSettings,useQuickDeleteSettings } from "./storage";

const KEYS = {
    message: {
        hash: "AMvpS4",
        storage: "autoConfirmMessage",
    },
    embed: {
        hash: "vXZ+Fo",
        storage: "autoConfirmEmbed",
    },
} as const;

let autoConfirmMessages: { embed: string; message: string };

let unpatch: () => void;

export default definePlugin({
    name: "QuickDelete",
    description: "Automatically confirm delete popups for messages and embeds",
    author: [
        {
            name: "The Sun",
            id: 406028027768733696n
        },
        {
            name: "Purple_Ξye™",
            id: 646535537334812682n
        }
    ],
    id: "quickdelete",
    version: "v1.0.0",
    async start() {
        waitForHydration(useQuickDeleteSettings);

        const { intl, t: intlMap } = findByProps("intl");

        autoConfirmMessages = {
            embed: intl.string(intlMap[KEYS.embed.hash]),
            message: intl.string(intlMap[KEYS.message.hash]),
        };

        const Popup = findByProps("show", "openLazy");

        if (!Popup) return;

        unpatch = instead("show", Popup, (args, fn) => {
            const popup = args?.[0];
            const title = popup?.children?.props?.title;
            const body = popup?.body;

            if (
                !popup?.onConfirm ||
                typeof popup.onConfirm !== "function" ||
                (typeof title !== "string" && typeof body !== "string")
            ) {
                return fn(...args);
            }

            const shouldConfirm = (type: "message" | "embed") => {
                const matcher = autoConfirmMessages[type];
                if (!matcher) return false;

                return quickDeleteSettings[KEYS[type].storage] && (title?.includes(matcher) || body?.includes(matcher));
            };

            const result = shouldConfirm("message") || shouldConfirm("embed");
            return result ? popup.onConfirm() : fn(...args);
        });
    },
    stop() {
        unpatch?.();
    },
    settings: Settings,
});
