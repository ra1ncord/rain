import { createPluginStore } from "@api/storage";

interface VolumeBoostSettings {
    maxPercent: number;
    showPercent: boolean;
    debugSliders: boolean;
    boosted: Record<string, number>;
}

export const {
    useStore: useVolumeBoostSettings,
    settings: volumeBoostSettings,
} = createPluginStore<VolumeBoostSettings>("volumeboost", {
    maxPercent: 1000,
    showPercent: true,
    debugSliders: false,
    boosted: {},
});
