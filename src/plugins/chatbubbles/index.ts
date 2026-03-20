import { isChatBubblesSupported } from "@api/native/loader";
import BubbleModule from "@api/native/modules/bubble";
import { waitForHydration } from "@api/storage";
import { logger } from "@lib/utils/logger";
import { findByStoreName } from "@metro";
import { FluxDispatcher, tokens } from "@metro/common";
import { definePlugin } from "@plugins";
import { Contributors, Developers } from "@rain/Developers";

import settings from "./settings";
import { useChatBubblesSettings } from "./storage";

export default definePlugin({
    name: "ChatBubbles",
    description: "Adds customizable chat bubbles to the chat, similar to Flowercord",
    author: [ Contributors.pylix, Developers.cocobo1, Developers.kmmiio99o ],
    id: "chatbubbles",
    version: "1.0.0",
    predicates: [
        () => isChatBubblesSupported() === true,
    ],
    async eagerStart() {
        BubbleModule?.hookBubbles();
        await waitForHydration(useChatBubblesSettings);

        const updateBubbleAppearance = () => {
            const { avatarRadius, bubbleChatRadius } = useChatBubblesSettings.getState();
            const color = getBubbleColor();
            BubbleModule?.configure(avatarRadius, bubbleChatRadius, color)
                .then(() => logger.info("configure succeeded"))
                .catch(e => logger.error("configure failed:", e));
        };

        const getBubbleColor = (): string => {
            const { bubbleChatColor } = useChatBubblesSettings.getState();
            if (bubbleChatColor) return bubbleChatColor;
            try {
                const token = tokens.colors.BACKGROUND_SECONDARY_ALT;
                const theme = findByStoreName("ThemeStore")?.theme;
                const resolved = tokens.internal.resolveSemanticColor(theme, token);
                if (typeof resolved === "string" && resolved.startsWith("#")) return resolved;
            } catch {}
            return "#00000066";
        };

        updateBubbleAppearance();

        for (const event of [
            "CACHE_LOADED",
            "SELECTIVELY_SYNCED_USER_SETTINGS_UPDATE",
            "THEME_UPDATE",
        ]) {
            FluxDispatcher.subscribe(event, updateBubbleAppearance);
        }

        useChatBubblesSettings.subscribe(updateBubbleAppearance);
    },
    stop() {
        BubbleModule?.unhookBubbles();
    },
    settings: settings
});
