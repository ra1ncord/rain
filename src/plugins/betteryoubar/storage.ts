import { createPluginStore } from "@api/storage";

export interface BetterYouBarSettings {
    showStar: boolean;
    showSettings: boolean;
    targetServerId: string;
    customImageUrl: string;
    backgroundMode: "nameplate" | "custom_image" | "none";
}

export const {
    useStore: useBetterYouBarSettings,
    settings: betteryoubarSettings,
} = createPluginStore<BetterYouBarSettings>("betteryoubar", {
    showStar: true,
    showSettings: true,
    targetServerId: "@favorites",
    customImageUrl: "",
    backgroundMode: "nameplate",
});
