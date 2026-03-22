import { after, instead } from "@api/patcher";
import { findByProps, findByStoreName } from "@metro";

const nitroInfo = findByProps("canUseEmojisEverywhere");
const emojiUtils = findByProps("getEmojiUnavailableReason");
const { getCurrentUser } = findByStoreName("UserStore");


function patchReaction(args: any[], result: any, response: any) {
    if (args[0]?.intention === 0 && result === null && getCurrentUser?.().premiumType === null) {
        const { emoji, guildId, channel } = args[0];
        if (emoji.type === 0) return result; // type 0 is twemoji
        const currentGuildId = guildId ?? channel?.getGuildId?.();
        if (emoji.guildId !== currentGuildId || emoji.animated) {
            return response;
        }
    }
    return result;
}

function patchNitro(orig: Function, args: any[]) {
    if (getCurrentUser?.().premiumType !== null)
        return orig(...args);
    return true;
}

export default function getPatches() {
    return [
        instead("canUseEmojisEverywhere", nitroInfo, (args, orig) => {
            return patchNitro(orig, args);
        }),
        instead("canUseAnimatedEmojis", nitroInfo, (args, orig) => {
            return patchNitro(orig, args);
        }),

        // blocks reactions from the big modal
        after("getEmojiUnavailableReason", emojiUtils, (args, result) => {
            return patchReaction(args, result, 0); // 0 = DISALLOW_EXTERNAL
        }),

        // blocks reactions from the quick selector
        after("isEmojiPremiumLocked", emojiUtils, (args, result) => {
            patchReaction(args, result, true);
        }),

        // sticker patch credits: https://github.com/aliernfrog/vd-plugins/blob/master/plugins/FreeStickers/src/patches/nitro.ts
        instead(nitroInfo.canUseCustomStickersEverywhere ? "canUseCustomStickersEverywhere" : "canUseStickersEverywhere", nitroInfo, (args, orig) => {
            return patchNitro(orig, args);
        }),
    ];
}
