import { after, instead } from "@api/patcher";
import { findByProps, findByStoreName } from "@metro";

const nitroInfo = findByProps("canUseEmojisEverywhere");
const emojiUtils = findByProps("getEmojiUnavailableReason");
const { getCurrentUser } = findByStoreName("UserStore");

export default function getPatches() {
    return [
        instead("canUseEmojisEverywhere", nitroInfo, (args, orig) => {
            if (getCurrentUser?.().premiumType !== null)
                return orig(...args);
            return true;
        }),
        instead("canUseAnimatedEmojis", nitroInfo, (args, orig) => {
            if (getCurrentUser?.().premiumType !== null)
                return orig(...args);
            return true;
        }),

        // blocks reactions from the big modal
        after("getEmojiUnavailableReason", emojiUtils, (args, result) => {
            if (args[0]?.intention === 0 && result === null && getCurrentUser?.().premiumType === null) {
                const { emoji, guildId, channel } = args[0];
                const currentGuildId = guildId ?? channel?.getGuildId?.();
                if (emoji.guildId !== currentGuildId || emoji.animated) {
                    return 0; // DISALLOW_EXTERNAL
                }
            }
            return result;
        }),

        // blocks reactions from the quick selector
        after("isEmojiPremiumLocked", emojiUtils, (args, result) => {
            if (args[0]?.intention === 0 && !result && getCurrentUser?.().premiumType === null) {
                const { emoji, guildId, channel } = args[0];
                const currentGuildId = guildId ?? channel?.getGuildId?.();
                if (emoji.guildId !== currentGuildId || emoji.animated) {
                    return true;
                }
            }
            return result;
        }),

        // Stickers
        instead(nitroInfo.canUseCustomStickersEverywhere ? "canUseCustomStickersEverywhere" : "canUseStickersEverywhere", nitroInfo, (args, orig) => {
            if (getCurrentUser?.().premiumType !== null)
                return orig(...args);
            return true;
        }),
    ];
}
