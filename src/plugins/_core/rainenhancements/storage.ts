import { createPluginStore } from "@api/storage";

interface RainEnhancementsSettings {
	transformEmoji: boolean;
	transformSticker: boolean;
}

export const {
    useStore: useRainEnhancementsSettings,
    settings: rainenhancementsSettings,
} = createPluginStore<RainEnhancementsSettings>("_core.rainenhancements", {
    transformEmoji: true,
    transformSticker: true,
});
