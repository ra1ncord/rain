import { createPluginStore } from "@api/storage";

import type { ExtraClutterSettings } from "./surfaces";

interface DeclutterSettings extends ExtraClutterSettings {
    hideServerBoostGoal: boolean;
    hideDmActivityCards: boolean;

}

export const {
    useStore: useDeclutterSettings,
    settings: declutterSettings,
} = createPluginStore<DeclutterSettings>("declutter", {
    hideAvatarDecorations: true,
    hideNameplates: true,
    hideProfileEffects: true,
    hideProfileFrames: true,
    hideGuildTags: true,
    hideDisplayNameStyles: true,
    hidePaymentSettings: true,
    hidePaymentShop: false,
    hidePaymentQuests: false,
    hidePaymentNitro: false,
    hidePaymentSubscriptions: false,
    hidePaymentBoosts: false,
    hidePaymentGifts: false,
    hideServerBoostGoal: true,
    hideDmActivityCards: true,
});
