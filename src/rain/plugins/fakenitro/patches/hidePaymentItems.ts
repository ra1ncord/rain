import { after } from "@api/patcher";
import { findByPropsLazy } from "@metro/wrappers";

const ITEMS_TO_REMOVE = [
    "COLLECTIBLES_SHOP",
    "PREMIUM",
    "PREMIUM_GUILD_BOOSTING",
    "PREMIUM_GIFTING",
    "GUILD_ROLE_SUBSCRIPTIONS",
    "PREMIUM_RESTORE_SUBSCRIPTION"
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

                if (typeof key === "string" && ITEMS_TO_REMOVE.includes(key)) {
                    sectionData.splice(i, 1);
                }
            }
        }
    });

    patches.push(unpatch);
    return patches;
}
