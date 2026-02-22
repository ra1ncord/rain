import { findByProps } from "@metro";
import { instead } from "@api/patcher";
import { definePlugin } from "@plugins";

import Settings from "./Settings";
import { quickDeleteSettings } from "./storage";
import {Developers} from "@rain/Developers";

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
        Developers.TheSun,
        Developers.PurpleEye,
        Developers.kmmiio99o
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

        const Popup = findByProps("show", "openLazy");
        if (!Popup) return;

        unpatch = instead("show", Popup, (args, fn) => {
            const popup = args?.[0];
            const title = popup?.title;
            const body = popup?.children?.props?.message?.content;

            if (
                !popup?.onConfirm ||
                typeof popup.onConfirm !== 'function' ||
                (typeof title !== 'string' && typeof body !== 'string')
            ) {;
                return fn(...args)
            }

            const shouldConfirm = (type: "message" | "embed") => {
                const matcher = autoConfirmMessages[type];
                if (!matcher) return false;

                const match = title?.includes(matcher) || body?.includes(matcher);
                return quickDeleteSettings[KEYS[type].storage] && match;
            };

            const result = shouldConfirm("message") || shouldConfirm("embed");
            return result ? popup.onConfirm() : fn(...args);
        });
    },
    stop() {
        unpatch?.();
    },
});
