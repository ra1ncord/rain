import { after } from "@api/patcher";
import { findByPropsLazy } from "@metro/wrappers";

import { fakenitroSettings, Settings } from "../storage";

type SettingKey = keyof Settings;

const ITEMS_TO_REMOVE: Array<{ key: string; setting: SettingKey }> = [
    { key: "COLLECTIBLES_SHOP", setting: "hideCollectiblesShop" },
    { key: "QUEST_HOME", setting: "hideQuests" },
    { key: "PREMIUM", setting: "hidePremium" },
    { key: "PREMIUM_GUILD_BOOSTING", setting: "hidePremiumGuildBoosting" },
    { key: "PREMIUM_GIFTING", setting: "hidePremiumGifting" },
    { key: "GUILD_ROLE_SUBSCRIPTIONS", setting: "hideGuildRoleSubscriptions" },
    { key: "PREMIUM_RESTORE_SUBSCRIPTION", setting: "hidePremiumRestoreSubscription" },
];

export default function getHidePaymentItems() {
    const patches: Array<() => void> = [];

    const createListModule = findByPropsLazy("createList");

    if (!createListModule) {
        console.log("[HidePaymentItems] Could not find createList");
        return patches;
    }

    const unpatch = after("createList", createListModule, function(args: any[], ret: any) {
        const [config] = args;

        if (!config?.sections || !Array.isArray(config.sections)) return;

        for (const section of config.sections) {
            if (!section?.settings || !Array.isArray(section.settings)) continue;

            const sectionData = section.settings;

            for (let i = sectionData.length - 1; i >= 0; i--) {
                const item = sectionData[i];
                const key = typeof item === "string" ? item : item?.key;

                if (typeof key === "string") {
                    const itemToRemove = ITEMS_TO_REMOVE.find(x => x.key === key);
                    if (itemToRemove && (fakenitroSettings as any)[itemToRemove.setting]) {
                        sectionData.splice(i, 1);
                    }
                }
            }
        }
    });

    patches.push(unpatch);
    return patches;
}
