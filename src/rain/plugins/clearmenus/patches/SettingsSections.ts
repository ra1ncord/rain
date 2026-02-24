import { after } from "@api/patcher";
import { findByPropsLazy } from "@metro/wrappers";
import { useSettingsSections, SettingsSections } from "../storage";

const BILLING_ITEMS = [
    { key: "COLLECTIBLES_SHOP", rowKey: "collectiblesShop" },
    { key: "QUEST_HOME", rowKey: "quests" },
    { key: "PREMIUM", rowKey: "premium" },
    { key: "PREMIUM_GUILD_BOOSTING", rowKey: "premiumGuildBoosting" },
    { key: "PREMIUM_GIFTING", rowKey: "premiumGifting" },
    { key: "GUILD_ROLE_SUBSCRIPTIONS", rowKey: "guildRoleSubscriptions" },
    { key: "PREMIUM_RESTORE_SUBSCRIPTION", rowKey: "premiumRestoreSubscription" },
];

const RAIN_CATEGORIES = [
    { section: "rain" as keyof SettingsSections },
    { section: "plugins" as keyof SettingsSections },
    { section: "themes" as keyof SettingsSections },
    { section: "fonts" as keyof SettingsSections },
    { section: "developer" as keyof SettingsSections },
];

export default function patchSettingsSections() {
    const patches: Array<() => void> = [];
    const createListModule = findByPropsLazy("createList");
    if (!createListModule) return patches;
    const unpatch = after("createList", createListModule, function(args: any[], ret: any) {
        console.log("ClearMenus patch: createList patch running");
        const [config] = args;
        console.log("ClearMenus patch: config", config);
        if (!config?.sections || !Array.isArray(config.sections)) {
            console.log("ClearMenus patch: config.sections missing or not array", config?.sections);
            return;
        }
        console.log("ClearMenus patch: sections", config.sections);
        // Runtime log: print all keys for each section
        for (const section of config.sections) {
            if (section?.id && Array.isArray(section.settings)) {
                console.log("ClearMenus section:", section.id, "keys:", section.settings.map((item: any) => typeof item === "string" ? item : item?.key));
            }
        }
        const settings = useSettingsSections.getState();
        for (const section of config.sections) {
            if (!section?.settings || !Array.isArray(section.settings)) continue;
            const sectionData = section.settings;
            // Rain categories logic
            // Rain categories logic (Themes, Fonts, Developer)
            const rainRowKeys: Record<string, string> = {
                themes: "RAIN_THEMES",
                fonts: "RAIN_FONTS",
                developer: "RAIN_DEVELOPER",
            };
            for (const rainCat of RAIN_CATEGORIES) {
                if (section.id && section.id.toLowerCase() === rainCat.section) {
                    const toggles = settings[rainCat.section as keyof typeof settings];
                    if (typeof toggles === "object" && toggles !== null) {
                        if (toggles.hideAll) {
                            section.settings.length = 0;
                            break;
                        }
                        for (let i = section.settings.length - 1; i >= 0; i--) {
                            const item = section.settings[i];
                            const key = typeof item === "string" ? item : item?.key;
                            // Use correct row key for themes, fonts, developer
                            let toggleKey = key;
                            if (rainCat.section in rainRowKeys && key === rainRowKeys[rainCat.section as string]) {
                                toggleKey = rainRowKeys[rainCat.section as string];
                            }
                            if (typeof key === "string" && toggles[toggleKey as keyof typeof toggles]) {
                                section.settings.splice(i, 1);
                            }
                        }
                    }
                }
            }
            // HideAll logic for every category in SettingsSections
            for (let i = sectionData.length - 1; i >= 0; i--) {
                const item = sectionData[i];
                const key = typeof item === "string" ? item : item?.key;
                if (typeof key !== "string") continue;

                // Billing logic
                const billingItem = BILLING_ITEMS.find(x => x.key === key);
                if (billingItem) {
                    if (settings.billing?.hideAll || settings.billing?.[billingItem.rowKey]) {
                        sectionData.splice(i, 1);
                    }
                    continue;
                }

                // Explicit logic for each category shown in the runtime log
                const explicitCategories = [
                    { id: "account settings", key: "account" },
                    { id: "billing settings", key: "billing" },
                    { id: "app settings", key: "appSettings" },
                    { id: "support", key: "support" },
                    { id: "what's new", key: "whatsNew" },
                    { id: "developer settings", key: "developerSettings" },
                    { id: "bug reporter", key: "bugReporter" },
                    { id: "build status", key: "buildStatus" },
                    { id: "staff settings", key: "staffSettings" },
                ];
                let handled = false;
                for (const cat of explicitCategories) {
                    if (section.label && section.label.toLowerCase() === cat.id) {
                        const toggles = settings[cat.key as keyof typeof settings];
                        if (toggles && typeof toggles === "object" && (toggles.hideAll || toggles[key as keyof typeof toggles])) {
                            sectionData.splice(i, 1);
                        }
                        handled = true;
                        break;
                    }
                }
                if (handled) continue;

                // Support fallback for id (in case label is not present)
                if (section.id && section.id.toLowerCase() === "support") {
                    if (settings.support?.hideAll || settings.support?.[key as keyof typeof settings.support]) {
                        sectionData.splice(i, 1);
                    }
                    continue;
                }

                // Generic hideAll logic for all categories (fallback)
                for (const category of Object.keys(settings)) {
                    // Skip billing (already handled), support (handled above), rain/plugins/themes/fonts/developer (handled above)
                    if (["billing", "support", ...RAIN_CATEGORIES.map(r => r.section)].includes(category)) continue;
                    // Section id can be label or id, so compare lowercased
                    if (section.id && section.id.toLowerCase().replace(/\s/g,"") === category.toLowerCase()) {
                        const toggles = settings[category as keyof typeof settings];
                        if (toggles && typeof toggles === "object" && (toggles.hideAll || toggles[key as keyof typeof toggles])) {
                            sectionData.splice(i, 1);
                        }
                        break;
                    }
                }
            }
        }
    });
    patches.push(unpatch);
    return patches;
}
