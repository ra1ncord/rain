type Unpatch = () => unknown;
type Instead = (key: string, target: any, callback: (args: any[], original: Function) => any) => Unpatch;

export interface ClutterSettings {
    hideServerBoostGoal: boolean;
    hideDmActivityCards: boolean;
}

export const BOOST_GOAL_ROW = "guild-premium-progress-bar";

// Remove the boost goal from the channel-list model itself so FastList does not
// reserve a row. Leave the separate Server Boosts management entry untouched.
export function installClutterSurfaces(guildActions: any, activity: any, settings: () => ClutterSettings, instead: Instead): Unpatch[] {
    const targets = [
        [guildActions, "default"],
        [activity?.default, "type"],
        [activity, "getMessagesItemHappeningNowHeight"],
    ] as const;
    for (const [target, key] of targets) {
        if (typeof target?.[key] !== "function") throw new Error(`Declutter: required Discord surface ${key} is unavailable`);
    }
    const patches: Unpatch[] = [];
    try {
        patches.push(instead("default", guildActions, (args, original) => {
            // Always execute the hook, regardless of the preference.
            const rows = original(...args);
            if (!settings().hideServerBoostGoal) return rows;
            if (!Array.isArray(rows)) throw new Error("Declutter: unexpected guild action rows");
            return rows.includes(BOOST_GOAL_ROW) ? rows.filter(row => row !== BOOST_GOAL_ROW) : rows;
        }));
        patches.push(instead("type", activity.default, (args, original) => {
            const tree = original(...args);
            return settings().hideDmActivityCards ? null : tree;
        }));
        patches.push(instead("getMessagesItemHappeningNowHeight", activity, (args, original) => {
            const height = original(...args);
            return settings().hideDmActivityCards ? 0 : height;
        }));
        return patches;
    } catch (error) {
        for (const undo of patches.reverse()) undo();
        throw error;
    }
}

export const profileOptions = [
    ["hideAvatarDecorations", "Hide avatar decorations"],
    ["hideNameplates", "Hide nameplates"],
    ["hideProfileEffects", "Hide profile effects"],
    ["hideProfileFrames", "Hide profile frames"],
    ["hideGuildTags", "Hide guild tags"],
    ["hideDisplayNameStyles", "Hide display-name styles"],
] as const;

export const paymentOptions = [
    ["hidePaymentShop", "Shop", "COLLECTIBLES_SHOP"],
    ["hidePaymentQuests", "Quests", "QUEST_HOME"],
    ["hidePaymentNitro", "Nitro Home", "PREMIUM"],
    ["hidePaymentSubscriptions", "Manage Subscriptions", "PREMIUM_MANAGE_SUBSCRIPTIONS"],
    ["hidePaymentBoosts", "Server Boost", "PREMIUM_GUILD_BOOSTING"],
    ["hidePaymentGifts", "Gift Inventory", "PREMIUM_GIFTING"],
] as const;

export type ExtraClutterSettings = Record<
    typeof profileOptions[number][0] | typeof paymentOptions[number][0] | "hidePaymentSettings", boolean
>;

export function filterPaymentRows(rows: any[], settings: ExtraClutterSettings): any[] {
    const hidden = new Set<string>(paymentOptions
        .filter(([key]) => settings.hidePaymentSettings || settings[key])
        .map(([, , id]) => id));
    if (!rows.some(row => hidden.has(row.setting))) return rows;
    // Headers and footers belong to the rows up to the next section header.
    // Drop a section only when this filter removed all its rows.
    const output: any[] = [];
    for (let start = 0; start < rows.length;) {
        let end = start + 1;
        while (end < rows.length && rows[end].type !== "section_header") end++;
        const section = rows.slice(start, end);
        const kept = section.filter(row => !hidden.has(row.setting));
        const removed = kept.length !== section.length;
        if (!removed || kept.some(row => row.setting != null)) output.push(...kept);
        start = end;
    }
    return output;
}

export function installProfileAndPaymentSurfaces(
    find: {
        byName: (name: string, expDefault: boolean) => any;
        byTypeName: (name: string, expDefault: boolean) => any;
        byProps: (...props: string[]) => any;
    },
    settings: () => ExtraClutterSettings, instead: Instead,
    preview: { useIsPreview: () => boolean; wrap: (component: any, props: any) => any },
): Unpatch[] {
    const targets: [any, string, keyof ExtraClutterSettings][] = [];
    const add = (module: any, key: string, flag: keyof ExtraClutterSettings, memo = false) => {
        targets.push([memo ? module?.[key] : module, memo ? "type" : key, flag]);
    };
    add(find.byName("CutoutableAvatarDecoration", false), "default", "hideAvatarDecorations");
    add(find.byProps("useAvatarDecoration", "getAvatarDecoration"), "useAvatarDecoration", "hideAvatarDecorations");
    add(find.byName("Nameplate", false), "default", "hideNameplates");
    add(find.byTypeName("YouBarNameplate", false), "default", "hideNameplates", true);
    add(find.byProps("useNameplate"), "useNameplate", "hideNameplates");
    add(find.byProps("usePreloadProfileEffect"), "default", "hideProfileEffects");
    add(find.byName("ProfileFrame", false), "default", "hideProfileFrames");
    add(find.byName("useProfileFrame", false), "default", "hideProfileFrames");
    for (const key of ["default", "GuildTagBadge", "BaseGuildTagChiplet"]) {
        add(find.byProps("GuildTagBadge", "BaseGuildTagChiplet"), key, "hideGuildTags", true);
    }
    add(find.byName("useDisplayNameStyles", false), "default", "hideDisplayNameStyles");
    const individualPreview = find.byProps("IndividualProductPreview");
    // 343.12 split these previews into separate modules; retain the old exports
    // for earlier Discord versions and keep validation before installation.
    const productPreviews = [
        ["ProfileEffectPreview", "ProfileEffectUserPreview"],
        ["AvatarDecorationPreview", "AvatarDecorationProductPreview"],
        ["NameplatePreview", "NameplateProductPreview"],
    ].map(([key, name]) => typeof individualPreview?.[key] === "function"
        ? [individualPreview, key] : [find.byName(name, false), "default"]);
    const previewTargets = [
        [find.byProps("CollectiblesShopV2"), "default"],
        [find.byProps("CollectiblesShopV2"), "CollectiblesShopV2"],
        [find.byProps("COLLECTIBLES_SHOP_CARD_HEIGHT", "COLLECTIBLES_SHOP_CARD_WIDTH")?.default, "type"],
        [find.byName("ProductDetailsActionSheet", false), "default"],
        [individualPreview, "IndividualProductPreview"],
        ...productPreviews,
    ] as [any, string][];
    const messages = find.byName("createMessageContent", false);
    const lists = find.byProps("toSettingListItems", "getScoredSettingListSearchResultItems");
    for (const [target, key] of [...targets, ...previewTargets, [messages, "default"], [lists, "toSettingListItems"], [lists, "getScoredSettingListSearchResultItems"]] as [any, string][]) {
        if (typeof target?.[key] !== "function") throw new Error(`Declutter: required profile/payment surface ${key} is unavailable`);
    }
    const patches: Unpatch[] = [];
    try {
        for (const [target, key] of previewTargets) {
            patches.push(instead(key, target, (args, original) => preview.wrap(original, args[0])));
        }
        for (const [target, key, flag] of targets) patches.push(instead(key, target, (args, original) => {
            const isPreview = preview.useIsPreview();
            const result = original(...args);
            return !isPreview && settings()[flag] ? null : result;
        }));
        patches.push(instead("default", messages, (args, original) => {
            const result = original(...args);
            if (!result) return result;
            const state = settings();
            const changes: Record<string, null> = {};
            const fields = [
                ...(state.hideAvatarDecorations ? ["avatarDecorationURL", "avatarDecorationUrl", "guildMemberAvatarDecoration"] : []),
                ...(state.hideDisplayNameStyles ? ["displayNameStyles"] : []),
                ...(state.hideGuildTags ? ["clanTagGuildId", "clanTag", "clanBadgeUrl"] : []),
            ];
            for (const key of fields) {
                if (result[key] != null) changes[key] = null;
            }
            return Object.keys(changes).length ? { ...result, ...changes } : result;
        }));
        for (const key of ["toSettingListItems", "getScoredSettingListSearchResultItems"]) {
            patches.push(instead(key, lists, (args, original) => filterPaymentRows(original(...args), settings())));
        }
        return patches;
    } catch (error) {
        for (const undo of patches.reverse()) undo();
        throw error;
    }
}
