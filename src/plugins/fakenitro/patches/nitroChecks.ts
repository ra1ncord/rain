import { after, instead } from "@api/patcher";
import { findByProps } from "@metro";
import { UserStore } from "@metro/common/stores";

const nitroInfo = findByProps("canUseEmojisEverywhere");
const emojiUtils = findByProps("getEmojiUnavailableReason");
const { getCurrentUser } = UserStore;

const BYPASSABLE = [3, 4]; // CHAT, GUILD_STICKER_RELATED_EMOJI

function patchNitro(orig: Function, args: any[]) {
    if (getCurrentUser?.().premiumType !== null)
        return orig(...args);
    return true;
}

export default function getPatches() {
    return [
        instead("getEmojiUnavailableReason", emojiUtils, (args, result) => {
            if (getCurrentUser?.().premiumType !== null) return result;
            if (result !== null && BYPASSABLE.includes(args[0]?.intention)) return null;
            return result;
        }),

        after("getEmojiUnavailableReasons", emojiUtils, (args, result) => {
            if (getCurrentUser?.().premiumType !== null) return result;
            if (BYPASSABLE.includes(args[0]?.intention)) {
                return {
                    emojisDisabled: new Set(),
                    emojisUnfiltered: args[0]?.categoryEmojis ?? [],
                    emojisPremiumLockedCount: 0,
                    emojiNitroLocked: false,
                };
            }
            return result;
        }),

        after("isEmojiPremiumLocked", emojiUtils, (args, result) => {
            if (getCurrentUser?.().premiumType !== null) return result;
            if (result === true && BYPASSABLE.includes(args[0]?.intention)) return false;
            return result;
        }),

        // sticker patch credits: https://github.com/aliernfrog/vd-plugins/blob/master/plugins/FreeStickers/src/patches/nitro.ts
        instead(nitroInfo.canUseCustomStickersEverywhere ? "canUseCustomStickersEverywhere" : "canUseStickersEverywhere", nitroInfo, (args, orig) => {
            return patchNitro(orig, args);
        }),
    ];
}

