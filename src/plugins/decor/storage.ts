import { createPluginStore } from "@api/storage";

export interface FakeNitroSettings {
    emojiSize: number;
    hyperLink: boolean;
    stickerHyperLink: boolean;
    hideCollectiblesShop: boolean;
    hidePremium: boolean;
    hidePremiumGuildBoosting: boolean;
    hidePremiumGifting: boolean;
    hideGuildRoleSubscriptions: boolean;
    hidePremiumRestoreSubscription: boolean;
    hideQuests: boolean;
}

export const {
    useStore: useFakeNitroSettings,
    settings: fakenitroSettings,
} = createPluginStore<FakeNitroSettings>("fakenitro", {
    emojiSize: 48,
    hyperLink: true,
    stickerHyperLink: true,
    hideCollectiblesShop: false,
    hidePremium: true,
    hidePremiumGuildBoosting: false,
    hidePremiumGifting: false,
    hideGuildRoleSubscriptions: false,
    hidePremiumRestoreSubscription: false,
    hideQuests: false,
});
