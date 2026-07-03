import { createPluginStore } from "@api/storage";

interface CustomBadgesSettings {
    left: boolean;
    showPrefix: boolean;
    showSuffix: boolean;
    showAero: boolean;
    showVelocity: boolean;
    showCustom: boolean;
    showNekocord: boolean;
    showReviewDB: boolean;
    showAliucord: boolean;
    showEnmity: boolean;
    showPaicord: boolean;
    showVencord: boolean;
    showEquicord: boolean;
    showBunny: boolean;
    showGooseMod: boolean;
    showReplugged: boolean;
    showBetterDiscord: boolean;
    showVendroidEnhanced: boolean;
    showRevenge: boolean;
    showReCord: boolean;
}

export const {
    useStore: useCustomBadgesSettings,
    settings: customBadgesSettings,
} = createPluginStore<CustomBadgesSettings>("globalbadges", {
    left: false,
    showPrefix: false,
    showSuffix: false,
    showCustom: true,
    showNekocord: true,
    showReviewDB: true,
    showAero: true,
    showAliucord: true,
    showVelocity: true,
    showEnmity: true,
    showPaicord: true,
    showVencord: true,
    showEquicord: true,
    showBunny: true,
    showGooseMod: true,
    showReplugged: true,
    showBetterDiscord: true,
    showVendroidEnhanced: true,
    showRevenge: true,
    showReCord: true,
});
