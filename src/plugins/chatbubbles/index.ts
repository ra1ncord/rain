import { findByProps, findByStoreName, filters } from "@metro";
import { tokens } from "@metro/common";
import { waitFor } from "@metro/internals/modules";
import { waitForHydration } from "@api/storage";
import { definePlugin } from "@plugins";
import { logger } from "@lib/utils/logger";
import { useChatBubblesSettings } from "./storage";
import BubbleModule from "@api/native/modules/bubble";

export default definePlugin({
    name: "ChatBubbles",
    description: "Adds customizable chat bubbles to the chat, similar to Flowercord",
    author: [
        { name: "Pylix", id: 492949202121261067n },
        { name: "cocobo1", id: 767650984175992833n },
        { name: "kmmiio99o", id: 879393496627306587n },
    ],
    id: "chatbubbles",
    version: "1.0.0",
    platforms: ["android"],

    async start() {
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
                const token = tokens.colors.BG_BASE_TERTIARY;
                const theme = findByStoreName("ThemeStore")?.theme;
                const resolved = tokens.internal.resolveSemanticColor(theme, token);
                if (typeof resolved === "string" && resolved.startsWith("#")) return resolved;
            } catch {}
            return "#00000066";
        };

        updateBubbleAppearance();

        waitFor(filters.byProps("_interceptors"), (FluxDispatcher: any) => {
            for (const event of [
                "CACHE_LOADED",
                "SELECTIVELY_SYNCED_USER_SETTINGS_UPDATE",
                "THEME_UPDATE",
            ]) {
                FluxDispatcher.subscribe(event, updateBubbleAppearance);
            }
        });

        useChatBubblesSettings.subscribe(updateBubbleAppearance);
    },
    stop() {
        BubbleModule?.unhookBubbles();
    },
});