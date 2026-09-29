import { createPluginStore } from "@api/storage";

interface SplitViewSettings {
    showButton: boolean;
    iconSize: number;
    order: string[];
    sized: boolean;
    smartPip: boolean;
}

export const {
    useStore: useSplitViewSettings,
    settings: splitViewSettings,
} = createPluginStore<SplitViewSettings>("splitview", {
    showButton: true,
    iconSize: 24,
    order: ["stream", "them", "me"],
    sized: false,
    smartPip: true,
});
