import { findByProps } from "@metro";
import { instead } from "@api/patcher";
import { definePlugin } from "@plugins";

import Settings from "./Settings";
import { quickDeleteSettings } from "./storage";

const { intl, t: intlMap } = findByProps("intl");

const KEYS = {
    message: {
        hash: "AMvpS4",
        storage: "autoConfirmMessage",
        default: true,
    },
    embed: {
        hash: "vXZ+Fo",
        storage: "autoConfirmEmbed",
        default: true,
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
    version: "1.0.0",
    settings: Settings,
    start() {
        if (intl && intlMap) {
            autoConfirmMessages = {
                embed: intl.string(intlMap[KEYS.embed.hash]) || "Delete embed",
                message: intl.string(intlMap[KEYS.message.hash]) || "Delete Message",
            };
        } else {
            autoConfirmMessages = {
                embed: "Delete embed",
                message: "Delete Message",
            };
        }
        
        console.log("[QuickDelete] Starting...");
        const Popup = findByProps("show", "openLazy");
        console.log("[QuickDelete] Popup found:", !!Popup);
        if (!Popup) return;

        unpatch = instead("show", Popup, (args, fn) => {
            const popup = args?.[0];
            console.log("[QuickDelete] Popup:", popup);
            const title = popup?.title;
            const body = popup?.children?.props?.message?.content;
            console.log("[QuickDelete] title:", title, "body:", body);

            if (
                !popup?.onConfirm ||
                typeof popup.onConfirm !== 'function' ||
                (typeof title !== 'string' && typeof body !== 'string')
            ) {
                console.log("[QuickDelete] Skipping - not a delete popup");
                return fn(...args)
            }

            const shouldConfirm = (type: "message" | "embed") => {
                const matcher = autoConfirmMessages[type];
                console.log("[QuickDelete] matcher:", matcher, "setting:", quickDeleteSettings[KEYS[type].storage]);
                if (!matcher) return false;

                const match = title?.includes(matcher) || body?.includes(matcher);
                console.log("[QuickDelete] match:", match);
                return quickDeleteSettings[KEYS[type].storage] && match;
            };

            const result = shouldConfirm("message") || shouldConfirm("embed");
            console.log("[QuickDelete] result:", result);
            return result ? popup.onConfirm() : fn(...args);
        });
    },
    stop() {
        unpatch?.();
    },
});
