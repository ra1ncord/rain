import { createPluginStore } from "@api/storage";

import type { MonetCache, MonetColors, MonetConfig, MonetPatchConfig } from "./types";

export interface MonetThemeSettings {
    colors: MonetColors;
    config: MonetConfig;
    active: boolean;
    cache: MonetCache;
    patches: MonetPatchConfig;
}

export const DEFAULT_SETTINGS: MonetThemeSettings = {
    colors: {
        neutral1: "#747679",
        neutral2: "#70777C",
        accent1: "#007FAC",
        accent2: "#657985",
        accent3: "#787296",
    },
    config: {
        wallpaper: "none",
        custom: [],
    },
    active: false,
    cache: {},
    patches: {
        from: "git",
    },
};

export const {
    useStore: useMonetSettings,
    settings: monetSettings,
} = createPluginStore<MonetThemeSettings>("_core.painter.monet", DEFAULT_SETTINGS);
