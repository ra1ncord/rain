import { createPluginStore } from "@api/storage";

interface CoolbarSettings {
    showStar: boolean;
    showSettings: boolean;
    targetServerId: string;
}

export const {
    useStore: useCoolbarSettings,
    settings: coolBarSettings,
} = createPluginStore<CoolbarSettings>("coolbar", {
    showStar: true,
    showSettings: true,
    targetServerId: "@favorites",
});
