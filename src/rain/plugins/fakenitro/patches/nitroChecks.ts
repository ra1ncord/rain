import { instead } from "@api/patcher";
import { findByProps, findByStoreName } from "@metro";

const nitroInfo = findByProps("canUseEmojisEverywhere");
const { getCurrentUser } = findByStoreName("UserStore");

export default [
    instead("canUseEmojisEverywhere", nitroInfo, (args, orig) => {
        if (getCurrentUser?.().premiumType !== null)
            return orig.apply(this, args);

        return true;
    }),
    instead("canUseAnimatedEmojis", nitroInfo, (args, orig) => {
        if (getCurrentUser?.().premiumType !== null)
            return orig.apply(this, args);

        return true;
    }),

    // patch credits: https://github.com/aliernfrog/vd-plugins/blob/master/plugins/FreeStickers/src/patches/nitro.ts
    instead(nitroInfo.canUseCustomStickersEverywhere ? "canUseCustomStickersEverywhere" : "canUseStickersEverywhere", nitroInfo, (args, orig) => {
        if (getCurrentUser?.().premiumType !== null)
            return orig.apply(this, args);

        return true;
    }),

];
