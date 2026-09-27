import { createPluginStore } from "@api/storage";

interface SplitViewSettings {
    showButton: boolean;
    iconSize: number;
    order: string[];
}

export const {
    useStore: useSplitViewSettings,
    settings: splitViewSettings,
} = createPluginStore<SplitViewSettings>("splitview", {
    showButton: true,
    iconSize: 26,
    order: ["stream", "them", "me"],
});
