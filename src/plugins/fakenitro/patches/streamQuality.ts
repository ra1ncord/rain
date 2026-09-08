import { instead } from "@api/patcher";
import { findByProps } from "@metro";
import { UserStore } from "@metro/common/stores";

const PremiumUtils = findByProps("canUseHighVideoUploadQuality", "canStreamQuality");
const { getCurrentUser } = UserStore;

function patchPremium(orig: Function, args: any[]) {
    if (getCurrentUser?.().premiumType !== null)
        return orig(...args);
    return true;
}

export default function getPatches() {
    if (!PremiumUtils) return [];
    return [
        instead("canUseHighVideoUploadQuality", PremiumUtils, (args, orig) => patchPremium(orig, args)),
        instead("canStreamQuality", PremiumUtils, (args, orig) => patchPremium(orig, args)),
    ];
}
