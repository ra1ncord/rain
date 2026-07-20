import { createPluginStore } from "@api/storage";

export const GridQualities = ["gif", "tinygif", "nanogif"] as const;
export type GridQuality = (typeof GridQualities)[number];

export interface TenorGifSearchSettings {
    gridQuality: GridQuality;
}

export const {
    useStore: useTenorGifSearchSettings,
    settings: tenorgifSettings,
} = createPluginStore<TenorGifSearchSettings>("bringbacktenor", {
    gridQuality: "tinygif",
});
