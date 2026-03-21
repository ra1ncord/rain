import { instead } from "@api/patcher";
import { findByProps } from "@metro";
import { definePlugin } from "@plugins";
import { Contributors,Developers } from "@rain/Developers";
import { Strings } from "@rain/i18n";

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
    name: Strings.PLUGINS.CUSTOM.QUICKDELETE.NAME,
    description: Strings.PLUGINS.CUSTOM.QUICKDELETE.DESCRIPTION,
    author: [
        Contributors.TheSun,
        Contributors.PurpleEye,
        Developers.kmmiio99o
    ],
    id: "quickdelete",
    version: "1.0.0",
    settings: Settings,
    start() {
        if (intl && intlMap) {
            autoConfirmMessages = {
                embed: intl.string(intlMap[KEYS.embed.hash]) || "Remove All Embeds",
                message: intl.string(intlMap[KEYS.message.hash]) || "Delete Message",
            };
        } else {
            autoConfirmMessages = {
                embed: "Remove All Embeds",
                message: "Delete Message",
            };
        }

        const Popup = findByProps("show", "openLazy");
        if (!Popup) return;

        unpatch = instead("show", Popup, (args, fn) => {
            const popup = args?.[0];
            const title = popup?.title;
            const confirmText = popup?.confirmText;
            const body = popup?.children?.props?.message?.content ?? "";

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

                const titleLower = title?.toLowerCase();
                const confirmLower = confirmText?.toLowerCase();
                const bodyLower = body?.toLowerCase();
                const matcherLower = matcher.toLowerCase();
                const match = titleLower?.includes(matcherLower) || confirmLower?.includes(matcherLower) || bodyLower?.includes(matcherLower);
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
