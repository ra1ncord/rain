import { createPluginStore } from "@api/storage";

export const DEFAULT_WATERMARK = "Made with rain";

export interface QuoterSettings {
    /** Render the avatar in black and white. */
    grayscale: boolean;
    /** Whether to draw the watermark text on the image. */
    showWatermark: boolean;
    /** Watermark text, drawn bottom-right (max 32 chars). */
    watermark: string;
}

export const {
    useStore: useQuoterSettings,
    settings: quoterSettings,
} = createPluginStore<QuoterSettings>("quoter", {
    grayscale: true,
    showWatermark: false,
    watermark: DEFAULT_WATERMARK,
});
