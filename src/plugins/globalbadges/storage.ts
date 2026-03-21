import { createPluginStore } from "@api/storage";

interface CustomBadgesSettings {
    left: boolean;
    mods: boolean;
    customs: boolean;
}

export const {
    useStore: useCustomBadgesSettings,
    settings: customBadgesSettings,
} = createPluginStore<CustomBadgesSettings>("globalbadges", {
    left: true,
    mods: false,
    customs: false,
});
