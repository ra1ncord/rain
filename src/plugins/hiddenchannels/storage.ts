import { createPluginStore } from "@api/storage";

interface HiddenChannelsSettings {
    showIcon: boolean;
    showPopup: boolean;
}

export const {
    useStore: useHiddenChannelsSettings,
    settings: hiddenChannelsSettings,
} = createPluginStore<HiddenChannelsSettings>("hiddenchannels", {
    showIcon: true,
    showPopup: true,
});
