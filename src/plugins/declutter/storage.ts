import { createPluginStore } from "@api/storage";

import type { ExtraClutterSettings } from "./surfaces";

interface DeclutterSettings extends ExtraClutterSettings {
    hideServerBoostGoal: boolean;
    hideDmActivityCards: boolean;
    hide: {
        voice: boolean;
        gift: boolean;
        thread: boolean;
        app: boolean;
    };
    show: {
        thread: boolean;
    };
    dismiss: {
        actions: boolean;
        send: boolean;
    };
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
    hide: {
        app: true,
        gift: true,
        thread: true,
        voice: true,
    },
    show: {
        thread: false,
    },
    dismiss: {
        actions: true,
        send: false,
    },
});
