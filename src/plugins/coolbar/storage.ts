import { createPluginStore } from "@api/storage";

interface CoolBarSettings {
    showStar: boolean;
    showSettings: boolean;
}

export const {
    useStore: useCoolBarSettings,
    settings: coolBarSettings,
} = createPluginStore<CoolBarSettings>("coolbar", {
    showStar: true,
    showSettings: true,
});
