import { findByProps } from "@metro";
import { storage } from "../../storage";
import { getGaryUrl } from "../utils/api";
import { logger } from "@lib/utils/logger";

const MessageActions = findByProps("sendMessage");

export const garyCommand = {
    name: "gary",
    displayName: "gary",
    description: "Send a random Gary image to the channel.",
    displayDescription: "Send a random Gary image to the channel.",
    options: [],
    execute: async (args: any, ctx: any) => {
        try {
            // Ensure garySettings exists and get the source
            if (!storage.garySettings) {
                storage.garySettings = { imageSource: "gary" };
            }

            const source = storage.garySettings.imageSource || "gary";
            logger.log(`[Gary Command] Using image source: ${source}`);

            const imageUrl = await getGaryUrl(source);

            if (!imageUrl) {
                logger.log("[Gary Command] No image URL received");
                // Silent fail
                return null;
            }

            logger.log(`[Gary Command] Sending image: ${imageUrl}`);
            const fixNonce = Date.now().toString();
            MessageActions.sendMessage(ctx.channel.id, { content: imageUrl }, void 0, {
                nonce: fixNonce,
            });
            return { type: 4 };
        } catch (error) {
            console.error("[Gary] Error:", error);
            // Silent fail
            return null;
        }
    },
    applicationId: "-1",
    inputType: 1,
    type: 1,
};
