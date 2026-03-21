import { createPluginStore } from "@api/storage";

interface PlatformIndicatorSettings {
    dmTopBar: boolean;
    userList: boolean;
    profileUsername: boolean;
    removeDefaultMobile: boolean;
    useThemeColors: boolean;
}

export const {
    useStore: usePlatformIndicatorSettings,
    settings: platformIndicatorSettings,
} = createPluginStore<PlatformIndicatorSettings>("platformindicators", {
    dmTopBar: true,
    userList: true,
    profileUsername: true,
    removeDefaultMobile: true,
    useThemeColors: true,
});
